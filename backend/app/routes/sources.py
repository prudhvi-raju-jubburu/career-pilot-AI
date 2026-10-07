import logging
from flask import Blueprint, jsonify, request
from app.utils.auth import token_required
from app.models.source_run import SourceRunModel
from app.services.ingestion_service import OpportunityIngestionService

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
            {"source_name": "remotive_api", "display_name": "Remotive Remote Jobs API", "type": "jobs", "schedule": "Every 4 hours"},
            {"source_name": "arbeitnow_api", "display_name": "Arbeitnow Tech Board API", "type": "jobs", "schedule": "Every 4 hours"},
            {"source_name": "codeforces_api", "display_name": "Codeforces Contests API", "type": "coding_contest", "schedule": "Every 1 hour"},
            {"source_name": "devfolio_api", "display_name": "Devfolio University Hackathons API", "type": "hackathon", "schedule": "Every 6 hours"},
            {"source_name": "opportunitydesk_rss", "display_name": "OpportunityDesk Scholarships Feed", "type": "scholarship", "schedule": "Every 12 hours"}
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
                "duration_seconds": last_run.get("duration_seconds", 0.0) if last_run else 0.0,
                "items_fetched": last_run.get("fetched", 0) if last_run else 0,
                "items_accepted": last_run.get("accepted", 0) if last_run else 0,
                "items_duplicates": last_run.get("duplicates", 0) if last_run else 0,
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
@token_required
def trigger_sync(current_user):
    """Triggers an immediate ingestion sync across configured sources."""
    try:
        service = OpportunityIngestionService()
        metrics = service.run_ingestion()
        return jsonify({
            "success": True,
            "message": "Opportunity sync completed successfully",
            "data": metrics
        }), 200
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
