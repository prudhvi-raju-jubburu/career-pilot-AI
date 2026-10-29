import json
import logging
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request, Response
from bson import ObjectId

from app.config.db import Database
from app.utils.auth import token_required
from app.services.recommendation_engine import RecommendationEngine
from app.services.opportunity_service import OpportunityService
from app.services.eligibility_engine import EligibilityEngine
from app.scrapers.link_import_service import LinkImportService
from app.models.company import CompanyModel
from app.models.opportunity import OpportunityModel
from app.config.recommendation_config import RECOMMENDATION_WEIGHTS

logger = logging.getLogger(__name__)

recommendations_bp = Blueprint("recommendations", __name__)

# -------------------------------------------------------------
# 1. Personalized Recommendations Feed
# -------------------------------------------------------------
@recommendations_bp.route("/recommendations", methods=["GET"])
@token_required
def get_personalized_recommendations(current_user):
    """
    Returns personalized opportunity recommendations for the authenticated student.
    Supports filtering by type, location, work_mode, minimum stipend, and tabs.
    """
    try:
        user_id = str(current_user.get("_id") or current_user.get("id"))
        opp_type = request.args.get("type")
        location = request.args.get("location")
        work_mode = request.args.get("mode") or request.args.get("work_mode")
        min_stipend_raw = request.args.get("min_stipend")
        min_stipend = int(min_stipend_raw) if min_stipend_raw and min_stipend_raw.isdigit() else None
        tab = request.args.get("tab", "recommended")
        cursor_raw = request.args.get("cursor", "0")
        cursor = int(cursor_raw) if cursor_raw and cursor_raw.isdigit() else 0
        limit_raw = request.args.get("limit", "20")
        limit = min(50, int(limit_raw) if limit_raw and limit_raw.isdigit() else 20)

        result = RecommendationEngine.get_recommendations(
            user_id=user_id,
            opp_type=opp_type,
            location=location,
            work_mode=work_mode,
            min_stipend=min_stipend,
            tab=tab,
            limit=limit,
            cursor=cursor
        )

        return jsonify({
            "success": True,
            "message": "Recommendations retrieved successfully",
            "data": result
        }), 200

    except Exception as e:
        logger.exception("Error generating recommendations: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to generate recommendations",
            "error": str(e)
        }), 500

# -------------------------------------------------------------
# 2. Detailed Explainability Inspector
# -------------------------------------------------------------
@recommendations_bp.route("/recommendations/<opp_id>/explain", methods=["GET"])
@token_required
def explain_recommendation(current_user, opp_id):
    """
    Provides full transparency report: score breakdown, eligibility checklist,
    matched/missing skills, and personalized rationale.
    """
    try:
        user_id = str(current_user.get("_id") or current_user.get("id"))
        report = RecommendationEngine.explain_recommendation(opp_id, user_id)
        if not report:
            return jsonify({
                "success": False,
                "message": "Opportunity not found"
            }), 404

        return jsonify({
            "success": True,
            "message": "Recommendation explanation retrieved successfully",
            "data": report
        }), 200

    except Exception as e:
        logger.exception("Error explaining recommendation %s: %s", opp_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to explain recommendation",
            "error": str(e)
        }), 500

# -------------------------------------------------------------
# 3. Tier 2 "Add by Link" URL Importer
# -------------------------------------------------------------
@recommendations_bp.route("/opportunities/import-url", methods=["POST"])
@token_required
def import_opportunity_url(current_user):
    """
    Compliance-first user-initiated import.
    Fetches only single public link specified by user, extracts metadata,
    and returns a preview or creates an opportunity record.
    """
    try:
        user_id = str(current_user.get("_id") or current_user.get("id"))
        data = request.get_json() or {}
        raw_url = data.get("url")
        if not raw_url or not isinstance(raw_url, str):
            return jsonify({
                "success": False,
                "message": "A valid 'url' string is required in JSON payload",
                "error": "VALIDATION_ERROR"
            }), 400

        url = raw_url.strip()
        save_immediately = bool(data.get("save_immediately", False))

        success, parsed_data, msg = LinkImportService.import_from_url(url, user_id)
        if not success:
            return jsonify({
                "success": False,
                "message": msg
            }), 400

        created_opp = None
        if save_immediately:
            # Create opportunity document in MongoDB
            valid, err = OpportunityService.validate_opportunity(parsed_data)
            if valid:
                created_opp, _ = OpportunityService.create_opportunity(parsed_data)
                # Automatically save for this user
                if created_opp:
                    OpportunityService.save_opportunity(user_id, created_opp["id"])

        return jsonify({
            "success": True,
            "message": msg,
            "data": {
                "parsed": parsed_data,
                "created_opportunity": created_opp
            }
        }), 200

    except Exception as e:
        logger.exception("Error importing URL: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to import opportunity from URL",
            "error": "IMPORT_FAILED"
        }), 500

# -------------------------------------------------------------
# 4. User Interaction Feedback Loop
# -------------------------------------------------------------
@recommendations_bp.route("/feedback", methods=["POST"])
@token_required
def record_feedback(current_user):
    """
    Records student interactions (click, save, apply, dismiss with reason).
    Used by collaborative filter and learning loop to refine future scores.
    """
    try:
        user_id = str(current_user.get("_id") or current_user.get("id"))
        payload = request.get_json() or {}
        opp_id = payload.get("opportunity_id")
        action = payload.get("action", "click") # click | save | apply | dismiss
        reason = payload.get("reason")          # not_interested | salary_too_low | location_mismatch | missing_skills

        ALLOWED_ACTIONS = {"click", "save", "unsave", "apply", "dismiss", "relevant", "not_relevant", "application_started", "application_confirmed"}
        if action not in ALLOWED_ACTIONS:
            return jsonify({
                "success": False,
                "message": "Invalid feedback action",
                "error": "VALIDATION_ERROR"
            }), 400

        if reason and (not isinstance(reason, str) or len(reason) > 200):
            return jsonify({
                "success": False,
                "message": "Reason must be a text string up to 200 characters",
                "error": "VALIDATION_ERROR"
            }), 400

        if not opp_id or not isinstance(opp_id, (str, int)):
            return jsonify({"success": False, "message": "opportunity_id is required", "error": "VALIDATION_ERROR"}), 400

        opp = OpportunityService.get_opportunity_by_id(str(opp_id))
        category = opp.get("type") or opp.get("category") if opp else None
        company = (opp.get("organization", {}).get("name") or opp.get("company")) if opp else None
        skills = opp.get("skills") if opp else []

        from app.models.feedback import FeedbackModel
        ev = FeedbackModel.record_event(
            user_id=user_id,
            opportunity_id=str(opp_id),
            event_type=action,
            reason=reason,
            category=category,
            company=company,
            skills=skills
        )

        # If action is save, update saved_opportunities bookmark
        if action == "save":
            OpportunityService.save_opportunity(user_id, str(opp_id))
        elif action == "unsave":
            OpportunityService.unsave_opportunity(user_id, str(opp_id))

        return jsonify({
            "success": True,
            "message": f"Feedback '{action}' recorded successfully",
            "data": {"user_id": user_id, "action": action, "event": ev}
        }), 200

    except Exception as e:
        logger.exception("Error recording feedback: %s", str(e))
        return jsonify({"success": False, "message": "Failed to record feedback", "error": "INTERNAL_SERVER_ERROR"}), 500

@recommendations_bp.route("/recommendations/feedback-summary", methods=["GET"])
@token_required
def get_user_feedback_summary_route(current_user):
    """
    Returns summary statistics of the authenticated student's explicit and implicit feedback.
    """
    try:
        user_id = str(current_user.get("_id") or current_user.get("id"))
        from app.models.feedback import FeedbackModel
        summary = FeedbackModel.get_user_feedback_summary(user_id)
        return jsonify({
            "success": True,
            "message": "Feedback summary retrieved successfully",
            "data": summary
        }), 200
    except Exception as e:
        logger.exception("Error getting feedback summary: %s", str(e))
        return jsonify({"success": False, "error": str(e)}), 500


# -------------------------------------------------------------
# 5. Company Watchlist Endpoints
# -------------------------------------------------------------
@recommendations_bp.route("/companies/watchlist", methods=["GET"])
@token_required
def get_watchlist(current_user):
    """Returns list of companies followed by the student."""
    try:
        user_id = str(current_user.get("_id") or current_user.get("id"))
        watchlist = CompanyModel.get_user_watchlist(user_id)
        return jsonify({
            "success": True,
            "data": watchlist
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@recommendations_bp.route("/companies/watchlist", methods=["POST"])
@token_required
def add_to_watchlist(current_user):
    """Follows a company to boost its future opportunity recommendations."""
    try:
        user_id = str(current_user.get("_id") or current_user.get("id"))
        data = request.get_json() or {}
        company_name = data.get("company_name", "").strip()
        if not company_name:
            return jsonify({"success": False, "message": "company_name is required"}), 400

        CompanyModel.add_to_watchlist(user_id, company_name)
        return jsonify({
            "success": True,
            "message": f"Added '{company_name}' to your followed watchlist (+15 match boost active)",
            "data": {"company_name": company_name}
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@recommendations_bp.route("/companies/watchlist/<company_name>", methods=["DELETE"])
@token_required
def remove_from_watchlist(current_user, company_name):
    """Unfollows a company."""
    try:
        user_id = str(current_user.get("_id") or current_user.get("id"))
        CompanyModel.remove_from_watchlist(user_id, company_name)
        return jsonify({
            "success": True,
            "message": f"Removed '{company_name}' from watchlist",
            "data": {"company_name": company_name}
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# -------------------------------------------------------------
# 6. Target Company Registry Endpoints
# -------------------------------------------------------------
@recommendations_bp.route("/companies/registry", methods=["GET"])
@token_required
def get_company_registry(current_user):
    """Lists registered target companies and their ATS connector configurations."""
    try:
        CompanyModel.seed_initial_registry()
        companies = CompanyModel.get_all_companies(active_only=False)
        return jsonify({
            "success": True,
            "count": len(companies),
            "data": companies
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@recommendations_bp.route("/companies/registry", methods=["POST"])
@token_required
def add_company_to_registry(current_user):
    """Allows adding a target company with its ATS board slug."""
    try:
        data = request.get_json() or {}
        success, msg = CompanyModel.add_company(data)
        if not success:
            return jsonify({"success": False, "message": msg}), 400

        return jsonify({
            "success": True,
            "message": msg
        }), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# -------------------------------------------------------------
# 7. Search Alerts Endpoints
# -------------------------------------------------------------
@recommendations_bp.route("/alerts", methods=["GET"])
@token_required
def get_alerts(current_user):
    """Returns user's saved search queries and alert preferences."""
    try:
        user_id = str(current_user.get("_id") or current_user.get("id"))
        db = Database.get_db()
        if db is None:
            return jsonify({"success": False, "message": "Database not initialized"}), 500
        cursor = db["user_alerts"].find({"user_id": user_id})
        alerts = []
        for doc in cursor:
            doc["id"] = str(doc.get("_id"))
            doc.pop("_id", None)
            alerts.append(doc)
        return jsonify({"success": True, "data": alerts}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@recommendations_bp.route("/alerts", methods=["POST"])
@token_required
def create_alert(current_user):
    """Saves a search query and sets notification frequency."""
    try:
        user_id = str(current_user.get("_id") or current_user.get("id"))
        data = request.get_json() or {}
        query = data.get("query", "").strip()
        frequency = data.get("frequency", "daily") # instant | daily | weekly
        opp_type = data.get("type", "all")
        location = data.get("location", "all")

        db = Database.get_db()
        if db is None:
            return jsonify({"success": False, "message": "Database not initialized"}), 500
        doc = {
            "user_id": user_id,
            "query": query,
            "frequency": frequency,
            "type": opp_type,
            "location": location,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        res = db["user_alerts"].insert_one(doc)
        doc["id"] = str(res.inserted_id)
        doc.pop("_id", None)
        return jsonify({"success": True, "message": "Alert created successfully", "data": doc}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@recommendations_bp.route("/alerts/<alert_id>", methods=["DELETE"])
@token_required
def delete_alert(current_user, alert_id):
    """Removes a search alert."""
    try:
        user_id = str(current_user.get("_id") or current_user.get("id"))
        db = Database.get_db()
        if db is None:
            return jsonify({"success": False, "message": "Database not initialized"}), 500
        if ObjectId.is_valid(alert_id):
            db["user_alerts"].delete_one({"_id": ObjectId(alert_id), "user_id": user_id})
        return jsonify({"success": True, "message": "Alert deleted"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# -------------------------------------------------------------
# 8. Recommendation Engine Debug Endpoint
# -------------------------------------------------------------
@recommendations_bp.route("/recommendations/debug", methods=["GET"])
@token_required
def debug_recommendations(current_user):
    """
    Admin & testing inspector to verify scoring weights, candidate counts,
    and eligibility violation checks (guaranteed 0%).
    """
    try:
        user_id = str(current_user.get("_id") or current_user.get("id"))
        res = RecommendationEngine.get_recommendations(user_id=user_id, limit=10)

        # Calculate eligibility violation count
        violations = sum(
            1 for item in res.get("items", [])
            if not item.get("eligibility", {}).get("is_eligible", False)
        )

        return jsonify({
            "success": True,
            "weights": RECOMMENDATION_WEIGHTS,
            "total_candidates": res.get("total"),
            "recommended_count": res.get("counts", {}).get("recommended"),
            "stretch_count": res.get("counts", {}).get("stretch"),
            "eligibility_violations_in_recommended": violations,
            "top_item_breakdown": res.get("items", [])[0]["score_breakdown"] if res.get("items") else None
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# -------------------------------------------------------------
# 9. Real-Time Recommendation Stream (SSE)
# -------------------------------------------------------------
@recommendations_bp.route("/stream/recommendations", methods=["GET"])
@token_required
def stream_recommendations(current_user):
    """Server-Sent Events stream delivering live recommendations."""
    user_id = str(current_user.get("_id") or current_user.get("id"))

    def event_stream():
        # Initial heartbeat
        yield f"event: connected\ndata: {json.dumps({'status': 'connected', 'user_id': user_id})}\n\n"
        # Fetch fresh recommendations
        try:
            res = RecommendationEngine.get_recommendations(user_id=user_id, limit=5)
            payload = {
                "type": "new_recommendations",
                "count": len(res.get("items", [])),
                "items": res.get("items", [])
            }
            yield f"event: recommendations\ndata: {json.dumps(payload)}\n\n"
        except Exception as err:
            logger.warning("Error in recommendation stream: %s", str(err))

    return Response(
        event_stream(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive"
        }
    )

# -------------------------------------------------------------
# 10. Canonical Saved Opportunities Endpoint
# -------------------------------------------------------------
@recommendations_bp.route("/saved-opportunities", methods=["GET"])
@token_required
def get_saved_opportunities_alias(current_user):
    """Retrieves all bookmarked opportunities for the authenticated student."""
    user_id = str(current_user.get("_id") or current_user.get("id"))
    saved_ids = OpportunityService.get_saved_opportunity_ids(user_id)
    items = []
    for sid in saved_ids:
        opp = OpportunityService.get_opportunity_by_id(sid)
        if opp:
            items.append(opp)
    return jsonify({
        "success": True,
        "message": "Saved opportunities retrieved successfully",
        "data": items
    }), 200
