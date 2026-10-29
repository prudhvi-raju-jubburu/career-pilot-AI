import uuid
import pytest
from bson import ObjectId
from app import create_app
from app.models.user import UserModel
from app.models.opportunity import OpportunityModel
from app.models.application import ApplicationModel
from app.models.profile import ProfileModel
from app.models.feedback import FeedbackModel
from app.models.audit_log import AuditLogModel
from app.utils.auth import generate_token

@pytest.fixture
def app():
    app = create_app()
    app.config["TESTING"] = True
    return app

@pytest.fixture
def client(app):
    with app.test_client() as client:
        yield client

@pytest.fixture
def seed_users(app):
    """Provides test student and admin accounts."""
    with app.app_context():
        col = UserModel.get_collection()
        col.delete_many({"email": {"$in": [
            "student_security_test@careerpilot.ai",
            "admin_security_test@careerpilot.ai",
            "second_admin_test@careerpilot.ai",
            "target_user_test@careerpilot.ai"
        ]}})

        student = UserModel.create_user(
            name="Student Tester",
            email="student_security_test@careerpilot.ai",
            password="studentPassword123!",
            role="student",
            status="active"
        )
        admin = UserModel.create_user(
            name="Admin Tester",
            email="admin_security_test@careerpilot.ai",
            password="adminPassword123!",
            role="admin",
            status="active"
        )
        second_admin = UserModel.create_user(
            name="Second Admin",
            email="second_admin_test@careerpilot.ai",
            password="adminPassword123!",
            role="admin",
            status="active"
        )
        target = UserModel.create_user(
            name="Target Candidate",
            email="target_user_test@careerpilot.ai",
            password="targetPassword123!",
            role="student",
            status="active"
        )

        student_token = generate_token(str(student["_id"]), student["email"])
        admin_token = generate_token(str(admin["_id"]), admin["email"])
        second_admin_token = generate_token(str(second_admin["_id"]), second_admin["email"])

        yield {
            "student": student,
            "admin": admin,
            "second_admin": second_admin,
            "target": target,
            "student_token": student_token,
            "admin_token": admin_token,
            "second_admin_token": second_admin_token
        }

        # Clean up
        col.delete_many({"email": {"$in": [
            "student_security_test@careerpilot.ai",
            "admin_security_test@careerpilot.ai",
            "second_admin_test@careerpilot.ai",
            "target_user_test@careerpilot.ai"
        ]}})

def test_unauthenticated_requests_denied(client):
    """Admin endpoints reject requests without authorization token with 401."""
    endpoints = [
        "/api/admin/overview",
        "/api/admin/charts",
        "/api/admin/users",
        "/api/admin/opportunities",
        "/api/admin/sources",
        "/api/admin/analytics",
        "/api/admin/feedback",
        "/api/admin/audit-logs",
        "/api/admin/settings"
    ]
    for ep in endpoints:
        res = client.get(ep)
        assert res.status_code == 401
        assert res.get_json()["error"] == "UNAUTHORIZED"

def test_student_access_to_admin_denied(client, seed_users):
    """Student accounts cannot access administrative routes and receive 403 FORBIDDEN."""
    token = seed_users["student_token"]
    headers = {"Authorization": f"Bearer {token}"}

    endpoints = [
        ("/api/admin/overview", "GET", None),
        ("/api/admin/charts", "GET", None),
        ("/api/admin/users", "GET", None),
        ("/api/admin/opportunities", "GET", None),
        ("/api/admin/sources", "GET", None),
        ("/api/admin/sources/sync", "POST", {}),
        ("/api/admin/analytics", "GET", None),
        ("/api/admin/feedback", "GET", None),
        ("/api/admin/audit-logs", "GET", None),
        ("/api/admin/settings", "GET", None),
        ("/api/sources/sync", "POST", {})
    ]

    for path, method, payload in endpoints:
        if method == "GET":
            res = client.get(path, headers=headers)
        else:
            res = client.post(path, json=payload, headers=headers)
        assert res.status_code == 403
        data = res.get_json()
        assert data["error"] == "FORBIDDEN"
        assert "Administrative privileges required" in data["message"]

def test_client_cannot_self_promote_or_register_as_admin(client):
    """Registration endpoint strictly forces role to 'student', ignoring request role."""
    test_email = "malicious_reg_test@careerpilot.ai"
    UserModel.get_collection().delete_one({"email": test_email})

    res = client.post("/api/auth/register", json={
        "name": "Attacker",
        "email": test_email,
        "password": "attackPassword123!",
        "role": "admin"  # Malicious attempt to self-grant admin
    })
    assert res.status_code == 201
    user = UserModel.find_by_email(test_email)
    assert user is not None
    assert user["role"] == "student"  # Server-side forced to student
    assert user.get("status") == "active"

    UserModel.get_collection().delete_one({"email": test_email})

def test_suspended_account_policy(client, seed_users):
    """Suspended accounts cannot log in or access protected APIs."""
    student_id = str(seed_users["student"]["_id"])
    token = seed_users["student_token"]

    # Initially active - protected /api/auth/me works
    res_active = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_active.status_code == 200

    # Suspend user in database
    UserModel.update_status(student_id, "suspended")

    # Protected call with existing token must fail with 403 ACCOUNT_SUSPENDED
    res_suspended = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_suspended.status_code == 403
    assert res_suspended.get_json()["error"] == "ACCOUNT_SUSPENDED"

    # Login attempt must also be rejected with 403 ACCOUNT_SUSPENDED
    res_login = client.post("/api/auth/login", json={
        "email": seed_users["student"]["email"],
        "password": "studentPassword123!"
    })
    assert res_login.status_code == 403
    assert res_login.get_json()["error"] == "ACCOUNT_SUSPENDED"

    # Reactivate user
    UserModel.update_status(student_id, "active")
    res_reactivated = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_reactivated.status_code == 200

def test_admin_overview_kpis_and_charts(client, seed_users):
    """Authorized administrator can retrieve real KPI metrics and aggregations."""
    headers = {"Authorization": f"Bearer {seed_users['admin_token']}"}

    res_kpis = client.get("/api/admin/overview?period=30", headers=headers)
    assert res_kpis.status_code == 200
    kpis = res_kpis.get_json()["data"]
    assert "users" in kpis
    assert "opportunities" in kpis
    assert "applications" in kpis
    assert "sources" in kpis
    assert kpis["users"]["total"] >= 1
    assert kpis["opportunities"]["total"] >= 0

    res_charts = client.get("/api/admin/charts?period=30", headers=headers)
    assert res_charts.status_code == 200
    charts = res_charts.get_json()["data"]
    assert "user_registrations_trend" in charts
    assert "opportunity_categories" in charts
    assert "opportunity_sources" in charts
    assert "opportunity_freshness" in charts

def test_admin_user_management_lifecycle(client, seed_users):
    """Admin can list users, view sanitized details, suspend, reactivate, and change roles."""
    admin_headers = {"Authorization": f"Bearer {seed_users['admin_token']}"}
    target_id = str(seed_users["target"]["_id"])

    # 1. List users
    res_list = client.get("/api/admin/users?page=1&limit=10&role=all", headers=admin_headers)
    assert res_list.status_code == 200
    data = res_list.get_json()["data"]
    assert len(data["users"]) >= 1
    # Check no password hashes leaked
    for u in data["users"]:
        assert "password_hash" not in u

    # 2. User details
    res_details = client.get(f"/api/admin/users/{target_id}", headers=admin_headers)
    assert res_details.status_code == 200
    user_detail = res_details.get_json()["data"]
    assert user_detail["user"]["email"] == seed_users["target"]["email"]
    assert "password_hash" not in user_detail["user"]

    # 3. Suspend target user
    res_susp = client.patch(
        f"/api/admin/users/{target_id}/status",
        json={"status": "suspended", "reason": "Violation of terms"},
        headers=admin_headers
    )
    assert res_susp.status_code == 200
    assert res_susp.get_json()["data"]["status"] == "suspended"

    # Verify audit log was created
    audit = AuditLogModel.get_collection().find_one({
        "action": "USER_SUSPENDED",
        "target_id": target_id
    })
    assert audit is not None
    assert audit["details"]["reason"] == "Violation of terms"

    # 4. Admin cannot suspend self
    admin_id = str(seed_users["admin"]["_id"])
    res_self_susp = client.patch(
        f"/api/admin/users/{admin_id}/status",
        json={"status": "suspended", "reason": "Self suspension attempt"},
        headers=admin_headers
    )
    assert res_self_susp.status_code == 400
    assert "cannot suspend their own" in res_self_susp.get_json()["message"]

    # 5. Reactivate user
    res_reactivate = client.patch(
        f"/api/admin/users/{target_id}/status",
        json={"status": "active", "reason": "Account restored"},
        headers=admin_headers
    )
    assert res_reactivate.status_code == 200
    assert res_reactivate.get_json()["data"]["status"] == "active"

    # 6. Role change: promote to admin
    res_role = client.patch(
        f"/api/admin/users/{target_id}/role",
        json={"role": "admin", "reason": "Staff promotion"},
        headers=admin_headers
    )
    assert res_role.status_code == 200
    assert res_role.get_json()["data"]["role"] == "admin"

    # 7. Admin cannot demote self
    res_self_demote = client.patch(
        f"/api/admin/users/{admin_id}/role",
        json={"role": "student", "reason": "Demote self"},
        headers=admin_headers
    )
    assert res_self_demote.status_code == 400
    assert "cannot demote their own" in res_self_demote.get_json()["message"]

def test_admin_opportunity_moderation(client, seed_users):
    """Admin can approve, edit metadata, and retire opportunities."""
    admin_headers = {"Authorization": f"Bearer {seed_users['admin_token']}"}
    col = OpportunityModel.get_collection()

    test_opp = {
        "title": "Software Engineer Intern Test",
        "organization": {"name": "Tech Corp India"},
        "type": "internship",
        "category": "software_engineering",
        "location": {"city": "Bengaluru", "country": "India", "is_remote": False},
        "work_mode": "Hybrid",
        "application_url": "https://careers.techcorp.in/jobs/123",
        "status": "active",
        "moderation_status": "pending_review",
        "dates": {"deadline": "2026-12-31"},
        "skills": ["Python", "Flask", "React"]
    }
    inserted = col.insert_one(test_opp)
    opp_id = str(inserted.inserted_id)

    # 1. Approve opportunity
    res_approve = client.patch(
        f"/api/admin/opportunities/{opp_id}/moderate",
        json={"action": "approve", "payload": {"notes": "Verified source & India role"}},
        headers=admin_headers
    )
    assert res_approve.status_code == 200
    assert res_approve.get_json()["data"]["status"] == "active"

    # 2. Update metadata
    res_meta = client.patch(
        f"/api/admin/opportunities/{opp_id}/moderate",
        json={
            "action": "update_metadata",
            "payload": {
                "title": "Senior Software Engineer Intern",
                "application_url": "https://careers.techcorp.in/jobs/updated"
            }
        },
        headers=admin_headers
    )
    assert res_meta.status_code == 200
    assert res_meta.get_json()["data"]["title"] == "Senior Software Engineer Intern"

    # 3. Reject invalid application_url (e.g. javascript injection or non-http)
    res_bad_url = client.patch(
        f"/api/admin/opportunities/{opp_id}/moderate",
        json={
            "action": "update_metadata",
            "payload": {"application_url": "ftp://malicious.org"}
        },
        headers=admin_headers
    )
    assert res_bad_url.status_code == 400

    # 4. Retire opportunity
    res_retire = client.patch(
        f"/api/admin/opportunities/{opp_id}/moderate",
        json={"action": "retire", "payload": {"notes": "Role closed by company"}},
        headers=admin_headers
    )
    assert res_retire.status_code == 200
    assert res_retire.get_json()["data"]["status"] == "retired"

    col.delete_one({"_id": inserted.inserted_id})

def test_admin_duplicate_merge_preserves_references(client, seed_users):
    """Duplicate merge repoints applications, bookmarks, and user feedback while retiring duplicate."""
    admin_headers = {"Authorization": f"Bearer {seed_users['admin_token']}"}
    col_opps = OpportunityModel.get_collection()
    col_apps = ApplicationModel.get_collection()
    col_prof = ProfileModel.get_collection()
    student_id = str(seed_users["student"]["_id"])

    # Canonical Opportunity A
    opp_a = col_opps.insert_one({
        "title": "Frontend Developer Intern",
        "organization": {"name": "Bengaluru Tech Labs"},
        "status": "active",
        "category": "frontend",
        "application_url": "https://techlabs.in/jobs/1",
        "skills": ["React", "JavaScript"]
    })
    id_a = str(opp_a.inserted_id)

    # Duplicate Opportunity B
    opp_b = col_opps.insert_one({
        "title": "Frontend Intern (React)",
        "organization": {"name": "Bengaluru Tech Labs"},
        "status": "active",
        "category": "frontend",
        "application_url": "https://unstop.com/jobs/techlabs-react",
        "skills": ["React", "CSS"]
    })
    id_b = str(opp_b.inserted_id)

    # Create student application pointing to Duplicate B
    app_doc = col_apps.insert_one({
        "user_id": student_id,
        "opportunity_id": id_b,
        "company": "Bengaluru Tech Labs",
        "role": "Frontend Intern",
        "status": "Applied"
    })
    app_id = app_doc.inserted_id

    # Create profile saved bookmark pointing to Duplicate B
    col_prof.update_one(
        {"user_id": student_id},
        {"$addToSet": {"saved_opportunities": id_b}},
        upsert=True
    )

    # Execute merge of B into A
    res_merge = client.post(
        "/api/admin/opportunities/merge",
        json={
            "canonical_id": id_a,
            "duplicate_id": id_b,
            "reason": "Duplicate listing verified across ATS and Unstop"
        },
        headers=admin_headers
    )
    assert res_merge.status_code == 200
    merge_data = res_merge.get_json()["data"]
    assert merge_data["repointed_applications"] >= 1
    assert merge_data["repointed_bookmarks"] >= 1

    # Verify application now references Canonical A
    updated_app = col_apps.find_one({"_id": app_id})
    assert updated_app["opportunity_id"] == id_a

    # Verify bookmark now references Canonical A and not B
    updated_prof = col_prof.find_one({"user_id": student_id})
    assert id_a in updated_prof.get("saved_opportunities", [])
    assert id_b not in updated_prof.get("saved_opportunities", [])

    # Verify Duplicate B is retired with merged_into link
    updated_b = col_opps.find_one({"_id": opp_b.inserted_id})
    assert updated_b["status"] == "retired"
    assert updated_b["merged_into"] == id_a

    # Clean up
    col_opps.delete_many({"_id": {"$in": [opp_a.inserted_id, opp_b.inserted_id]}})
    col_apps.delete_one({"_id": app_id})
    col_prof.delete_one({"user_id": student_id})

def test_admin_audit_logs_read_only(client, seed_users):
    """Audit logs can be read and filtered, but cannot be modified or deleted via API."""
    admin_headers = {"Authorization": f"Bearer {seed_users['admin_token']}"}

    res = client.get("/api/admin/audit-logs?page=1&limit=10", headers=admin_headers)
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "audit_logs" in data
    assert "total" in data

    # Verify audit logs endpoint rejects POST/DELETE/PUT (read-only)
    assert client.post("/api/admin/audit-logs", headers=admin_headers).status_code == 405
    assert client.delete("/api/admin/audit-logs", headers=admin_headers).status_code == 405
    assert client.put("/api/admin/audit-logs", headers=admin_headers).status_code == 405

def test_admin_settings_sanitized(client, seed_users):
    """Settings report system operational flags and never leak secrets or passwords."""
    admin_headers = {"Authorization": f"Bearer {seed_users['admin_token']}"}

    res = client.get("/api/admin/settings", headers=admin_headers)
    assert res.status_code == 200
    data = res.get_json()["data"]

    assert "environment" in data
    assert "supported_connectors" in data
    assert "security" in data

    # Guarantee secrets are not leaked
    response_str = str(data).lower()
    assert "supersecret" not in response_str
    assert "password" not in response_str
    assert "jwt_secret" not in response_str

def test_admin_create_another_admin(client, seed_users):
    """Admin has authority to provision new administrators, while students are rejected."""
    admin_headers = {"Authorization": f"Bearer {seed_users['admin_token']}"}
    student_headers = {"Authorization": f"Bearer {seed_users['student_token']}"}

    # 1. Student cannot add an admin (403 Forbidden)
    res_student = client.post(
        "/api/admin/users/create-admin",
        json={
            "name": "Unauthorized Attempt",
            "email": "hacker@test.com",
            "password": "Password123!"
        },
        headers=student_headers
    )
    assert res_student.status_code == 403

    # 2. Admin successfully creates a new admin (201 Created)
    new_admin_email = f"coadmin_{uuid.uuid4().hex[:6]}@careerpilot.ai"
    res_admin = client.post(
        "/api/admin/users/create-admin",
        json={
            "name": "Co-Administrator",
            "email": new_admin_email,
            "password": "SecurePassword123!",
            "reason": "Operations expansion"
        },
        headers=admin_headers
    )
    assert res_admin.status_code == 201
    created_data = res_admin.get_json()["data"]
    assert created_data["email"] == new_admin_email
    assert created_data["role"] == "admin"
    assert created_data["status"] == "active"
    assert "password_hash" not in created_data

    # 3. New admin can log in and obtain token
    res_login = client.post(
        "/api/auth/login",
        json={"email": new_admin_email, "password": "SecurePassword123!"}
    )
    assert res_login.status_code == 200
    assert res_login.get_json()["data"]["user"]["role"] == "admin"

    # 4. Duplicate admin creation fails with 400
    res_dup = client.post(
        "/api/admin/users/create-admin",
        json={
            "name": "Duplicate Admin",
            "email": new_admin_email,
            "password": "SecurePassword123!"
        },
        headers=admin_headers
    )
    assert res_dup.status_code == 400
    assert "already exists" in res_dup.get_json()["message"]

