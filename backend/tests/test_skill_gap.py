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
