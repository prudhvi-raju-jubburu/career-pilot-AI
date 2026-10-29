import logging
from flask import Blueprint, jsonify, request
from app.utils.auth import token_required, admin_required
from app.models.source_run import SourceRunModel
from app.services.ingestion_service import OpportunityIngestionService
from app.services.admin_service import AdminService

logger = logging.getLogger(__name__)
sources_bp = Blueprint("sources", __name__)

@sources_bp.route("/status", methods=["GET"])
def get_sources_status():
    """
    Returns live operational status and last sync metrics for each registered
    external opportunity connector.
    """
    try:
        latest_runs = SourceRunModel.get_latest_runs()
        # Canonical list of sources
        canonical_sources = [
            {"source_name": "ats_job_boards", "display_name": "Indian Unicorn & GCC ATS Job Boards", "type": "public_ats_boards", "schedule": "Every 2 hours"},
            {"source_name": "unstop_api", "display_name": "Unstop India Tech Opportunities", "type": "internships_and_jobs", "schedule": "Every 3 hours"},
            {"source_name": "devfolio_api", "display_name": "Devfolio India University Hackathons", "type": "hackathon", "schedule": "Every 6 hours"},
            {"source_name": "remotive_api", "display_name": "Remotive India & Global Remote Tech", "type": "remote_jobs", "schedule": "Every 4 hours"},
            {"source_name": "codeforces_api", "display_name": "Codeforces Contests API", "type": "coding_contest", "schedule": "Every 1 hour"},
            {"source_name": "opportunitydesk_rss", "display_name": "India & Global Fellowships Feed", "type": "scholarship", "schedule": "Every 12 hours"}
        ]

        run_map = {r.get("source_name"): r for r in latest_runs}
        statuses = []
        for src in canonical_sources:
            s_name = src["source_name"]
            last_run = run_map.get(s_name)
            statuses.append({
                "source_name": s_name,
                "display_name": src["display_name"],
                "type": src["type"],
                "schedule": src["schedule"],
                "status": last_run.get("status", "idle") if last_run else "ready",
                "last_synced_at": last_run.get("completed_at") if last_run else None,
                "last_success_at": last_run.get("last_successful_at") or (last_run.get("completed_at") if last_run and last_run.get("status") == "success" else None),
                "duration_seconds": last_run.get("duration_seconds", 0.0) if last_run else 0.0,
                "items_fetched": last_run.get("fetched", 0) if last_run else 0,
                "items_validated": last_run.get("validated", 0) if last_run else 0,
                "items_accepted": last_run.get("accepted", 0) if last_run else 0,
                "items_updated": last_run.get("updated", 0) if last_run else 0,
                "items_duplicates": last_run.get("duplicates", 0) if last_run else 0,
                "items_rejected": last_run.get("rejected", 0) if last_run else 0,
                "last_error": last_run.get("error") if last_run else None
            })

        return jsonify({
            "success": True,
            "message": "Sources status retrieved successfully",
            "data": statuses
        }), 200
    except Exception as e:
        logger.exception("Error getting sources status: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to get sources status",
            "error": str(e)
        }), 500

@sources_bp.route("/sync", methods=["POST"])
@admin_required
def trigger_sync(current_user):
    """Triggers an immediate ingestion sync across configured sources (Admin only)."""
    ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    ua = request.headers.get("User-Agent")
    try:
        metrics = AdminService.trigger_source_sync(
            admin_id=str(current_user["_id"]),
            admin_email=current_user.get("email"),
            ip_address=ip,
            user_agent=ua
        )
        return jsonify({
            "success": True,
            "message": "Opportunity sync completed successfully",
            "data": metrics
        }), 200
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "CONCURRENT_JOB_CONFLICT"
        }), 409
    except Exception as e:
        logger.exception("Error triggering source sync: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to run source sync",
            "error": str(e)
        }), 500

@sources_bp.route("/<source_name>/history", methods=["GET"])
@token_required
def get_source_history(current_user, source_name):
    """Retrieves telemetry history for a specific ingestion source."""
    try:
        history = SourceRunModel.get_source_history(source_name)
        return jsonify({
            "success": True,
            "message": f"Run history for source '{source_name}' retrieved",
            "data": history
        }), 200
    except Exception as e:
        logger.exception("Error getting history for source %s: %s", source_name, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to get source history",
            "error": str(e)
        }), 500

@sources_bp.route("/health", methods=["GET"])
@token_required
def get_sources_health(current_user):
    """
    Protected diagnostic endpoint reporting real-time operational health,
    connector metrics, error categories, and database opportunity freshness.
    Guarantees no credentials or student data are exposed.
    """
    from app.models.opportunity import OpportunityModel
    try:
        latest_runs = SourceRunModel.get_latest_runs()
        run_map = {r.get("source_name"): r for r in latest_runs}

        col = OpportunityModel.get_collection()
        total_opps = col.count_documents({})
        active_opps = col.count_documents({"status": "active"})
        expired_opps = col.count_documents({"status": "expired"})
        scam_opps = col.count_documents({"status": "scam_flagged"})

        connectors = []
        canonical_sources = [
            {"source_name": "ats_job_boards", "display_name": "ATS Job Boards (Greenhouse/Lever/SmartRecruiters)"},
            {"source_name": "unstop_api", "display_name": "Unstop India Tech Opportunities"},
            {"source_name": "devfolio_api", "display_name": "Devfolio Hackathons"},
            {"source_name": "remotive_api", "display_name": "Remotive Remote Jobs"},
            {"source_name": "codeforces_api", "display_name": "Codeforces Contests"},
            {"source_name": "opportunitydesk_rss", "display_name": "Fellowships & Scholarships RSS"}
        ]

        healthy_count = 0
        failed_count = 0

        for src in canonical_sources:
            s_name = src["source_name"]
            last_run = run_map.get(s_name) or {}
            status = last_run.get("status", "idle")
            err = last_run.get("error")

            if status == "success":
                healthy_count += 1
            elif status == "failed":
                failed_count += 1

            connectors.append({
                "source_name": s_name,
                "display_name": src["display_name"],
                "status": status,
                "last_synced_at": last_run.get("completed_at"),
                "duration_seconds": last_run.get("duration_seconds", 0.0),
                "items_fetched": last_run.get("fetched", 0),
                "items_accepted": last_run.get("accepted", 0),
                "items_duplicates": last_run.get("duplicates", 0),
                "items_rejected": last_run.get("rejected", 0),
                "last_error": str(err)[:200] if err else None
            })

        overall_system_status = "healthy" if failed_count == 0 else ("degraded" if healthy_count > 0 else "unhealthy")

        return jsonify({
            "success": True,
            "message": "Operational source health retrieved successfully",
            "data": {
                "system_status": overall_system_status,
                "healthy_connectors": healthy_count,
                "failed_connectors": failed_count,
                "total_connectors": len(canonical_sources),
                "connectors": connectors,
                "database_freshness": {
                    "total_opportunities": total_opps,
                    "active_opportunities": active_opps,
                    "expired_opportunities": expired_opps,
                    "scam_flagged_opportunities": scam_opps
                }
            }
        }), 200
    except Exception as e:
        logger.exception("Error checking sources health: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to check sources health",
            "error": str(e)
        }), 500
