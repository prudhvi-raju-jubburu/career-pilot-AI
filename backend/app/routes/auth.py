import re
from flask import Blueprint, request, jsonify
from app.models.user import UserModel
from app.utils.auth import generate_token, token_required

auth_bp = Blueprint("auth", __name__)

EMAIL_REGEX = re.compile(r"^[\w\.-]+@([\w\.-]+\.)+[\w-]{2,4}$")

@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new student account."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({
            "success": False,
            "message": "Request body must be valid JSON",
            "error": "BAD_REQUEST"
        }), 400

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    # Validation
    if not name:
        return jsonify({
            "success": False,
            "message": "Full name is required",
            "error": "VALIDATION_ERROR"
        }), 400

    if len(name) > 100:
        return jsonify({
            "success": False,
            "message": "Full name cannot exceed 100 characters",
            "error": "VALIDATION_ERROR"
        }), 400

    if not email or not EMAIL_REGEX.match(email):
        return jsonify({
            "success": False,
            "message": "A valid email address is required",
            "error": "VALIDATION_ERROR"
        }), 400

    if len(email) > 255:
        return jsonify({
            "success": False,
            "message": "Email address cannot exceed 255 characters",
            "error": "VALIDATION_ERROR"
        }), 400

    if not password or len(password) < 6:
        return jsonify({
            "success": False,
            "message": "Password must be at least 6 characters long",
            "error": "VALIDATION_ERROR"
        }), 400

    if len(password) > 256:
        return jsonify({
            "success": False,
            "message": "Password cannot exceed 256 characters",
            "error": "VALIDATION_ERROR"
        }), 400

    # Duplicate check
    existing_user = UserModel.find_by_email(email)
    if existing_user:
        return jsonify({
            "success": False,
            "message": "An account with this email address already exists",
            "error": "EMAIL_ALREADY_EXISTS"
        }), 409

    try:
        user = UserModel.create_user(name=name, email=email, password=password, role="student")
        token = generate_token(user_id=str(user["_id"]), email=user["email"])

        return jsonify({
            "success": True,
            "message": "Student account registered successfully",
            "data": {
                "user": UserModel.to_dict(user),
                "token": token
            }
        }), 201
    except Exception as e:
        import logging
        logging.getLogger(__name__).error("Registration error: %s", str(e), exc_info=True)
        return jsonify({
            "success": False,
            "message": "Failed to create account. Please try again.",
            "error": "REGISTRATION_FAILED"
        }), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate student and return JWT token."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({
            "success": False,
            "message": "Request body must be valid JSON",
            "error": "BAD_REQUEST"
        }), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Both email and password are required",
            "error": "VALIDATION_ERROR"
        }), 400

    user = UserModel.find_by_email(email)
    if not user or not UserModel.verify_password(user.get("password_hash"), password):
        return jsonify({
            "success": False,
            "message": "Invalid email or password",
            "error": "INVALID_CREDENTIALS"
        }), 401

    if UserModel.is_suspended(user):
        return jsonify({
            "success": False,
            "message": "Account has been suspended. Please contact platform support.",
            "error": "ACCOUNT_SUSPENDED"
        }), 403

    token = generate_token(user_id=str(user["_id"]), email=user["email"])

    return jsonify({
        "success": True,
        "message": "Login successful",
        "data": {
            "user": UserModel.to_dict(user),
            "token": token
        }
    }), 200

@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user_profile(current_user):
    """Retrieve the authenticated student's profile."""
    return jsonify({
        "success": True,
        "message": "Profile retrieved successfully",
        "data": {
            "user": UserModel.to_dict(current_user)
        }
    }), 200

@auth_bp.route("/refresh", methods=["POST"])
@token_required
def refresh_token(current_user):
    """Refreshes active JWT session token."""
    new_token = generate_token(user_id=str(current_user["_id"]), email=current_user["email"])
    return jsonify({
        "success": True,
        "message": "Token refreshed successfully",
        "data": {
            "token": new_token,
            "user": UserModel.to_dict(current_user)
        }
    }), 200

@auth_bp.route("/logout", methods=["POST"])
def logout():
    """Client session logout endpoint."""
    return jsonify({
        "success": True,
        "message": "Logged out successfully"
    }), 200

