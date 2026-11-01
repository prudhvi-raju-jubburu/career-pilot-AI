import os
import tempfile
import pytest
from bson import ObjectId
from app import create_app
from app.config.db import Database
from app.models.user import UserModel
from app.utils.auth import generate_token
from app.services.account_deletion_service import AccountDeletionService

@pytest.fixture
def test_app():
    app = create_app()
    app.config["TESTING"] = True
    return app

@pytest.fixture
def test_client(test_app):
    return test_app.test_client()

@pytest.fixture
def setup_student():
    db = Database.get_db()
    email = "delete_target_student@example.com"
    db.users.delete_many({"email": email})
    user = UserModel.create_user(name="Delete Me", email=email, password="MySecurePassword123")
    user_id = str(user["_id"])

    # Create dummy uploaded resume file
    temp_dir = tempfile.gettempdir()
    dummy_resume = os.path.join(temp_dir, f"test_resume_{user_id}.pdf")
    with open(dummy_resume, "w") as f:
        f.write("%PDF-1.4 test resume content")

    # Seed related documents across collections
    db.student_profiles.insert_one({
        "user_id": user_id,
        "resume": {"file_path": dummy_resume, "file_name": "resume.pdf"}
    })
    db.applications.insert_one({
        "user_id": user_id,
        "company": "Test Org",
        "role": "Intern"
    })
    db.notifications.insert_one({
        "user_id": user_id,
        "title": "Alert",
        "message": "Test"
    })
    db.mock_test_attempts.insert_one({
        "user_id": user_id,
        "score": 85
    })
    db.interview_prep_packs.insert_one({
        "user_id": user_id,
        "company": "Acme"
    })

    # Also seed a shared opportunity that MUST NOT be deleted
    opp_res = db.opportunities.insert_one({
        "title": "Shared Tech Opportunity",
        "company": "Shared Company",
        "status": "active"
    })
    shared_opp_id = opp_res.inserted_id

    yield user_id, email, dummy_resume, shared_opp_id

    # Cleanup if still exists
    db.users.delete_many({"_id": user["_id"]})
    db.opportunities.delete_many({"_id": shared_opp_id})
    if os.path.exists(dummy_resume):
        try:
            os.remove(dummy_resume)
        except Exception:
            pass

def test_account_deletion_validation(test_client, setup_student, test_app):
    user_id, email, dummy_resume, shared_opp_id = setup_student
    with test_app.app_context():
        token = generate_token(user_id, email)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Missing password
    res = test_client.delete("/api/profile/account", headers=headers, json={"confirmation": "DELETE"})
    assert res.status_code == 400
    assert "password is required" in res.get_json()["message"].lower()

    # 2. Missing or incorrect DELETE confirmation text
    res = test_client.delete("/api/profile/account", headers=headers, json={"password": "MySecurePassword123", "confirmation": "delete"})
    assert res.status_code == 400
    assert "DELETE" in res.get_json()["message"]

    # 3. Wrong password
    res = test_client.delete("/api/profile/account", headers=headers, json={"password": "WrongPassword!", "confirmation": "DELETE"})
    assert res.status_code == 401
    assert "incorrect password" in res.get_json()["message"].lower()

def test_account_deletion_cascading_success(test_client, setup_student, test_app):
    user_id, email, dummy_resume, shared_opp_id = setup_student
    db = Database.get_db()

    with test_app.app_context():
        token = generate_token(user_id, email)
    headers = {"Authorization": f"Bearer {token}"}

    # Assert resume file exists before deletion
    assert os.path.exists(dummy_resume)

    # Execute deletion
    res = test_client.delete("/api/profile/account", headers=headers, json={
        "password": "MySecurePassword123",
        "confirmation": "DELETE"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True

    # Verify user record is deleted
    assert db.users.find_one({"_id": ObjectId(user_id)}) is None

    # Verify student_profile is deleted
    assert db.student_profiles.find_one({"user_id": user_id}) is None

    # Verify resume file was deleted from disk
    assert not os.path.exists(dummy_resume)

    # Verify applications, notifications, prep packs, mock tests deleted
    assert db.applications.count_documents({"user_id": user_id}) == 0
    assert db.notifications.count_documents({"user_id": user_id}) == 0
    assert db.interview_prep_packs.count_documents({"user_id": user_id}) == 0
    assert db.mock_test_attempts.count_documents({"user_id": user_id}) == 0

    # CRUCIAL: Verify shared opportunity is preserved!
    assert db.opportunities.find_one({"_id": shared_opp_id}) is not None

def test_account_deletion_staged_failure_and_idempotency(test_client, setup_student, test_app):
    """
    Simulates deliberate partial failure where filesystem remove raises OSError.
    Verifies that the user account is safely deactivated, database purge completes,
    and repeated deletion calls are idempotent (returns 404).
    """
    user_id, email, dummy_resume, shared_opp_id = setup_student
    db = Database.get_db()

    with test_app.app_context():
        token = generate_token(user_id, email)
    headers = {"Authorization": f"Bearer {token}"}

    from unittest.mock import patch
    with patch("os.remove", side_effect=PermissionError("Simulated locked file")):
        res = test_client.delete("/api/profile/account", headers=headers, json={
            "password": "MySecurePassword123",
            "confirmation": "DELETE"
        })
        # Staged deletion completes database records despite filesystem error
        assert res.status_code == 200

    # User is completely purged from users collection
    assert db.users.find_one({"_id": ObjectId(user_id)}) is None

    # Verify failed file was persisted independently in failed_file_cleanups queue
    failed_record = db.failed_file_cleanups.find_one({"user_id": user_id, "resolved": False})
    assert failed_record is not None
    assert failed_record["file_path"] == dummy_resume

    # Verify retry mechanism can safely clean up file independently of user record
    retry_summary = AccountDeletionService.retry_failed_file_cleanups()
    assert retry_summary["attempted"] >= 1
    assert retry_summary["resolved"] >= 1
    assert not os.path.exists(dummy_resume)

    # Calling retry again is idempotent
    retry_summary_2 = AccountDeletionService.retry_failed_file_cleanups()
    assert retry_summary_2["attempted"] == 0

    # Calling deletion AGAIN with the same token is rejected (idempotent & revoked)
    repeat_res = test_client.delete("/api/profile/account", headers=headers, json={
        "password": "MySecurePassword123",
        "confirmation": "DELETE"
    })
    # Since user no longer exists, token_required rejects with 401
    assert repeat_res.status_code == 401

def test_account_deletion_strict_isolation_between_students(test_client, setup_student, test_app):
    """
    Asserts that deleting Student A's account NEVER deletes Student B's profile, applications, or resumes.
    """
    user_id_a, email_a, dummy_resume_a, shared_opp_id = setup_student
    db = Database.get_db()

    # Create Student B
    email_b = "student_b_safe@example.com"
    db.users.delete_many({"email": email_b})
    user_b = UserModel.create_user(name="Student B", email=email_b, password="PasswordB123!")
    user_id_b = str(user_b["_id"])

    db.student_profiles.insert_one({"user_id": user_id_b, "name": "Student B"})
    db.applications.insert_one({"user_id": user_id_b, "company": "Target Company", "role": "Fullstack"})

    try:
        with test_app.app_context():
            token_a = generate_token(user_id_a, email_a)
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # Delete Student A
        res = test_client.delete("/api/profile/account", headers=headers_a, json={
            "password": "MySecurePassword123",
            "confirmation": "DELETE"
        })
        assert res.status_code == 200

        # Verify Student B is 100% intact
        assert db.users.find_one({"_id": user_b["_id"]}) is not None
        assert db.student_profiles.find_one({"user_id": user_id_b}) is not None
        assert db.applications.find_one({"user_id": user_id_b}) is not None

    finally:
        db.users.delete_many({"_id": user_b["_id"]})
        db.student_profiles.delete_many({"user_id": user_id_b})
        db.applications.delete_many({"user_id": user_id_b})


