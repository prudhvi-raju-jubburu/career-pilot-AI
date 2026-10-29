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
from app.routes.application import application_bp
from app.routes.dashboard import dashboard_bp
from app.routes.notification import notification_bp
from app.routes.sources import sources_bp
from app.routes.stream import stream_bp
from app.routes.advisor import advisor_bp
from app.routes.recommendations import recommendations_bp
from app.routes.resume_builder import resume_builder_bp
from app.routes.admin import admin_bp

from app.models.user import UserModel
from app.models.profile import ProfileModel
from app.models.opportunity import OpportunityModel
from app.models.company import CompanyModel
from app.models.learning_progress import LearningProgressModel
from app.models.application import ApplicationModel
from app.models.notification import NotificationModel
from app.models.source_run import SourceRunModel
from app.models.generated_resume import GeneratedResumeModel
from app.models.feedback import FeedbackModel
from app.models.digest_delivery import DigestDeliveryModel
from app.models.interview_event import InterviewEventModel
from app.models.interview_prep import InterviewPrepModel
from app.models.mock_test_attempt import MockTestAttemptModel
from app.models.audit_log import AuditLogModel
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
        
        # Production Security Hardening Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response

    # Ensure uploads directory exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Initialize PyMongo Database
    Database.init_app(app)

    # Ensure database indexes
    UserModel.ensure_indexes()
    ProfileModel.ensure_indexes()
    OpportunityModel.ensure_indexes()
    CompanyModel.ensure_indexes()
    CompanyModel.seed_initial_registry()
    LearningProgressModel.ensure_indexes()
    ApplicationModel.ensure_indexes()
    NotificationModel.ensure_indexes()
    SourceRunModel.ensure_indexes()
    GeneratedResumeModel.ensure_indexes()
    FeedbackModel.ensure_indexes()
    DigestDeliveryModel.ensure_indexes()
    InterviewEventModel.ensure_indexes()
    InterviewPrepModel.ensure_indexes()
    MockTestAttemptModel.ensure_indexes()
    AuditLogModel.ensure_indexes()

    # Register Blueprints
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(profile_bp, url_prefix="/api/profile")
    app.register_blueprint(resume_bp, url_prefix="/api/resume")
    app.register_blueprint(resume_builder_bp, url_prefix="/api/resume-builder")
    app.register_blueprint(skill_gap_bp, url_prefix="/api/skill-gap")
    app.register_blueprint(opportunity_bp, url_prefix="/api/opportunities")
    app.register_blueprint(application_bp, url_prefix="/api/applications")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(notification_bp, url_prefix="/api/notifications")
    app.register_blueprint(sources_bp, url_prefix="/api/sources")
    app.register_blueprint(stream_bp, url_prefix="/api/stream")
    app.register_blueprint(advisor_bp, url_prefix="/api/advisor")
    app.register_blueprint(recommendations_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

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
        logging.getLogger(__name__).error("Internal server error: %s", str(error), exc_info=True)
        return jsonify({
            "success": False,
            "message": "An internal server error occurred.",
            "error": "INTERNAL_SERVER_ERROR"
        }), 500

    return app
