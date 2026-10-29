import pytest
import io
from pypdf import PdfReader
from docx import Document
from app import create_app
from app.models.user import UserModel
from app.models.profile import ProfileModel
from app.models.generated_resume import GeneratedResumeModel
from app.services.resume_quality_service import ResumeQualityService
from app.services.resume_builder_service import ResumeBuilderService
from app.services.resume_export_service import ResumeExportService
from app.services.resume_template_service import ResumeTemplateService

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def user_tokens(client):
    # Setup two distinct users to verify cross-user isolation
    col = UserModel.get_collection()
    user_a_email = "student_a_rb@university.edu"
    user_b_email = "student_b_rb@university.edu"
    col.delete_many({"email": {"$in": [user_a_email, user_b_email]}})

    # Create User A
    res_a = client.post("/api/auth/register", json={
        "name": "Student A",
        "email": user_a_email,
        "password": "Password123!"
    })
    token_a = res_a.get_json()["data"]["token"]
    user_a_id = res_a.get_json()["data"]["user"]["id"]

    # Create User B
    res_b = client.post("/api/auth/register", json={
        "name": "Student B",
        "email": user_b_email,
        "password": "Password123!"
    })
    token_b = res_b.get_json()["data"]["token"]
    user_b_id = res_b.get_json()["data"]["user"]["id"]

    # Populate profile for User A
    ProfileModel.update_profile(user_a_id, {
        "personal": {
            "fullName": "Student Alpha",
            "email": user_a_email,
            "phone": "+1-555-0199",
            "location": "San Francisco, CA"
        },
        "education": {
            "college": "State University",
            "degree": "B.Tech",
            "branch": "Computer Science",
            "graduationYear": 2026,
            "cgpa": 8.9
        },
        "skills": ["Python", "Flask", "React", "MongoDB", "Git"],
        "projects": [
            {
                "name": "CareerPilot AI",
                "description": "Engineered real-time career guidance portal.",
                "technologies": ["Python", "React", "MongoDB"],
                "bullets": ["Developed full-stack features and API endpoints."]
            }
        ]
    })

    return {
        "user_a": {"id": user_a_id, "email": user_a_email, "token": token_a},
        "user_b": {"id": user_b_id, "email": user_b_email, "token": token_b}
    }

def test_source_data_endpoint(client, user_tokens):
    """Verifies retrieval of student profile and resume source data."""
    token = user_tokens["user_a"]["token"]
    res = client.get("/api/resume-builder/source-data", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    body = res.get_json()
    assert body["success"] is True
    full_name_val = body["data"]["profile"]["personal"]["fullName"]
    if isinstance(full_name_val, dict):
        full_name_val = full_name_val.get("value")
    assert full_name_val == "Student Alpha"
    assert "saved_versions_count" in body["data"]

def test_merge_resume_and_profile_safe_provenance():
    """Verifies that manual profile values are preserved and conflicts detected."""
    profile_data = {
        "personal": {"fullName": "Verified Student", "email": "student@uni.edu", "phone": "111-222-3333"},
        "field_sources": {"personal.fullName": "manual", "personal.email": "system"},
        "education": {"college": "Verified College", "degree": "B.S."},
        "skills": ["Python", "Flask"],
        "projects": [{"name": "Web App", "description": "Existing project"}]
    }

    extracted_resume = {
        "personal": {"fullName": "Extracted Different Name", "phone": "999-888-7777", "location": "New York"},
        "education": {"college": "Extracted College"},
        "skills": ["React", "TypeScript", "Python"],
        "projects": [{"name": "Web App", "description": "Duplicate project name"}, {"name": "ML Model", "description": "New project"}]
    }

    merged = ResumeBuilderService.merge_profile_and_resume(profile_data, extracted_resume)

    # 1. Manual name is preserved
    assert merged["personal"]["fullName"] == "Verified Student"
    assert merged["field_provenance"]["personal.fullName"] == "manual"
    # 2. Location from resume is incorporated
    assert merged["personal"]["location"] == "New York"
    assert merged["field_provenance"]["personal.location"] == "resume"
    # 3. Duplicate project was detected and not duplicated
    assert len(merged["projects"]) == 2
    # 4. Conflict on name was recorded
    assert any(c["field"] == "personal.fullName" for c in merged["conflicts"])
    # 5. Skills normalized and combined
    assert "React" in merged["skills"]
    assert "Python" in merged["skills"]

def test_deterministic_quality_score_calculation():
    """Verifies transparent 100-pt ATS Readiness scoring engine."""
    resume_data = {
        "personal": {
            "fullName": "Jane Tech",
            "email": "jane.tech@university.edu",
            "phone": "+1-555-012-3456",
            "location": "Boston, MA",
            "github": "https://github.com/janetech",
            "linkedin": "https://linkedin.com/in/janetech"
        },
        "summary": "Proactive Software Engineer with solid foundational experience developing scalable full-stack applications using Python, React, and PostgreSQL.",
        "education": [
            {"degree": "B.Tech in Computer Science", "institution": "Tech Institute", "year": "2025", "gpa": "9.0 CGPA"}
        ],
        "skills": ["Python", "React", "PostgreSQL", "Flask", "Docker", "Git", "REST APIs", "SQL", "Linux", "Node.js"],
        "projects": [
            {
                "name": "Cloud Observability Platform",
                "technologies": ["Python", "Docker", "REST APIs"],
                "bullets": [
                    "Architected monitoring microservice consuming streaming metric payloads.",
                    "Implemented RESTful endpoints and integrated automated container testing."
                ]
            },
            {
                "name": "E-Commerce Frontend",
                "technologies": ["React", "TypeScript"],
                "bullets": [
                    "Engineered responsive catalog UI and optimized client-side state caching."
                ]
            }
        ],
        "experience": [
            {
                "role": "Software Engineering Intern",
                "company": "NextGen Systems",
                "duration": "May 2024 - Aug 2024",
                "bullets": [
                    "Developed backend database queries and refactored authentication middleware."
                ]
            }
        ]
    }

    eval_result = ResumeQualityService.evaluate(
        resume_data=resume_data,
        target_role="Software Engineer",
        target_job_description="Looking for Software Engineer with Python, React, PostgreSQL, Docker, AWS, and GraphQL."
    )

    assert eval_result["score"] >= 80
    assert "category_scores" in eval_result
    assert set(eval_result["category_scores"].keys()) == {"structure", "contact", "relevance", "keywords", "descriptions"}
    assert eval_result["category_scores"]["contact"]["score"] == 15.0

    # Keyword coverage check
    kw = eval_result["keyword_analysis"]
    assert "Python" in kw["present"]
    assert "Docker" in kw["present"]
    assert "AWS" in kw["related"]
    assert "GraphQL" in kw["missing_or_unconfirmed"]
    assert "disclaimer" in kw

def test_grounded_ai_improvements_zero_fabrication():
    """Verifies that suggestions improve verbs without fabricating metrics."""
    data = {
        "projects": [
            {
                "name": "Todo Web App",
                "technologies": ["React", "Flask"],
                "bullets": ["made a web application using React and Flask"]
            }
        ]
    }

    improvements = ResumeBuilderService.generate_ai_improvements(data, target_role="Full Stack Developer")
    assert len(improvements) >= 1
    sugg = improvements[0]
    assert sugg["original_text"] == "made a web application using React and Flask"
    # Ensure active verb is used
    assert sugg["suggested_text"].startswith("Developed") or sugg["suggested_text"].startswith("Implemented")
    # Verify no fake metric was added (e.g. no 'improved by 35%')
    assert "35%" not in sugg["suggested_text"]
    assert "40%" not in sugg["suggested_text"]

def test_template_catalog_endpoint(client):
    """Verifies template library API."""
    res = client.get("/api/resume-builder/templates")
    assert res.status_code == 200
    templates = res.get_json()["data"]
    assert len(templates) >= 6
    template_ids = [t["id"] for t in templates]
    assert "ats_classic" in template_ids
    assert "modern_professional" in template_ids
    assert "software_engineer" in template_ids
    assert "ai_ml_data" in template_ids
    assert "student_fresher" in template_ids
    assert "internship_focus" in template_ids

def test_version_crud_and_cross_user_isolation(client, user_tokens):
    """Verifies version creation, retrieval, duplicate, update, deletion, and strict user isolation."""
    token_a = user_tokens["user_a"]["token"]
    token_b = user_tokens["user_b"]["token"]

    # 1. User A creates version
    res_create = client.post("/api/resume-builder/versions", headers={"Authorization": f"Bearer {token_a}"}, json={
        "title": "Backend Python Resume",
        "target_role": "Python Developer",
        "template_id": "ats_classic",
        "resume_data": {
            "personal": {"fullName": "Student Alpha"},
            "skills": ["Python", "Flask"]
        }
    })
    assert res_create.status_code == 201
    version_a = res_create.get_json()["data"]
    version_a_id = version_a["id"]

    # 2. User A can retrieve version
    res_get_a = client.get(f"/api/resume-builder/versions/{version_a_id}", headers={"Authorization": f"Bearer {token_a}"})
    assert res_get_a.status_code == 200
    assert res_get_a.get_json()["data"]["title"] == "Backend Python Resume"

    # 3. User B CANNOT retrieve User A's version (404 / Unauthorized isolation)
    res_get_b = client.get(f"/api/resume-builder/versions/{version_a_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert res_get_b.status_code == 404

    # 4. User B CANNOT update User A's version
    res_put_b = client.put(f"/api/resume-builder/versions/{version_a_id}", headers={"Authorization": f"Bearer {token_b}"}, json={
        "title": "Hacked Title"
    })
    assert res_put_b.status_code == 404

    # 5. User B CANNOT delete User A's version
    res_del_b = client.delete(f"/api/resume-builder/versions/{version_a_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert res_del_b.status_code == 404

    # 6. User A updates version
    res_update = client.put(f"/api/resume-builder/versions/{version_a_id}", headers={"Authorization": f"Bearer {token_a}"}, json={
        "title": "Senior Python Developer Resume"
    })
    assert res_update.status_code == 200
    assert res_update.get_json()["data"]["title"] == "Senior Python Developer Resume"

    # 7. User A duplicates version
    res_dup = client.post(f"/api/resume-builder/versions/{version_a_id}/duplicate", headers={"Authorization": f"Bearer {token_a}"}, json={
        "title": "Copied Python Resume"
    })
    assert res_dup.status_code == 201
    dup_id = res_dup.get_json()["data"]["id"]
    assert dup_id != version_a_id
    assert res_dup.get_json()["data"]["title"] == "Copied Python Resume"

    # 8. User A lists versions (should see 2 versions)
    res_list = client.get("/api/resume-builder/versions", headers={"Authorization": f"Bearer {token_a}"})
    assert res_list.status_code == 200
    assert len(res_list.get_json()["data"]) >= 2

    # 9. User A deletes original version
    res_del_a = client.delete(f"/api/resume-builder/versions/{version_a_id}", headers={"Authorization": f"Bearer {token_a}"})
    assert res_del_a.status_code == 200

    # 10. Confirm deleted
    res_confirm = client.get(f"/api/resume-builder/versions/{version_a_id}", headers={"Authorization": f"Bearer {token_a}"})
    assert res_confirm.status_code == 404

def test_pdf_and_docx_export_endpoints(client, user_tokens):
    """Verifies that the /export endpoint streams authentic valid PDF and DOCX files."""
    token = user_tokens["user_a"]["token"]
    payload = {
        "resume_data": {
            "personal": {
                "fullName": "Student Alpha",
                "email": "alpha@university.edu",
                "phone": "+1-555-0199"
            },
            "summary": "Full Stack developer experienced in React and Flask.",
            "skills": ["Python", "Flask", "React"],
            "projects": [
                {
                    "name": "Career Platform",
                    "technologies": ["Python", "Flask"],
                    "bullets": ["Developed backend API endpoints."]
                }
            ]
        },
        "template_id": "ats_classic",
        "format": "pdf"
    }

    # PDF Export
    res_pdf = client.post("/api/resume-builder/export", headers={"Authorization": f"Bearer {token}"}, json=payload)
    assert res_pdf.status_code == 200
    assert res_pdf.content_type == "application/pdf"
    assert len(res_pdf.data) > 500
    # Check that PDF text is selectable
    reader = PdfReader(io.BytesIO(res_pdf.data))
    extracted_text = reader.pages[0].extract_text()
    assert "Student Alpha" in extracted_text
    assert "Career Platform" in extracted_text

    # DOCX Export
    payload["format"] = "docx"
    res_docx = client.post("/api/resume-builder/export", headers={"Authorization": f"Bearer {token}"}, json=payload)
    assert res_docx.status_code == 200
    assert "wordprocessingml" in res_docx.content_type
    assert len(res_docx.data) > 1000
    # Check docx structure
    doc = Document(io.BytesIO(res_docx.data))
    all_p_text = " ".join([p.text for p in doc.paragraphs])
    assert "Student Alpha" in all_p_text
    assert "Career Platform" in all_p_text
