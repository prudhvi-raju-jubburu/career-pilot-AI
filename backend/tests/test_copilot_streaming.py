import os
import json
import pytest
from unittest.mock import patch, MagicMock
from bson import ObjectId

from app import create_app
from app.ai.ai_service import AIService, AIServiceError
from app.services.copilot_service import CareerCopilotService, CareerIntent
from app.models.copilot_conversation import CopilotConversationModel
from app.models.user import UserModel
from app.utils.auth import generate_token


@pytest.fixture
def app():
    os.environ["TESTING"] = "true"
    os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-streaming"
    app = create_app()
    app.config["TESTING"] = True
    yield app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def test_user(app):
    with app.app_context():
        user = UserModel.find_by_email("streaming_student@example.com")
        if not user:
            user = UserModel.create_user(
                name="Streaming Student",
                email="streaming_student@example.com",
                password="Password123!",
                role="student"
            )
        return user


# =============================================================================
# 1. AIService.stream_text() Unit Tests
# =============================================================================

def test_ai_service_stream_text_gemini_success():
    """Verifies that AIService.stream_text streams tokens via Gemini when configured."""
    def mock_gemini_stream(prompt, system_instruction, api_key, timeout):
        yield "Hello"
        yield " from "
        yield "Gemini!"

    with patch.dict(os.environ, {"AI_PROVIDER": "gemini", "GEMINI_API_KEY": "dummy_key"}):
        with patch.object(AIService, "_stream_gemini", side_effect=mock_gemini_stream):
            events = list(AIService.stream_text("Say hello"))
            
            types = [e["type"] for e in events]
            assert "start" in types
            assert "token" in types
            assert "done" in types

            tokens = [e["token"] for e in events if e["type"] == "token"]
            assert "".join(tokens) == "Hello from Gemini!"

            done_evt = next(e for e in events if e["type"] == "done")
            assert done_evt["full_text"] == "Hello from Gemini!"
            assert done_evt["provider"] == "gemini"
            assert done_evt["tokens_emitted"] == 3


def test_ai_service_stream_text_openai_success():
    """Verifies that AIService.stream_text streams tokens via OpenAI when configured."""
    def mock_openai_stream(prompt, system_instruction, api_key, timeout):
        yield "Hello"
        yield " from "
        yield "OpenAI!"

    with patch.dict(os.environ, {"AI_PROVIDER": "openai", "OPENAI_API_KEY": "dummy_key"}):
        with patch.object(AIService, "_stream_openai", side_effect=mock_openai_stream):
            events = list(AIService.stream_text("Say hello"))
            
            tokens = [e["token"] for e in events if e["type"] == "token"]
            assert "".join(tokens) == "Hello from OpenAI!"

            done_evt = next(e for e in events if e["type"] == "done")
            assert done_evt["provider"] == "openai"


def test_ai_service_stream_pre_token_fallback():
    """
    If primary provider (Gemini) fails BEFORE emitting any token,
    AIService.stream_text falls back to secondary provider (OpenAI).
    """
    def mock_gemini_fail(prompt, system_instruction, api_key, timeout):
        raise AIServiceError("Gemini quota exhausted prior to tokens")

    def mock_openai_stream(prompt, system_instruction, api_key, timeout):
        yield "Fallback "
        yield "response"

    with patch.dict(os.environ, {
        "AI_PROVIDER": "gemini",
        "GEMINI_API_KEY": "dummy_gemini",
        "OPENAI_API_KEY": "dummy_openai"
    }):
        with patch.object(AIService, "_stream_gemini", side_effect=mock_gemini_fail):
            with patch.object(AIService, "_stream_openai", side_effect=mock_openai_stream):
                events = list(AIService.stream_text("Test fallback"))
                
                # Should have received tokens from OpenAI fallback
                tokens = [e["token"] for e in events if e["type"] == "token"]
                assert "".join(tokens) == "Fallback response"

                done_evt = next(e for e in events if e["type"] == "done")
                assert done_evt["provider"] == "openai"


def test_ai_service_stream_post_token_failure_no_fallback():
    """
    If primary provider fails AFTER emitting tokens,
    it must NOT fall back to secondary provider (to avoid garbled/duplicate responses).
    It must yield a non-recoverable error event.
    """
    def mock_gemini_midstream_fail(prompt, system_instruction, api_key, timeout):
        yield "Initial tokens emitted... "
        raise AIServiceError("Mid-stream connection dropped")

    mock_openai = MagicMock()

    with patch.dict(os.environ, {
        "AI_PROVIDER": "gemini",
        "GEMINI_API_KEY": "dummy_gemini",
        "OPENAI_API_KEY": "dummy_openai"
    }):
        with patch.object(AIService, "_stream_gemini", side_effect=mock_gemini_midstream_fail):
            with patch.object(AIService, "_stream_openai", mock_openai):
                events = list(AIService.stream_text("Test midstream error"))
                
                # Secondary provider must NOT have been called
                mock_openai.assert_not_called()

                # Must contain the initial token and an unrecoverable error
                tokens = [e["token"] for e in events if e["type"] == "token"]
                assert "".join(tokens) == "Initial tokens emitted... "

                err_evt = next(e for e in events if e["type"] == "error")
                assert err_evt["recoverable"] is False
                assert "Initial tokens emitted..." in err_evt["partial_text"]


# =============================================================================
# 2. CareerCopilotService.chat_stream() Tests
# =============================================================================

def test_copilot_service_chat_stream_grounded_fallback_when_offline(app, test_user):
    """
    When all AI providers are offline or keys missing,
    chat_stream yields deterministic grounded tokens and completes gracefully.
    """
    with app.app_context():
        user_id = str(test_user["_id"])
        
        # Ensure no AI keys
        with patch.dict(os.environ, {"GEMINI_API_KEY": "", "OPENAI_API_KEY": ""}):
            events = list(CareerCopilotService.chat_stream(
                user_id=user_id,
                message="Tell me about my student profile",
                conversation_id=None
            ))

            types = [e["type"] for e in events]
            assert "start" in types
            assert "sources" in types
            assert "actions" in types
            assert "token" in types
            assert "done" in types

            # Tokens should form a grounded answer
            full_text = "".join(e["token"] for e in events if e["type"] == "token")
            assert len(full_text) > 20

            done_evt = next(e for e in events if e["type"] == "done")
            assert done_evt["provider"]["active_provider"] == "grounded_fallback"


def test_copilot_service_chat_stream_persists_messages(app, test_user):
    """
    Verifies that chat_stream persists the user message at start
    and the assistant message at done.
    """
    with app.app_context():
        user_id = str(test_user["_id"])
        conv = CopilotConversationModel.create_conversation(user_id=user_id, title="Stream Test")
        conv_id = conv["id"]

        def mock_stream_tokens(prompt, system_instruction, timeout=25.0):
            yield {"type": "start", "provider": "gemini", "model": "gemini-2.5-flash"}
            yield {"type": "token", "token": "First token "}
            yield {"type": "token", "token": "and second token."}
            yield {
                "type": "done",
                "full_text": "First token and second token.",
                "provider": "gemini",
                "model": "gemini-2.5-flash",
                "duration_ms": 120,
                "tokens_emitted": 2
            }

        with patch.object(AIService, "stream_text", side_effect=mock_stream_tokens):
            events = list(CareerCopilotService.chat_stream(
                user_id=user_id,
                message="Explain REST APIs",
                conversation_id=conv_id
            ))

            done_evt = next(e for e in events if e["type"] == "done")
            assert done_evt["full_text"] == "First token and second token."

            # Verify MongoDB conversation contains both messages
            updated_conv = CopilotConversationModel.find_by_id(conv_id, user_id)
            messages = updated_conv.get("messages", [])
            assert len(messages) >= 2
            assert messages[-2]["role"] == "user"
            assert messages[-2]["content"] == "Explain REST APIs"
            assert messages[-1]["role"] == "assistant"
            assert messages[-1]["content"] == "First token and second token."


# =============================================================================
# 3. SSE Route POST /api/copilot/stream Tests
# =============================================================================

def test_copilot_stream_endpoint_unauthenticated(client):
    """Verifies 401 on unauthenticated call to /api/copilot/stream."""
    res = client.post("/api/copilot/stream", json={"message": "Hello"})
    assert res.status_code == 401


def test_copilot_stream_endpoint_empty_message(client, test_user, app):
    """Verifies 400 validation error on empty message."""
    with app.app_context():
        token = generate_token(str(test_user["_id"]), test_user["email"])
    res = client.post(
        "/api/copilot/stream",
        json={"message": ""},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 400
    data = res.get_json()
    assert data["error"] == "VALIDATION_ERROR"


def test_copilot_stream_endpoint_sse_response(client, test_user, app):
    """Verifies genuine text/event-stream response and event payload format."""
    with app.app_context():
        token = generate_token(str(test_user["_id"]), test_user["email"])

    def mock_stream_tokens(prompt, system_instruction, timeout=25.0):
        yield {"type": "start", "provider": "gemini", "model": "gemini-2.5-flash"}
        yield {"type": "token", "token": "Streaming chunk"}
        yield {
            "type": "done",
            "full_text": "Streaming chunk",
            "provider": "gemini",
            "model": "gemini-2.5-flash",
            "duration_ms": 100,
            "tokens_emitted": 1
        }

    with patch.object(AIService, "stream_text", side_effect=mock_stream_tokens):
        res = client.post(
            "/api/copilot/stream",
            json={"message": "Show opportunities"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        assert "text/event-stream" in res.content_type

        # Parse SSE lines
        raw_text = res.get_data(as_text=True)
        lines = [line.strip() for line in raw_text.split("\n") if line.strip().startswith("data: ")]
        assert len(lines) >= 3

        parsed_events = [json.loads(line[6:]) for line in lines]
        event_types = [p["type"] for p in parsed_events]
        assert "start" in event_types
        assert "sources" in event_types
        assert "actions" in event_types
        assert "token" in event_types
        assert "done" in event_types
