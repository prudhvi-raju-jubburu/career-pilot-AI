import logging
from datetime import datetime, timezone, timedelta
from flask import Blueprint, jsonify
from app.utils.auth import token_required
from app.models.opportunity import OpportunityModel
from app.models.application import ApplicationModel
from app.models.profile import ProfileModel
from app.services.profile_service import ProfileService

logger = logging.getLogger(__name__)
dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/stats", methods=["GET"])
@token_required
def get_dashboard_stats(current_user):
    """
    Computes real, dynamic dashboard telemetry directly from MongoDB collections.
    Zero static or Math.random numbers.
    """
    user_id = str(current_user["_id"])
    try:
        now_utc = datetime.now(timezone.utc)
        today_start = (now_utc - timedelta(days=1)).isoformat()

        opp_col = OpportunityModel.get_collection()

        # 1. Total Opportunities in Radar
        total_opps = opp_col.count_documents({"status": "active"})

        # 2. Scanned Today (last 24 hours)
        scanned_today = opp_col.count_documents({
            "status": "active",
            "created_at": {"$gte": today_start}
        })

        # 3. 7-day sparkline history computed from real created_at dates
        sparkline = []
        for d in range(6, -1, -1):
            day_start = (now_utc - timedelta(days=d+1)).isoformat()
            day_end = (now_utc - timedelta(days=d)).isoformat()
            cnt = opp_col.count_documents({
                "created_at": {"$gte": day_start, "$lt": day_end}
            })
            sparkline.append(cnt)

        # 4. User's Applications Pipeline Breakdown (7 Canonical Statuses)
        user_apps = ApplicationModel.find_by_user(user_id)
        from app.services.opportunity_service import OpportunityService
        saved_opp_ids = OpportunityService.get_saved_opportunity_ids(user_id)
        pipeline = {
            "saved": len([a for a in user_apps if a.get("status") == "Saved"]),
            "applied": len([a for a in user_apps if a.get("status") == "Applied"]),
            "assessment": len([a for a in user_apps if a.get("status") in ("Assessment", "Online Assessment")]),
            "interview": len([a for a in user_apps if a.get("status") in ("Interview", "Interviewing")]),
            "interviewing": len([a for a in user_apps if a.get("status") in ("Interview", "Interviewing", "Assessment")]),
            "offer": len([a for a in user_apps if a.get("status") in ("Offer", "Offered", "Hired")]),
            "rejected": len([a for a in user_apps if a.get("status") in ("Rejected", "Closed")]),
            "withdrawn": len([a for a in user_apps if a.get("status") == "Withdrawn"]),
        }
        active_applications = pipeline["applied"] + pipeline["interviewing"]
        saved_opportunities_count = max(len(saved_opp_ids), pipeline["saved"])

        # 5. Profile Completion
        profile = ProfileService.get_profile_by_user_id(user_id)
        if not profile:
            profile = ProfileService.create_default_profile(
                user_id=user_id,
                user_email=current_user.get("email", ""),
                user_name=current_user.get("name", "")
            )
        completion_data = ProfileService.calculate_profile_completion(profile)
        completion_pct = completion_data.get("percentage", 0)

        # 6. Upcoming Deadlines
        upcoming_cursor = opp_col.find({
            "status": "active",
            "dates.deadline": {"$gte": now_utc.isoformat()}
        }).sort("dates.deadline", 1).limit(4)
        upcoming_deadlines = [OpportunityModel.to_dict(doc) for doc in upcoming_cursor]

        # 7. Recent Opportunities
        recent_cursor = opp_col.find({"status": "active"}).sort("created_at", -1).limit(4)
        recent_opportunities = [OpportunityModel.to_dict(doc) for doc in recent_cursor]

        return jsonify({
            "success": True,
            "message": "Dashboard statistics computed successfully",
            "data": {
                "total_opportunities": total_opps,
                "scanned_today": scanned_today,
                "sparkline_data": sparkline,
                "active_applications": active_applications,
                "saved_opportunities_count": saved_opportunities_count,
                "pipeline": pipeline,
                "profile_completion": completion_pct,
                "missing_items": completion_data.get("missing_items", []),
                "upcoming_deadlines": upcoming_deadlines,
                "recent_opportunities": recent_opportunities
            }
        }), 200

    except Exception as e:
        logger.exception("Error computing dashboard stats: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to compute dashboard stats",
            "error": str(e)
        }), 500
