import pytest
from app import create_app
from app.services.eligibility_engine import EligibilityEngine
from app.services.recommendation_engine import RecommendationEngine
from app.services.opportunity_service import OpportunityService

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

# =====================================================================
# 1. Open-to-All Branches and Degrees Eligibility Tests
# =====================================================================
def test_open_to_all_branches_passes_all_students():
    student_profile = {
        "education": {
            "degree": "B.Tech",
            "branch": "Information Technology",
            "graduation_year": 2025,
            "cgpa": 8.0
        }
    }
    
    # Opportunity with 'Any' branch (e.g. Smart India Hackathon / MLH Fellowship)
    opp_any = {
        "type": "hackathon",
        "title": "Smart India Hackathon",
        "education_requirements": {
            "branches": ["Any Technical Branch"]
        }
    }
    res = EligibilityEngine.evaluate(opp_any, student_profile)
    assert res["status"] == "eligible"
    assert res["is_eligible"] is True
    assert "Eligible Branch" in res["passed_requirements"]

    # Opportunity with 'Any' in degrees
    opp_any_degree = {
        "type": "job",
        "title": "Associate Analyst",
        "education_requirements": {
            "degrees": ["Any Degree", "B.Tech", "BCA"],
            "branches": ["All Branches"]
        }
    }
    res_deg = EligibilityEngine.evaluate(opp_any_degree, student_profile)
    assert res_deg["status"] == "eligible"
    assert "Degree Requirement" in res_deg["passed_requirements"]
    assert "Eligible Branch" in res_deg["passed_requirements"]

# =====================================================================
# 2. Experience Requirements Eligibility Tests
# =====================================================================
def test_experience_requirement_evaluation():
    student_fresher = {
        "education": {"degree": "B.Tech", "branch": "CSE"},
        "experience": [] # 0 experience
    }
    
    student_experienced = {
        "education": {"degree": "B.Tech", "branch": "CSE"},
        "total_experience_years": 3.0,
        "experience": [{"role": "Junior SDE", "description": "Backend dev"}]
    }

    senior_job = {
        "type": "job",
        "title": "Senior Backend Engineer",
        "experience": {
            "min_years": 2.0
        }
    }

    # Fresher must fail experience requirement
    res_fresher = EligibilityEngine.evaluate(senior_job, student_fresher)
    assert res_fresher["status"] == "not_eligible"
    assert "Required Experience" in res_fresher["failed_requirements"]

    # Experienced student must pass experience requirement
    res_exp = EligibilityEngine.evaluate(senior_job, student_experienced)
    assert res_exp["status"] == "eligible"
    assert "Required Experience" in res_exp["passed_requirements"]

    # Student with omitted experience info must return needs_review
    student_missing_exp = {
        "education": {"degree": "B.Tech", "branch": "CSE"}
    }
    res_missing = EligibilityEngine.evaluate(senior_job, student_missing_exp)
    assert res_missing["status"] == "needs_review"
    assert "Required Experience" in res_missing["unknown_requirements"]

# =====================================================================
# 3. Top-Level Field Fallback Tests
# =====================================================================
def test_top_level_eligibility_fallbacks():
    # Opportunity where min_cgpa and branches are placed at top level
    opp_top_level = {
        "type": "job",
        "title": "SDE 1",
        "min_cgpa": 7.5,
        "eligible_branches": ["Computer Science", "Information Technology"],
        "graduation_years": [2025, 2026]
    }

    student_passing = {
        "cgpa": 8.5,
        "branch": "Computer Science",
        "graduation_year": 2025
    }
    res = EligibilityEngine.evaluate(opp_top_level, student_passing)
    assert res["status"] == "eligible"
    assert "Minimum CGPA" in res["passed_requirements"]
    assert "Eligible Branch" in res["passed_requirements"]
    assert "Graduation Batch" in res["passed_requirements"]

    student_failing = {
        "cgpa": 6.5, # Below 7.5
        "branch": "Computer Science",
        "graduation_year": 2025
    }
    res_fail = EligibilityEngine.evaluate(opp_top_level, student_failing)
    assert res_fail["status"] == "not_eligible"
    assert "Minimum CGPA" in res_fail["failed_requirements"]

# =====================================================================
# 4. Skill Alias Normalization and Word-Boundary Matching
# =====================================================================
def test_skill_alias_matching_in_recommendations():
    student_profile = {
        "skills": {
            "programming_languages": ["Python", "JavaScript", "Go"],
            "frameworks": ["React", "Node.js"]
        },
        "target_role": "Full-Stack Developer"
    }

    student_skills = RecommendationEngine._extract_student_skills(student_profile)
    # Check that canonical aliases were added
    assert "python" in student_skills
    assert "javascript" in student_skills
    assert "react" in student_skills
    assert "node.js" in student_skills

    # Opportunity listing skills under aliases like 'reactjs', 'golang', 'nodejs'
    opp_with_aliases = {
        "title": "Full-Stack Engineer",
        "skills": ["reactjs", "golang", "nodejs", "python3"]
    }

    score_data = RecommendationEngine._score_opportunity(
        opp=opp_with_aliases,
        profile=student_profile,
        student_skills=student_skills,
        student_roles=["Full-Stack Developer"],
        watchlist=set(),
        eligibility={"status": "eligible", "is_eligible": True}
    )

    # All 4 skills should match thanks to canonical alias normalization!
    breakdown = score_data["breakdown"]
    assert breakdown["skill_relevance"] == 100
    assert any("react" in h.lower() or "python" in h.lower() for h in score_data["highlights"])

# =====================================================================
# 5. Role Stop-Words & False Positives Prevention
# =====================================================================
def test_role_stop_words_do_not_falsely_match_unrelated_jobs():
    student_profile = {
        "target_role": "Software Engineer Intern",
        "skills": ["Python"]
    }
    student_skills = {"python"}

    # Opportunity is HR Intern - must NOT match "Software Engineer Intern" just because of "intern"
    hr_opp = {
        "title": "Human Resources Intern",
        "skills": ["Recruitment", "Communication"]
    }

    score_data = RecommendationEngine._score_opportunity(
        opp=hr_opp,
        profile=student_profile,
        student_skills=student_skills,
        student_roles=["Software Engineer Intern"],
        watchlist=set(),
        eligibility={"status": "eligible", "is_eligible": True}
    )

    # Role score must remain baseline (60), NOT boosted to 85!
    assert score_data["breakdown"]["role_preference"] <= 65
    assert not any("Direct match" in h or "focus in Software Engineer" in h for h in score_data["highlights"])

# =====================================================================
# 6. Branch Match Does Not Falsely Reward Civil/Mechanical for CS
# =====================================================================
def test_unrelated_engineering_branch_not_rewarded():
    student_mech = {
        "education": {
            "branch": "Mechanical Engineering",
            "degree": "B.Tech"
        }
    }
    student_cs = {
        "education": {
            "branch": "Computer Science & Engineering",
            "degree": "B.Tech"
        }
    }

    cs_opp = {
        "title": "Software Engineer",
        "education_requirements": {
            "branches": ["Computer Science & Engineering", "Information Technology"]
        }
    }

    score_cs = RecommendationEngine._score_opportunity(
        opp=cs_opp,
        profile=student_cs,
        student_skills=set(),
        student_roles=[],
        watchlist=set(),
        eligibility={"status": "eligible", "is_eligible": True}
    )

    score_mech = RecommendationEngine._score_opportunity(
        opp=cs_opp,
        profile=student_mech,
        student_skills=set(),
        student_roles=[],
        watchlist=set(),
        eligibility={"status": "not_eligible", "is_eligible": False}
    )

    # CS student should have higher education_fit than Mechanical student on CS listing
    assert score_cs["breakdown"]["education_fit"] > score_mech["breakdown"]["education_fit"]
