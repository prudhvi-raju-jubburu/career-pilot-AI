import pytest
import uuid
from datetime import datetime, timezone, timedelta
from app import create_app
from app.models.user import UserModel
from app.models.application import ApplicationModel
from app.models.interview_prep import InterviewPrepModel
from app.models.mock_test_attempt import MockTestAttemptModel
from app.services.mock_test_service import MockTestService, CANONICAL_TEST_CATEGORIES
from app.services.mock_test_question_bank import MOCK_TEST_QUESTIONS, get_questions_by_category
from app.utils.auth import generate_token


@pytest.fixture
def test_app():
    app = create_app()
    app.config["TESTING"] = True
    return app


@pytest.fixture
def candidate_user(test_app):
    """Creates a candidate user and returns token and user doc."""
    with test_app.app_context():
        email = f"stage5_cand_{uuid.uuid4().hex[:8]}@example.com"
        user = UserModel.create_user(name="Stage5 Candidate", email=email, password="password123")
        token = generate_token(user_id=str(user["_id"]), email=email)
        return {"user": user, "token": token, "user_id": str(user["_id"])}


@pytest.fixture
def other_user(test_app):
    """Creates a secondary user for cross-user security checks."""
    with test_app.app_context():
        email = f"stage5_other_{uuid.uuid4().hex[:8]}@example.com"
        user = UserModel.create_user(name="Stage5 Other", email=email, password="password123")
        token = generate_token(user_id=str(user["_id"]), email=email)
        return {"user": user, "token": token, "user_id": str(user["_id"])}


@pytest.fixture
def test_application(test_app, candidate_user):
    """Creates an application for candidate_user."""
    with test_app.app_context():
        app_doc = ApplicationModel.create_application(
            user_id=candidate_user["user_id"],
            data={
                "company": "CloudScale Systems",
                "role": "Backend Software Engineer",
                "type": "Full-time",
                "status": "Applied",
                "job_description": (
                    "Backend Engineer with Python, PostgreSQL, Docker, and Redis. "
                    "Strong CS fundamentals in OS, concurrency, and distributed systems."
                )
            }
        )
        return app_doc


def test_start_each_supported_test_category(test_app, candidate_user, test_application):
    """Verifies that every supported test category can be successfully started."""
    with test_app.app_context():
        app_id = test_application["id"]
        user_id = candidate_user["user_id"]

        categories = MockTestService.get_available_categories(app_id, user_id)
        assert len(categories) >= 8

        for cat in categories:
            cat_name = cat["name"]
            attempt = MockTestService.start_test_attempt(
                application_id=app_id,
                user_id=user_id,
                config={
                    "category": cat_name,
                    "difficulty": "Medium",
                    "question_count": 3,
                    "is_timed": True,
                    "time_limit_minutes": 10
                }
            )
            assert attempt is not None
            assert attempt["status"] == "in_progress"
            assert attempt["category"] == cat_name
            assert len(attempt["questions"]) >= 1

            # Complete attempt so subsequent loop iteration starts fresh
            MockTestService.submit_attempt(app_id, attempt["id"], user_id, {})


def test_hidden_answer_keys_during_active_test(test_app, candidate_user, test_application):
    """Verifies correct answers and explanations are never exposed in active test payloads."""
    with test_app.app_context():
        app_id = test_application["id"]
        user_id = candidate_user["user_id"]

        attempt = MockTestService.start_test_attempt(
            application_id=app_id,
            user_id=user_id,
            config={
                "category": "SQL & Databases",
                "difficulty": "Medium",
                "question_count": 3,
                "is_timed": True,
                "time_limit_minutes": 15
            }
        )

        test_id = attempt["id"]
        # In-progress fetch
        fetched = MockTestService.get_attempt(app_id, test_id, user_id)
        assert fetched["status"] == "in_progress"

        for q in fetched["questions"]:
            assert "correct_answer" not in q, "Security breach: correct_answer exposed in active test!"
            assert "explanation" not in q, "Security breach: explanation exposed in active test!"
            assert "learning_resources" not in q, "learning_resources leaked in active test!"
            assert "options" in q
            assert len(q["options"]) == 4

        # Clean up
        MockTestService.submit_attempt(app_id, test_id, user_id, {})


def test_objective_scoring_and_unanswered_questions(test_app, candidate_user, test_application):
    """Verifies deterministic objective scoring, correct/incorrect/unanswered counting, and percentage."""
    with test_app.app_context():
        app_id = test_application["id"]
        user_id = candidate_user["user_id"]

        attempt = MockTestService.start_test_attempt(
            application_id=app_id,
            user_id=user_id,
            config={
                "category": "Operating Systems, Networking, and DBMS",
                "difficulty": "Easy",
                "question_count": 3,
                "is_timed": False
            }
        )
        test_id = attempt["id"]

        # Fetch underlying raw document to know correct answers for testing
        raw_doc = MockTestAttemptModel.find_by_id(test_id, user_id=user_id)
        questions = raw_doc["questions"]
        assert len(questions) == 3

        q1 = questions[0]
        q2 = questions[1]
        q3 = questions[2]

        # Submit:
        # q1: correct answer
        # q2: deliberately wrong answer
        # q3: left unanswered (skipped)
        answers = {
            q1["id"]: q1["correct_answer"],
            q2["id"]: "DefinitelyIncorrectAnswer_12345"
            # q3 omitted
        }

        result = MockTestService.submit_attempt(app_id, test_id, user_id, answers)
        assert result["status"] == "completed"
        assert result["total_questions"] == 3
        assert result["correct_count"] == 1
        assert result["incorrect_count"] == 1
        assert result["unanswered_count"] == 1
        assert result["score"] == 1
        assert result["percentage"] == pytest.approx(33.3, abs=0.1)

        # After submission, correct_answer and explanations ARE revealed for review
        for q in result["questions"]:
            assert "correct_answer" in q
            assert "explanation" in q


def test_answer_persistence_and_in_progress_saving(test_app, candidate_user, test_application):
    """Verifies that answers can be saved incrementally during test without submitting."""
    with test_app.app_context():
        app_id = test_application["id"]
        user_id = candidate_user["user_id"]

        attempt = MockTestService.start_test_attempt(
            application_id=app_id,
            user_id=user_id,
            config={"category": "Technical MCQs", "question_count": 3}
        )
        test_id = attempt["id"]

        # Save question 1 answer
        save_res = MockTestService.save_answers(app_id, test_id, user_id, {"q_1": "Sample Option A"})
        assert save_res["saved_count"] == 1

        # Check attempt returns saved answer
        att_state = MockTestService.get_attempt(app_id, test_id, user_id)
        assert att_state["submitted_answers"].get("q_1") == "Sample Option A"

        # Save question 2 answer
        MockTestService.save_answers(app_id, test_id, user_id, {"q_2": "Sample Option B"})
        att_state2 = MockTestService.get_attempt(app_id, test_id, user_id)
        assert att_state2["submitted_answers"].get("q_1") == "Sample Option A"
        assert att_state2["submitted_answers"].get("q_2") == "Sample Option B"

        # Clean up
        MockTestService.submit_attempt(app_id, test_id, user_id, {})


def test_deadline_expiration_and_timer_enforcement(test_app, candidate_user, test_application):
    """Verifies that an overdue test is automatically expired and graded using server-authoritative time."""
    with test_app.app_context():
        app_id = test_application["id"]
        user_id = candidate_user["user_id"]

        attempt = MockTestService.start_test_attempt(
            application_id=app_id,
            user_id=user_id,
            config={"category": "Data Structures & Algorithms", "question_count": 3, "is_timed": True, "time_limit_minutes": 5}
        )
        test_id = attempt["id"]

        # Simulate server-time expiration by backdating expires_at into the past
        past_time = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()
        col = MockTestAttemptModel.get_collection()
        from bson import ObjectId
        col.update_one({"_id": ObjectId(test_id)}, {"$set": {"expires_at": past_time}})

        # Attempting to save answers after expiration should raise ValueError
        with pytest.raises(ValueError, match="expired"):
            MockTestService.save_answers(app_id, test_id, user_id, {"q_1": "TooLate"})

        # Fetching attempt marks it as expired and grades whatever was saved
        fetched = MockTestService.get_attempt(app_id, test_id, user_id)
        assert fetched["status"] == "expired"
        assert "score" in fetched


def test_duplicate_submissions_and_immutability(test_app, candidate_user, test_application):
    """Verifies that repeated submissions are idempotent and completed tests cannot be edited."""
    with test_app.app_context():
        app_id = test_application["id"]
        user_id = candidate_user["user_id"]

        attempt = MockTestService.start_test_attempt(
            application_id=app_id,
            user_id=user_id,
            config={"category": "Programming Language Fundamentals", "question_count": 3}
        )
        test_id = attempt["id"]

        raw_doc = MockTestAttemptModel.find_by_id(test_id, user_id=user_id)
        correct_opt = raw_doc["questions"][0]["correct_answer"]

        # First submission
        res1 = MockTestService.submit_attempt(app_id, test_id, user_id, {"q_1": correct_opt})
        score1 = res1["score"]

        # Second submission (idempotent, score does not change)
        res2 = MockTestService.submit_attempt(app_id, test_id, user_id, {"q_1": "SomethingElse", "q_2": "Another"})
        assert res2["score"] == score1
        assert res2["status"] == "completed"

        # Attempting to edit answers on a completed test must fail
        with pytest.raises(ValueError, match="completed"):
            MockTestService.save_answers(app_id, test_id, user_id, {"q_1": "NewAnswer"})


def test_cross_user_security_and_ownership(test_app, candidate_user, other_user, test_application):
    """Verifies that unauthorized users cannot access, start, or submit tests for another user's application."""
    client = test_app.test_client()

    with test_app.app_context():
        app_id = test_application["id"]

        # Other user tries to start a test for candidate's application
        res = client.post(
            f"/api/applications/{app_id}/mock-tests/start",
            headers={"Authorization": f"Bearer {other_user['token']}"},
            json={"category": "Technical MCQs"}
        )
        assert res.status_code == 404

        # Candidate user starts a test
        cand_start = client.post(
            f"/api/applications/{app_id}/mock-tests/start",
            headers={"Authorization": f"Bearer {candidate_user['token']}"},
            json={"category": "Technical MCQs"}
        )
        assert cand_start.status_code == 201
        test_id = cand_start.get_json()["data"]["id"]

        # Other user tries to fetch test
        res_get = client.get(
            f"/api/applications/{app_id}/mock-tests/{test_id}",
            headers={"Authorization": f"Bearer {other_user['token']}"}
        )
        assert res_get.status_code == 404

        # Other user tries to submit test
        res_sub = client.post(
            f"/api/applications/{app_id}/mock-tests/{test_id}/submit",
            headers={"Authorization": f"Bearer {other_user['token']}"},
            json={"answers": {}}
        )
        assert res_sub.status_code == 404

        # Clean up
        MockTestService.submit_attempt(app_id, test_id, candidate_user["user_id"], {})


def test_question_snapshot_stability(test_app, candidate_user, test_application):
    """Verifies that an attempt's question snapshots remain stable even if prep pack is refreshed."""
    with test_app.app_context():
        app_id = test_application["id"]
        user_id = candidate_user["user_id"]

        attempt = MockTestService.start_test_attempt(
            application_id=app_id,
            user_id=user_id,
            config={"category": "Job-Specific Technologies", "question_count": 3}
        )
        test_id = attempt["id"]
        initial_q_texts = [q["question_text"] for q in attempt["questions"]]

        # Refresh the prep pack
        from app.services.interview_prep_service import InterviewPrepService
        InterviewPrepService.get_or_generate_prep_pack(user_id=user_id, application_id=app_id, force_refresh=True)

        # Retrieve test attempt: question snapshots must remain identical
        post_refresh = MockTestService.get_attempt(app_id, test_id, user_id)
        current_q_texts = [q["question_text"] for q in post_refresh["questions"]]
        assert current_q_texts == initial_q_texts

        # Clean up
        MockTestService.submit_attempt(app_id, test_id, user_id, {})


def test_weak_topics_and_roadmap_integration(test_app, candidate_user, test_application):
    """Verifies that weak topics are identified and can be added directly to the preparation checklist roadmap."""
    with test_app.app_context():
        app_id = test_application["id"]
        user_id = candidate_user["user_id"]

        # Ensure prep pack exists
        from app.services.interview_prep_service import InterviewPrepService
        prep_pack = InterviewPrepService.get_or_generate_prep_pack(user_id=user_id, application_id=app_id)
        assert prep_pack is not None

        attempt = MockTestService.start_test_attempt(
            application_id=app_id,
            user_id=user_id,
            config={"category": "SQL & Databases", "question_count": 3}
        )
        test_id = attempt["id"]

        # Submit all wrong answers to produce weak topics
        wrong_answers = {q["id"]: "CompletelyWrongChoice" for q in attempt["questions"]}
        result = MockTestService.submit_attempt(app_id, test_id, user_id, wrong_answers)

        assert len(result["weak_topics"]) > 0
        weak_topic = result["weak_topics"][0]

        # Add weak topic to roadmap
        updated_pack = MockTestService.add_weak_topic_to_roadmap(app_id, test_id, user_id, weak_topic)
        assert updated_pack is not None
        checklist_titles = [item["task"] for item in updated_pack["checklist"]]
        assert any(weak_topic in title for title in checklist_titles)


def test_attempt_history_listing(test_app, candidate_user, test_application):
    """Verifies previous attempts history list returns past attempts for an application."""
    client = test_app.test_client()
    with test_app.app_context():
        app_id = test_application["id"]
        user_id = candidate_user["user_id"]

        # Start and submit 2 attempts
        att1 = MockTestService.start_test_attempt(app_id, user_id, {"category": "Aptitude and Logical Reasoning", "question_count": 3})
        MockTestService.submit_attempt(app_id, att1["id"], user_id, {})

        att2 = MockTestService.start_test_attempt(app_id, user_id, {"category": "Technical MCQs", "question_count": 3})
        MockTestService.submit_attempt(app_id, att2["id"], user_id, {})

        # Call API
        res = client.get(
            f"/api/applications/{app_id}/mock-tests",
            headers={"Authorization": f"Bearer {candidate_user['token']}"}
        )
        assert res.status_code == 200
        data = res.get_json()["data"]
        assert "categories" in data
        assert "previous_attempts" in data
        assert len(data["previous_attempts"]) >= 2


def test_unknown_category_fallback_to_verified_inventory(test_app, candidate_user, test_application):
    """Verifies that selecting an unrecognized category falls back safely to general question pool."""
    with test_app.app_context():
        app_id = test_application["id"]
        user_id = candidate_user["user_id"]

        attempt = MockTestService.start_test_attempt(
            application_id=app_id,
            user_id=user_id,
            config={"category": "NonExistentSpecialtyCategory_999", "question_count": 3}
        )
        assert attempt is not None
        assert len(attempt["questions"]) >= 1
        MockTestService.submit_attempt(app_id, attempt["id"], user_id, {})


def test_ai_provider_failure_and_deterministic_fallback(test_app, candidate_user, test_application):
    """Verifies that an AI provider failure does not break mock test generation and uses deterministic pool."""
    from unittest.mock import patch
    from app.ai.ai_service import AIServiceError

    with test_app.app_context():
        app_id = test_application["id"]
        user_id = candidate_user["user_id"]

        with patch("app.ai.ai_service.AIService.resolve_active_provider", side_effect=AIServiceError("Network timeout to AI endpoint")):
            attempt = MockTestService.start_test_attempt(
                application_id=app_id,
                user_id=user_id,
                config={"category": "SQL & Databases", "question_count": 3}
            )
            assert attempt is not None
            assert len(attempt["questions"]) == 3
            MockTestService.submit_attempt(app_id, attempt["id"], user_id, {})

