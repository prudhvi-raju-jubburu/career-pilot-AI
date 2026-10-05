import os
import io
import pytest
from pypdf import PdfWriter
from app import create_app
from app.models.user import UserModel
from app.models.profile import ProfileModel
from app.services.profile_service import ProfileService
from app.services.resume_parser import ResumeParserService
from app.ai.resume_analyzer import ResumeAnalyzerService
from app.utils.skill_normalizer import normalize_skill, normalize_skill_list

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def create_sample_pdf_bytes():
    """Generates a valid in-memory PDF resume for testing."""
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    bio = io.BytesIO()
    writer.write(bio)
    bio.seek(0)
    return bio

def register_and_get_auth(client, email, name="Test Student", password="password123"):
    """Helper to register user and obtain token and headers."""
    u_col = UserModel.get_collection()
    u_col.delete_one({"email": email})
    
    # Also clean profile
    p_col = ProfileService.get_collection()
    user = u_col.find_one({"email": email})
    if user:
        p_col.delete_one({"user_id": user["_id"]})

    reg_res = client.post("/api/auth/register", json={
        "name": name,
        "email": email,
        "password": password
    })
    data = reg_res.get_json()["data"]
    token = data["token"]
    user_id = data["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}
    return user_id, headers

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
    test_email = "profile_lifecycle@university.edu"
    user_id, headers = register_and_get_auth(client, test_email, name="Rohan Sharma")

    # 1. Get initial profile (draft state)
    res_prof = client.get("/api/profile", headers=headers)
    assert res_prof.status_code == 200
    assert res_prof.get_json()["data"]["verification_status"] == "draft"

    # 2. Upload invalid file rejected
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

def test_unauthenticated_request_rejected(client):
    """Verifies that all profile APIs reject unauthenticated requests with 401."""
    assert client.get("/api/profile").status_code == 401
    assert client.put("/api/profile", json={"personal": {"phone": "123"}}).status_code == 401
    assert client.post("/api/profile/verify").status_code == 401
    assert client.get("/api/profile/completion").status_code == 401

def test_user_cannot_access_or_update_another_profile(client):
    """Verifies profile ownership isolation: user cannot read or update another's profile."""
    user_a_id, headers_a = register_and_get_auth(client, "user_a@test.edu", "Alice User")
    user_b_id, headers_b = register_and_get_auth(client, "user_b@test.edu", "Bob User")

    # Alice sets specific phone
    client.put("/api/profile", json={
        "personal": {"phone": "+1 555-0100"}
    }, headers=headers_a)

    # Bob sets different phone
    client.put("/api/profile", json={
        "personal": {"phone": "+1 555-0200"}
    }, headers=headers_b)

    # Alice checks profile: only sees Alice
    res_a = client.get("/api/profile", headers=headers_a)
    assert res_a.get_json()["data"]["personal"]["phone"]["value"] == "+1 555-0100"
    assert res_a.get_json()["data"]["user_id"] == str(user_a_id)

    # Bob checks profile: only sees Bob
    res_b = client.get("/api/profile", headers=headers_b)
    assert res_b.get_json()["data"]["personal"]["phone"]["value"] == "+1 555-0200"
    assert res_b.get_json()["data"]["user_id"] == str(user_b_id)

    # Alice attempts spoofing Bob's ID in request body
    client.put("/api/profile", json={
        "user_id": str(user_b_id),
        "personal": {"phone": "+1 999-9999"}
    }, headers=headers_a)

    # Bob's profile must remain unchanged
    res_b_after = client.get("/api/profile", headers=headers_b)
    assert res_b_after.get_json()["data"]["personal"]["phone"]["value"] == "+1 555-0200"

def test_profile_completion_and_missing_fields():
    """Verifies deterministic completion calculation and accurate missing fields list."""
    empty_doc = {
        "personal": {},
        "education": {},
        "skills": {},
        "projects": [],
        "preferences": {},
        "resume": {}
    }
    comp_empty = ProfileService.calculate_profile_completion(empty_doc)
    assert comp_empty["percentage"] == 0
    assert "personal.full_name" in comp_empty["missing_fields"]
    assert "education.college" in comp_empty["missing_fields"]
    assert "skills.programming_languages" in comp_empty["missing_fields"]
    assert "projects" in comp_empty["missing_fields"]

    # Fill personal info only
    partial_doc = {
        "personal": {
            "full_name": "Test Student",
            "email": "student@test.edu",
            "phone": "9876543210",
            "location": "City"
        },
        "education": {},
        "skills": {},
        "projects": [],
        "preferences": {},
        "resume": {}
    }
    comp_partial = ProfileService.calculate_profile_completion(partial_doc)
    assert comp_partial["percentage"] == 20
    assert "personal.full_name" not in comp_partial["missing_fields"]
    assert "education.college" in comp_partial["missing_fields"]

def test_editing_verified_profile_changes_status_to_needs_review(client):
    """Verifies that modifying a verified profile immediately triggers status reversion to 'needs_review'."""
    user_id, headers = register_and_get_auth(client, "verified_user@test.edu", "Verified Student")

    # Complete baseline profile so verification succeeds
    client.put("/api/profile", json={
        "personal": {"full_name": "Verified Student", "email": "verified_user@test.edu"},
        "education": {"college": "Test College", "degree": "B.Tech", "branch": "CSE", "cgpa": 8.5, "graduation_year": 2026},
        "skills": {"programming_languages": ["Python", "Go"]},
        "projects": [{"name": "Portfolio"}],
        "preferences": {"target_roles": ["Backend Developer"]}
    }, headers=headers)

    # Verify profile
    res_verify = client.post("/api/profile/verify", headers=headers)
    assert res_verify.status_code == 200
    assert res_verify.get_json()["data"]["verification_status"] == "verified"

    # Now edit a field
    res_edit = client.put("/api/profile", json={
        "education": {"cgpa": 8.9}
    }, headers=headers)
    assert res_edit.status_code == 200
    assert res_edit.get_json()["data"]["verification_status"] == "needs_review"
    assert res_edit.get_json()["data"]["verified_at"] is None

def test_manual_fields_not_overwritten_by_later_resume_analysis(client):
    """Verifies that student manual edits are preserved and NOT overwritten by subsequent resume extractions."""
    user_id, headers = register_and_get_auth(client, "preserve_manual@test.edu", "Manual Student")

    # 1. Student manually enters CGPA 8.9
    client.put("/api/profile", json={
        "education": {"cgpa": 8.9, "college": "Initial College"}
    }, headers=headers)

    # 2. Later resume analysis extracts different CGPA 8.2 and college
    extracted_data = {
        "personal": {"fullName": "Manual Student"},
        "education": {"cgpa": 8.2, "college": "New College From Resume", "degree": "B.Tech"},
        "skills": {"programmingLanguages": ["Python"]}
    }
    ProfileService.merge_resume_data_into_profile(
        user_id=user_id,
        extracted_data=extracted_data,
        resume_meta={"fileName": "resume_v2.pdf", "filePath": "path"}
    )

    # 3. Fetch profile and verify CGPA was preserved at 8.9, while degree was populated
    prof = ProfileService.get_profile_by_user_id(user_id)
    assert prof["education"]["cgpa"] == 8.9
    assert prof["field_sources"]["education.cgpa"] == "manual"
    # College was manual, so preserved Initial College
    assert prof["education"]["college"] == "Initial College"
    # Degree was not manual before, so accepted from resume
    assert prof["education"]["degree"] == "B.Tech"
    assert prof["field_sources"]["education.degree"] == "resume"

def test_missing_resume_fields_do_not_create_fabricated_data(client):
    """Verifies that missing information in resumes defaults strictly to null or [] without hallucinations."""
    user_id, headers = register_and_get_auth(client, "sparse_resume@test.edu", "Sparse Student")

    # Resume without target roles, phone, or certifications
    sparse_extracted = {
        "personal": {"fullName": "Sparse Student"},
        "education": {},
        "skills": {"programmingLanguages": ["C++"]},
        "projects": []
    }
    ProfileService.merge_resume_data_into_profile(
        user_id=user_id,
        extracted_data=sparse_extracted,
        resume_meta={"fileName": "sparse.pdf", "filePath": "path"}
    )

    prof = ProfileService.get_profile_by_user_id(user_id)
    # Must NOT hallucinate roles or education
    assert prof["preferences"]["target_roles"] == []
    assert prof["education"]["college"] is None
    assert prof["education"]["cgpa"] is None
    assert prof["personal"]["phone"] is None

def test_skill_normalization():
    """Verifies canonical normalization for skill variations."""
    raw_skills = ["ReactJS", "react.js", "Mongo DB", "Node JS", "Java Script", "C++", "unknown_custom_skill"]
    normalized = normalize_skill_list(raw_skills)

    assert "React" in normalized
    assert "MongoDB" in normalized
    assert "Node.js" in normalized
    assert "JavaScript" in normalized
    assert "C++" in normalized
    assert "unknown_custom_skill" in normalized
    # React should not appear twice
    assert normalized.count("React") == 1

def test_validation_rejects_invalid_cgpa(client):
    """Verifies that invalid CGPA values (> 10, < 0, non-numeric) are rejected with 400."""
    user_id, headers = register_and_get_auth(client, "cgpa_val@test.edu")

    # > 10.0
    res1 = client.put("/api/profile", json={"education": {"cgpa": 12.5}}, headers=headers)
    assert res1.status_code == 400
    assert "CGPA" in res1.get_json()["message"]

    # < 0.0
    res2 = client.put("/api/profile", json={"education": {"cgpa": -0.5}}, headers=headers)
    assert res2.status_code == 400

    # Non numeric
    res3 = client.put("/api/profile", json={"education": {"cgpa": "ten"}}, headers=headers)
    assert res3.status_code == 400

def test_validation_rejects_invalid_graduation_year(client):
    """Verifies that out-of-range graduation years are rejected with 400."""
    user_id, headers = register_and_get_auth(client, "grad_val@test.edu")

    # Before 1970
    res1 = client.put("/api/profile", json={"education": {"graduation_year": 1950}}, headers=headers)
    assert res1.status_code == 400
    assert "Graduation year" in res1.get_json()["message"]

    # In far future
    res2 = client.put("/api/profile", json={"education": {"graduation_year": 2099}}, headers=headers)
    assert res2.status_code == 400

def test_validation_rejects_malformed_profile_payload(client):
    """Verifies that non-object payloads or invalid types are rejected with 400."""
    user_id, headers = register_and_get_auth(client, "malformed@test.edu")

    # Non-dict payload
    res1 = client.put("/api/profile", data="not_json", headers={**headers, "Content-Type": "application/json"})
    assert res1.status_code == 400

    # Invalid email in personal
    res2 = client.put("/api/profile", json={"personal": {"email": "invalid_email_format"}}, headers=headers)
    assert res2.status_code == 400

    # Non-list for projects
    res3 = client.put("/api/profile", json={"projects": "just_a_string"}, headers=headers)
    assert res3.status_code == 400

def test_database_unique_index():
    """Verifies that student_profiles collection has unique index on user_id."""
    col = ProfileService.get_collection()
    ProfileService.ensure_indexes()
    indexes = col.index_information()
    
    # Check that user_id index exists and is unique
    has_user_id_index = False
    for idx_name, idx_info in indexes.items():
        keys = idx_info.get("key", [])
        if any(k[0] == "user_id" for k in keys):
            has_user_id_index = True
            assert idx_info.get("unique") is True
            break
    assert has_user_id_index
