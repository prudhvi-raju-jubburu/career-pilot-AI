import os
import logging
from typing import Optional, Dict, Any
from flask import request
from flask_socketio import SocketIO, join_room, leave_room, emit, disconnect, ConnectionRefusedError
from app.utils.auth import decode_token
from app.models.user import UserModel
from app.models.notification import NotificationModel

logger = logging.getLogger(__name__)

socketio = SocketIO()

def extract_token_from_handshake(auth=None) -> Optional[str]:
    """
    Extracts Bearer JWT from socket connection handshake.
    Checks auth dictionary, query string, or Authorization header.
    """
    if isinstance(auth, dict) and auth.get("token"):
        return auth.get("token")
    if request.args and request.args.get("token"):
        return request.args.get("token")
    auth_header = request.headers.get("Authorization")
    if auth_header:
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1]
    return None

def init_socketio(app):
    """Initializes Flask-SocketIO with application settings and optional message queue."""
    frontend_url = app.config.get("FRONTEND_URL", "http://localhost:5173")
    message_queue = app.config.get("SOCKETIO_MESSAGE_QUEUE") or os.environ.get("REDIS_URL")
    kwargs = {
        "cors_allowed_origins": "*",
        "async_mode": "threading",
        "logger": False,
        "engineio_logger": False,
        "ping_timeout": 20,
        "ping_interval": 10
    }
    if message_queue:
        kwargs["message_queue"] = message_queue
        logger.info("Socket.IO configured with distributed message queue: %s", message_queue)
    else:
        logger.info("Socket.IO configured with in-memory threading queue.")

    socketio.init_app(app, **kwargs)

@socketio.on("connect")
def handle_connect(auth=None):
    """
    Authenticates socket connection via JWT.
    Binds authenticated user to a private user-scoped room: user_{user_id}.
    Rejects unauthenticated or suspended connections.
    """
    token = extract_token_from_handshake(auth)
    if not token:
        logger.warning("Socket.IO connection rejected: No token provided.")
        raise ConnectionRefusedError("Authentication token required")

    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise ConnectionRefusedError("Invalid token payload")

        user = UserModel.find_by_id(user_id)
        if not user or UserModel.is_suspended(user):
            logger.warning("Socket.IO connection rejected: User %s not found or suspended.", user_id)
            raise ConnectionRefusedError("User account inactive or suspended")

        user_room = f"user_{user_id}"
        join_room(user_room)
        join_room("broadcast")

        logger.info("Socket.IO client connected: user_id=%s, room=%s", user_id, user_room)

        # Send initial confirmation and unread count directly to the connected client
        unread_count = NotificationModel.get_unread_count(user_id)
        emit("connected", {
            "status": "authenticated",
            "user_id": str(user_id),
            "unread_count": unread_count
        })

    except Exception as e:
        logger.warning("Socket.IO authentication failed: %s", str(e))
        raise ConnectionRefusedError(f"Authentication failed: {str(e)}")

@socketio.on("disconnect")
def handle_disconnect():
    """Handles socket disconnection."""
    logger.info("Socket.IO client disconnected.")

@socketio.on("ping_alive")
def handle_ping(data=None):
    """Simple heartbeat ping-pong."""
    emit("pong_alive", {"status": "ok"})


# ==============================================================================
# THREAD-SAFE NOTIFICATION EVENT EMITTERS
# ==============================================================================

def emit_to_user(user_id: str, event: str, data: Dict[str, Any]):
    """Emits an event to a specific user's private room."""
    try:
        room = f"user_{user_id}"
        socketio.emit(event, data, room=room)
    except Exception as e:
        logger.warning("Failed to emit '%s' to room '%s': %s", event, user_id, str(e))

def emit_broadcast(event: str, data: Dict[str, Any]):
    """Emits an event to all connected users."""
    try:
        socketio.emit(event, data, room="broadcast")
    except Exception as e:
        logger.warning("Failed to emit broadcast '%s': %s", event, str(e))

def emit_unread_count(user_id: str, count: Optional[int] = None):
    """Emits the current unread notifications count for the user."""
    try:
        if count is None:
            count = NotificationModel.get_unread_count(user_id)
        emit_to_user(user_id, "notification:unread_count", {"unread_count": count})
    except Exception as e:
        logger.warning("Failed to emit unread count for %s: %s", user_id, str(e))

def emit_notification_new(user_id: str, notification: Dict[str, Any]):
    """Dispatches a new notification to the user in real time."""
    try:
        if str(user_id) == "broadcast":
            emit_broadcast("notification:new", notification)
        else:
            emit_to_user(user_id, "notification:new", notification)
            emit_unread_count(user_id)
    except Exception as e:
        logger.warning("Failed to emit new notification to %s: %s", user_id, str(e))

def emit_notification_read(user_id: str, notif_id: str, unread_count: int):
    """Dispatches notification marked as read."""
    try:
        emit_to_user(user_id, "notification:read", {
            "id": str(notif_id),
            "unread_count": unread_count
        })
    except Exception as e:
        logger.warning("Failed to emit notification read for %s: %s", user_id, str(e))

def emit_notification_read_all(user_id: str, unread_count: int = 0):
    """Dispatches all notifications marked as read."""
    try:
        emit_to_user(user_id, "notification:read_all", {
            "unread_count": unread_count
        })
    except Exception as e:
        logger.warning("Failed to emit notification read all for %s: %s", user_id, str(e))

def emit_notification_deleted(user_id: str, notif_id: str, unread_count: int):
    """Dispatches notification deleted."""
    try:
        emit_to_user(user_id, "notification:deleted", {
            "id": str(notif_id),
            "unread_count": unread_count
        })
    except Exception as e:
        logger.warning("Failed to emit notification deleted for %s: %s", user_id, str(e))

def disconnect_user(user_id: str):
    """Terminates active socket sessions and leaves room for the specified user."""
    try:
        room = f"user_{user_id}"
        socketio.emit("account:deactivated", {"message": "Account has been deactivated."}, room=room)
        socketio.close_room(room)
    except Exception as e:
        logger.warning("Failed to close socket room for %s: %s", user_id, str(e))


