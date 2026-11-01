import json
import logging
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, Response, stream_with_context
from app.utils.auth import token_required
from app.services.copilot_service import CareerCopilotService

logger = logging.getLogger(__name__)
advisor_bp = Blueprint("advisor", __name__)

@advisor_bp.route("/history", methods=["GET"])
@token_required
def get_advisor_history(current_user):
    """
    Backward-compatible history endpoint delegating to Student Career Copilot conversations.
    """
    user_id = str(current_user["_id"])
    convs = CareerCopilotService.list_conversations(user_id=user_id, limit=1)
    history = []
    if convs:
        full_conv = CareerCopilotService.get_conversation(convs[0]["id"], user_id)
        if full_conv and "messages" in full_conv:
            for m in full_conv["messages"]:
                history.append({
                    "id": m.get("id"),
                    "role": m.get("role", "user"),
                    "content": m.get("content", ""),
                    "created_at": m.get("created_at")
                })

    return jsonify({
        "success": True,
        "message": "Conversation history retrieved",
        "data": history
    }), 200

@advisor_bp.route("/chat", methods=["POST"])
@token_required
def chat_with_advisor(current_user):
    """
    Backward-compatible chat endpoint delegating to Student Career Copilot RAG pipeline.
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
        res = CareerCopilotService.chat(
            user_id=user_id,
            message=message,
            conversation_id=conversation_id
        )
        return jsonify({
            "success": True,
            "message": "Response generated successfully",
            "data": {
                "role": "assistant",
                "content": res["answer"],
                "answer": res["answer"],
                "conversation_id": res["conversation_id"],
                "message_id": res["message_id"],
                "intent": res["intent"],
                "sources": res["sources"],
                "suggested_actions": res["suggested_actions"],
                "provider": res["provider"],
                "created_at": res["created_at"]
            }
        }), 200
    except Exception as e:
        logger.exception("Error in advisor chat for user %s: %s", user_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to generate advisor response",
            "error": "INTERNAL_ERROR"
        }), 500

@advisor_bp.route("/stream", methods=["POST", "GET"])
@token_required
def stream_advisor_chat(current_user):
    """
    SSE streaming endpoint for AI Career Advisor / Copilot tokens.
    """
    user_id = str(current_user["_id"])
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        message = data.get("message", "").strip()
    else:
        message = request.args.get("message", "").strip()

    if not message:
        return jsonify({"success": False, "message": "Message is required"}), 400

    try:
        res = CareerCopilotService.chat(user_id=user_id, message=message)
        complete_text = res["answer"]

        def event_stream():
            words = complete_text.split(" ")
            for i in range(0, len(words), 3):
                chunk = " ".join(words[i:i+3]) + " "
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            yield f"data: {json.dumps({'done': True, 'content': complete_text, 'sources': res['sources'], 'suggested_actions': res['suggested_actions']})}\n\n"

        return Response(
            stream_with_context(event_stream()),
            mimetype="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Access-Control-Allow-Origin": "*"
            }
        )
    except Exception as e:
        logger.exception("Error in advisor stream for user %s: %s", user_id, str(e))
        return jsonify({"success": False, "message": "Streaming error"}), 500

@advisor_bp.route("/history", methods=["DELETE"])
@token_required
def clear_advisor_history(current_user):
    """Clears conversation history for the student."""
    user_id = str(current_user["_id"])
    try:
        CareerCopilotService.clear_all(user_id=user_id)
        return jsonify({
            "success": True,
            "message": "Conversation history cleared"
        }), 200
    except Exception as e:
        logger.exception("Error clearing advisor history for user %s: %s", user_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to clear history",
            "error": "INTERNAL_ERROR"
        }), 500
