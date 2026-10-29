import pytest
from datetime import datetime, timedelta, timezone
from app import create_app
from app.utils.experience_calculator import (
    calculate_student_experience,
    parse_date_boundary,
    merge_date_intervals
)
from app.utils.field_of_study import (
    classify_text_to_fields,
    extract_student_fields_of_study,
    compute_field_relevance
)
from app.services.eligibility_engine import EligibilityEngine
from app.services.recommendation_engine import RecommendationEngine
from app.services.opportunity_service import OpportunityService
from app.models.user import UserModel
from app.models.application import ApplicationModel
from app.utils.auth import generate_token

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.app_context():
        with app.test_client() as client:
            yield client

# =====================================================================
# 1. Experience Calculation & Overlap Union Tests
# =====================================================================
def test_experience_overlapping_roles_no_double_counting():
    """Overlapping roles must be unioned to elapsed calendar time, avoiding double-counting."""
    now_ref = datetime(2025, 1, 1, tzinfo=timezone.utc)
    profile = {
        "experience": [
            {
                "role": "Frontend Intern",
                "start_date": "2024-01-01",
                "end_date": "2024-06-30"  # 6 months
            },
            {
                "role": "Open Source Contributor",
                "start_date": "2024-03-01",
                "end_date": "2024-08-31"  # 6 months (overlaps March-June)
            }
        ]
    }
    result = calculate_student_experience(profile, now_utc=now_ref)
    assert result["has_experience_data"] is True
    assert result["is_fresher"] is False
    # Jan 1 to Aug 31 is exactly 8 months (~0.67 years), NOT 1.0 or 1.2 years
    assert 0.65 <= result["total_years"] <= 0.68
    assert result["intervals_count"] == 1

def test_experience_current_role_without_end_date():
    """Current roles without end date evaluate dynamically up to now_utc."""
    now_ref = datetime(2024, 7, 1, tzinfo=timezone.utc)
    profile = {
        "experience": [
            {
                "role": "Software Engineering Intern",
                "start_date": "2024-01-01",
                "is_current": True
            }
        ]
    }
    result = calculate_student_experience(profile, now_utc=now_ref)
    assert result["has_experience_data"] is True
    # 6 months (Jan 1 to Jul 1) = ~0.50 years
    assert 0.49 <= result["total_years"] <= 0.51

def test_experience_malformed_and_inverted_dates():
    """Invalid date ranges (end before start) are safely ignored without crashing."""
    profile = {
        "experience": [
            {
                "role": "Invalid Role",
                "start_date": "2024-08-01",
                "end_date": "2024-02-01"  # End < Start
            }
        ]
    }
    result = calculate_student_experience(profile)
    # Ignored invalid interval results in unverified/undated
    assert result["total_years"] is None

def test_distinguish_known_zero_from_missing_experience():
    """Empty list is confirmed 0 experience (fresher), omitted field is unverified (needs review)."""
    senior_role = {
        "type": "job",
        "title": "Backend SDE 2",
        "experience": {"min_years": 1.0}
    }

    # Profile with explicit empty experience list (fresher) -> not_eligible
    fresher_profile = {"education": {"degree": "B.Tech", "branch": "CSE"}, "experience": []}
    fresher_res = EligibilityEngine.evaluate(senior_role, fresher_profile)
    assert fresher_res["status"] == "not_eligible"
    assert "Required Experience" in fresher_res["failed_requirements"]

    # Profile with omitted experience data -> needs_review
    missing_profile = {"education": {"degree": "B.Tech", "branch": "CSE"}}
    missing_res = EligibilityEngine.evaluate(senior_role, missing_profile)
    assert missing_res["status"] == "needs_review"
    assert "Required Experience" in missing_res["unknown_requirements"]

# =====================================================================
# 2. Deadline Correctness & Boundary Tests
# =====================================================================
def test_date_only_deadline_remains_active_on_deadline_day():
    """A date-only deadline (YYYY-MM-DD) must be considered active throughout that entire day."""
    now_utc = datetime.now(timezone.utc)
    today_str = now_utc.strftime("%Y-%m-%d")
    opp_today = {
        "title": "Google Summer of Code 2026",
        "deadline": today_str
    }
    profile = {"education": {"degree": "B.Tech", "branch": "CSE"}}
    eval_today = EligibilityEngine.evaluate(opp_today, profile)
    assert eval_today["status"] == "eligible"
    assert "Application Deadline" in eval_today["passed_requirements"]

def test_past_deadline_evaluates_as_not_eligible():
    """A deadline in the past must fail the deadline rule."""
    past_date = (datetime.now(timezone.utc) - timedelta(days=2)).strftime("%Y-%m-%d")
    opp_past = {
        "title": "Old Hackathon",
        "deadline": past_date
    }
    eval_past = EligibilityEngine.evaluate(opp_past, {})
    assert eval_past["status"] == "not_eligible"
    assert "Application Deadline" in eval_past["failed_requirements"]

def test_malformed_deadline_handles_safely():
    """Malformed deadline strings do not crash the engine."""
    opp_malformed = {
        "title": "Adhoc Grant",
        "deadline": "Rolling admission / TBD 2026"
    }
    eval_safe = EligibilityEngine.evaluate(opp_malformed, {})
    assert eval_safe["status"] == "eligible"

# =====================================================================
# 3. Field-of-Study Taxonomy & Scholarship Relevance Tests
# =====================================================================
def test_scholarship_field_relevance_differentiation():
    """
    Scholarships in the student's field receive high relevance, while unrelated disciplines
    receive lower scores even with identical high CGPAs.
    """
    student_cs = {
        "education": {
            "branch": "Computer Science & Engineering",
            "degree": "B.Tech",
            "cgpa": 9.2
        },
        "target_role": "Full-Stack Developer",
        "skills": []
    }
    student_skills = set()

    tech_fellowship = {
        "title": "AI & Open Source Research Fellowship",
        "type": "fellowship",
        "category": "artificial_intelligence",
        "skills": ["Research", "Leadership"],
        "description": "Fellowship in artificial intelligence and computer science algorithms."
    }

    ichthyology_fellowship = {
        "title": "Postdoctoral Fellowship in Systematic Ichthyology",
        "type": "fellowship",
        "category": "general",
        "skills": ["Research", "Leadership"],
        "description": "Biological taxonomy, fish anatomy, and marine organism conservation."
    }

    score_tech = RecommendationEngine._score_opportunity(
        opp=tech_fellowship,
        profile=student_cs,
        student_skills=student_skills,
        student_roles=["Full-Stack Developer"],
        watchlist=set(),
        eligibility={"status": "eligible", "is_eligible": True}
    )

    score_ich = RecommendationEngine._score_opportunity(
        opp=ichthyology_fellowship,
        profile=student_cs,
        student_skills=student_skills,
        student_roles=["Full-Stack Developer"],
        watchlist=set(),
        eligibility={"status": "eligible", "is_eligible": True}
    )

    # Tech fellowship aligns with CS student (Factor 1 skill_relevance should be high ~96)
    assert score_tech["breakdown"]["skill_relevance"] > score_ich["breakdown"]["skill_relevance"]
    assert score_tech["total_score"] > score_ich["total_score"]
    assert any("aligns with your field" in h.lower() or "ai" in h.lower() for h in score_tech["highlights"])

def test_open_discipline_fellowship_accessible_to_all():
    """General scholarships open to all disciplines score solidly for any student."""
    student_mech = {
        "education": {
            "branch": "Mechanical Engineering",
            "degree": "B.Tech",
            "cgpa": 8.0
        }
    }
    general_grant = {
        "title": "Global Higher Education Leadership Scholarship",
        "type": "scholarship",
        "education_requirements": {
            "branches": ["Open to all academic disciplines"]
        },
        "description": "Undergraduate merit grant for university students of any discipline."
    }
    score_data = RecommendationEngine._score_opportunity(
        opp=general_grant,
        profile=student_mech,
        student_skills=set(),
        student_roles=[],
        watchlist=set(),
        eligibility={"status": "eligible", "is_eligible": True}
    )
    assert score_data["breakdown"]["skill_relevance"] >= 75
    assert any("open to students across all" in h.lower() for h in score_data["highlights"])

# =====================================================================
# 4. Connector Resilience & Circuit Breaker Isolation Tests
# =====================================================================
def test_ats_connector_child_404_does_not_trip_circuit_breaker():
    """An individual company returning 404 does not trip the connector-level circuit breaker."""
    from app.scrapers.base import OpportunitySource
    from app.scrapers.ats_connector import ATSJobBoardConnector

    connector = ATSJobBoardConnector(limit_per_company=1)
    initial_breaker = connector._circuit_broken_until

    # Simulating a company 404 with record_failure=False
    try:
        connector._fetch_url("https://boards-api.greenhouse.io/v1/boards/non_existent_company_99999/jobs", timeout=2, record_failure=False)
    except Exception:
        pass

    assert connector._consecutive_failures == 0
    assert connector._circuit_broken_until == initial_breaker
    assert connector.is_enabled is True

# =====================================================================
# 5. Security & User Ownership Tests
# =====================================================================
def test_user_cannot_access_or_modify_other_user_application(client):
    """Students cannot fetch or update applications belonging to another user."""
    import uuid
    email_a = f"usera_{uuid.uuid4().hex[:6]}@example.com"
    email_b = f"userb_{uuid.uuid4().hex[:6]}@example.com"
    user_a = UserModel.create_user(name="User A", email=email_a, password="SecretPass123!")
    user_b = UserModel.create_user(name="User B", email=email_b, password="SecretPass123!")
    token_a = generate_token(str(user_a["_id"]), email_a)
    token_b = generate_token(str(user_b["_id"]), email_b)

    # User A creates an application
    app_doc = ApplicationModel.create_application(str(user_a["_id"]), {
        "company": "SecureTech",
        "role": "Security Engineer",
        "status": "applied"
    })
    app_id = str(app_doc.get("id") or app_doc.get("_id"))

    # User B attempts to access User A's application -> 404 Not Found
    res_b_get = client.get(
        f"/api/applications/{app_id}",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert res_b_get.status_code == 404

    # User B attempts to update stage of User A's application -> 404 Not Found
    res_b_patch = client.patch(
        f"/api/applications/{app_id}/stage",
        headers={"Authorization": f"Bearer {token_b}"},
        json={"status": "interview"}
    )
    assert res_b_patch.status_code == 404

    # User A can successfully access their own application
    res_a_get = client.get(
        f"/api/applications/{app_id}",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert res_a_get.status_code == 200
    assert res_a_get.get_json()["data"]["company"] == "SecureTech"

def test_protected_source_health_endpoint(client):
    """The /api/sources/health endpoint requires authentication and returns telemetry."""
    # Unauthenticated request -> 401
    res_unauth = client.get("/api/sources/health")
    assert res_unauth.status_code == 401

    # Authenticated request -> 200 with operational metrics
    import uuid
    diag_email = f"diag_{uuid.uuid4().hex[:6]}@example.com"
    user = UserModel.create_user(name="Diag User", email=diag_email, password="SecretPass123!")
    token = generate_token(str(user["_id"]), diag_email)

    res_auth = client.get("/api/sources/health", headers={"Authorization": f"Bearer {token}"})
    assert res_auth.status_code == 200
    json_data = res_auth.get_json()
    assert json_data["success"] is True
    data = json_data["data"]
    assert "system_status" in data
    assert "connectors" in data
    assert "database_freshness" in data
