import json
import logging
from flask import Blueprint, request, jsonify, Response, stream_with_context
from app.utils.auth import token_required
from app.services.copilot_service import CareerCopilotService

logger = logging.getLogger(__name__)

copilot_bp = Blueprint("copilot", __name__)

@copilot_bp.route("/chat", methods=["POST"])
@token_required
def chat(current_user):
    """
    Primary endpoint for Student Career Copilot RAG chat.
    Processes user query, retrieves student context, generates grounded response,
    and returns answer with sources and contextual actions.
    """
    user_id = str(current_user["_id"])
    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()
    conversation_id = data.get("conversation_id")

    if not message:
        return jsonify({
            "success": False,
            "message": "Message content is required",
            "error": "VALIDATION_ERROR"
        }), 400

    try:
        result = CareerCopilotService.chat(
            user_id=user_id,
            message=message,
            conversation_id=conversation_id
        )
        return jsonify({
            "success": True,
            "message": "Copilot response generated successfully",
            "data": result
        }), 200

    except Exception as e:
        logger.exception("Error in copilot chat for user %s: %s", user_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to generate copilot response",
            "error": "INTERNAL_ERROR"
        }), 500

@copilot_bp.route("/stream", methods=["POST"])
@token_required
def chat_stream(current_user):
    """
    Genuine token streaming endpoint using Server-Sent Events (SSE).
    Streams LLM tokens and metadata incrementally.
    """
    user_id = str(current_user["_id"])
    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()
    conversation_id = data.get("conversation_id")

    if not message:
        return jsonify({
            "success": False,
            "message": "Message content is required",
            "error": "VALIDATION_ERROR"
        }), 400

    def generate_sse():
        try:
            for event in CareerCopilotService.chat_stream(
                user_id=user_id,
                message=message,
                conversation_id=conversation_id
            ):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            logger.exception("Error in copilot stream for user %s: %s", user_id, str(e))
            err_event = {
                "type": "error",
                "error": str(e),
                "recoverable": False
            }
            yield f"data: {json.dumps(err_event)}\n\n"

    return Response(
        stream_with_context(generate_sse()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive"
        }
    )

@copilot_bp.route("/conversations", methods=["GET"])
@token_required
def list_conversations(current_user):
    """Lists all conversation threads belonging to the authenticated student."""
    user_id = str(current_user["_id"])
    try:
        conversations = CareerCopilotService.list_conversations(user_id=user_id)
        return jsonify({
            "success": True,
            "message": "Conversations retrieved successfully",
            "data": conversations
        }), 200
    except Exception as e:
        logger.exception("Error listing copilot conversations for user %s: %s", user_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to retrieve conversations",
            "error": "INTERNAL_ERROR"
        }), 500

@copilot_bp.route("/conversations", methods=["POST"])
@token_required
def create_conversation(current_user):
    """Starts a new empty conversation thread for the student."""
    user_id = str(current_user["_id"])
    data = request.get_json(silent=True) or {}
    title = data.get("title")

    try:
        conv = CareerCopilotService.create_new_conversation(user_id=user_id, title=title)
        return jsonify({
            "success": True,
            "message": "New conversation created successfully",
            "data": conv
        }), 201
    except Exception as e:
        logger.exception("Error creating conversation for user %s: %s", user_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to create conversation",
            "error": "INTERNAL_ERROR"
        }), 500

@copilot_bp.route("/conversations/<conv_id>", methods=["GET"])
@token_required
def get_conversation_detail(current_user, conv_id):
    """Retrieves full message history for a specific conversation verifying ownership."""
    user_id = str(current_user["_id"])
    try:
        conv = CareerCopilotService.get_conversation(conversation_id=conv_id, user_id=user_id)
        if not conv:
            return jsonify({
                "success": False,
                "message": "Conversation not found or access denied",
                "error": "NOT_FOUND"
            }), 404

        return jsonify({
            "success": True,
            "message": "Conversation retrieved successfully",
            "data": conv
        }), 200
    except Exception as e:
        logger.exception("Error retrieving conversation %s for user %s: %s", conv_id, user_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to retrieve conversation",
            "error": "INTERNAL_ERROR"
        }), 500

@copilot_bp.route("/conversations/<conv_id>", methods=["DELETE"])
@token_required
def delete_conversation(current_user, conv_id):
    """Deletes a conversation thread verifying student ownership."""
    user_id = str(current_user["_id"])
    try:
        success = CareerCopilotService.delete_conversation(conversation_id=conv_id, user_id=user_id)
        if not success:
            return jsonify({
                "success": False,
                "message": "Conversation not found or access denied",
                "error": "NOT_FOUND"
            }), 404

        return jsonify({
            "success": True,
            "message": "Conversation deleted successfully"
        }), 200
    except Exception as e:
        logger.exception("Error deleting conversation %s for user %s: %s", conv_id, user_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to delete conversation",
            "error": "INTERNAL_ERROR"
        }), 500

@copilot_bp.route("/conversations", methods=["DELETE"])
@token_required
def clear_all_conversations(current_user):
    """Clears all conversations for the student."""
    user_id = str(current_user["_id"])
    try:
        count = CareerCopilotService.clear_all(user_id=user_id)
        return jsonify({
            "success": True,
            "message": f"Cleared {count} conversations successfully",
            "data": {
                "deleted_count": count
            }
        }), 200
    except Exception as e:
        logger.exception("Error clearing conversations for user %s: %s", user_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to clear conversations",
            "error": "INTERNAL_ERROR"
        }), 500

