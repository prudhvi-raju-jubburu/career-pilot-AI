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
            for col_name in ["opportunities", "applications", "users", "student_profiles", "source_runs"]:
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
            "sources": sources_summary
        }
    }), 200
