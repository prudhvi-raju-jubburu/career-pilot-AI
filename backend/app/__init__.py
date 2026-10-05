import os
import logging
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from app.config.config import Config
from app.config.db import Database
from app.routes.health import health_bp
from app.routes.auth import auth_bp
from app.routes.profile import profile_bp
from app.routes.resume import resume_bp
from app.routes.skill_gap import skill_gap_bp
from app.routes.opportunity import opportunity_bp
from app.models.user import UserModel
from app.models.profile import ProfileModel
from app.models.opportunity import OpportunityModel
from app.models.learning_progress import LearningProgressModel
from app.services.scheduler import init_scheduler

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
            "origins": ["*"],
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
        }
    }, supports_credentials=True)

    @app.before_request
    def handle_options_preflight():
        if request.method == "OPTIONS":
            response = make_response()
            origin = request.headers.get("Origin") or "*"
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
            return response, 200

    @app.after_request
    def add_cors_headers(response):
        origin = request.headers.get("Origin") or "*"
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        return response

    # Ensure uploads directory exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Initialize PyMongo Database
    Database.init_app(app)

    # Ensure database indexes
    UserModel.ensure_indexes()
    ProfileModel.ensure_indexes()
    OpportunityModel.ensure_indexes()
    LearningProgressModel.ensure_indexes()

    # Register Blueprints
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(profile_bp, url_prefix="/api/profile")
    app.register_blueprint(resume_bp, url_prefix="/api/resume")
    app.register_blueprint(skill_gap_bp, url_prefix="/api/skill-gap")
    app.register_blueprint(opportunity_bp, url_prefix="/api/opportunities")

    # Placeholder for Phase 5 Applications endpoint
    @app.route("/api/applications", methods=["GET"])
    def get_applications_stub():
        return jsonify({
            "success": True,
            "data": []
        }), 200

    # Initialize Background Scheduler if not in testing mode
    if not app.config.get("TESTING") and not os.environ.get("PYTEST_CURRENT_TEST"):
        init_scheduler(app)

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
