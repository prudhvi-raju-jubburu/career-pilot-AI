import os
import json
import pytest
from unittest.mock import patch
from bson import ObjectId

from app import create_app
from app.models.user import UserModel
from app.models.application import ApplicationModel
from app.models.opportunity import OpportunityModel
from app.models.interview_session import InterviewSessionModel
from app.services.interview_prep_service import InterviewPrepService, DISCLAIMER_TEXT
from app.services.interview_simulator_service import InterviewSimulatorService, SIMULATOR_DISCLAIMER
from app.utils.auth import generate_token


@pytest.fixture
def app():
    os.environ["TESTING"] = "true"
    os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-interview-validation"
    app = create_app()
    app.config["TESTING"] = True
    yield app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def test_user(app):
    with app.app_context():
        user = UserModel.find_by_email("interview_student@example.com")
        if not user:
            user = UserModel.create_user(
                name="Interview Student",
                email="interview_student@example.com",
                password="Password123!",
                role="student"
            )
        return user


@pytest.fixture
def auth_headers(app, test_user):
    with app.app_context():
        token = generate_token(str(test_user["_id"]), test_user["email"])
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }


@pytest.fixture
def test_application(app, test_user):
    with app.app_context():
        user_id = str(test_user["_id"])
        opp = OpportunityModel.get_collection().find_one({"title": "Systems Software Engineer"})
        if not opp:
            opp_id = OpportunityModel.get_collection().insert_one({
                "title": "Systems Software Engineer",
                "company": "Stripe",
                "location": "Bengaluru, India",
                "work_mode": "Hybrid",
                "status": "active",
                "description": "Develop high-throughput payment infrastructure in Go and Python.",
                "required_skills": ["Go", "Python", "Distributed Systems"]
            }).inserted_id
        else:
            opp_id = opp["_id"]

        app_doc = ApplicationModel.create_application(
            user_id=user_id,
            data={
                "opportunity_id": str(opp_id),
                "company": "Stripe",
                "role": "Systems Software Engineer",
                "status": "Applied",
                "job_description": "Develop high-throughput payment infrastructure in Go and Python."
            }
        )
        return app_doc


# =============================================================================
# 1. DISCLAIMER TESTS
# =============================================================================

def test_interview_prep_disclaimer_content():
    """Verifies that the prep pack disclaimer explicitly states suggestions and no guarantees."""
    assert "suggestions" in DISCLAIMER_TEXT
    assert "not guaranteed or official" in DISCLAIMER_TEXT
    assert "does not guarantee hiring outcomes" in DISCLAIMER_TEXT
    assert "predict actual interviewer decisions" in DISCLAIMER_TEXT


def test_interview_simulator_disclaimer_content():
    """Verifies that simulator disclaimer explicitly states study suggestions and no hiring predictions."""
    assert "study suggestions" in SIMULATOR_DISCLAIMER
    assert "do not represent actual or guaranteed" in SIMULATOR_DISCLAIMER
    assert "do not guarantee employment outcomes" in SIMULATOR_DISCLAIMER
    assert "predict human interviewer decisions" in SIMULATOR_DISCLAIMER


# =============================================================================
# 2. SHORT SPEECH-ANSWER & VALIDATION TESTS
# =============================================================================

def test_submit_answer_missing_answer_field_returns_400(client, test_application, auth_headers):
    """Submitting payload without answer/answer_text returns 400 VALIDATION_ERROR."""
    app_id = str(test_application["id"])
    
    # Start session
    start_res = client.post(
        f"/api/applications/{app_id}/interview-simulator/start",
        json={"mode": "technical", "resume_active": False},
        headers=auth_headers
    )
    assert start_res.status_code == 201
    session_id = start_res.get_json()["data"]["id"]

    res = client.post(
        f"/api/applications/{app_id}/interview-simulator/sessions/{session_id}/answer",
        json={"question_index": 0},
        headers=auth_headers
    )
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
    assert data["error"] == "VALIDATION_ERROR"
    assert "cannot be empty" in data["message"].lower()


def test_submit_answer_empty_string_returns_400(client, test_application, auth_headers):
    """Submitting empty string returns 400 VALIDATION_ERROR."""
    app_id = str(test_application["id"])
    start_res = client.post(
        f"/api/applications/{app_id}/interview-simulator/start",
        json={"mode": "technical", "resume_active": False},
        headers=auth_headers
    )
    session_id = start_res.get_json()["data"]["id"]

    res = client.post(
        f"/api/applications/{app_id}/interview-simulator/sessions/{session_id}/answer",
        json={"question_index": 0, "answer": ""},
        headers=auth_headers
    )
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
    assert data["error"] == "VALIDATION_ERROR"
    assert "cannot be empty" in data["message"].lower()


def test_submit_answer_whitespace_only_returns_400(client, test_application, auth_headers):
    """Submitting whitespace-only answer returns 400 VALIDATION_ERROR."""
    app_id = str(test_application["id"])
    start_res = client.post(
        f"/api/applications/{app_id}/interview-simulator/start",
        json={"mode": "technical", "resume_active": False},
        headers=auth_headers
    )
    session_id = start_res.get_json()["data"]["id"]

    res = client.post(
        f"/api/applications/{app_id}/interview-simulator/sessions/{session_id}/answer",
        json={"question_index": 0, "answer": "   \n\t  \r  "},
        headers=auth_headers
    )
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
    assert data["error"] == "VALIDATION_ERROR"
    assert "cannot be empty" in data["message"].lower()


def test_submit_answer_legitimate_short_answers_accepted(client, test_application, auth_headers):
    """Verifies legitimate short answers (Yes, No, C, SQL, Java) are accepted with HTTP 200."""
    app_id = str(test_application["id"])
    short_answers = ["Yes", "No", "C", "SQL", "Java"]

    for ans in short_answers:
        start_res = client.post(
            f"/api/applications/{app_id}/interview-simulator/start",
            json={"mode": "technical", "resume_active": False},
            headers=auth_headers
        )
        assert start_res.status_code in (200, 201)
        session_id = start_res.get_json()["data"]["id"]

        res = client.post(
            f"/api/applications/{app_id}/interview-simulator/sessions/{session_id}/answer",
            json={"question_index": 0, "answer": ans},
            headers=auth_headers
        )
        assert res.status_code == 200, f"Expected 200 for answer '{ans}', got {res.status_code}: {res.get_data(as_text=True)}"
        data = res.get_json()
        assert data["success"] is True
        assert "data" in data


def test_submit_answer_missing_question_index_returns_400(client, test_application, auth_headers):
    """Submitting payload without question_index returns 400."""
    app_id = str(test_application["id"])
    start_res = client.post(
        f"/api/applications/{app_id}/interview-simulator/start",
        json={"mode": "technical", "resume_active": False},
        headers=auth_headers
    )
    session_id = start_res.get_json()["data"]["id"]

    res = client.post(
        f"/api/applications/{app_id}/interview-simulator/sessions/{session_id}/answer",
        json={"answer": "I have extensive experience building scalable microservices in Python."},
        headers=auth_headers
    )
    assert res.status_code == 400
    data = res.get_json()
    assert data["error"] == "VALIDATION_ERROR"
    assert "question_index is required" in data["message"]


def test_submit_answer_invalid_question_index_negative_returns_400(client, test_application, auth_headers):
    """Submitting negative question_index returns 400."""
    app_id = str(test_application["id"])
    start_res = client.post(
        f"/api/applications/{app_id}/interview-simulator/start",
        json={"mode": "technical", "resume_active": False},
        headers=auth_headers
    )
    session_id = start_res.get_json()["data"]["id"]

    res = client.post(
        f"/api/applications/{app_id}/interview-simulator/sessions/{session_id}/answer",
        json={"question_index": -1, "answer": "I have extensive experience building scalable microservices."},
        headers=auth_headers
    )
    assert res.status_code == 400
    data = res.get_json()
    assert data["error"] == "VALIDATION_ERROR"


def test_submit_answer_nonexistent_session_returns_404(client, test_application, auth_headers):
    """Submitting answer to nonexistent session returns 404 NOT_FOUND."""
    app_id = str(test_application["id"])
    fake_session_id = str(ObjectId())

    res = client.post(
        f"/api/applications/{app_id}/interview-simulator/sessions/{fake_session_id}/answer",
        json={"question_index": 0, "answer": "Valid substantive candidate response here."},
        headers=auth_headers
    )
    assert res.status_code == 404
    data = res.get_json()
    assert data["success"] is False
    assert data["error"] == "NOT_FOUND"


def test_submit_answer_valid_substantive_response_succeeds(client, test_application, auth_headers):
    """Valid answer with >= 5 characters evaluates successfully."""
    app_id = str(test_application["id"])
    start_res = client.post(
        f"/api/applications/{app_id}/interview-simulator/start",
        json={"mode": "technical", "resume_active": False},
        headers=auth_headers
    )
    session_id = start_res.get_json()["data"]["id"]

    valid_answer = (
        "In my previous project, I designed a Redis caching layer for read-heavy API endpoints "
        "which reduced PostgreSQL query latency from 180ms to under 12ms."
    )

    res = client.post(
        f"/api/applications/{app_id}/interview-simulator/sessions/{session_id}/answer",
        json={"question_index": 0, "answer": valid_answer},
        headers=auth_headers
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "data" in data
    assert data["data"]["answer_text"] == valid_answer
    assert "evaluation" in data["data"]


def test_submit_answer_unexpected_server_error_returns_500(client, test_application, auth_headers):
    """Unexpected runtime exceptions return 500 and are never masked as validation errors."""
    app_id = str(test_application["id"])
    start_res = client.post(
        f"/api/applications/{app_id}/interview-simulator/start",
        json={"mode": "technical", "resume_active": False},
        headers=auth_headers
    )
    session_id = start_res.get_json()["data"]["id"]

    with patch.object(InterviewSimulatorService, "submit_answer", side_effect=RuntimeError("Database replica unreachable")):
        res = client.post(
            f"/api/applications/{app_id}/interview-simulator/sessions/{session_id}/answer",
            json={"question_index": 0, "answer": "Valid substantive candidate response here."},
            headers=auth_headers
        )
        assert res.status_code == 500
        data = res.get_json()
        assert data["success"] is False
        assert data["error"] != "VALIDATION_ERROR"
        assert "Failed to evaluate answer" in data["message"]
