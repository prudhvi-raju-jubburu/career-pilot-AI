import logging
from datetime import datetime, timezone, timedelta
from flask import Blueprint, jsonify
from app.utils.auth import token_required
from app.models.notification import NotificationModel
from app.models.opportunity import OpportunityModel
from app.models.application import ApplicationModel
from app.models.profile import ProfileModel

logger = logging.getLogger(__name__)
notification_bp = Blueprint("notification", __name__)

@notification_bp.route("", methods=["GET"])
@token_required
def get_notifications(current_user):
    """Retrieves in-app notifications for authenticated student."""
    user_id = str(current_user["_id"])
    try:
        notifications = NotificationModel.find_by_user(user_id)
        # If user has no notifications yet, generate an initial welcome notification
        if not notifications:
            welcome_notif = NotificationModel.create_notification(
                user_id=user_id,
                title="Welcome to CareerPilot AI! 🚀",
                message="Your live career telemetry and opportunity discovery radar is active. We are continuously scanning top student opportunities.",
                notif_type="system",
                link="/opportunities"
            )
            notifications = [welcome_notif]

        return jsonify({
            "success": True,
            "message": "Notifications retrieved successfully",
            "data": notifications
        }), 200
    except Exception as e:
        logger.exception("Error getting notifications: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to retrieve notifications",
            "error": str(e)
        }), 500

@notification_bp.route("/<notif_id>/read", methods=["PATCH", "PUT"])
@token_required
def mark_notification_read(current_user, notif_id):
    """Marks a single notification as read."""
    user_id = str(current_user["_id"])
    try:
        success = NotificationModel.mark_read(notif_id, user_id)
        return jsonify({
            "success": True,
            "message": "Notification marked as read"
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
            "data": {"count": count}
        }), 200
    except Exception as e:
        logger.exception("Error marking all notifications read: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to mark all notifications read",
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
