import logging
from flask import Blueprint, request, jsonify
from app.utils.auth import token_required
from app.services.profile_service import ProfileService

logger = logging.getLogger(__name__)
profile_bp = Blueprint("profile", __name__)

@profile_bp.route("", methods=["GET"])
@token_required
def get_profile(current_user):
    """Retrieves authenticated student's profile from student_profiles."""
    user_id = str(current_user["_id"])
    profile = ProfileService.get_profile_by_user_id(user_id)

    if not profile:
        # Initialize default student profile using authenticated credentials
        profile = ProfileService.create_default_profile(
            user_id=user_id,
            user_email=current_user.get("email", ""),
            user_name=current_user.get("name", "")
        )

    return jsonify({
        "success": True,
        "message": "Student profile retrieved successfully",
        "data": ProfileService.to_dict(profile)
    }), 200

@profile_bp.route("", methods=["PUT"])
@token_required
def update_profile(current_user):
    """
    Updates student profile fields.
    Enforces manual provenance tracking, validation, and resets verified status if edited.
    """
    user_id = str(current_user["_id"])
    updates = request.get_json(silent=True)

    if updates is None or not isinstance(updates, dict):
        return jsonify({
            "success": False,
            "message": "Request body must be a valid JSON object",
            "error": {
                "code": "BAD_REQUEST",
                "message": "Malformed profile update payload"
            }
        }), 400

    try:
        updated_profile = ProfileService.update_profile_for_user(user_id, updates)
        return jsonify({
            "success": True,
            "message": "Profile updated successfully",
            "data": ProfileService.to_dict(updated_profile)
        }), 200
    except ValueError as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "error": {
                "code": "VALIDATION_ERROR",
                "message": str(e)
            }
        }), 400
    except Exception as e:
        logger.exception("Unexpected error updating profile for user %s: %s", user_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to update profile",
            "error": {
                "code": "INTERNAL_ERROR",
                "message": str(e)
            }
        }), 500

@profile_bp.route("/verify", methods=["POST"])
@token_required
def verify_profile(current_user):
    """
    Marks student profile as verified after ensuring baseline requirements.
    Sets verification.status = 'verified'.
    """
    user_id = str(current_user["_id"])
    try:
        verified_profile = ProfileService.verify_profile(user_id)
        return jsonify({
            "success": True,
            "message": "Student profile successfully verified",
            "data": ProfileService.to_dict(verified_profile)
        }), 200
    except ValueError as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "error": {
                "code": "VERIFICATION_FAILED",
                "message": str(e)
            }
        }), 400
    except Exception as e:
        logger.exception("Error verifying profile for user %s: %s", user_id, str(e))
        return jsonify({
            "success": False,
            "message": "Internal verification error",
            "error": {
                "code": "INTERNAL_ERROR",
                "message": str(e)
            }
        }), 500

@profile_bp.route("/completion", methods=["GET"])
@token_required
def get_completion(current_user):
    """
    Returns deterministic profile completion percentage and missing fields.
    """
    user_id = str(current_user["_id"])
    profile = ProfileService.get_profile_by_user_id(user_id)
    if not profile:
        profile = ProfileService.create_default_profile(
            user_id=user_id,
            user_email=current_user.get("email", ""),
            user_name=current_user.get("name", "")
        )

    completion = ProfileService.calculate_profile_completion(profile)
    return jsonify({
        "success": True,
        "message": "Profile completion calculated successfully",
        "data": {
            "percentage": completion["percentage"],
            "missing_fields": completion["missing_fields"],
            "breakdown": completion.get("breakdown", {}),
            "missing_items": completion.get("missing_items", [])
        }
    }), 200
