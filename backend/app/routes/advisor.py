import json
import logging
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, Response, stream_with_context
from app.utils.auth import token_required
from app.config.db import Database
from app.models.profile import ProfileModel
from app.services.profile_service import ProfileService
from app.ai.advisor_agent import AdvisorAgentService

logger = logging.getLogger(__name__)
advisor_bp = Blueprint("advisor", __name__)

COLLECTION_NAME = "advisor_conversations"

def _get_history(user_id: str, limit: int = 30):
    db = Database.get_db()
    if db is None:
        return []
    cursor = db[COLLECTION_NAME].find({"user_id": str(user_id)}).sort("created_at", 1).limit(limit)
    items = []
    for doc in cursor:
        items.append({
            "id": str(doc["_id"]),
            "role": doc.get("role", "user"),
            "content": doc.get("content", ""),
            "created_at": doc.get("created_at")
        })
    return items

def _save_message(user_id: str, role: str, content: str):
    db = Database.get_db()
    if db is None:
        return
    db[COLLECTION_NAME].insert_one({
        "user_id": str(user_id),
        "role": role,
        "content": content,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

@advisor_bp.route("/history", methods=["GET"])
@token_required
def get_advisor_history(current_user):
    """Retrieves conversation history for the student."""
    user_id = str(current_user["_id"])
    history = _get_history(user_id)
    return jsonify({
        "success": True,
        "message": "Conversation history retrieved",
        "data": history
    }), 200

@advisor_bp.route("/chat", methods=["POST"])
@token_required
def chat_with_advisor(current_user):
    """Processes student message with Gemini AI and persists response."""
    user_id = str(current_user["_id"])
    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()

    if not message:
        return jsonify({
            "success": False,
            "message": "Message content is required",
            "error": "VALIDATION_ERROR"
        }), 400

    profile = ProfileService.get_profile_by_user_id(user_id) or {}
    history = _get_history(user_id)

    # Save user message
    _save_message(user_id, "user", message)

    # Generate response
    reply = AdvisorAgentService.generate_response(message, profile, history)

    # Save advisor response
    _save_message(user_id, "assistant", reply)

    return jsonify({
        "success": True,
        "message": "Response generated successfully",
        "data": {
            "role": "assistant",
            "content": reply,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    }), 200

@advisor_bp.route("/stream", methods=["POST", "GET"])
@token_required
def stream_advisor_chat(current_user):
    """SSE streaming endpoint for AI career advisor tokens."""
    user_id = str(current_user["_id"])
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        message = data.get("message", "").strip()
    else:
        message = request.args.get("message", "").strip()

    if not message:
        return jsonify({"success": False, "message": "Message is required"}), 400

    profile = ProfileService.get_profile_by_user_id(user_id) or {}
    history = _get_history(user_id)

    # Save user message
    _save_message(user_id, "user", message)

    def event_stream():
        full_reply = []
        for chunk in AdvisorAgentService.stream_response(message, profile, history):
            full_reply.append(chunk)
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"

        complete_text = "".join(full_reply)
        _save_message(user_id, "assistant", complete_text)
        yield f"data: {json.dumps({'done': True, 'content': complete_text})}\n\n"

    return Response(
        stream_with_context(event_stream()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*"
        }
    )

@advisor_bp.route("/history", methods=["DELETE"])
@token_required
def clear_advisor_history(current_user):
    """Clears conversation history for the student."""
    user_id = str(current_user["_id"])
    db = Database.get_db()
    if db is not None:
        db[COLLECTION_NAME].delete_many({"user_id": str(user_id)})
    return jsonify({
        "success": True,
        "message": "Conversation history cleared"
    }), 200
