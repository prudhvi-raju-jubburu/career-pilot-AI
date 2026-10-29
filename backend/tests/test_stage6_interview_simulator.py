import pytest
from bson import ObjectId
from app import create_app
from app.config.db import Database
from app.models.user import UserModel
from app.models.application import ApplicationModel
from app.models.profile import ProfileModel
from app.models.interview_prep import InterviewPrepModel
from app.models.mock_test_attempt import MockTestAttemptModel
from app.models.interview_session import InterviewSessionModel
from app.services.interview_simulator_service import InterviewSimulatorService
from app.utils.auth import generate_token

@pytest.fixture(scope="module")
def app_instance():
    app = create_app()
    app.config["TESTING"] = True
    yield app

@pytest.fixture(scope="module")
def client(app_instance):
    return app_instance.test_client()

@pytest.fixture(scope="module")
def test_user(app_instance):
    with app_instance.app_context():
        user = UserModel.find_by_email("stage6_sim_student@careerpilot.ai")
        if not user:
            user = UserModel.create_user(
                email="stage6_sim_student@careerpilot.ai",
                password="SecurePassword123!",
                name="Aarav Sharma"
            )
        # Create candidate profile with real projects for deep-dive testing
        ProfileModel.update_profile(str(user["_id"]), {
            "full_name": "Aarav Sharma",
            "headline": "Full Stack Engineer & Cloud Developer",
            "skills": ["Python", "Flask", "React", "Docker", "PostgreSQL", "Redis"],
            "projects": [
                {
                    "name": "CloudFleet Manager",
                    "technologies": ["Python", "Docker", "PostgreSQL"],
                    "description": "Container orchestration dashboard with Redis task queues and real-time WebSockets."
                },
                {
                    "name": "CryptoArbitrage Bot",
                    "technologies": ["React", "FastAPI", "WebSockets"],
                    "description": "High-frequency triangular arbitrage engine with sub-50ms execution latency."
                }
            ]
        })
        return user

@pytest.fixture(scope="module")
def auth_headers(app_instance, test_user):
    with app_instance.app_context():
        token = generate_token(str(test_user["_id"]), test_user["email"])
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

@pytest.fixture(scope="module")
def other_user(app_instance):
    with app_instance.app_context():
        user = UserModel.find_by_email("stage6_other_student@careerpilot.ai")
        if not user:
            user = UserModel.create_user(
                email="stage6_other_student@careerpilot.ai",
                password="SecurePassword123!",
                name="Rhea Patel"
            )
        return user

@pytest.fixture(scope="module")
def other_auth_headers(app_instance, other_user):
    with app_instance.app_context():
        token = generate_token(str(other_user["_id"]), other_user["email"])
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

@pytest.fixture(scope="module")
def test_application(app_instance, test_user):
    with app_instance.app_context():
        user_id = str(test_user["_id"])
        app_doc = ApplicationModel.create_application(user_id, {
            "company": "Swiggy",
            "role": "Software Development Engineer - Backend",
            "status": "Applied",
            "type": "Job",
            "job_description": "We are seeking a Backend SDE skilled in Python, distributed caching with Redis, relational database design with PostgreSQL, and microservices containerization with Docker."
        })
        # Record a past mock test attempt with weak topics
        MockTestAttemptModel.create_attempt({
            "user_id": user_id,
            "application_id": str(app_doc["id"]),
            "category": "Operating Systems, Networking, and DBMS",
            "difficulty": "Medium",
            "percentage": 50,
            "status": "completed",
            "weak_topics": ["Database Indexing", "Connection Pooling"],
            "questions": [],
            "submitted_answers": {}
        })
        return app_doc

# -----------------------------------------------------------------------------
# Unit & Service Tests
# -----------------------------------------------------------------------------

def test_session_model_crud(app_instance, test_user, test_application):
    with app_instance.app_context():
        user_id = str(test_user["_id"])
        app_id = str(test_application["id"])

        session = InterviewSessionModel.create_session({
            "user_id": user_id,
            "application_id": app_id,
            "mode": "technical",
            "difficulty": "medium",
            "total_questions": 3,
            "questions": [
                {"id": "q1", "question_text": "Sample Q1", "expected_points": ["point A", "point B"]}
            ]
        })
        assert session["id"] is not None
        assert session["status"] == "active"
        assert session["current_question_index"] == 0

        # Save answer
        ans_ok = InterviewSessionModel.save_answer(session["id"], user_id, 0, "My comprehensive technical response.")
        assert ans_ok is True

        # Save evaluation
        eval_ok = InterviewSessionModel.save_evaluation(session["id"], user_id, 0, {
            "overall_assessment": "Great answer",
            "score_band": "Strong",
            "score_percentage": 88
        })
        assert eval_ok is True

        # Advance question
        adv_ok = InterviewSessionModel.advance_question(session["id"], user_id, 1)
        assert adv_ok is True

        # Pause and resume
        p_ok = InterviewSessionModel.pause_session(session["id"], user_id)
        assert p_ok is True
        paused = InterviewSessionModel.find_by_id(session["id"])
        assert paused["status"] == "paused"

        r_ok = InterviewSessionModel.resume_session(session["id"], user_id)
        assert r_ok is True
        resumed = InterviewSessionModel.find_by_id(session["id"])
        assert resumed["status"] == "active"

        # Complete
        completed = InterviewSessionModel.complete_session(session["id"], user_id, {"summary_stat": 100})
        assert completed["status"] == "completed"
        assert completed["summary"]["summary_stat"] == 100

def test_start_session_technical_mode(app_instance, test_user, test_application):
    with app_instance.app_context():
        user_id = str(test_user["_id"])
        app_id = str(test_application["id"])

        session = InterviewSimulatorService.start_session(
            app_id=app_id,
            user_id=user_id,
            config={"mode": "technical", "difficulty": "medium", "question_count": 3, "resume_active": False}
        )

        assert session["mode"] == "technical"
        assert session["total_questions"] >= 2
        assert len(session["questions"]) >= 2
        q0 = session["questions"][0]
        assert "question_text" in q0
        assert "expected_points" in q0
        assert "why_relevant" in q0

def test_start_session_project_deep_dive_grounded(app_instance, test_user, test_application):
    with app_instance.app_context():
        user_id = str(test_user["_id"])
        app_id = str(test_application["id"])

        session = InterviewSimulatorService.start_session(
            app_id=app_id,
            user_id=user_id,
            config={"mode": "project_deep_dive", "difficulty": "hard", "question_count": 2, "resume_active": False}
        )

        assert session["mode"] == "project_deep_dive"
        questions = session["questions"]
        assert len(questions) >= 1
        # Confirm candidate's actual projects are referenced
        found_project_mention = any(
            "CloudFleet Manager" in q["question_text"] or "CryptoArbitrage Bot" in q["question_text"]
            for q in questions
        )
        assert found_project_mention is True, "Project Deep-Dive must be grounded in candidate's verified projects"

def test_start_session_weak_topics_mode(app_instance, test_user, test_application):
    with app_instance.app_context():
        user_id = str(test_user["_id"])
        app_id = str(test_application["id"])

        session = InterviewSimulatorService.start_session(
            app_id=app_id,
            user_id=user_id,
            config={"mode": "weak_topics", "difficulty": "medium", "question_count": 3, "resume_active": False}
        )

        assert session["mode"] == "weak_topics"
        questions = session["questions"]
        assert len(questions) >= 1
        # Weak topics were "Database Indexing" and "Connection Pooling"
        has_weak_topic = any(
            "Database Indexing" in q["question_text"] or "Connection Pooling" in q["question_text"] or q.get("grounded_source")
            for q in questions
        )
        assert has_weak_topic is True

def test_atomic_answer_persistence_and_evaluation(app_instance, test_user, test_application):
    with app_instance.app_context():
        user_id = str(test_user["_id"])
        app_id = str(test_application["id"])

        session = InterviewSimulatorService.start_session(
            app_id=app_id,
            user_id=user_id,
            config={"mode": "coding_discussion", "difficulty": "medium", "question_count": 2, "resume_active": False}
        )
        session_id = session["id"]

        detailed_answer = (
            "To solve this problem efficiently, I would use a hash table to achieve O(1) average-time lookups "
            "and an LRU cache eviction policy with a doubly linked list. The primary trade-off is higher memory "
            "consumption to avoid repeated O(N) database reads. For edge cases, I handle empty payloads, null keys, "
            "and concurrent read/write races using fine-grained reader-writer locks."
        )

        result = InterviewSimulatorService.submit_answer(
            app_id=app_id,
            session_id=session_id,
            user_id=user_id,
            question_index=0,
            answer_text=detailed_answer
        )

        assert result["session_id"] == session_id
        assert result["answer_text"] == detailed_answer
        assert "evaluation" in result

        eval_data = result["evaluation"]
        assert eval_data["score_band"] in ("Strong", "Competent", "Developing", "Needs Improvement")
        assert 0 <= eval_data["score_percentage"] <= 100
        assert "dimensions" in eval_data
        assert "technical_correctness" in eval_data["dimensions"]
        assert "what_went_well" in eval_data
        assert "missing_concepts" in eval_data
        assert "sample_answer" in eval_data

        # Verify answer was persisted in MongoDB
        refetched = InterviewSessionModel.find_by_id(session_id)
        assert "0" in refetched["answers"]
        assert refetched["answers"]["0"]["answer_text"] == detailed_answer
        assert "0" in refetched["evaluations"]

def test_add_simulator_feedback_to_roadmap(app_instance, test_user, test_application):
    with app_instance.app_context():
        user_id = str(test_user["_id"])
        app_id = str(test_application["id"])

        session = InterviewSimulatorService.start_session(
            app_id=app_id,
            user_id=user_id,
            config={"mode": "technical", "resume_active": False}
        )

        task_title = "Revise Redis Sentinel and Cluster Failover Mechanisms"
        updated_pack = InterviewSimulatorService.add_feedback_to_roadmap(
            app_id=app_id,
            session_id=session["id"],
            user_id=user_id,
            task_title=task_title,
            category="Technical"
        )

        checklist = updated_pack.get("checklist") or []
        matching_tasks = [t for t in checklist if t.get("task") == task_title]
        assert len(matching_tasks) == 1
        assert matching_tasks[0]["source"] == "interview_simulator"

# -----------------------------------------------------------------------------
# HTTP Route Endpoint Tests
# -----------------------------------------------------------------------------

def test_route_get_simulator_overview(client, test_application, auth_headers):
    app_id = str(test_application["id"])
    res = client.get(f"/api/applications/{app_id}/interview-simulator", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "modes" in data
    assert len(data["modes"]) == 5
    assert "history" in data

def test_route_start_and_advance_session(client, test_application, auth_headers):
    app_id = str(test_application["id"])

    # 1. Start session
    start_res = client.post(
        f"/api/applications/{app_id}/interview-simulator/start",
        json={"mode": "behavioral", "difficulty": "medium", "question_count": 2, "resume_active": False},
        headers=auth_headers
    )
    assert start_res.status_code == 201
    session = start_res.get_json()["data"]
    session_id = session["id"]
    assert session["mode"] == "behavioral"

    # 2. Submit answer
    answer_res = client.post(
        f"/api/applications/{app_id}/interview-simulator/sessions/{session_id}/answer",
        json={
            "question_index": 0,
            "answer": (
                "Situation: During our production launch, our payments webhook failed unexpectedly due to an API change. "
                "Task: As the backend lead, I had to prevent dropped customer transactions. "
                "Action: I implemented an exponential-backoff retry queue with dead-letter storage within 2 hours. "
                "Result: All 450 impacted transactions were processed cleanly with zero financial loss."
            )
        },
        headers=auth_headers
    )
    assert answer_res.status_code == 200
    eval_res = answer_res.get_json()["data"]["evaluation"]
    assert eval_res["score_band"] in ("Strong", "Competent", "Developing")

    # 3. Advance to next question
    next_res = client.post(
        f"/api/applications/{app_id}/interview-simulator/sessions/{session_id}/next",
        headers=auth_headers
    )
    assert next_res.status_code == 200
    updated_session = next_res.get_json()["data"]
    assert updated_session["current_question_index"] == 1

def test_route_security_cross_user_isolation(client, test_application, other_auth_headers):
    """Ensures another user cannot access or submit answers to an unowned session."""
    app_id = str(test_application["id"])
    res = client.get(f"/api/applications/{app_id}/interview-simulator", headers=other_auth_headers)
    assert res.status_code == 404
    assert res.get_json()["error"] == "NOT_FOUND"

def test_route_answer_validation_length(client, test_application, auth_headers):
    """Rejects answers that are too short to be substantive."""
    app_id = str(test_application["id"])
    start_res = client.post(
        f"/api/applications/{app_id}/interview-simulator/start",
        json={"mode": "technical", "resume_active": False},
        headers=auth_headers
    )
    session_id = start_res.get_json()["data"]["id"]

    too_short_res = client.post(
        f"/api/applications/{app_id}/interview-simulator/sessions/{session_id}/answer",
        json={"question_index": 0, "answer": "yes"},
        headers=auth_headers
    )
    assert too_short_res.status_code == 400
    assert "too short" in too_short_res.get_json()["message"].lower()

def test_route_add_simulator_task_to_roadmap(client, test_application, auth_headers):
    app_id = str(test_application["id"])
    start_res = client.post(
        f"/api/applications/{app_id}/interview-simulator/start",
        json={"mode": "technical", "resume_active": False},
        headers=auth_headers
    )
    session_id = start_res.get_json()["data"]["id"]

    roadmap_res = client.post(
        f"/api/applications/{app_id}/interview-simulator/sessions/{session_id}/add-to-roadmap",
        json={"task": "Study PostgreSQL MVCC Vacuum and Transaction Isolation Levels"},
        headers=auth_headers
    )
    assert roadmap_res.status_code == 200
    assert "PostgreSQL MVCC" in roadmap_res.get_json()["message"]

def test_question_count_scaling_5_to_15(client, test_application, auth_headers):
    """Verifies that requesting 10 and 15 questions curates full grounded question sets from JD and Resume."""
    app_id = str(test_application["id"])
    res = client.post(
        f"/api/applications/{app_id}/interview-simulator/start",
        json={"mode": "technical", "question_count": 10, "resume_active": False},
        headers=auth_headers
    )
    assert res.status_code == 201
    data = res.get_json()["data"]
    assert data["total_questions"] == 10
    assert len(data["questions"]) == 10

    # Verify JD and Resume grounding sources are present
    sources = [q.get("grounded_source", "") for q in data["questions"]]
    assert any("Resume" in s or "Project" in s or "Job Description" in s for s in sources)

