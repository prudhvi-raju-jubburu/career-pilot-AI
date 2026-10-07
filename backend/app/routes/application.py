import logging
from flask import Blueprint, request, jsonify
from app.utils.auth import token_required
from app.models.application import ApplicationModel
from app.services.event_stream import EventStreamManager

logger = logging.getLogger(__name__)
application_bp = Blueprint("application", __name__)

@application_bp.route("", methods=["GET"])
@token_required
def get_applications(current_user):
    """Retrieves all tracked career applications for the authenticated student."""
    user_id = str(current_user["_id"])
    status = request.args.get("status")
    try:
        apps = ApplicationModel.find_by_user(user_id, status=status)
        return jsonify({
            "success": True,
            "message": "Applications retrieved successfully",
            "data": apps
        }), 200
    except Exception as e:
        logger.exception("Error getting applications for user %s: %s", user_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to retrieve applications",
            "error": str(e)
        }), 500

@application_bp.route("", methods=["POST"])
@token_required
def create_application(current_user):
    """Creates a new tracked application in the student's pipeline."""
    user_id = str(current_user["_id"])
    payload = request.get_json(silent=True) or {}

    if not payload.get("company") or not payload.get("role"):
        return jsonify({
            "success": False,
            "message": "Both company and role are required",
            "error": "VALIDATION_ERROR"
        }), 400

    try:
        app_doc = ApplicationModel.create_application(user_id, payload)
        EventStreamManager.broadcast("application_created", {
            "user_id": user_id,
            "application": app_doc
        })
        return jsonify({
            "success": True,
            "message": "Application created successfully",
            "data": app_doc
        }), 201
    except Exception as e:
        logger.exception("Error creating application for user %s: %s", user_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to create application",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>", methods=["GET"])
@token_required
def get_application(current_user, app_id):
    """Retrieves a single application by ID."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404
    return jsonify({
        "success": True,
        "message": "Application retrieved successfully",
        "data": app_doc
    }), 200

@application_bp.route("/<app_id>", methods=["PUT"])
@token_required
def update_application(current_user, app_id):
    """Updates application details, notes, or target deadlines."""
    user_id = str(current_user["_id"])
    updates = request.get_json(silent=True) or {}

    try:
        updated = ApplicationModel.update_application(app_id, user_id, updates)
        if not updated:
            return jsonify({
                "success": False,
                "message": "Application not found",
                "error": "NOT_FOUND"
            }), 404
        return jsonify({
            "success": True,
            "message": "Application updated successfully",
            "data": updated
        }), 200
    except Exception as e:
        logger.exception("Error updating application %s: %s", app_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to update application",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>/stage", methods=["PATCH", "PUT"])
@token_required
def update_application_stage(current_user, app_id):
    """Updates application status stage and records a timeline audit trail event."""
    user_id = str(current_user["_id"])
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")

    if not new_status:
        return jsonify({
            "success": False,
            "message": "New status stage is required",
            "error": "VALIDATION_ERROR"
        }), 400

    note = data.get("note")
    try:
        updated = ApplicationModel.update_stage(app_id, user_id, new_status, note=note)
        if not updated:
            return jsonify({
                "success": False,
                "message": "Application not found",
                "error": "NOT_FOUND"
            }), 404

        EventStreamManager.broadcast("application_stage_changed", {
            "user_id": user_id,
            "application_id": app_id,
            "status": new_status
        })

        return jsonify({
            "success": True,
            "message": f"Stage updated to {new_status}",
            "data": updated
        }), 200
    except Exception as e:
        logger.exception("Error updating stage for application %s: %s", app_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to update application stage",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>", methods=["DELETE"])
@token_required
def delete_application(current_user, app_id):
    """Removes an application from tracking."""
    user_id = str(current_user["_id"])
    try:
        deleted = ApplicationModel.delete_application(app_id, user_id)
        if not deleted:
            return jsonify({
                "success": False,
                "message": "Application not found",
                "error": "NOT_FOUND"
            }), 404
        return jsonify({
            "success": True,
            "message": "Application deleted successfully"
        }), 200
    except Exception as e:
        logger.exception("Error deleting application %s: %s", app_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to delete application",
            "error": str(e)
        }), 500
