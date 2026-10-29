import json
import pytest
from datetime import datetime, timedelta, timezone
from app import create_app
from app.models.opportunity import OpportunityModel
from app.models.profile import ProfileModel
from app.models.company import CompanyModel
from app.services.eligibility_engine import EligibilityEngine
from app.services.recommendation_engine import RecommendationEngine
from app.scrapers.link_import_service import LinkImportService
from app.utils.opportunity_normalizer import (
    parse_inr_compensation,
    normalize_branches,
    parse_graduation_years,
    detect_scam_opportunity
)

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def get_auth_token(client, email="rec_test@student.edu"):
    client.post("/api/auth/register", json={
        "name": "Arjun Sharma",
        "email": email,
        "password": "Password123!"
    })
    res = client.post("/api/auth/login", json={
        "email": email,
        "password": "Password123!"
    })
    return res.get_json()["data"]["token"]

# -------------------------------------------------------------
# 1. Normalizers Unit Tests (India Context)
# -------------------------------------------------------------
def test_inr_compensation_parsing():
    # 12 LPA
    res1 = parse_inr_compensation("Offering 12 LPA CTC for freshers")
    assert res1["min_amount"] == 1200000
    assert res1["period"] == "year"
    assert res1["type"] == "salary"

    # LPA Range
    res2 = parse_inr_compensation("Salary: 8 - 14 LPA")
    assert res2["min_amount"] == 800000
    assert res2["max_amount"] == 1400000

    # Monthly stipend
    res3 = parse_inr_compensation("Stipend: ₹25,000 / month")
    assert res3["min_amount"] == 25000
    assert res3["period"] == "month"

    # 30k/mo
    res4 = parse_inr_compensation("30k/month plus perks")
    assert res4["min_amount"] == 30000

    # Unpaid
    res5 = parse_inr_compensation("Unpaid volunteer internship")
    assert res5["min_amount"] == 0
    assert res5["type"] == "unpaid"

def test_branch_and_batch_parsing():
    # Branches aliasing
    branches = normalize_branches(["CSE", "IT", "ECE"])
    assert "Computer Science & Engineering" in branches
    assert "Information Technology" in branches
    assert "Electronics & Communication" in branches

    # Batch year extraction
    years = parse_graduation_years("Open for 2025 batch and 2026 passouts")
    assert 2025 in years
    assert 2026 in years

def test_scam_opportunity_detection():
    is_scam, reason = detect_scam_opportunity(
        title="Software Intern",
        description="Candidate must pay a refundable security deposit of Rs 5000 before onboarding"
    )
    assert is_scam is True
    assert "deposit" in reason.lower()

    legit, _ = detect_scam_opportunity(
        title="Software Engineer Intern",
        description="Build scalable services with Python and AWS. Competitive stipend."
    )
    assert legit is False

# -------------------------------------------------------------
# 2. Deterministic Eligibility Engine Tests
# -------------------------------------------------------------
def test_eligibility_engine_rules():
    now = datetime.now(timezone.utc)
    future_deadline = (now + timedelta(days=20)).isoformat()
    past_deadline = (now - timedelta(days=2)).isoformat()

    student_profile = {
        "education": {
            "branch": "Computer Science & Engineering",
            "graduation_year": 2026,
            "cgpa": 8.5
        },
        "preferences": {
            "locations": ["Bengaluru"],
            "willing_to_relocate": True
        }
    }

    # Opportunity matching all criteria
    valid_opp = {
        "title": "Backend SDE Intern",
        "deadline": future_deadline,
        "education_requirements": {
            "branches": ["Computer Science & Engineering"],
            "graduation_years": [2025, 2026],
            "cgpa_min": 7.0
        },
        "location": {"city": "Bengaluru", "is_remote": False}
    }

    eval1 = EligibilityEngine.evaluate(valid_opp, student_profile)
    assert eval1["is_eligible"] is True
    assert eval1["eligibility_score"] == 100
    assert len(eval1["critical_failures"]) == 0

    # Opportunity with expired deadline (Hard rule fail)
    expired_opp = {**valid_opp, "deadline": past_deadline}
    eval2 = EligibilityEngine.evaluate(expired_opp, student_profile)
    assert eval2["is_eligible"] is False
    assert any("deadline" in f.lower() for f in eval2["critical_failures"])

    # Opportunity with CGPA cutoff > student CGPA
    high_cgpa_opp = {
        **valid_opp,
        "education_requirements": {
            "branches": ["Computer Science & Engineering"],
            "graduation_years": [2026],
            "cgpa_min": 9.0
        }
    }
    eval3 = EligibilityEngine.evaluate(high_cgpa_opp, student_profile)
    assert eval3["is_eligible"] is False
    assert any("cgpa" in f.lower() for f in eval3["critical_failures"])

# -------------------------------------------------------------
# 3. Recommendation Engine & Explainability Tests
# -------------------------------------------------------------
def test_recommendation_engine_scoring(client):
    token = get_auth_token(client, "engine_tester@student.edu")
    headers = {"Authorization": f"Bearer {token}"}

    # Setup student profile
    client.put("/api/profile", headers=headers, json={
        "skills": ["Python", "FastAPI", "MongoDB", "Docker"],
        "target_role": "Backend Engineer",
        "education": {
            "degree": "B.Tech",
            "branch": "Computer Science",
            "graduation_year": 2026,
            "cgpa": 8.8
        },
        "preferences": {
            "locations": ["Bengaluru"],
            "work_mode": "Hybrid"
        }
    })

    # Ingest a matching opportunity
    future_date = (datetime.now(timezone.utc) + timedelta(days=25)).isoformat()
    opp_res = client.post("/api/opportunities", headers=headers, json={
        "title": "Backend Software Intern",
        "organization": {"name": "FinTech Corp India", "website": "https://fintech.in"},
        "description": "Looking for Python, FastAPI, and MongoDB developer.",
        "skills": ["Python", "FastAPI", "MongoDB"],
        "type": "internship",
        "category": "software",
        "deadline": future_date,
        "education_requirements": {
            "branches": ["Computer Science & Engineering"],
            "graduation_years": [2026],
            "cgpa_min": 7.5
        },
        "location": {"city": "Bengaluru", "country": "India"},
        "application_url": "https://fintech.in/careers/sde"
    })
    assert opp_res.status_code == 201
    opp_id = opp_res.get_json()["data"]["id"]

    # Test GET /api/recommendations
    rec_res = client.get("/api/recommendations", headers=headers)
    assert rec_res.status_code == 200
    rec_data = rec_res.get_json()["data"]
    assert rec_data["counts"]["recommended"] >= 1
    top_item = rec_data["items"][0]
    assert top_item["match_score"] >= 75
    assert "score_breakdown" in top_item
    assert "why_matched" in top_item
    assert top_item["eligibility"]["is_eligible"] is True

    # Test GET /api/recommendations/<id>/explain
    exp_res = client.get(f"/api/recommendations/{opp_id}/explain", headers=headers)
    assert exp_res.status_code == 200
    exp_data = exp_res.get_json()["data"]
    assert exp_data["match_score"] >= 75
    assert "Python" in exp_data["skill_gap"]["matched_skills"]
    assert len(exp_data["eligibility"]["rules"]) >= 4

# -------------------------------------------------------------
# 4. Watchlist & Feedback Tests
# -------------------------------------------------------------
def test_company_watchlist_and_boost(client):
    token = get_auth_token(client, "watchlist_tester@student.edu")
    headers = {"Authorization": f"Bearer {token}"}

    # Add company to watchlist
    add_res = client.post("/api/companies/watchlist", headers=headers, json={"company_name": "Razorpay"})
    assert add_res.status_code == 200

    # Get watchlist
    get_res = client.get("/api/companies/watchlist", headers=headers)
    assert get_res.status_code == 200
    assert "Razorpay" in get_res.get_json()["data"]

    # Record feedback action
    feed_res = client.post("/api/feedback", headers=headers, json={
        "opportunity_id": "test_opp_123",
        "action": "click"
    })
    assert feed_res.status_code == 200

# -------------------------------------------------------------
# 5. Link Importer ("Add by link") & Debug View Tests
# -------------------------------------------------------------
def test_link_import_and_debug_endpoint(client):
    token = get_auth_token(client, "import_tester@student.edu")
    headers = {"Authorization": f"Bearer {token}"}

    # Add by link preview
    import_res = client.post("/api/opportunities/import-url", headers=headers, json={
        "url": "https://careers.google.com/jobs/results/123-software-engineer-intern-bengaluru"
    })
    assert import_res.status_code == 200
    parsed = import_res.get_json()["data"]["parsed"]
    assert parsed["application_url"] == "https://careers.google.com/jobs/results/123-software-engineer-intern-bengaluru"

    # Test Admin / Debug Endpoint (Verify 0% violations)
    debug_res = client.get("/api/recommendations/debug", headers=headers)
    assert debug_res.status_code == 200
    debug_data = debug_res.get_json()
    assert debug_data["eligibility_violations_in_recommended"] == 0
