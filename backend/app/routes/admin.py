import logging
from flask import Blueprint, request, jsonify
from app.utils.auth import admin_required
from app.services.admin_service import AdminService
from app.models.source_run import SourceRunModel

logger = logging.getLogger(__name__)

admin_bp = Blueprint("admin", __name__)

def _client_meta():
    """Extracts client IP and User Agent for audit logging."""
    ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    if ip and "," in ip:
        ip = ip.split(",")[0].strip()
    ua = request.headers.get("User-Agent")
    return ip, ua

# =============================================================================
# 1. OVERVIEW DASHBOARD
# =============================================================================

@admin_bp.route("/overview", methods=["GET"])
@admin_required
def get_overview(current_user):
    """
    Returns platform KPI metrics and real-time system counts backed by MongoDB.
    """
    try:
        period_days = request.args.get("period", default=30, type=int)
        data = AdminService.get_overview_kpis(period_days=period_days)
        return jsonify({
            "success": True,
            "message": "Overview KPIs retrieved successfully",
            "data": data
        }), 200
    except Exception as e:
        logger.exception("Error getting admin overview KPIs: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to retrieve overview KPIs",
            "error": str(e)
        }), 500

@admin_bp.route("/charts", methods=["GET"])
@admin_required
def get_charts(current_user):
    """
    Returns database aggregations for registration trends, categories, sources, and application funnels.
    """
    try:
        period_days = request.args.get("period", default=30, type=int)
        charts = AdminService.get_overview_charts(period_days=period_days)
        return jsonify({
            "success": True,
            "message": "Chart aggregations retrieved successfully",
            "data": charts
        }), 200
    except Exception as e:
        logger.exception("Error getting admin chart aggregations: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to retrieve chart aggregations",
            "error": str(e)
        }), 500

# =============================================================================
# 2. USER MANAGEMENT
# =============================================================================

@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users(current_user):
    """
    Lists users with pagination, role/status filters, and search.
    """
    try:
        page = request.args.get("page", default=1, type=int)
        limit = min(request.args.get("limit", default=20, type=int), 100)
        search = request.args.get("search")
        role = request.args.get("role")
        status = request.args.get("status")
        sort_by = request.args.get("sort_by", default="created_at")
        sort_dir = request.args.get("sort_dir", default="desc")

        result = AdminService.list_users(
            page=page,
            limit=limit,
            search=search,
            role=role,
            status=status,
            sort_by=sort_by,
            sort_dir=sort_dir
        )
        return jsonify({
            "success": True,
            "message": "Users retrieved successfully",
            "data": result
        }), 200
    except Exception as e:
        logger.exception("Error listing users: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to list users",
            "error": str(e)
        }), 500

@admin_bp.route("/users/<user_id>", methods=["GET"])
@admin_required
def get_user_details(current_user, user_id):
    """
    Retrieves user profile and activity summary for administrative review.
    """
    try:
        details = AdminService.get_user_details(user_id)
        if not details:
            return jsonify({
                "success": False,
                "message": "User not found",
                "error": "NOT_FOUND"
            }), 404

        return jsonify({
            "success": True,
            "message": "User details retrieved successfully",
            "data": details
        }), 200
    except Exception as e:
        logger.exception("Error getting user details: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to get user details",
            "error": str(e)
        }), 500

@admin_bp.route("/users/<user_id>/status", methods=["PATCH"])
@admin_required
def update_user_status(current_user, user_id):
    """
    Suspends or reactivates a user account.
    Prevents self-suspension and audits the change.
    """
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    reason = data.get("reason", "")

    if not new_status:
        return jsonify({
            "success": False,
            "message": "Status is required ('active' or 'suspended')",
            "error": "VALIDATION_ERROR"
        }), 400

    ip, ua = _client_meta()
    try:
        updated_user = AdminService.set_user_status(
            admin_id=str(current_user["_id"]),
            admin_email=current_user.get("email"),
            target_user_id=user_id,
            new_status=new_status,
            reason=reason,
            ip_address=ip,
            user_agent=ua
        )
        return jsonify({
            "success": True,
            "message": f"User status updated to '{new_status}' successfully",
            "data": updated_user
        }), 200
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "BAD_REQUEST"
        }), 400
    except Exception as e:
        logger.exception("Error updating user status: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to update user status",
            "error": str(e)
        }), 500

@admin_bp.route("/users/<user_id>/role", methods=["PATCH"])
@admin_required
def update_user_role(current_user, user_id):
    """
    Updates a user role ('student' or 'admin') with safeguards against self-lockout.
    """
    data = request.get_json(silent=True) or {}
    new_role = data.get("role")
    reason = data.get("reason", "")

    if not new_role:
        return jsonify({
            "success": False,
            "message": "Role is required ('student' or 'admin')",
            "error": "VALIDATION_ERROR"
        }), 400

    ip, ua = _client_meta()
    try:
        updated_user = AdminService.set_user_role(
            admin_id=str(current_user["_id"]),
            admin_email=current_user.get("email"),
            target_user_id=user_id,
            new_role=new_role,
            reason=reason,
            ip_address=ip,
            user_agent=ua
        )
        return jsonify({
            "success": True,
            "message": f"User role updated to '{new_role}' successfully",
            "data": updated_user
        }), 200
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "BAD_REQUEST"
        }), 400
    except Exception as e:
        logger.exception("Error updating user role: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to update user role",
            "error": str(e)
        }), 500

@admin_bp.route("/users/create-admin", methods=["POST"])
@admin_required
def create_admin(current_user):
    """
    Creates a new administrator account. Requires existing admin privileges.
    """
    data = request.get_json(silent=True) or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    reason = data.get("reason", "")

    if not name or not email or not password:
        return jsonify({
            "success": False,
            "message": "Name, email, and password (min 8 chars) are required",
            "error": "VALIDATION_ERROR"
        }), 400

    ip, ua = _client_meta()
    try:
        new_admin = AdminService.create_admin_user(
            admin_id=str(current_user["_id"]),
            admin_email=current_user.get("email"),
            name=name,
            email=email,
            password=password,
            reason=reason,
            ip_address=ip,
            user_agent=ua
        )
        return jsonify({
            "success": True,
            "message": f"Administrator '{name}' ({email}) created successfully",
            "data": new_admin
        }), 201
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "BAD_REQUEST"
        }), 400
    except Exception as e:
        logger.exception("Error creating admin user: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to create administrator account",
            "error": str(e)
        }), 500

# =============================================================================
# 3. OPPORTUNITY MODERATION & DUPLICATE MERGE
# =============================================================================

@admin_bp.route("/opportunities", methods=["GET"])
@admin_required
def list_opportunities(current_user):
    """
    Lists opportunities with administrative review filters.
    """
    try:
        page = request.args.get("page", default=1, type=int)
        limit = min(request.args.get("limit", default=20, type=int), 100)
        search = request.args.get("search")
        status = request.args.get("status")
        filter_type = request.args.get("filter_type")
        category = request.args.get("category")
        source = request.args.get("source")
        sort_by = request.args.get("sort_by", default="created_at")
        sort_dir = request.args.get("sort_dir", default="desc")

        result = AdminService.list_opportunities(
            page=page,
            limit=limit,
            search=search,
            status=status,
            filter_type=filter_type,
            category=category,
            source=source,
            sort_by=sort_by,
            sort_dir=sort_dir
        )
        return jsonify({
            "success": True,
            "message": "Opportunities retrieved successfully",
            "data": result
        }), 200
    except Exception as e:
        logger.exception("Error listing admin opportunities: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to list opportunities",
            "error": str(e)
        }), 500

@admin_bp.route("/opportunities/<opp_id>", methods=["GET"])
@admin_required
def get_opportunity_details(current_user, opp_id):
    """
    Retrieves full opportunity details including duplicate candidate checks and application metrics.
    """
    try:
        opp = AdminService.get_opportunity_details(opp_id)
        if not opp:
            return jsonify({
                "success": False,
                "message": "Opportunity not found",
                "error": "NOT_FOUND"
            }), 404

        return jsonify({
            "success": True,
            "message": "Opportunity details retrieved successfully",
            "data": opp
        }), 200
    except Exception as e:
        logger.exception("Error getting opportunity details: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to get opportunity details",
            "error": str(e)
        }), 500

@admin_bp.route("/opportunities/<opp_id>/moderate", methods=["PATCH"])
@admin_required
def moderate_opportunity(current_user, opp_id):
    """
    Moderation actions: 'approve', 'mark_review', 'retire', 'update_metadata'.
    """
    data = request.get_json(silent=True) or {}
    action = data.get("action")
    payload = data.get("payload", {})

    if not action:
        return jsonify({
            "success": False,
            "message": "Action is required ('approve', 'mark_review', 'retire', 'update_metadata')",
            "error": "VALIDATION_ERROR"
        }), 400

    ip, ua = _client_meta()
    try:
        updated_opp = AdminService.moderate_opportunity(
            admin_id=str(current_user["_id"]),
            admin_email=current_user.get("email"),
            opp_id=opp_id,
            action=action,
            payload=payload,
            ip_address=ip,
            user_agent=ua
        )
        return jsonify({
            "success": True,
            "message": f"Opportunity moderated successfully with action '{action}'",
            "data": updated_opp
        }), 200
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "BAD_REQUEST"
        }), 400
    except Exception as e:
        logger.exception("Error moderating opportunity: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to moderate opportunity",
            "error": str(e)
        }), 500

@admin_bp.route("/opportunities/merge", methods=["POST"])
@admin_required
def merge_opportunities(current_user):
    """
    Merges duplicate opportunity into canonical record while preserving applications and bookmarks.
    """
    data = request.get_json(silent=True) or {}
    canonical_id = data.get("canonical_id")
    duplicate_id = data.get("duplicate_id")
    reason = data.get("reason", "Administrator verified duplicate merge")

    if not canonical_id or not duplicate_id:
        return jsonify({
            "success": False,
            "message": "Both canonical_id and duplicate_id are required",
            "error": "VALIDATION_ERROR"
        }), 400

    ip, ua = _client_meta()
    try:
        result = AdminService.merge_duplicate_opportunities(
            admin_id=str(current_user["_id"]),
            admin_email=current_user.get("email"),
            canonical_id=canonical_id,
            duplicate_id=duplicate_id,
            reason=reason,
            ip_address=ip,
            user_agent=ua
        )
        return jsonify({
            "success": True,
            "message": "Opportunities successfully merged",
            "data": result
        }), 200
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "BAD_REQUEST"
        }), 400
    except Exception as e:
        logger.exception("Error merging opportunities: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to merge opportunities",
            "error": str(e)
        }), 500

# =============================================================================
# 4. SOURCE HEALTH & CONTROLLED SYNC
# =============================================================================

@admin_bp.route("/sources", methods=["GET"])
@admin_required
def get_sources_status(current_user):
    """
    Returns live connector statuses and scheduler metrics.
    """
    try:
        status_data = AdminService.get_sources_overview()
        return jsonify({
            "success": True,
            "message": "Source connector statuses retrieved successfully",
            "data": status_data
        }), 200
    except Exception as e:
        logger.exception("Error getting admin sources status: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to get sources status",
            "error": str(e)
        }), 500

@admin_bp.route("/sources/<source_name>/history", methods=["GET"])
@admin_required
def get_source_history(current_user, source_name):
    """
    Returns telemetry run history for a connector.
    """
    try:
        history = SourceRunModel.get_source_history(source_name, limit=25)
        return jsonify({
            "success": True,
            "message": f"Run history for source '{source_name}' retrieved successfully",
            "data": history
        }), 200
    except Exception as e:
        logger.exception("Error getting source history: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to get source history",
            "error": str(e)
        }), 500

@admin_bp.route("/sources/sync", methods=["POST"])
@admin_required
def trigger_sources_sync(current_user):
    """
    Triggers an immediate, controlled opportunity ingestion sync across connectors.
    Prevents concurrent overlapping runs.
    """
    ip, ua = _client_meta()
    try:
        metrics = AdminService.trigger_source_sync(
            admin_id=str(current_user["_id"]),
            admin_email=current_user.get("email"),
            ip_address=ip,
            user_agent=ua
        )
        return jsonify({
            "success": True,
            "message": "Opportunity sync finished successfully",
            "data": metrics
        }), 200
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "CONCURRENT_JOB_CONFLICT"
        }), 409
    except Exception as e:
        logger.exception("Error running admin source sync: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to trigger opportunity sync",
            "error": str(e)
        }), 500

# =============================================================================
# 5. PLATFORM ANALYTICS & FEEDBACK RESOLUTION
# =============================================================================

@admin_bp.route("/analytics", methods=["GET"])
@admin_required
def get_analytics(current_user):
    """
    Retrieves deep platform analytics and performance breakdowns.
    """
    try:
        period_days = request.args.get("period", default=30, type=int)
        kpis = AdminService.get_overview_kpis(period_days=period_days)
        charts = AdminService.get_overview_charts(period_days=period_days)
        return jsonify({
            "success": True,
            "message": "Platform analytics retrieved successfully",
            "data": {
                "kpis": kpis,
                "charts": charts
            }
        }), 200
    except Exception as e:
        logger.exception("Error getting platform analytics: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to get analytics",
            "error": str(e)
        }), 500

@admin_bp.route("/feedback", methods=["GET"])
@admin_required
def list_feedback_reports(current_user):
    """
    Retrieves paginated student feedback signals and reported listings.
    """
    try:
        page = request.args.get("page", default=1, type=int)
        limit = min(request.args.get("limit", default=20, type=int), 100)
        event_type = request.args.get("event_type")
        reason = request.args.get("reason")
        rating = request.args.get("rating")
        status = request.args.get("status")
        search = request.args.get("search")

        result = AdminService.list_feedback_reports(
            page=page,
            limit=limit,
            event_type=event_type,
            reason=reason,
            rating=rating,
            status=status,
            search=search
        )
        return jsonify({
            "success": True,
            "message": "Feedback reports retrieved successfully",
            "data": result
        }), 200
    except Exception as e:
        logger.exception("Error listing feedback reports: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to list feedback reports",
            "error": str(e)
        }), 500

@admin_bp.route("/feedback/<feedback_id>/resolve", methods=["PATCH"])
@admin_required
def resolve_feedback_report(current_user, feedback_id):
    """
    Records an administrative resolution for a feedback report.
    """
    data = request.get_json(silent=True) or {}
    resolution_notes = data.get("resolution_notes", "")
    action_taken = data.get("action_taken", "Reviewed by administrator")

    ip, ua = _client_meta()
    try:
        updated = AdminService.resolve_feedback_report(
            admin_id=str(current_user["_id"]),
            admin_email=current_user.get("email"),
            feedback_id=feedback_id,
            resolution_notes=resolution_notes,
            action_taken=action_taken,
            ip_address=ip,
            user_agent=ua
        )
        return jsonify({
            "success": True,
            "message": "Feedback report resolved successfully",
            "data": updated
        }), 200
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "BAD_REQUEST"
        }), 400
    except Exception as e:
        logger.exception("Error resolving feedback report: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to resolve feedback report",
            "error": str(e)
        }), 500

# =============================================================================
# 6. AUDIT LOGS & ADMINISTRATIVE SETTINGS
# =============================================================================

@admin_bp.route("/audit-logs", methods=["GET"])
@admin_required
def list_audit_logs(current_user):
    """
    Retrieves paginated, read-only audit log records.
    """
    try:
        page = request.args.get("page", default=1, type=int)
        limit = min(request.args.get("limit", default=25, type=int), 100)
        admin_id = request.args.get("admin_id")
        action = request.args.get("action")
        target_type = request.args.get("target_type")
        date_from = request.args.get("date_from")
        date_to = request.args.get("date_to")

        result = AdminService.list_audit_logs(
            page=page,
            limit=limit,
            admin_id=admin_id,
            action=action,
            target_type=target_type,
            date_from=date_from,
            date_to=date_to
        )
        return jsonify({
            "success": True,
            "message": "Audit logs retrieved successfully",
            "data": result
        }), 200
    except Exception as e:
        logger.exception("Error listing audit logs: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to list audit logs",
            "error": str(e)
        }), 500

@admin_bp.route("/settings", methods=["GET"])
@admin_required
def get_settings(current_user):
    """
    Returns safe system parameters and operational configuration.
    """
    try:
        settings = AdminService.get_system_settings()
        return jsonify({
            "success": True,
            "message": "System settings retrieved successfully",
            "data": settings
        }), 200
    except Exception as e:
        logger.exception("Error getting admin settings: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to get settings",
            "error": str(e)
        }), 500
