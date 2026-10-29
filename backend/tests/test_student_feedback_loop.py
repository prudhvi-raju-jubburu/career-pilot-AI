import pytest
import uuid
from datetime import datetime, timezone, timedelta
from bson import ObjectId

from app import create_app
from app.config.db import Database
from app.models.user import UserModel
from app.models.feedback import FeedbackModel, CANONICAL_EVENT_TYPES
from app.models.opportunity import OpportunityModel
from app.services.signal_interpreter import SignalInterpreter, SIGNAL_WEIGHTS, MAX_PERSONALIZATION_BOOST, MIN_PERSONALIZATION_PENALTY
from app.services.recommendation_engine import RecommendationEngine

@pytest.fixture
def test_app():
    app = create_app()
    app.config["TESTING"] = True
    return app

from app.utils.auth import generate_token

@pytest.fixture
def auth_tokens(test_app):
    with test_app.app_context():
        u1_email = f"user1_{uuid.uuid4().hex[:8]}@example.com"
        u2_email = f"user2_{uuid.uuid4().hex[:8]}@example.com"
        user1 = UserModel.create_user(name="Student One", email=u1_email, password="password123")
        user2 = UserModel.create_user(name="Student Two", email=u2_email, password="password123")
        token1 = generate_token(user_id=str(user1["_id"]), email=u1_email)
        token2 = generate_token(user_id=str(user2["_id"]), email=u2_email)
        return {
            "user1": user1,
            "user2": user2,
            "token1": token1,
            "token2": token2,
            "headers1": {"Authorization": f"Bearer {token1}", "Content-Type": "application/json"},
            "headers2": {"Authorization": f"Bearer {token2}", "Content-Type": "application/json"}
        }

@pytest.fixture
def sample_opportunity(test_app):
    with test_app.app_context():
        col = OpportunityModel.get_collection()
        opp_doc = {
            "title": "Full Stack Software Engineer",
            "organization": {"name": "TestCorp Labs"},
            "description": "Looking for passionate React and Python developer.",
            "type": "job",
            "category": "software",
            "location": {"city": "Bengaluru", "is_remote": False},
            "work_mode": "Hybrid",
            "skills": ["React", "Python", "MongoDB"],
            "education_requirements": {"branches": ["Computer Science"], "graduation_years": [2025, 2026]},
            "experience": {"min_years": 0.0},
            "status": "active",
            "dates": {"posted_at": datetime.now(timezone.utc).isoformat(), "deadline": "2027-12-31"},
            "metadata": {"raw_hash": f"hash_{uuid.uuid4().hex}"}
        }
        res = col.insert_one(opp_doc)
        opp_doc["_id"] = res.inserted_id
        opp_doc["id"] = str(res.inserted_id)
        yield opp_doc
        col.delete_one({"_id": res.inserted_id})

def test_feedback_event_validation_and_deduplication(test_app, auth_tokens, sample_opportunity):
    """Verifies valid event recording, invalid type rejection, and 24h view rate-limiting."""
    with test_app.app_context():
        uid = str(auth_tokens["user1"]["_id"])
        opp_id = sample_opportunity["id"]

        # Valid view event
        ev1 = FeedbackModel.record_event(
            user_id=uid,
            opportunity_id=opp_id,
            event_type="opportunity_viewed",
            category="job",
            company="TestCorp Labs"
        )
        assert ev1["event_type"] == "opportunity_viewed"

        # Immediate duplicate view should return existing record (rate-limited)
        ev2 = FeedbackModel.record_event(
            user_id=uid,
            opportunity_id=opp_id,
            event_type="opportunity_viewed"
        )
        assert str(ev1["id"]) == str(ev2["id"])

        # Invalid event type should raise ValueError
        with pytest.raises(ValueError) as exc:
            FeedbackModel.record_event(
                user_id=uid,
                opportunity_id=opp_id,
                event_type="invalid_event_type_xyz"
            )
        assert "Invalid event_type" in str(exc.value)

def test_cross_user_feedback_isolation(test_app, auth_tokens, sample_opportunity):
    """Verifies that User 2 cannot see, overwrite, or delete User 1's feedback."""
    client = test_app.test_client()
    opp_id = sample_opportunity["id"]

    # User 1 submits relevant feedback
    res1 = client.post(
        f"/api/opportunities/{opp_id}/feedback",
        headers=auth_tokens["headers1"],
        json={"rating": "relevant", "reason": "good_match"}
    )
    assert res1.status_code == 200

    # User 2 checks feedback on the same opportunity -> should be empty (None)
    res2 = client.get(
        f"/api/opportunities/{opp_id}/feedback",
        headers=auth_tokens["headers2"]
    )
    assert res2.status_code == 200
    assert res2.get_json()["data"] is None

    # User 2 tries to delete feedback -> should report deleted: False
    del_res = client.delete(
        f"/api/opportunities/{opp_id}/feedback",
        headers=auth_tokens["headers2"]
    )
    assert del_res.status_code == 200
    assert del_res.get_json()["data"]["deleted"] is False

    # User 1's feedback remains intact
    res1_check = client.get(
        f"/api/opportunities/{opp_id}/feedback",
        headers=auth_tokens["headers1"]
    )
    assert res1_check.status_code == 200
    assert res1_check.get_json()["data"]["rating"] == "relevant"

def test_temporal_recency_decay_calculation():
    """Verifies exponential half-life decay (30 days = 50% weight)."""
    now = datetime.now(timezone.utc)
    factor_now = SignalInterpreter.get_decay_factor(now.isoformat(), now_utc=now)
    assert abs(factor_now - 1.0) < 0.01

    thirty_days_ago = (now - timedelta(days=30)).isoformat()
    factor_30d = SignalInterpreter.get_decay_factor(thirty_days_ago, now_utc=now)
    assert abs(factor_30d - 0.50) < 0.05

    sixty_days_ago = (now - timedelta(days=60)).isoformat()
    factor_60d = SignalInterpreter.get_decay_factor(sixty_days_ago, now_utc=now)
    assert abs(factor_60d - 0.25) < 0.05

def test_cold_start_fallback_for_new_user(test_app, auth_tokens, sample_opportunity):
    """Verifies that a new user with 0 interaction history receives 0 personalization delta."""
    with test_app.app_context():
        uid = str(auth_tokens["user1"]["_id"])
        prefs = SignalInterpreter.build_student_preference_profile(uid)
        assert prefs["has_history"] is False
        assert prefs["positive_signal_count"] == 0

        delta, highlights = SignalInterpreter.calculate_personalization_adjustment(sample_opportunity, prefs)
        assert delta == 0
        assert len(highlights) == 0

def test_bounded_personalization_adjustment_clamp():
    """Verifies personalization adjustment strictly respects [-10, +10] bounds."""
    heavy_positive_prefs = {
        "has_history": True,
        "category_weights": {"job": 50.0},
        "skill_weights": {"python": 40.0, "react": 30.0, "mongodb": 25.0},
        "company_weights": {"TestCorp Labs": 30.0},
        "saved_opp_ids": {"test_opp"},
        "applied_opp_ids": {"test_opp"},
        "dismissed_opp_ids": set(),
        "not_relevant_opp_ids": set(),
        "positive_signal_count": 10
    }
    opp = {
        "id": "test_opp",
        "type": "job",
        "skills": ["Python", "React", "MongoDB"],
        "organization": {"name": "TestCorp Labs"}
    }
    boost, _ = SignalInterpreter.calculate_personalization_adjustment(opp, heavy_positive_prefs)
    assert boost == MAX_PERSONALIZATION_BOOST  # Clamped to 10

def test_explicit_negative_feedback_suppression(test_app, auth_tokens, sample_opportunity):
    """Verifies that dismissing or marking an opportunity not-relevant severely penalizes it and excludes from recommended."""
    client = test_app.test_client()
    opp_id = sample_opportunity["id"]
    uid = str(auth_tokens["user1"]["_id"])

    # Submit not_relevant feedback
    res = client.post(
        f"/api/opportunities/{opp_id}/feedback",
        headers=auth_tokens["headers1"],
        json={"rating": "not_relevant", "reason": "wrong_role"}
    )
    assert res.status_code == 200

    # Build preference profile
    with test_app.app_context():
        prefs = SignalInterpreter.build_student_preference_profile(uid)
        assert opp_id in prefs["not_relevant_opp_ids"]

        penalty, highlights = SignalInterpreter.calculate_personalization_adjustment(sample_opportunity, prefs)
        assert penalty == MIN_PERSONALIZATION_PENALTY  # -10
        assert "not relevant" in highlights[0].lower()

def test_mandatory_eligibility_invariant_with_personalization(test_app, auth_tokens):
    """
    CRITICAL INVARIANT TEST:
    A high personalization boost must NEVER convert a 'not_eligible' opportunity into 'eligible'.
    """
    with test_app.app_context():
        col = OpportunityModel.get_collection()
        uid = str(auth_tokens["user1"]["_id"])

        # Create an opportunity with a strict CGPA requirement of 9.5
        ineligible_opp = {
            "title": "Ultra Elite Research Fellow",
            "organization": {"name": "SuperCorp Labs"},
            "type": "job",
            "skills": ["Python"],
            "education_requirements": {"min_cgpa": 9.5, "graduation_years": [2025]},
            "status": "active",
            "dates": {
                "posted_at": datetime.now(timezone.utc).isoformat(),
                "deadline": "2027-12-31"
            },
            "metadata": {"raw_hash": f"hash_{uuid.uuid4().hex}"}
        }
        res = col.insert_one(ineligible_opp)
        opp_id = str(res.inserted_id)

        try:
            # Student has CGPA 7.0 and bookmarks it
            FeedbackModel.record_event(
                user_id=uid,
                opportunity_id=opp_id,
                event_type="opportunity_saved",
                category="job",
                company="SuperCorp Labs"
            )

            rec_res = RecommendationEngine.get_recommendations(user_id=uid, tab="recommended", limit=200)
            rec_ids = [item["id"] for item in rec_res["items"]]

            # Must NOT be in recommended
            assert opp_id not in rec_ids

            # Must appear in stretch/ineligible
            stretch_res = RecommendationEngine.get_recommendations(user_id=uid, tab="stretch", limit=200)
            stretch_ids = [item["id"] for item in stretch_res["items"]]
            assert opp_id in stretch_ids
        finally:
            col.delete_one({"_id": res.inserted_id})

def test_feedback_summary_endpoint(test_app, auth_tokens, sample_opportunity):
    """Verifies that GET /api/recommendations/feedback-summary aggregates correctly."""
    client = test_app.test_client()
    opp_id = sample_opportunity["id"]

    client.post(
        f"/api/opportunities/{opp_id}/feedback",
        headers=auth_tokens["headers1"],
        json={"rating": "relevant", "reason": "dream_company"}
    )

    summary_res = client.get(
        "/api/recommendations/feedback-summary",
        headers=auth_tokens["headers1"]
    )
    assert summary_res.status_code == 200
    data = summary_res.get_json()["data"]
    assert data["relevant_count"] >= 1
    assert "dream_company" in data["reasons"]
