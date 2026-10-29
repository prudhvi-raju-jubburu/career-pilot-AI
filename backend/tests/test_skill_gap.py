import pytest
from app import create_app
from app.config.config import Config
from app.utils.skill_normalizer import normalize_skill, normalize_skill_list, skills_match
from app.services.skill_gap_service import SkillGapService
from app.services.resource_catalog import get_resources_by_skill, get_all_resources

class TestConfig(Config):
    TESTING = True
    MONGODB_DB_NAME = "careerpilot_test_db"
    JWT_SECRET_KEY = "test-secret-key-123"

@pytest.fixture
def app():
    app = create_app(TestConfig)
    return app

@pytest.fixture
def client(app):
    return app.test_client()

def test_skill_normalizer():
    """Verifies that alias resolution maps to canonical naming."""
    assert normalize_skill("js") == "JavaScript"
    assert normalize_skill("ReactJS") == "React"
    assert normalize_skill("Node") == "Node.js"
    assert normalize_skill("mongo db") == "MongoDB"
    assert normalize_skill("cpp") == "C++"
    assert normalize_skill("dsa") == "Data Structures & Algorithms"
    assert normalize_skill("docker containers") == "Docker"
    assert skills_match("React", "react.js") is True
    assert skills_match("Python", "py") is True

def test_resource_catalog():
    """Verifies verified resources contain real, non-empty URLs and valid metadata."""
    all_res = get_all_resources()
    assert len(all_res) > 10
    
    docker_res = get_resources_by_skill("Docker")
    assert len(docker_res) >= 2
    assert any("docs.docker.com" in r["url"] for r in docker_res)
    for r in docker_res:
        assert r["title"]
        assert r["provider"]
        assert r["url"].startswith("http")
        assert r["difficulty"]
        assert r["estimatedHours"] > 0

def test_skill_gap_calculation_software_engineer():
    """
    Tests skill gap calculation with the user prompt's example profile:
    Current: Python, C++, SQL, React, Flask, MongoDB
    Target: Software Engineer
    """
    student_skills = ["Python", "C++", "SQL", "React", "Flask", "MongoDB"]
    target_role = "Software Engineer"

    result = SkillGapService.analyze(student_skills=student_skills, target_role=target_role)

    assert result["targetRole"] == "Software Engineer"
    assert result["readinessScore"] > 0
    assert result["readinessScore"] <= 100

    matched_names = [s["name"] for s in result["matchedSkills"]]
    missing_names = [s["name"] for s in result["missingSkills"] + result["partialSkills"]]

    # Matched should contain Python, C++, SQL
    assert "Python" in matched_names
    assert "C++" in matched_names
    assert "SQL" in matched_names

    # Missing should contain Docker and System Design
    assert any("Docker" in name for name in missing_names)
    assert any("System Design" in name for name in missing_names)

    # Roadmap sequencing
    roadmap = result["roadmap"]
    assert "now" in roadmap
    assert "next" in roadmap
    assert "afterThat" in roadmap
    assert "capstoneProject" in roadmap
    assert len(roadmap["now"]) > 0

    # Future skills verification
    future_skills = result["futureSkills"]
    assert len(future_skills) > 0
    assert all(fs["badge"] == "Recommended Future Skill" for fs in future_skills)

def test_public_skill_gap_endpoints(client):
    """Verifies public roles and resources endpoints return 200 OK."""
    # Test /api/skill-gap/roles
    res = client.get("/api/skill-gap/roles")
    assert res.status_code == 200
    json_data = res.get_json()
    assert json_data["success"] is True
    assert len(json_data["data"]) >= 8

    # Test /api/skill-gap/resources
    res_cat = client.get("/api/skill-gap/resources")
    assert res_cat.status_code == 200
    json_cat = res_cat.get_json()
    assert json_cat["success"] is True
    assert json_cat["count"] > 10

    # Test /api/skill-gap/resources/Docker
    res_dock = client.get("/api/skill-gap/resources/Docker")
    assert res_dock.status_code == 200
    json_dock = res_dock.get_json()
    assert json_dock["success"] is True
    assert json_dock["count"] >= 2

def test_skill_gap_coverage_and_analytics():
    """Verifies strict calculation of target-role skill coverage and category breakdown."""
    student_skills = ["Python", "SQL", "Git"]
    target_role = "Software Engineer"

    result = SkillGapService.analyze(student_skills=student_skills, target_role=target_role)

    # 1. Target-Role Skill Coverage policy verification
    total_req = result["stats"]["totalRequired"]
    matched_req = result["stats"]["matchedCount"]
    expected_cov = round((matched_req / total_req) * 100)
    assert result["skillCoverage"] == expected_cov
    assert "matched required skills divided by total distinct skills" in result["coveragePolicy"]

    # 2. Category Breakdown for bar charts
    breakdown = result["categoryBreakdown"]
    assert len(breakdown) >= 4
    for cat in breakdown:
        assert cat["category"] in [
            "Programming Languages", "Databases", "Frameworks & Development",
            "Computer Science Fundamentals", "Cloud & DevOps", "Data Science & AI",
            "Testing & Software Engineering"
        ]
        assert cat["targetCount"] >= 0
        assert cat["studentCount"] >= 0
        assert 0 <= cat["coveragePct"] <= 100

    # 3. Structured Roadmap with 4 sequential phases
    roadmap_phases = result["structuredRoadmap"]
    assert len(roadmap_phases) == 4
    phase_names = [p["phase"] for p in roadmap_phases]
    assert any("Prerequisites" in p for p in phase_names)
    assert any("Core Target" in p for p in phase_names)
    assert any("Practical Implementation" in p for p in phase_names)
    assert any("Capstone" in p for p in phase_names)

def test_skill_inventory_provenance():
    """Verifies skill evidence classification: demonstrated vs listed vs needs_verification."""
    user_profile = {
        "projects": [
            {
                "name": "Microservices Job Board",
                "technologies": ["Python", "Docker", "FastAPI"]
            }
        ],
        "experience": [
            {
                "organization": "Acme Tech",
                "role": "Frontend Intern",
                "skills": ["React"]
            }
        ],
        "field_sources": {
            "skills.programming_languages": "resume"
        },
        "resume": {
            "fileName": "my_resume.pdf"
        }
    }
    student_skills = ["Python", "Docker", "FastAPI", "React", "C++", "AWS"]

    result = SkillGapService.analyze(
        student_skills=student_skills,
        target_role="Software Engineer",
        user_profile=user_profile
    )

    inventory = {item["name"]: item for item in result["skillsInventory"]}

    # Python & Docker should be 'demonstrated' via Project
    assert inventory["Python"]["evidenceType"] == "demonstrated"
    assert "Microservices Job Board" in inventory["Python"]["context"]

    # React should be 'demonstrated' via Experience
    assert inventory["React"]["evidenceType"] == "demonstrated"
    assert "Acme Tech" in inventory["React"]["context"]

    # C++ was in resume and should be 'listed'
    assert inventory["C++"]["evidenceType"] == "listed"

def test_opportunity_skill_blending():
    """Verifies that selecting an active opportunity blends its required skills into the analysis."""
    student_skills = ["Python"]
    target_opportunity = {
        "title": "Backend Engineering Intern",
        "requiredSkills": ["Python", "Kafka", "GraphQL"]
    }

    result = SkillGapService.analyze(
        student_skills=student_skills,
        target_role="Software Engineer",
        target_opportunity=target_opportunity
    )

    assert result["targetOpportunity"] == "Backend Engineering Intern"
    all_names = [s["name"] for s in result["matchedSkills"] + result["missingSkills"] + result["partialSkills"]]
    assert "Kafka" in all_names
    assert "GraphQL" in all_names

def test_empty_profile_and_missing_role():
    """Verifies graceful handling of empty profile skills or custom unknown roles."""
    # Empty skills
    result_empty = SkillGapService.analyze(student_skills=[], target_role="Software Engineer")
    assert result_empty["skillCoverage"] == 0
    assert result_empty["stats"]["matchedCount"] == 0
    assert len(result_empty["missingSkills"]) > 0

    # Custom role fallback
    result_custom = SkillGapService.analyze(student_skills=["Python"], target_role="Cloud Security Architect")
    assert result_custom["targetRole"] == "Cloud Security Architect"
    assert len(result_custom["matchedSkills"]) + len(result_custom["missingSkills"]) > 0

