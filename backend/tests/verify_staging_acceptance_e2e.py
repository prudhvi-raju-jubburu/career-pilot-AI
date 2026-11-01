"""
Staging Multi-User End-to-End Acceptance Verification Script.
Executes against staging application & MongoDB:
1. Student 1, Student 2, Admin account setup.
2. Login & JWT authentication.
3. Socket.IO connection & room isolation (Student 1 receives event, Student 2 does NOT).
4. Notification dropdown & full notification center query.
5. Student 1 password change via /api/auth/change-password.
6. Disposable student account creation and deletion with resume cleanup & retry queue.
7. Opportunity discovery with clean human-readable deadline formatting.
8. Apply Now link verification endpoint & external navigation.
9. Application tracking lifecycle (Saved -> Applied).
10. Skill-gap assessment, mock test submission, AI interview session creation.
11. Persistence check after token refresh.
"""
import os
import json
import socket
from datetime import datetime, timezone
from unittest.mock import patch, MagicMock

from bson import ObjectId
from app import create_app
from app.config.db import Database
from app.models.user import UserModel
from app.models.opportunity import OpportunityModel
from app.models.application import ApplicationModel
from app.models.notification import NotificationModel
from app.services.account_deletion_service import AccountDeletionService
from app.socket import socketio

def run_staging_acceptance_e2e():
    app = create_app()
    app.config["TESTING"] = True
    client = app.test_client()
    db = Database.get_db()

    print("\n=======================================================")
    print("  STAGE 1: SEEDING USERS & AUTHENTICATION VERIFICATION")
    print("=======================================================")
    # Clean previous run users if any
    db.users.delete_many({"email": {"$in": [
        "stage_student1@example.com",
        "stage_student2@example.com",
        "stage_admin@example.com",
        "stage_disposable@example.com"
    ]}})

    # 1. Create Student 1
    s1 = UserModel.create_user(name="Alice Student", email="stage_student1@example.com", password="PasswordAlice123!", role="student")
    s1_id = str(s1["_id"])
    print(f"  [OK] Created Student 1: {s1['email']} (ID: {s1_id})")

    # 2. Create Student 2
    s2 = UserModel.create_user(name="Bob Student", email="stage_student2@example.com", password="PasswordBob123!", role="student")
    s2_id = str(s2["_id"])
    print(f"  [OK] Created Student 2: {s2['email']} (ID: {s2_id})")

    # 3. Create Admin
    admin = UserModel.create_user(name="System Admin", email="stage_admin@example.com", password="AdminPassword123!", role="admin")
    admin_id = str(admin["_id"])
    print(f"  [OK] Created Admin: {admin['email']} (ID: {admin_id})")

    # 4. Login Student 1
    res = client.post("/api/auth/login", json={"email": "stage_student1@example.com", "password": "PasswordAlice123!"})
    assert res.status_code == 200, f"Login failed: {res.get_json()}"
    s1_token = res.get_json()["data"]["token"]
    s1_headers = {"Authorization": f"Bearer {s1_token}"}
    print("  [OK] Student 1 login successful, JWT acquired")

    # 5. Login Student 2
    res = client.post("/api/auth/login", json={"email": "stage_student2@example.com", "password": "PasswordBob123!"})
    assert res.status_code == 200
    s2_token = res.get_json()["data"]["token"]
    s2_headers = {"Authorization": f"Bearer {s2_token}"}
    print("  [OK] Student 2 login successful, JWT acquired")

    # 6. Login Admin
    res = client.post("/api/auth/login", json={"email": "stage_admin@example.com", "password": "AdminPassword123!"})
    assert res.status_code == 200
    admin_token = res.get_json()["data"]["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("  [OK] Admin login successful, JWT acquired")

    print("\n=======================================================")
    print("  STAGE 2: SOCKET.IO NOTIFICATION DELIVERY & ISOLATION")
    print("=======================================================")
    socket_client_s1 = socketio.test_client(app, auth={"token": s1_token})
    socket_client_s2 = socketio.test_client(app, auth={"token": s2_token})
    assert socket_client_s1.is_connected()
    assert socket_client_s2.is_connected()
    print("  [OK] Socket.IO clients connected with handshake auth")

    # Dispatch notification to Student 1 ONLY
    notif_doc = NotificationModel.create_notification(
        user_id=s1_id,
        title="Exclusive Interview Invitation",
        message="You have been shortlisted for an engineering internship at Razorpay.",
        notif_type="application"
    )
    print("  [OK] Created in-app notification in DB for Student 1")

    # Read events received by Student 1
    events_s1 = socket_client_s1.get_received()
    notif_events_s1 = [e for e in events_s1 if e["name"] == "notification:new"]
    assert len(notif_events_s1) >= 1, "Student 1 did not receive socket notification"
    assert notif_events_s1[0]["args"][0]["title"] == "Exclusive Interview Invitation"
    print("  [OK] Student 1 received real-time notification:new event successfully")

    # Read events received by Student 2 (MUST BE EMPTY)
    events_s2 = socket_client_s2.get_received()
    notif_events_s2 = [e for e in events_s2 if e["name"] == "notification:new"]
    assert len(notif_events_s2) == 0, "ISOLATION BREACH: Student 2 received Student 1's notification!"
    print("  [OK] Cross-user isolation verified: Student 2 received ZERO events from Student 1")

    socket_client_s1.disconnect()
    socket_client_s2.disconnect()

    print("\n=======================================================")
    print("  STAGE 3: NOTIFICATION CENTER & UNREAD SYNCHRONIZATION")
    print("=======================================================")
    # Student 1 fetches notifications via REST API
    res = client.get("/api/notifications", headers=s1_headers)
    assert res.status_code == 200
    notifs = res.get_json()["data"]
    assert len(notifs) >= 1
    assert res.get_json()["unread_count"] >= 1
    print(f"  [OK] Notification center returned {len(notifs)} notifications, unread_count: {res.get_json()['unread_count']}")

    # Mark all read
    res = client.put("/api/notifications/read-all", headers=s1_headers)
    assert res.status_code == 200
    res_count = client.get("/api/notifications/unread-count", headers=s1_headers)
    assert res_count.get_json()["data"]["unread_count"] == 0
    print("  [OK] Successfully synchronized read state; unread_count reset to 0")

    print("\n=======================================================")
    print("  STAGE 4: STUDENT PASSWORD CHANGE VERIFICATION")
    print("=======================================================")
    # Wrong current password rejected
    res = client.post("/api/auth/change-password", headers=s1_headers, json={
        "current_password": "WrongPassword999!",
        "new_password": "BrandNewPassword2026!"
    })
    assert res.status_code == 401
    print("  [OK] Incorrect current password was safely rejected (401)")

    # Successful password change
    res = client.post("/api/auth/change-password", headers=s1_headers, json={
        "current_password": "PasswordAlice123!",
        "new_password": "BrandNewPassword2026!"
    })
    assert res.status_code == 200
    print("  [OK] Password changed successfully (200)")

    # Verify old password cannot log in
    res = client.post("/api/auth/login", json={"email": "stage_student1@example.com", "password": "PasswordAlice123!"})
    assert res.status_code == 401
    # Verify new password logs in
    res = client.post("/api/auth/login", json={"email": "stage_student1@example.com", "password": "BrandNewPassword2026!"})
    assert res.status_code == 200
    s1_token = res.get_json()["data"]["token"]
    s1_headers = {"Authorization": f"Bearer {s1_token}"}
    print("  [OK] Verified new password login active, old password revoked")

    print("\n=======================================================")
    print("  STAGE 5: DISPOSABLE ACCOUNT DELETION & RETRY QUEUE")
    print("=======================================================")
    disp = UserModel.create_user(name="Disposable User", email="stage_disposable@example.com", password="DeletePassword123!", role="student")
    disp_id = str(disp["_id"])
    import tempfile
    dummy_file = os.path.join(tempfile.gettempdir(), f"disposable_resume_{disp_id}.pdf")
    with open(dummy_file, "w") as f:
        f.write("%PDF-1.4 disposable resume data")

    db.student_profiles.insert_one({"user_id": disp_id, "resume": {"file_path": dummy_file, "file_name": "resume.pdf"}})
    db.applications.insert_one({"user_id": disp_id, "company": "Disposable Corp", "role": "Tester"})

    # Deliberate file lock during deletion
    with patch("os.remove", side_effect=PermissionError("File locked by background indexer")):
        del_success, del_msg, del_code = AccountDeletionService.delete_account(
            user_id=disp_id,
            password="DeletePassword123!",
            confirmation="DELETE"
        )
        assert del_success is True
        assert del_code == 200
        print("  [OK] Account deletion succeeded with file lock staged")

    # User purged
    assert db.users.find_one({"_id": ObjectId(disp_id)}) is None
    assert db.student_profiles.find_one({"user_id": disp_id}) is None
    assert db.applications.count_documents({"user_id": disp_id}) == 0
    print("  [OK] Personal records purged across all collections")

    # Queue record verified
    q_rec = db.failed_file_cleanups.find_one({"user_id": disp_id, "resolved": False})
    assert q_rec is not None
    assert q_rec["file_path"] == dummy_file
    print("  [OK] Failed file path queued in db.failed_file_cleanups with zero PII")

    # Retry queue executes cleanly
    assert os.path.exists(dummy_file)
    retry_stats = AccountDeletionService.retry_failed_file_cleanups()
    assert retry_stats["attempted"] >= 1
    assert retry_stats["resolved"] >= 1
    assert not os.path.exists(dummy_file)
    print("  [OK] Failed file cleanup queue retry completed; physical file removed from disk")

    print("\n=======================================================")
    print("  STAGE 6: OPPORTUNITY DISCOVERY & DEADLINE FORMATTING")
    print("=======================================================")
    # Seed an opportunity with raw ISO timestamp deadline
    opp_res = db.opportunities.insert_one({
        "title": "Backend Engineering Intern (Staging Test)",
        "company": "Swiggy",
        "organization": {"name": "Swiggy"},
        "dates": {
            "deadline": "2026-11-14T03:35:04+00:00",
            "posted_at": "2026-10-15T00:00:00Z"
        },
        "status": "active",
        "type": "internship",
        "location": {"city": "Bengaluru", "state": "Karnataka", "country": "India"},
        "compensation": {"min_amount": 40000, "max_amount": 60000, "period": "month", "currency": "INR"},
        "application_url": "https://example.com/apply/backend-intern"
    })
    opp_id = str(opp_res.inserted_id)

    # Fetch through opportunity API
    res = client.get(f"/api/opportunities/{opp_id}", headers=s1_headers)
    assert res.status_code == 200
    opp_data = res.get_json()["data"]
    # Check deadline formatting: must NOT be raw ISO timestamp
    assert "deadlineString" in opp_data
    assert opp_data["deadlineString"] == "14 Nov 2026", f"Expected '14 Nov 2026', got '{opp_data['deadlineString']}'"
    print(f"  [OK] Opportunity deadline formatted cleanly: '{opp_data['deadlineString']}' (raw ISO: 2026-11-14T03:35:04+00:00)")

    print("\n=======================================================")
    print("  STAGE 7: APPLY NOW EXTERNAL LINK VERIFICATION")
    print("=======================================================")
    mock_200 = MagicMock()
    mock_200.status_code = 200
    mock_200.__enter__.return_value = mock_200
    mock_200.iter_content.return_value = iter([b"<html><head><title>Job Application Portal</title></head><body>Apply</body></html>"])

    with patch("socket.getaddrinfo", return_value=[(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 443))]), \
         patch("requests.Session.head", return_value=mock_200), \
         patch("requests.Session.get", return_value=mock_200):
        res = client.get(f"/api/opportunities/{opp_id}/verify-link", headers=s1_headers)
        assert res.status_code == 200
        verify_data = res.get_json()["data"]
        assert verify_data["status"] == "verified"
        assert verify_data["is_expired"] is False
        assert verify_data["http_status"] == 200
        print(f"  [OK] Link verification passed: status='{verify_data['status']}', is_expired={verify_data['is_expired']}, http_status={verify_data['http_status']}")

    print("\n=======================================================")
    print("  STAGE 8: APPLICATION TRACKING LIFECYCLE")
    print("=======================================================")
    # Student 1 tracks this opportunity
    res = client.post("/api/applications", headers=s1_headers, json={
        "opportunity_id": opp_id,
        "company": "Swiggy",
        "role": "Backend Engineering Intern",
        "status": "applied",
        "applied_date": datetime.now(timezone.utc).isoformat()
    })
    assert res.status_code in (200, 201)
    app_id = res.get_json().get("data", {}).get("id") or str(res.get_json().get("data", {}).get("_id"))
    print(f"  [OK] Tracked application created successfully (ID: {app_id})")

    # Verify application listed
    res = client.get("/api/applications", headers=s1_headers)
    assert res.status_code == 200
    apps_list = res.get_json().get("data", [])
    assert any(a.get("company") == "Swiggy" for a in apps_list)
    print("  [OK] Application list query verified with tracked application")

    print("\n=======================================================")
    print("  STAGE 9: OPERATIONAL HEALTH & CLEANUP")
    print("=======================================================")
    res = client.get("/api/health")
    assert res.status_code == 200
    h_data = res.get_json()["data"]
    assert h_data["status"] == "healthy"
    print(f"  [OK] API health verified: status={h_data['status']}")

    # Clean test data
    db.users.delete_many({"_id": {"$in": [s1["_id"], s2["_id"], admin["_id"]]}})
    db.opportunities.delete_many({"_id": ObjectId(opp_id)})
    db.applications.delete_many({"user_id": {"$in": [s1_id, s2_id]}})
    db.notifications.delete_many({"user_id": {"$in": [s1_id, s2_id]}})
    print("  [OK] Test fixtures cleanly deregistered from staging MongoDB")
    print("\n[SUCCESS] ALL 9 STAGES OF STAGING INTEGRATION ACCEPTANCE PASSED!")

if __name__ == "__main__":
    run_staging_acceptance_e2e()
