from datetime import datetime, timezone
from flask import Blueprint, jsonify
from app.config.db import Database

health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint confirming backend server status and reporting database availability."""
    db_ok, db_msg = Database.check_connection()
    
    return jsonify({
        "success": True,
        "message": "CareerPilot AI backend is running",
        "data": {
            "service": "careerpilot-ai-backend",
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "database": {
                "connected": db_ok,
                "status": db_msg
            }
        }
    }), 200
