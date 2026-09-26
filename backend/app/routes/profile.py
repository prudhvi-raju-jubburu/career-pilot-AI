from flask import Blueprint, request, jsonify
from app.utils.auth import token_required
from app.models.profile import ProfileModel

profile_bp = Blueprint("profile", __name__)

@profile_bp.route("", methods=["GET"])
@token_required
def get_profile(current_user):
    """Retrieves authenticated student's profile."""
    user_id = str(current_user["_id"])
    profile = ProfileModel.find_by_user_id(user_id)

    if not profile:
        # Return empty default profile structure initialized with user details
        default_profile = {
            "user_id": user_id,
            "personal": {
                "fullName": {"value": current_user.get("name", ""), "source": "system", "confidence": 1.0},
                "email": {"value": current_user.get("email", ""), "source": "system", "confidence": 1.0},
                "phone": {"value": None, "source": "manual", "confidence": 0.0},
                "location": {"value": None, "source": "manual", "confidence": 0.0},
            },
            "education": {
                "college": {"value": None, "source": "manual", "confidence": 0.0},
                "degree": {"value": None, "source": "manual", "confidence": 0.0},
                "branch": {"value": None, "source": "manual", "confidence": 0.0},
                "graduationYear": {"value": None, "source": "manual", "confidence": 0.0},
                "cgpa": {"value": None, "source": "manual", "confidence": 0.0},
            },
            "skills": {
                "programmingLanguages": {"value": [], "source": "manual"},
                "technical": {"value": [], "source": "manual"},
                "frameworks": {"value": [], "source": "manual"},
                "databases": {"value": [], "source": "manual"},
                "cloud": {"value": [], "source": "manual"},
                "tools": {"value": [], "source": "manual"},
            },
            "projects": [],
            "experience": [],
            "certifications": [],
            "achievements": [],
            "interests": [],
            "preferences": {
                "targetRoles": {"value": [], "source": "manual"},
                "preferredLocations": {"value": [], "source": "manual"},
                "workModes": {"value": ["Remote", "Hybrid"], "source": "manual"},
            },
            "resume": {"parsed": False, "analysisStatus": "none"},
            "verification_status": "draft",
            "profileCompletion": 12,
        }
        return jsonify({
            "success": True,
            "message": "Initialized empty student profile",
            "data": default_profile
        }), 200

    return jsonify({
        "success": True,
        "message": "Student profile retrieved successfully",
        "data": ProfileModel.to_dict(profile)
    }), 200

@profile_bp.route("", methods=["PUT"])
@token_required
def update_profile(current_user):
    """Updates student profile fields, marking changed fields with source 'manual'."""
    user_id = str(current_user["_id"])
    updates = request.get_json(silent=True)

    if not updates or not isinstance(updates, dict):
        return jsonify({
            "success": False,
            "message": "Request body must be valid JSON object",
            "error": "BAD_REQUEST"
        }), 400

    updated_profile = ProfileModel.update_profile(user_id, updates)

    return jsonify({
        "success": True,
        "message": "Profile updated successfully",
        "data": ProfileModel.to_dict(updated_profile)
    }), 200

@profile_bp.route("/verify", methods=["POST"])
@token_required
def verify_profile(current_user):
    """Marks student profile as verified, ready for opportunity matching."""
    user_id = str(current_user["_id"])
    try:
        verified_profile = ProfileModel.verify_profile(user_id)
        return jsonify({
            "success": True,
            "message": "Student profile successfully verified",
            "data": ProfileModel.to_dict(verified_profile)
        }), 200
    except ValueError as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "error": "VERIFICATION_FAILED"
        }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Verification failed: {str(e)}",
            "error": "INTERNAL_ERROR"
        }), 500

@profile_bp.route("/completion", methods=["GET"])
@token_required
def get_completion(current_user):
    """Calculates weighted completion details and identifies missing profile fields."""
    user_id = str(current_user["_id"])
    profile = ProfileModel.find_by_user_id(user_id)
    completion = ProfileModel.calculate_completion(profile)

    return jsonify({
        "success": True,
        "message": "Profile completion calculated",
        "data": completion
    }), 200
