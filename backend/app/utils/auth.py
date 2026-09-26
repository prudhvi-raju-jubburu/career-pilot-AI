from datetime import datetime, timezone, timedelta
from functools import wraps
import jwt
from flask import request, jsonify, current_app
from app.models.user import UserModel

def generate_token(user_id: str, email: str) -> str:
    """Generates a signed JWT with expiration."""
    jwt_secret = current_app.config.get("JWT_SECRET", "supersecret_jwt_dev_key")
    algorithm = current_app.config.get("JWT_ALGORITHM", "HS256")
    expires_in_hours = current_app.config.get("JWT_EXPIRATION_HOURS", 24)

    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=expires_in_hours),
    }

    return jwt.encode(payload, jwt_secret, algorithm=algorithm)

def decode_token(token: str) -> dict:
    """Decodes and validates a JWT token."""
    jwt_secret = current_app.config.get("JWT_SECRET", "supersecret_jwt_dev_key")
    algorithm = current_app.config.get("JWT_ALGORITHM", "HS256")

    try:
        payload = jwt.decode(token, jwt_secret, algorithms=[algorithm])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {str(e)}")

def token_required(f):
    """Decorator to require valid JWT in Authorization header for protected routes."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({
                "success": False,
                "message": "Authorization header is missing",
                "error": "UNAUTHORIZED"
            }), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({
                "success": False,
                "message": "Invalid Authorization header format. Expected 'Bearer <token>'",
                "error": "UNAUTHORIZED"
            }), 401

        token = parts[1]

        try:
            payload = decode_token(token)
            user_id = payload.get("sub")
            user = UserModel.find_by_id(user_id)

            if not user:
                return jsonify({
                    "success": False,
                    "message": "User not found or account deactivated",
                    "error": "USER_NOT_FOUND"
                }), 401

            # Attach current_user to request
            request.current_user = user
        except ValueError as e:
            return jsonify({
                "success": False,
                "message": str(e),
                "error": "INVALID_TOKEN"
            }), 401
        except Exception as e:
            return jsonify({
                "success": False,
                "message": "Authentication failed",
                "error": str(e)
            }), 401

        return f(current_user=user, *args, **kwargs)

    return decorated
