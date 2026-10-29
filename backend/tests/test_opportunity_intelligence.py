import pytest
from datetime import datetime, timezone, timedelta
from bson import ObjectId

from app import create_app
from app.models.opportunity import OpportunityModel
from app.models.application import ApplicationModel, CANONICAL_APPLICATION_STATUSES
from app.models.profile import ProfileModel
from app.services.opportunity_service import OpportunityService
from app.services.eligibility_engine import EligibilityEngine
from app.services.recommendation_engine import RecommendationEngine

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def get_auth_token(client, email="opp_intel_user@test.edu"):
    client.post("/api/auth/register", json={
        "name": "Intelligence Tester",
        "email": email,
        "password": "Password123!"
    })
    res = client.post("/api/auth/login", json={
        "email": email,
        "password": "Password123!"
    })
    return res.get_json()["data"]["token"]

# =====================================================================
# 1. Opportunity Data Quality & Normalization Tests
# =====================================================================
def test_opportunity_schema_validation():
    # Valid payload
    valid_opp = {
        "title": "Backend SDE Intern",
        "organization": {"name": "Infosys"},
        "application_url": "https://careers.infosys.com/job/123",
        "type": "internship",
        "category": "software"
    }
    is_valid, err = OpportunityService.validate_opportunity(valid_opp)
    assert is_valid is True
    assert err is None

    # Invalid title (< 3 chars)
    invalid_opp = {**valid_opp, "title": "AB"}
    is_valid, err = OpportunityService.validate_opportunity(invalid_opp)
    assert is_valid is False
    assert "title" in err.lower()

    # Invalid URL
    invalid_url_opp = {**valid_opp, "application_url": "ftp://not-http"}
    is_valid, err = OpportunityService.validate_opportunity(invalid_url_opp)
    assert is_valid is False
    assert "url" in err.lower()

def test_missing_fields_defaults_and_explicit_semantics():
    # Test that missing compensation & deadline do not invent fake salaries or dates
    raw_opp = {
        "title": "Python Developer",
        "organization": {"name": "TCS"},
        "application_url": "https://tcs.com/apply",
        "type": "job",
        "category": "engineering"
    }
    normalized = OpportunityService.normalize_opportunity(raw_opp)
    serialized = OpportunityModel.to_dict(normalized)

    assert serialized["compensationString"] == "Not specified"
    assert serialized["deadlineString"] == "Deadline not specified"
    assert serialized["company"] == "TCS"

def test_scholarship_compensation_semantics():
    # Scholarships must not display monthly salary
    raw_schol = {
        "title": "National STEM Excellence Scholarship",
        "organization": {"name": "Govt of India"},
        "application_url": "https://scholarships.gov.in/stem",
        "type": "scholarship",
        "category": "scholarship",
        "compensation": {
            "min_amount": 50000,
            "max_amount": 50000,
            "currency": "INR"
        }
    }
    normalized = OpportunityService.normalize_opportunity(raw_schol)
    serialized = OpportunityModel.to_dict(normalized)

    assert serialized["compensationString"] == "₹50,000 award"
    assert "/mo" not in serialized["compensationString"]

def test_opportunity_deduplication(client):
    unique_id = str(ObjectId())
    opp_data = {
        "title": "Data Science Intern",
        "organization_name": "Flipkart",
        "application_url": f"https://flipkart.com/jobs/ds-intern-{unique_id}",
        "type": "internship",
        "category": "data_science",
        "skills": ["Python", "Pandas", "SQL"]
    }

    # First insert
    doc1, is_created1 = OpportunityService.upsert_opportunity(opp_data)
    assert is_created1 is True

    # Duplicate insert with identical organization, title, and application_url
    doc2, is_created2 = OpportunityService.upsert_opportunity(opp_data)
    assert is_created2 is False
    assert str(doc1["_id"]) == str(doc2["_id"])

# =====================================================================
# 2. Deterministic Eligibility Engine Tests
# =====================================================================
def test_eligibility_engine_cgpa_and_branch_checks():
    student_profile = {
        "education": {
            "degree": "B.Tech",
            "branch": "Computer Science & Engineering",
            "graduation_year": 2026,
            "cgpa": 8.5
        }
    }

    # Job requiring 7.0 CGPA and CSE
    job_opp = {
        "type": "job",
        "education_requirements": {
            "branches": ["Computer Science & Engineering", "Information Technology"],
            "graduation_years": [2025, 2026],
            "cgpa_min": 7.0
        }
    }
    res = EligibilityEngine.evaluate(job_opp, student_profile)
    assert res["status"] == "eligible"
    assert res["is_eligible"] is True
    assert "Minimum CGPA" in res["passed_requirements"]
    assert "Eligible Branch" in res["passed_requirements"]

    # Job requiring 9.0 CGPA -> Confirmed failure
    high_cutoff_opp = {
        "type": "job",
        "education_requirements": {
            "branches": ["Computer Science & Engineering"],
            "cgpa_min": 9.0
        }
    }
    res_fail = EligibilityEngine.evaluate(high_cutoff_opp, student_profile)
    assert res_fail["status"] == "not_eligible"
    assert res_fail["is_eligible"] is False
    assert "Minimum CGPA" in res_fail["failed_requirements"]

def test_eligibility_engine_unknown_requirements_and_incomplete_profile():
    # Student with missing CGPA and graduation year
    incomplete_profile = {
        "education": {
            "branch": "Mechanical Engineering"
        }
    }
    job_opp = {
        "type": "job",
        "education_requirements": {
            "branches": ["Computer Science & Engineering"],
            "graduation_years": [2026],
            "cgpa_min": 7.5
        }
    }
    res = EligibilityEngine.evaluate(job_opp, incomplete_profile)
    # Branch is wrong (Mechanical vs CSE) -> not eligible
    assert res["status"] == "not_eligible"
    assert "Eligible Branch" in res["failed_requirements"]

    # Now an opportunity where only CGPA is unknown
    open_branch_opp = {
        "type": "job",
        "education_requirements": {
            "cgpa_min": 7.0
        }
    }
    res_unknown = EligibilityEngine.evaluate(open_branch_opp, incomplete_profile)
    # CGPA is missing in profile -> status must be 'needs_review'
    assert res_unknown["status"] == "needs_review"
    assert "Minimum CGPA" in res_unknown["unknown_requirements"]

def test_category_specific_eligibility_hackathons():
    # Hackathons must NOT enforce mandatory CGPA rules unless explicitly part of the competition
    hackathon_opp = {
        "type": "hackathon",
        "title": "Smart India Hackathon 2025",
        "education_requirements": {
            "cgpa_min": 8.0  # Even if mistakenly listed, hackathons shouldn't disqualify on CGPA
        }
    }
    student_profile = {
        "education": {
            "cgpa": 6.8
        }
    }
    res = EligibilityEngine.evaluate(hackathon_opp, student_profile)
    # Must be eligible or review, never not_eligible for CGPA on hackathon
    assert res["status"] in ("eligible", "needs_review")

# =====================================================================
# 3. Personalized Relevance Ranking Tests (35/25/15/15/10 Model)
# =====================================================================
def test_ranking_weights_and_eligibility_separation():
    student_profile = {
        "skills": ["Python", "FastAPI", "MongoDB", "Docker", "AWS"],
        "target_role": "Backend Engineer",
        "education": {
            "degree": "B.Tech",
            "branch": "Computer Science & Engineering",
            "graduation_year": 2026,
            "cgpa": 7.2
        },
        "projects": [
            {
                "title": "Microservices Cloud Platform",
                "description": "Built scalable Python REST APIs with Docker and AWS"
            }
        ],
        "preferences": {
            "preferred_locations": ["Bengaluru"],
            "work_modes": ["Hybrid", "Remote"]
        }
    }

    # Opportunity 1: High relevance, but fails mandatory CGPA requirement (cutoff 8.5)
    ineligible_opp = {
        "_id": ObjectId(),
        "title": "Senior Backend Engineer Intern",
        "organization": {"name": "Apex Cloud"},
        "skills": ["Python", "FastAPI", "Docker", "AWS"],
        "work_mode": "Hybrid",
        "location": {"city": "Bengaluru", "is_remote": False},
        "education_requirements": {
            "branches": ["Computer Science & Engineering"],
            "graduation_years": [2026],
            "cgpa_min": 8.5  # Student has 7.2
        }
    }

    eligibility = EligibilityEngine.evaluate(ineligible_opp, student_profile)
    assert eligibility["status"] == "not_eligible"

    # Score should be high based on skills, role, project, and location fit
    score_data = RecommendationEngine._score_opportunity(
        opp=ineligible_opp,
        profile=student_profile,
        student_skills={"python", "fastapi", "mongodb", "docker", "aws"},
        student_roles=["Backend Engineer"],
        watchlist=set(),
        eligibility=eligibility
    )

    # Decoupling Guarantee:
    # High score (e.g. > 80%) MUST NOT override eligibility status!
    assert score_data["total_score"] >= 80
    assert eligibility["status"] == "not_eligible"
    assert eligibility["is_eligible"] is False

    # Check breakdown has the 5 factors
    breakdown = score_data["breakdown"]
    assert "skill_relevance" in breakdown
    assert "role_preference" in breakdown
    assert "project_experience" in breakdown
    assert "education_fit" in breakdown
    assert "location_workmode" in breakdown
    assert breakdown["skill_relevance"] == 100  # All 4 skills matched

# =====================================================================
# 4. Persistent Saved Opportunities Tests
# =====================================================================
def test_saved_opportunities_endpoints(client):
    token = get_auth_token(client, "saved_test_user@student.edu")
    headers = {"Authorization": f"Bearer {token}"}

    # Create test opportunity
    opp_doc, _ = OpportunityService.upsert_opportunity({
        "title": "Cloud DevOps Trainee",
        "organization_name": "Wipro",
        "application_url": "https://wipro.com/careers/cloud-trainee",
        "type": "job",
        "category": "cloud"
    })
    opp_id = str(opp_doc["_id"])

    # 1. Save opportunity
    res_save = client.post(f"/api/opportunities/{opp_id}/save", headers=headers)
    assert res_save.status_code == 200
    assert res_save.get_json()["data"]["saved"] is True

    # 2. Duplicate save check (must not create duplicate IDs in list)
    client.post(f"/api/opportunities/{opp_id}/save", headers=headers)
    res_list = client.get("/api/saved-opportunities", headers=headers)
    assert res_list.status_code == 200
    saved_items = res_list.get_json()["data"]
    saved_matching = [s for s in saved_items if (s.get("id") or s.get("_id")) == opp_id]
    assert len(saved_matching) == 1

    # 3. Unsave opportunity
    res_unsave = client.delete(f"/api/opportunities/{opp_id}/save", headers=headers)
    assert res_unsave.status_code == 200
    assert res_unsave.get_json()["data"]["saved"] is False

    res_list_after = client.get("/api/saved-opportunities", headers=headers)
    saved_after = res_list_after.get_json()["data"]
    assert not any((s.get("id") or s.get("_id")) == opp_id for s in saved_after)

# =====================================================================
# 5. Application Tracker Pipeline & Ownership Tests
# =====================================================================
def test_application_tracker_lifecycle_and_history(client):
    token1 = get_auth_token(client, "app_user_one@student.edu")
    token2 = get_auth_token(client, "app_user_two@student.edu")
    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}

    # 1. Create tracked application
    payload = {
        "company": "Amazon India",
        "role": "SDE Intern 2026",
        "type": "Internship",
        "status": "Applied",
        "location": "Hyderabad",
        "notes": "Submitted referral application",
        "followUpDate": "2026-11-01"
    }
    create_res = client.post("/api/applications", headers=headers1, json=payload)
    assert create_res.status_code == 201
    created_app = create_res.get_json()["data"]
    app_id = created_app["id"]
    assert created_app["status"] == "Applied"
    assert created_app["company"] == "Amazon India"

    # 2. Update stage through the 7 canonical statuses with audit history
    stage_res = client.patch(
        f"/api/applications/{app_id}/stage",
        headers=headers1,
        json={"status": "Interview", "note": "Technical Round 1 scheduled"}
    )
    assert stage_res.status_code == 200
    updated_app = stage_res.get_json()["data"]
    assert updated_app["status"] == "Interview"
    assert len(updated_app["status_history"]) >= 2
    assert any("Interview" in h.get("event", "") or h.get("status") == "Interview" for h in updated_app["status_history"])

    # 3. Cross-User Access Prevention: User 2 must NOT access or delete User 1's application
    res_unauth_get = client.get(f"/api/applications/{app_id}", headers=headers2)
    assert res_unauth_get.status_code == 404

    res_unauth_del = client.delete(f"/api/applications/{app_id}", headers=headers2)
    assert res_unauth_del.status_code == 404

    # 4. User 1 deletes their own application
    del_res = client.delete(f"/api/applications/{app_id}", headers=headers1)
    assert del_res.status_code == 200
    assert del_res.get_json()["success"] is True

    # Verify deletion
    verify_res = client.get(f"/api/applications/{app_id}", headers=headers1)
    assert verify_res.status_code == 404
