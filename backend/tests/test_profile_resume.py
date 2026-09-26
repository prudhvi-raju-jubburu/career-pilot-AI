import os
import io
import pytest
from pypdf import PdfWriter
from app import create_app
from app.models.user import UserModel
from app.models.profile import ProfileModel
from app.services.resume_parser import ResumeParserService
from app.ai.resume_analyzer import ResumeAnalyzerService

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def create_sample_pdf_bytes():
    """Generates a valid in-memory PDF resume for testing."""
    writer = PdfWriter()
    page = writer.add_blank_page(width=612, height=792)
    # We can write text or use simple pdf
    bio = io.BytesIO()
    writer.write(bio)
    bio.seek(0)
    return bio

def test_resume_parser_text_cleaning():
    raw = "John   Doe\n\n\nSoftware   Engineer\r\n\r\nSkills:   Python,   React"
    cleaned = ResumeParserService.clean_extracted_text(raw)
    assert "John Doe" in cleaned
    assert "Software Engineer" in cleaned
    assert "Skills: Python, React" in cleaned

def test_resume_analyzer_fallback():
    sample_text = """
    Rohan Sharma
    rohan.sharma@university.edu
    +91 9876543210
    B.Tech in Computer Science and Engineering
    Institute of Technology, Hyderabad
    Graduation: 2026
    CGPA: 8.75 / 10
    Technical Skills: Python, JavaScript, React, Node.js, MongoDB, Docker, Git, REST APIs
    """
    result = ResumeAnalyzerService.analyze_resume_text(sample_text)
    assert result["personal"]["fullName"] == "Rohan Sharma"
    assert result["personal"]["email"] == "rohan.sharma@university.edu"
    assert result["education"]["cgpa"] == 8.75
    assert result["education"]["graduationYear"] == 2026
    assert "Python" in result["skills"]["programmingLanguages"]
    assert "React" in result["skills"]["frameworks"]
    assert "MongoDB" in result["skills"]["databases"]
    assert "Docker" in result["skills"]["tools"]

def test_profile_lifecycle(client):
    test_email = "profile_test@university.edu"
    test_password = "password123"

    # Clean existing
    u_col = UserModel.get_collection()
    u_col.delete_one({"email": test_email})

    # Register student
    reg_res = client.post("/api/auth/register", json={
        "name": "Rohan Sharma",
        "email": test_email,
        "password": test_password
    })
    token = reg_res.get_json()["data"]["token"]
    user_id = reg_res.get_json()["data"]["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Get initial profile
    res_prof = client.get("/api/profile", headers=headers)
    assert res_prof.status_code == 200
    assert res_prof.get_json()["data"]["verification_status"] == "draft"

    # 2. Upload invalid file
    bad_data = {"resume": (io.BytesIO(b"not a pdf"), "resume.txt")}
    res_bad = client.post("/api/resume/upload", data=bad_data, headers=headers, content_type="multipart/form-data")
    assert res_bad.status_code == 400

    # 3. Simulate resume extraction integration
    extracted_data = {
        "personal": {"fullName": "Rohan Sharma", "email": test_email, "phone": "+91 9876543210", "location": "Hyderabad"},
        "education": {"college": "ABC Institute", "degree": "B.Tech", "branch": "CSE", "graduationYear": 2026, "cgpa": 8.8},
        "skills": {
            "programmingLanguages": ["Python", "JavaScript"],
            "technical": ["Data Structures", "REST APIs"],
            "frameworks": ["React", "Flask"],
            "databases": ["MongoDB"],
            "cloud": ["AWS"],
            "tools": ["Git", "Docker"]
        },
        "projects": [{"name": "E-Commerce", "technologies": ["React", "Flask"]}],
        "experience": [],
        "confidence": {"cgpa": 0.98}
    }

    profile_doc = ProfileModel.upsert_from_resume_extraction(
        user_id=user_id,
        extracted_data=extracted_data,
        resume_meta={"fileName": "resume.pdf", "filePath": "dummy", "fileSize": 1024}
    )
    assert profile_doc["verification_status"] == "needs_review"
    assert profile_doc["education"]["cgpa"]["value"] == 8.8
    assert profile_doc["education"]["cgpa"]["source"] == "resume"

    # 4. Update manual preferences
    res_put = client.put("/api/profile", json={
        "preferences": {
            "targetRoles": ["Software Development Engineer", "Full Stack Developer"],
            "preferredLocations": ["Bengaluru", "Hyderabad"]
        }
    }, headers=headers)
    assert res_put.status_code == 200
    updated_doc = res_put.get_json()["data"]
    assert updated_doc["preferences"]["targetRoles"]["value"] == ["Software Development Engineer", "Full Stack Developer"]
    assert updated_doc["preferences"]["targetRoles"]["source"] == "manual"

    # 5. Verify profile
    res_verify = client.post("/api/profile/verify", headers=headers)
    assert res_verify.status_code == 200
    verified = res_verify.get_json()["data"]
    assert verified["verification_status"] == "verified"

    # 6. Check completion
    res_comp = client.get("/api/profile/completion", headers=headers)
    assert res_comp.status_code == 200
    comp_data = res_comp.get_json()["data"]
    assert comp_data["percentage"] >= 80
