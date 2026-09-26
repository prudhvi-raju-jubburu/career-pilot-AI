import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from app.config.config import Config
from app.config.db import Database
from app.routes.health import health_bp
from app.routes.auth import auth_bp
from app.routes.profile import profile_bp
from app.routes.resume import resume_bp
from app.models.user import UserModel
from app.models.profile import ProfileModel

def create_app(config_class=Config):
    """Application factory for CareerPilot AI Flask backend."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )

    # Enable CORS for frontend communication
    frontend_origin = app.config.get("FRONTEND_URL", "http://localhost:5173")
    CORS(app, resources={
        r"/api/*": {
            "origins": [frontend_origin, "http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Ensure uploads directory exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Initialize PyMongo Database
    Database.init_app(app)

    # Ensure database indexes
    UserModel.ensure_indexes()
    ProfileModel.ensure_indexes()

    # Register Blueprints
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(profile_bp, url_prefix="/api/profile")
    app.register_blueprint(resume_bp, url_prefix="/api/resume")

    # Consistent Error Handlers
    @app.errorhandler(404)
    def handle_not_found(error):
        return jsonify({
            "success": False,
            "message": "Resource not found",
            "error": str(error)
        }), 404

    @app.errorhandler(405)
    def handle_method_not_allowed(error):
        return jsonify({
            "success": False,
            "message": "Method not allowed",
            "error": str(error)
        }), 405

    @app.errorhandler(500)
    def handle_internal_server_error(error):
        return jsonify({
            "success": False,
            "message": "Internal server error occurred",
            "error": str(error)
        }), 500

    return app
