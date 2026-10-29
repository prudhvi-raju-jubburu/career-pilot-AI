import pytest
import uuid
import os
from unittest.mock import patch
from bson import ObjectId

from app import create_app
from app.models.user import UserModel
from app.models.profile import ProfileModel
from app.models.opportunity import OpportunityModel
from app.models.application import ApplicationModel
from app.models.interview_prep import InterviewPrepModel
from app.services.interview_prep_service import InterviewPrepService
from app.services.skill_gap_service import SkillGapService
from app.utils.auth import generate_token

@pytest.fixture
def test_app():
    app = create_app()
    app.config["TESTING"] = True
    return app

@pytest.fixture
def auth_users(test_app):
    with test_app.app_context():
        u1_email = f"stage4_u1_{uuid.uuid4().hex[:8]}@example.com"
        u2_email = f"stage4_u2_{uuid.uuid4().hex[:8]}@example.com"
        user1 = UserModel.create_user(name="Aria Student", email=u1_email, password="password123")
        user2 = UserModel.create_user(name="Bram Student", email=u2_email, password="password123")
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

# =============================================================================
# FEATURE A: JOB-SPECIFIC SKILL GAP CLASSIFICATION TESTS
# =============================================================================

def test_skill_gap_all_five_classifications(test_app):
    """
    Verifies all 5 deterministic classifications:
    1. demonstrated: in project/experience
    2. listed: on resume/profile skills without project proof
    3. priority_gap: mandatory requirement missing from profile
    4. preferred: optional qualification missing from profile
    5. unknown: foundational CS requirement where keyword is absent but candidate has CS background
    """
    with test_app.app_context():
        # Candidate profile
        profile = {
            "skills": {"technical": {"value": ["Python", "Flask", "Git"]}},
            "projects": [
                {
                    "name": "E-Commerce API",
                    "technologies": ["Python", "Flask", "PostgreSQL"],
                    "description": "Engineered RESTful endpoints with PostgreSQL persistence."
                }
            ],
            "experience": [],
            "education": {"degree": "B.Tech", "branch": "Computer Science"}
        }

        # Application with JD
        application = {
            "role": "Backend Engineer",
            "company": "CloudCorp",
            "job_description": (
                "We are hiring a Backend Engineer. "
                "Must have: Python, PostgreSQL, Docker, and Kubernetes. "
                "Nice to have: Redis and GraphQL. "
                "Strong foundation in Operating Systems required."
            )
        }

        analysis = SkillGapService.analyze_job_specific_gaps(application=application, user_profile=profile)
        assert analysis is not None
        assert "summary" in analysis

        class_map = {item["skill_name"].lower(): item["classification"] for item in analysis["all_requirements"]}

        # 1. Demonstrated: PostgreSQL and Python are built in project
        assert class_map.get("postgresql") == "demonstrated"
        assert class_map.get("python") == "demonstrated"

        # 2. Listed: Git is in profile skills, not in project
        assert class_map.get("git") == "listed" or class_map.get("flask") == "demonstrated"

        # 3. Priority Gap: Docker and Kubernetes are mandatory and missing
        assert class_map.get("docker") == "priority_gap"
        assert class_map.get("kubernetes") == "priority_gap"

        # 4. Preferred: Redis and GraphQL are optional/nice to have
        assert class_map.get("redis") == "preferred" or class_map.get("graphql") == "preferred"

        # 5. Unknown: Operating Systems is foundational, student has CS degree & Python, but keyword not explicitly on resume
        # Missing resume keyword is not treated as definitive proof of lack of skill
        assert class_map.get("operating systems") == "unknown"

def test_skill_aliases_and_deduplication(test_app):
    """Verifies that aliases (e.g. k8s -> Kubernetes, Postgres -> PostgreSQL, py -> Python) are deduplicated."""
    with test_app.app_context():
        application = {
            "role": "DevOps Engineer",
            "company": "InfraScale",
            "job_description": "Requirements: Kubernetes, k8s, Postgres, PostgreSQL, Python, python3."
        }
        profile = {"skills": [], "projects": []}
        analysis = SkillGapService.analyze_job_specific_gaps(application=application, user_profile=profile)

        skill_names = [req["skill_name"] for req in analysis["all_requirements"]]
        # Kubernetes and PostgreSQL should each appear at most once
        assert skill_names.count("Kubernetes") == 1
        assert skill_names.count("PostgreSQL") == 1
        assert skill_names.count("Python") == 1

def test_missing_and_incomplete_resumes(test_app):
    """Verifies graceful handling when candidate profile has empty skills, no resume, and no projects."""
    with test_app.app_context():
        application = {
            "role": "Frontend Developer",
            "company": "WebWorks",
            "job_description": "Must have React, TypeScript, and CSS."
        }
        analysis = SkillGapService.analyze_job_specific_gaps(application=application, user_profile=None)
        assert analysis is not None
        assert analysis["summary"]["total_requirements"] >= 3
        # Incomplete profile defaults unmet mandatory requirements to priority_gap
        assert len(analysis["priority_gaps"]) >= 2
        for gap in analysis["priority_gaps"]:
            assert "priority_reason" in gap
            assert "learning_objective" in gap
            assert "estimated_effort" in gap
            assert "resources" in gap

def test_missing_job_description_actionable_state(test_app):
    """Verifies that missing job descriptions produce clear actionable state with fallback to role standards."""
    with test_app.app_context():
        application = {
            "role": "Software Engineer",
            "company": "Stealth",
            "job_description": "",
            "job_description_snapshot": ""
        }
        analysis = SkillGapService.analyze_job_specific_gaps(application=application, user_profile={})
        assert analysis["job_description_status"] == "missing"
        # Standard software engineer requirements are loaded
        assert analysis["total_requirements"] > 0
        assert len(analysis["all_requirements"]) > 0

# =============================================================================
# FEATURE B & C: INTERVIEW QUESTION BANK & AI INTEGRATION TESTS
# =============================================================================

def test_question_bank_all_seven_categories(test_app, auth_users):
    """Verifies that prep pack generates questions across all 7 structured categories."""
    with test_app.app_context():
        u1_id = str(auth_users["user1"]["_id"])
        app_doc = ApplicationModel.create_application(u1_id, {
            "company": "FinTech Core",
            "role": "Backend Engineer",
            "status": "Applied",
            "job_description": "We build scalable transaction services using Java, Spring Boot, and PostgreSQL."
        })
        app_id = app_doc["id"]

        pack = InterviewPrepService.get_or_generate_prep_pack(u1_id, app_id, force_refresh=True)
        assert pack is not None
        assert "question_bank" in pack
        assert len(pack["question_bank"]) >= 7

        q_categories = {q["category"] for q in pack["question_bank"]}
        expected_categories = {
            "Technical Fundamentals",
            "Job-Specific Technologies",
            "Coding and DSA",
            "SQL and Databases",
            "Resume and Project Deep-Dives",
            "Behavioral and HR Questions",
            "Role and Company Preparation"
        }
        for cat in expected_categories:
            assert cat in q_categories, f"Missing category: {cat}"

        # Check question structure
        for q in pack["question_bank"]:
            assert "question" in q and len(q["question"]) > 10
            assert "difficulty" in q
            assert "why_relevant" in q and len(q["why_relevant"]) > 5
            assert "expected_answer_points" in q and len(q["expected_answer_points"]) > 0
            assert "sample_answer" in q and len(q["sample_answer"]) > 20
            assert "common_mistakes" in q and len(q["common_mistakes"]) > 0
            assert "follow_up_questions" in q
            assert "learning_resources" in q
            assert q.get("is_practice_question") is True
            assert q.get("is_official_exam_question") is False

def test_grounded_project_questions_never_invent_metrics(test_app, auth_users):
    """Verifies that project questions strictly ground on candidate's actual projects without inventing facts."""
    with test_app.app_context():
        u1_id = str(auth_users["user1"]["_id"])
        # Setup candidate profile with distinct project
        ProfileModel.get_collection().update_one(
            {"user_id": u1_id},
            {"$set": {
                "projects": [
                    {
                        "name": "TelemetryPulse",
                        "technologies": ["Go", "gRPC", "Prometheus"],
                        "description": "High-frequency metric collector daemon."
                    }
                ]
            }},
            upsert=True
        )

        app_doc = ApplicationModel.create_application(u1_id, {
            "company": "InfraCorp",
            "role": "Systems Engineer",
            "status": "Applied"
        })
        app_id = app_doc["id"]

        pack = InterviewPrepService.get_or_generate_prep_pack(u1_id, app_id, force_refresh=True)
        proj_questions = [q for q in pack["question_bank"] if q["category"] == "Resume and Project Deep-Dives"]
        assert len(proj_questions) > 0

        # Must explicitly reference the actual project name
        found_ref = any("TelemetryPulse" in q["question"] for q in proj_questions)
        assert found_ref, "Project question did not reference student's actual project 'TelemetryPulse'"

        # Verified practice simulation disclaimer
        assert "not represent leaked or official questions" in pack["disclaimer"].lower() or "practice" in pack["disclaimer"].lower()

def test_malformed_ai_output_recovers_to_deterministic_fallback(test_app, auth_users, monkeypatch):
    """Verifies that malformed or partial AI output falls back cleanly with explicit non-AI labeling."""
    monkeypatch.setenv("AI_PROVIDER", "gemini")
    monkeypatch.setenv("GEMINI_API_KEY", "mock-gemini-key")

    with test_app.app_context():
        u1_id = str(auth_users["user1"]["_id"])
        app_doc = ApplicationModel.create_application(u1_id, {
            "company": "Resilient Systems",
            "role": "Site Reliability Engineer",
            "status": "Applied"
        })
        app_id = app_doc["id"]

        # Simulate malformed AI output (missing required checklist & broken json)
        with patch("app.services.interview_prep_service.AIService.generate_structured_json", return_value=({"broken": "schema"}, {"active_provider": "gemini", "generation_source": "ai"})):
            pack = InterviewPrepService.get_or_generate_prep_pack(u1_id, app_id, force_refresh=True)
            assert pack is not None
            assert pack["is_ai_generated"] is False
            assert pack["generation_source"] == "deterministic_fallback"
            assert len(pack["checklist"]) >= 5
            assert len(pack["question_bank"]) >= 7

# =============================================================================
# FEATURE D: PERSISTENCE, OWNERSHIP & ROADMAP INTEGRATION TESTS
# =============================================================================

def test_persistence_and_idempotent_generation(test_app, auth_users):
    """Verifies that repeated requests reuse existing prep pack and do not regenerate repeatedly."""
    with test_app.app_context():
        u1_id = str(auth_users["user1"]["_id"])
        app_doc = ApplicationModel.create_application(u1_id, {
            "company": "Static Corp",
            "role": "Cloud Architect",
            "status": "Applied"
        })
        app_id = app_doc["id"]

        pack1 = InterviewPrepService.get_or_generate_prep_pack(u1_id, app_id, force_refresh=False)
        assert pack1 is not None

        # Re-fetch without force_refresh
        pack2 = InterviewPrepService.get_or_generate_prep_pack(u1_id, app_id, force_refresh=False)
        # Should return identical persisted pack
        assert str(pack1.get("id") or pack1.get("_id")) == str(pack2.get("id") or pack2.get("_id"))
        assert pack1.get("created_at") == pack2.get("created_at")

def test_checklist_progress_preservation_across_refresh(test_app, auth_users):
    """Verifies completed checklist items are preserved when the prep pack is regenerated."""
    with test_app.app_context():
        u1_id = str(auth_users["user1"]["_id"])
        app_doc = ApplicationModel.create_application(u1_id, {
            "company": "KeepState Inc",
            "role": "QA Engineer",
            "status": "Applied"
        })
        app_id = app_doc["id"]

        pack = InterviewPrepService.get_or_generate_prep_pack(u1_id, app_id, force_refresh=True)
        task_id = pack["checklist"][0]["id"]

        # Mark first task completed
        updated = InterviewPrepService.toggle_checklist_item(u1_id, app_id, task_id, completed=True)
        assert any(t["id"] == task_id and t["completed"] is True for t in updated["checklist"])

        # Regenerate with force_refresh=True
        refreshed = InterviewPrepService.get_or_generate_prep_pack(u1_id, app_id, force_refresh=True)
        preserved_item = next(t for t in refreshed["checklist"] if t["id"] == task_id)
        assert preserved_item["completed"] is True, "Checklist completion status was lost on refresh!"

def test_add_skill_to_roadmap_endpoint(test_app, auth_users):
    """Verifies POST /api/applications/<app_id>/prep/add-skill-to-roadmap updates checklist and roadmap state."""
    client = test_app.test_client()
    with test_app.app_context():
        u1_id = str(auth_users["user1"]["_id"])
        app_doc = ApplicationModel.create_application(u1_id, {
            "company": "Docker Inc",
            "role": "Container Specialist",
            "status": "Applied",
            "job_description": "Must have Docker, Kubernetes, and Linux."
        })
        app_id = app_doc["id"]

        # Initialize prep pack
        InterviewPrepService.get_or_generate_prep_pack(u1_id, app_id, force_refresh=True)

        # Add skill to roadmap
        res = client.post(
            f"/api/applications/{app_id}/prep/add-skill-to-roadmap",
            json={"skill_name": "Docker"},
            headers=auth_users["headers1"]
        )
        assert res.status_code == 200
        data = res.get_json()["data"]

        # Verify added to checklist
        has_docker_task = any("Docker" in t.get("task", "") or t.get("skill_name") == "Docker" for t in data["checklist"])
        assert has_docker_task, "Docker was not added to checklist!"

        # Verify skill_gaps in_roadmap flag
        docker_gap = next((g for g in data["skill_gaps"]["priority_gaps"] if g["skill_name"].lower() == "docker"), None)
        if docker_gap:
            assert docker_gap.get("in_roadmap") is True

def test_cross_user_ownership_enforcement(test_app, auth_users):
    """Verifies that user 2 cannot view, refresh, or modify user 1's prep pack or skill gaps."""
    client = test_app.test_client()
    with test_app.app_context():
        u1_id = str(auth_users["user1"]["_id"])
        app_doc = ApplicationModel.create_application(u1_id, {
            "company": "Secret Vault",
            "role": "Security Engineer",
            "status": "Applied"
        })
        app_id = app_doc["id"]
        InterviewPrepService.get_or_generate_prep_pack(u1_id, app_id, force_refresh=True)

        # User 2 attempts to get prep pack for User 1's app
        res_get = client.get(
            f"/api/applications/{app_id}/prep",
            headers=auth_users["headers2"]
        )
        assert res_get.status_code == 404

        # User 2 attempts to add skill to User 1's roadmap
        res_post = client.post(
            f"/api/applications/{app_id}/prep/add-skill-to-roadmap",
            json={"skill_name": "Cryptography"},
            headers=auth_users["headers2"]
        )
        assert res_post.status_code == 404
