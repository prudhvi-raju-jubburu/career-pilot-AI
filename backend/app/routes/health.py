from datetime import datetime, timezone
from flask import Blueprint, jsonify
from app.config.db import Database
from app.models.source_run import SourceRunModel

health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
def health_check():
    """
    Health check endpoint confirming backend server status, database connectivity,
    scheduler execution state, collection counts, and per-source telemetry.
    """
    db_ok, db_msg = Database.check_connection()

    db = Database.get_db()
    counts = {}
    if db_ok and db is not None:
        try:
            for col_name in ["opportunities", "applications", "users", "student_profiles", "source_runs", "copilot_conversations"]:
                counts[col_name] = db[col_name].count_documents({})
        except Exception:
            pass

    # Source runs
    sources_summary = []
    if db_ok:
        try:
            sources_summary = SourceRunModel.get_latest_runs()
        except Exception:
            pass

    # Scheduler state
    from app.services.scheduler import _scheduler
    scheduler_active = _scheduler is not None and _scheduler.running if '_scheduler' in globals() or _scheduler else False

    # AI Provider telemetry
    try:
        from app.ai.ai_service import AIService
        cfg_provider = AIService.get_configured_provider()
        active_provider, api_key = AIService.resolve_active_provider()
        ai_telemetry = {
            "configured_provider": cfg_provider,
            "active_provider": active_provider,
            "is_ai_available": active_provider != "fallback" and bool(api_key),
            "fallback_active": active_provider == "fallback" or not bool(api_key)
        }
    except Exception as e:
        ai_telemetry = {
            "configured_provider": "unknown",
            "active_provider": "fallback",
            "is_ai_available": False,
            "fallback_active": True,
            "error": str(e)
        }

    return jsonify({
        "success": True,
        "message": "CareerPilot AI backend is healthy and running",
        "data": {
            "service": "careerpilot-ai-backend",
            "status": "healthy" if db_ok else "degraded",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "database": {
                "connected": db_ok,
                "status": db_msg,
                "counts": counts
            },
            "scheduler": {
                "running": scheduler_active
            },
            "ai": ai_telemetry,
            "sources": sources_summary
        }
    }), 200
