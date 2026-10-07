import logging
from flask import Blueprint, request, jsonify
from app.services.opportunity_service import OpportunityService
from app.services.ingestion_service import OpportunityIngestionService
from app.utils.auth import token_required

logger = logging.getLogger(__name__)
opportunity_bp = Blueprint("opportunity", __name__)

@opportunity_bp.route("", methods=["GET"])
def get_opportunities():
    """
    Public/authenticated paginated opportunity discovery endpoint with full-text search and multi-facet filtering.
    """
    try:
        # Validate and parse query parameters
        page_raw = request.args.get("page", 1)
        limit_raw = request.args.get("limit", 20)

        try:
            page = int(page_raw)
            limit = int(limit_raw)
            if page < 1:
                return jsonify({
                    "success": False,
                    "message": "Query parameter 'page' must be greater than or equal to 1",
                    "error": "INVALID_QUERY_PARAMETER"
                }), 400
            if limit < 1 or limit > 50:
                return jsonify({
                    "success": False,
                    "message": "Query parameter 'limit' must be between 1 and 50",
                    "error": "INVALID_QUERY_PARAMETER"
                }), 400
        except ValueError:
            return jsonify({
                "success": False,
                "message": "Query parameters 'page' and 'limit' must be valid integers",
                "error": "INVALID_QUERY_PARAMETER"
            }), 400

        search = request.args.get("search")
        opp_type = request.args.get("type")
        category = request.args.get("category")
        location = request.args.get("location")
        remote = request.args.get("remote")
        work_mode = request.args.get("work_mode", request.args.get("workMode"))
        deadline_before = request.args.get("deadline_before")
        sort_by = request.args.get("sort", "latest")
        status = request.args.get("status", "active")

        result = OpportunityService.list_opportunities(
            page=page,
            limit=limit,
            search=search,
            opp_type=opp_type,
            category=category,
            location=location,
            remote=remote,
            work_mode=work_mode,
            deadline_before=deadline_before,
            status=status,
            sort_by=sort_by
        )

        return jsonify({
            "success": True,
            "message": "Opportunities retrieved successfully",
            "data": result
        }), 200

    except Exception as e:
        logger.exception("Error listing opportunities: %s", str(e))
        return jsonify({
            "success": False,
            "message": f"Failed to list opportunities: {str(e)}",
            "error": "INTERNAL_ERROR"
        }), 500

@opportunity_bp.route("/<opp_id>", methods=["GET"])
def get_opportunity_detail(opp_id):
    """Retrieves full details for a single opportunity by ID."""
    if not opp_id or not str(opp_id).strip():
        return jsonify({
            "success": False,
            "message": "Opportunity ID is required",
            "error": "BAD_REQUEST"
        }), 400

    try:
        opp = OpportunityService.get_opportunity_by_id(str(opp_id).strip())
        if not opp:
            return jsonify({
                "success": False,
                "message": f"Opportunity with ID '{opp_id}' was not found",
                "error": "OPPORTUNITY_NOT_FOUND"
            }), 404

        return jsonify({
            "success": True,
            "message": "Opportunity details retrieved successfully",
            "data": opp
        }), 200

    except Exception as e:
        logger.exception("Error retrieving opportunity %s: %s", opp_id, str(e))
        return jsonify({
            "success": False,
            "message": f"Failed to retrieve opportunity: {str(e)}",
            "error": "INTERNAL_ERROR"
        }), 500

@opportunity_bp.route("/categories", methods=["GET"])
def get_categories():
    """Returns active opportunity categories and item counts."""
    try:
        categories = OpportunityService.get_categories()
        return jsonify({
            "success": True,
            "message": "Categories retrieved successfully",
            "data": categories
        }), 200
    except Exception as e:
        logger.exception("Error getting categories: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to retrieve categories",
            "error": "INTERNAL_ERROR"
        }), 500

@opportunity_bp.route("/filters", methods=["GET"])
def get_filters():
    """Provides dynamically available filter choices based on stored opportunities."""
    try:
        filters = OpportunityService.get_filter_options()
        return jsonify({
            "success": True,
            "message": "Filter options retrieved successfully",
            "data": filters
        }), 200
    except Exception as e:
        logger.exception("Error getting filter options: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to retrieve filter options",
            "error": "INTERNAL_ERROR"
        }), 500

@opportunity_bp.route("/ingest", methods=["POST"])
@token_required
def trigger_ingestion(current_user):
    """
    Protected endpoint to trigger on-demand opportunity ingestion across registered sources.
    """
    try:
        ingestion_service = OpportunityIngestionService()
        metrics = ingestion_service.run_ingestion()
        return jsonify({
            "success": True,
            "message": "Opportunity ingestion completed",
            "data": metrics
        }), 200
    except Exception as e:
        logger.exception("Ingestion failed: %s", str(e))
        return jsonify({
            "success": False,
            "message": f"Ingestion failed: {str(e)}",
            "error": "INGESTION_ERROR"
        }), 500

@opportunity_bp.route("/<opp_id>/save", methods=["POST"])
@token_required
def save_opportunity(current_user, opp_id):
    """Bookmarks an opportunity in the student profile."""
    user_id = str(current_user["_id"])
    OpportunityService.save_opportunity(user_id, opp_id)
    return jsonify({
        "success": True,
        "message": "Opportunity saved to bookmarks",
        "data": {"opp_id": opp_id, "saved": True}
    }), 200

@opportunity_bp.route("/<opp_id>/unsave", methods=["POST", "DELETE"])
@token_required
def unsave_opportunity(current_user, opp_id):
    """Removes an opportunity bookmark."""
    user_id = str(current_user["_id"])
    OpportunityService.unsave_opportunity(user_id, opp_id)
    return jsonify({
        "success": True,
        "message": "Opportunity removed from bookmarks",
        "data": {"opp_id": opp_id, "saved": False}
    }), 200

@opportunity_bp.route("/saved", methods=["GET"])
@token_required
def get_saved_opportunities(current_user):
    """Retrieves all bookmarked opportunities for the authenticated student."""
    user_id = str(current_user["_id"])
    saved_ids = OpportunityService.get_saved_opportunity_ids(user_id)
    items = []
    for sid in saved_ids:
        opp = OpportunityService.get_opportunity_by_id(sid)
        if opp:
            items.append(opp)
    return jsonify({
        "success": True,
        "message": "Saved opportunities retrieved",
        "data": items
    }), 200

@opportunity_bp.route("/<opp_id>/eligibility", methods=["GET"])
@token_required
def get_opportunity_eligibility(current_user, opp_id):
    """Evaluates authenticated student profile against opportunity requirements."""
    user_id = str(current_user["_id"])
    opp = OpportunityService.get_opportunity_by_id(opp_id)
    if not opp:
        return jsonify({"success": False, "message": "Opportunity not found"}), 404

    from app.services.profile_service import ProfileService
    profile = ProfileService.get_profile_by_user_id(user_id) or {}
    result = OpportunityService.check_eligibility(opp, profile)
    return jsonify({
        "success": True,
        "message": "Eligibility evaluated successfully",
        "data": result
    }), 200

@opportunity_bp.route("/<opp_id>/match", methods=["GET"])
@token_required
def get_opportunity_match(current_user, opp_id):
    """Computes explainable match score and skill gaps for this opportunity."""
    user_id = str(current_user["_id"])
    opp = OpportunityService.get_opportunity_by_id(opp_id)
    if not opp:
        return jsonify({"success": False, "message": "Opportunity not found"}), 404

    from app.services.profile_service import ProfileService
    profile = ProfileService.get_profile_by_user_id(user_id) or {}
    match_result = OpportunityService.compute_match(opp, profile)
    return jsonify({
        "success": True,
        "message": "Match analysis computed successfully",
        "data": match_result
    }), 200

