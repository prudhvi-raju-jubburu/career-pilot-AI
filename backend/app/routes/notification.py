import logging
from datetime import datetime, timezone, timedelta
from flask import Blueprint, jsonify, request
from app.utils.auth import token_required
from app.models.notification import NotificationModel
from app.models.notification_preference import NotificationPreferenceModel
from app.models.opportunity import OpportunityModel
from app.models.application import ApplicationModel
from app.models.profile import ProfileModel
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)
notification_bp = Blueprint("notification", __name__)

@notification_bp.route("", methods=["GET"])
@token_required
def get_notifications(current_user):
    """
    Retrieves in-app notifications for authenticated student.
    Supports query parameters:
      - limit: int (default: 50, max: 100)
      - skip: int (default: 0)
      - unread_only: bool (default: false)
      - type: string (optional category filter)
    """
    user_id = str(current_user["_id"])
    try:
        limit = min(100, max(1, int(request.args.get("limit", 50))))
        skip = max(0, int(request.args.get("skip", 0)))
        unread_only = request.args.get("unread_only", "").lower() in ("true", "1")
        notif_type = request.args.get("type", None)

        notifications = NotificationModel.find_by_user(
            user_id=user_id,
            unread_only=unread_only,
            notif_type=notif_type,
            limit=limit,
            skip=skip
        )
        
        unread_count = NotificationModel.get_unread_count(user_id)

        # If user has no notifications at all, generate an initial welcome notification
        if not notifications and skip == 0 and not unread_only and not notif_type:
            welcome_notif = NotificationModel.create_notification(
                user_id=user_id,
                title="Welcome to CareerPilot AI! 🚀",
                message="Your live career telemetry and opportunity discovery radar is active. We are continuously scanning top student opportunities.",
                notif_type="system_notice",
                link="/opportunities",
                dedupe_key=f"{user_id}_welcome"
            )
            if welcome_notif:
                notifications = [welcome_notif]
                unread_count = 1

        return jsonify({
            "success": True,
            "message": "Notifications retrieved successfully",
            "data": notifications,
            "unread_count": unread_count
        }), 200
    except Exception as e:
        logger.exception("Error getting notifications: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to retrieve notifications",
            "error": str(e)
        }), 500

@notification_bp.route("/unread-count", methods=["GET"])
@token_required
def get_unread_count(current_user):
    """Returns the unread notifications count for the authenticated user."""
    user_id = str(current_user["_id"])
    try:
        count = NotificationModel.get_unread_count(user_id)
        return jsonify({
            "success": True,
            "data": {"unread_count": count}
        }), 200
    except Exception as e:
        logger.exception("Error getting unread count: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to get unread count",
            "error": str(e)
        }), 500

@notification_bp.route("/<notif_id>/read", methods=["PATCH", "PUT"])
@token_required
def mark_notification_read(current_user, notif_id):
    """Marks a single notification as read."""
    user_id = str(current_user["_id"])
    try:
        success = NotificationModel.mark_read(notif_id, user_id)
        unread_count = NotificationModel.get_unread_count(user_id)
        return jsonify({
            "success": True,
            "message": "Notification marked as read",
            "data": {"unread_count": unread_count}
        }), 200
    except Exception as e:
        logger.exception("Error marking notification read: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to mark notification read",
            "error": str(e)
        }), 500

@notification_bp.route("/read-all", methods=["POST"])
@token_required
def mark_all_read(current_user):
    """Marks all notifications as read for current user."""
    user_id = str(current_user["_id"])
    try:
        count = NotificationModel.mark_all_read(user_id)
        return jsonify({
            "success": True,
            "message": f"Marked {count} notifications as read",
            "data": {"count": count, "unread_count": 0}
        }), 200
    except Exception as e:
        logger.exception("Error marking all notifications read: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to mark all notifications read",
            "error": str(e)
        }), 500

@notification_bp.route("/<notif_id>", methods=["DELETE"])
@token_required
def delete_notification(current_user, notif_id):
    """Deletes a single notification owned by current user."""
    user_id = str(current_user["_id"])
    try:
        deleted = NotificationModel.delete_notification(notif_id, user_id)
        if not deleted:
            return jsonify({
                "success": False,
                "message": "Notification not found or access unauthorized"
            }), 404
        unread_count = NotificationModel.get_unread_count(user_id)
        return jsonify({
            "success": True,
            "message": "Notification deleted successfully",
            "data": {"unread_count": unread_count}
        }), 200
    except Exception as e:
        logger.exception("Error deleting notification: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to delete notification",
            "error": str(e)
        }), 500

@notification_bp.route("/preferences", methods=["GET"])
@token_required
def get_notification_preferences(current_user):
    """Retrieves notification preferences for authenticated user."""
    user_id = str(current_user["_id"])
    try:
        prefs = NotificationPreferenceModel.get_preferences(user_id)
        return jsonify({
            "success": True,
            "data": prefs
        }), 200
    except Exception as e:
        logger.exception("Error getting notification preferences: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to retrieve notification preferences",
            "error": str(e)
        }), 500

@notification_bp.route("/preferences", methods=["PUT", "PATCH"])
@token_required
def update_notification_preferences(current_user):
    """Updates notification preferences for authenticated user."""
    user_id = str(current_user["_id"])
    try:
        payload = request.get_json() or {}
        updated = NotificationPreferenceModel.update_preferences(user_id, payload)
        return jsonify({
            "success": True,
            "message": "Notification preferences updated successfully",
            "data": updated
        }), 200
    except Exception as e:
        logger.exception("Error updating notification preferences: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to update notification preferences",
            "error": str(e)
        }), 500

@notification_bp.route("/digest", methods=["GET"])
@token_required
def get_daily_digest(current_user):
    """
    Generates a personalized daily digest summarizing new opportunities,
    upcoming deadlines for tracked applications, and skill recommendations.
    """
    user_id = str(current_user["_id"])
    try:
        now_utc = datetime.now(timezone.utc)
        yesterday_iso = (now_utc - timedelta(days=1)).isoformat()
        next_week_iso = (now_utc + timedelta(days=7)).isoformat()

        opp_col = OpportunityModel.get_collection()
        new_opps_count = opp_col.count_documents({
            "status": "active",
            "created_at": {"$gte": yesterday_iso}
        })

        # Urgent upcoming deadlines
        urgent_opps = list(opp_col.find({
            "status": "active",
            "dates.deadline": {"$gte": now_utc.isoformat(), "$lte": next_week_iso}
        }).limit(3))

        # User's tracked applications
        user_apps = ApplicationModel.find_by_user(user_id)
        active_apps_count = len([a for a in user_apps if a.get("status") in ("Applied", "Interviewing")])

        top_picks = [OpportunityModel.to_dict(doc) for doc in urgent_opps]

        digest = {
            "date": now_utc.strftime("%B %d, %Y"),
            "new_opportunities_24h": new_opps_count,
            "active_applications_in_flight": active_apps_count,
            "top_upcoming_deadlines": top_picks,
            "summary": (
                f"Good morning! In the past 24 hours, {new_opps_count} fresh opportunities were ingested. "
                f"You have {active_apps_count} active applications currently in flight. "
                f"Review your high-priority deadlines below to submit on time."
            )
        }

        return jsonify({
            "success": True,
            "message": "Daily career digest generated",
            "data": digest
        }), 200
    except Exception as e:
        logger.exception("Error generating daily digest: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to generate digest",
            "error": str(e)
        }), 500

@notification_bp.route("/digest/send", methods=["POST"])
@token_required
def trigger_digest_send(current_user):
    """
    Manually triggers a digest dispatch execution for testing and administrative oversight.
    """
    try:
        data = request.get_json() or {}
        frequency = data.get("frequency", "daily")
        results = NotificationService.generate_and_dispatch_digests(frequency=frequency)
        return jsonify({
            "success": True,
            "message": f"Digest processing complete for frequency '{frequency}'",
            "data": results
        }), 200
    except Exception as e:
        logger.exception("Error triggering digest send: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to trigger digest dispatch",
            "error": str(e)
        }), 500

