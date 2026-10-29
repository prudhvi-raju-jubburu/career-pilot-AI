import os
import pytest
from flask import Flask, jsonify
from app import create_app
from app.scrapers.link_import_service import LinkImportService
from app.ai.resume_analyzer import ResumeAnalyzerService
from app.services.scheduler import init_scheduler
from app.models.user import UserModel
from app.utils.auth import generate_token

@pytest.fixture
def app_client():
    app = create_app()
    app.config["TESTING"] = True
    app.config["PROPAGATE_EXCEPTIONS"] = False
    with app.test_client() as client:
        yield client, app

def test_ssrf_ip_and_scheme_blocking():
    """
    Verifies that LinkImportService blocks Server-Side Request Forgery (SSRF) targets,
    including loopback, private networks, cloud metadata services, invalid schemes, and ports.
    """
    # Loopback targets (default port)
    safe, msg = LinkImportService.is_safe_public_url("http://127.0.0.1/api/users")
    assert not safe, "Loopback 127.0.0.1 must be blocked"
    assert "private, loopback, or internal" in msg

    # Localhost hostname
    safe, msg = LinkImportService.is_safe_public_url("http://localhost/admin")
    assert not safe, "localhost host must be blocked"
    assert "private or internal hosts" in msg

    # AWS / GCP / Azure metadata endpoint
    safe, msg = LinkImportService.is_safe_public_url("http://169.254.169.254/latest/meta-data/")
    assert not safe, "Link-local cloud metadata IP must be blocked"
    assert "private, loopback, or internal" in msg

    # RFC 1918 Private networks
    safe, msg = LinkImportService.is_safe_public_url("http://10.0.0.5/internal")
    assert not safe, "10.0.0.0/8 private network must be blocked"
    assert "private, loopback, or internal" in msg

    safe, msg = LinkImportService.is_safe_public_url("http://192.168.1.100/dashboard")
    assert not safe, "192.168.0.0/16 private network must be blocked"
    assert "private, loopback, or internal" in msg

    safe, msg = LinkImportService.is_safe_public_url("http://172.16.0.1/status")
    assert not safe, "172.16.0.0/12 private network must be blocked"
    assert "private, loopback, or internal" in msg

    # Non-HTTP schemes
    safe, msg = LinkImportService.is_safe_public_url("file:///etc/passwd")
    assert not safe, "file:// scheme must be blocked"
    assert "Only HTTP and HTTPS" in msg

    safe, msg = LinkImportService.is_safe_public_url("ftp://ftp.example.com/file.txt")
    assert not safe, "ftp:// scheme must be blocked"

    # Non-standard internal ports
    safe, msg = LinkImportService.is_safe_public_url("http://example.com:27017/db")
    assert not safe, "Database port 27017 must be blocked"
    assert "Port 27017 is not permitted" in msg

    safe, msg = LinkImportService.is_safe_public_url("http://example.com:22/ssh")
    assert not safe, "SSH port 22 must be blocked"
    assert "Port 22 is not permitted" in msg

    # Oversized URL (>2048 chars)
    giant_url = "https://example.com/jobs/" + ("a" * 2050)
    safe, msg = LinkImportService.is_safe_public_url(giant_url)
    assert not safe, "Oversized URL must be blocked"
    assert "maximum permitted length" in msg

    # Legitimate public URL
    safe, msg = LinkImportService.is_safe_public_url("https://example.com/careers/software-engineer")
    assert safe, f"Standard public HTTPS URL should be permitted, got: {msg}"

def test_security_headers_on_all_responses(app_client):
    """
    Verifies that all API responses include defensive security hardening headers:
    X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and X-XSS-Protection.
    """
    client, app = app_client
    resp = client.get("/api/health")
    assert resp.status_code == 200

    headers = resp.headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert headers.get("X-XSS-Protection") == "1; mode=block"

def test_internal_server_error_sanitization(app_client):
    """
    Verifies that 500 internal server errors mask raw exception messages and tracebacks,
    returning a sanitized error code to avoid secret or DB structure disclosure.
    """
    client, app = app_client

    # Define a failing endpoint
    @app.route("/api/test-server-error-trigger")
    def trigger_error():
        raise RuntimeError("SecretDBConnectionPassword123")

    resp = client.get("/api/test-server-error-trigger")
    assert resp.status_code == 500
    data = resp.get_json()
    assert data["success"] is False
    assert data["error"] == "INTERNAL_SERVER_ERROR"
    assert "SecretDBConnectionPassword123" not in resp.get_data(as_text=True)

def test_registration_input_length_limits(app_client):
    """
    Verifies that auth registration rejects payloads exceeding reasonable length bounds,
    mitigating denial-of-service and buffer bloat attacks.
    """
    client, app = app_client

    # Name exceeding 100 characters
    long_name = "A" * 105
    resp = client.post("/api/auth/register", json={
        "name": long_name,
        "email": "test_length@example.com",
        "password": "valid_password_123"
    })
    assert resp.status_code == 400
    assert "cannot exceed 100 characters" in resp.get_json()["message"]

    # Email exceeding 255 characters
    long_email = ("b" * 250) + "@example.com"
    resp = client.post("/api/auth/register", json={
        "name": "Valid Name",
        "email": long_email,
        "password": "valid_password_123"
    })
    assert resp.status_code == 400

    # Password exceeding 256 characters (bcrypt DoS defense)
    long_pwd = "P" * 300
    resp = client.post("/api/auth/register", json={
        "name": "Valid Name",
        "email": "test_pwd_len@example.com",
        "password": long_pwd
    })
    assert resp.status_code == 400
    assert "cannot exceed 256 characters" in resp.get_json()["message"]

def test_scheduler_enable_env_guard():
    """
    Verifies that background scheduler respects ENABLE_BACKGROUND_SCHEDULER=false
    to allow safe multi-worker deployment configurations without duplicate job runs.
    """
    os.environ["ENABLE_BACKGROUND_SCHEDULER"] = "false"
    try:
        scheduler = init_scheduler()
        assert scheduler is None, "Scheduler must not initialize when ENABLE_BACKGROUND_SCHEDULER=false"
    finally:
        os.environ.pop("ENABLE_BACKGROUND_SCHEDULER", None)

def test_ai_prompt_injection_boundary():
    """
    Verifies that ResumeAnalyzerService frames user input with clear untrusted boundaries
    and explicitly instructs the model not to interpret candidate resume text as instructions.
    """
    prompt = ResumeAnalyzerService.SYSTEM_PROMPT
    assert "UNTRUSTED RESUME BOUNDARY" in prompt
    assert "<candidate_resume>" in prompt

def test_feedback_action_and_reason_validation(app_client):
    """
    Verifies that feedback endpoints enforce strict allowlists for interaction actions
    and bounds on reason text length.
    """
    client, app = app_client

    with app.app_context():
        test_email = "test_feedback_hardening@example.com"
        user = UserModel.find_by_email(test_email)
        if not user:
            user = UserModel.create_user(name="Feedback Tester", email=test_email, password="password123")
        token = generate_token(str(user["_id"]), test_email)

    headers = {"Authorization": f"Bearer {token}"}

    # Invalid action
    resp = client.post("/api/feedback", headers=headers, json={
        "opportunity_id": "opp_123",
        "action": "malicious_unsupported_action"
    })
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "VALIDATION_ERROR"

    # Excessive reason length
    resp = client.post("/api/feedback", headers=headers, json={
        "opportunity_id": "opp_123",
        "action": "dismiss",
        "reason": "R" * 250
    })
    assert resp.status_code == 400
    assert "up to 200 characters" in resp.get_json()["message"]

def test_import_url_payload_validation(app_client):
    """
    Verifies that /api/opportunities/import-url (or /api/import-url) validates payload type.
    """
    client, app = app_client

    with app.app_context():
        test_email = "test_import_val@example.com"
        user = UserModel.find_by_email(test_email)
        if not user:
            user = UserModel.create_user(name="Import Tester", email=test_email, password="password123")
        token = generate_token(str(user["_id"]), test_email)

    headers = {"Authorization": f"Bearer {token}"}

    # Non-string URL payload
    resp = client.post("/api/opportunities/import-url", headers=headers, json={"url": 12345})
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "VALIDATION_ERROR"

def test_cross_user_isolation_for_interviews_and_notifications(app_client):
    """
    Verifies that User B cannot access, modify, schedule events on, or delete
    User A's applications, interview events, or notifications.
    """
    client, app = app_client
    from app.models.application import ApplicationModel
    from app.models.notification import NotificationModel

    with app.app_context():
        # Setup User A
        email_a = "user_alpha_hardening@example.com"
        user_a = UserModel.find_by_email(email_a)
        if not user_a:
            user_a = UserModel.create_user("User Alpha", email_a, "password123")
        token_a = generate_token(str(user_a["_id"]), email_a)

        # Setup User B
        email_b = "user_bravo_hardening@example.com"
        user_b = UserModel.find_by_email(email_b)
        if not user_b:
            user_b = UserModel.create_user("User Bravo", email_b, "password123")
        token_b = generate_token(str(user_b["_id"]), email_b)

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates an application
    create_resp = client.post("/api/applications", headers=headers_a, json={
        "company": "SecureCorp",
        "role": "Backend Engineer",
        "status": "Applied"
    })
    assert create_resp.status_code == 201
    app_id = create_resp.get_json()["data"]["id"]

    # User B tries to view User A's application -> 404
    get_resp = client.get(f"/api/applications/{app_id}", headers=headers_b)
    assert get_resp.status_code == 404

    # User B tries to update User A's application -> 404
    put_resp = client.put(f"/api/applications/{app_id}", headers=headers_b, json={"notes": "Hacked"})
    assert put_resp.status_code == 404

    # User B tries to view User A's application events -> 404
    events_resp = client.get(f"/api/applications/{app_id}/events", headers=headers_b)
    assert events_resp.status_code == 404

    # User B tries to create an interview event on User A's application -> 404
    post_event_resp = client.post(f"/api/applications/{app_id}/events", headers=headers_b, json={
        "title": "Malicious Interview",
        "event_type": "Technical Interview",
        "start_time": "2026-11-01T10:00:00Z",
        "end_time": "2026-11-01T11:00:00Z"
    })
    assert post_event_resp.status_code == 404

    # User B tries to delete User A's application -> 404
    del_resp = client.delete(f"/api/applications/{app_id}", headers=headers_b)
    assert del_resp.status_code == 404

    # Verify notification isolation
    with app.app_context():
        notif_a = NotificationModel.create_notification(
            user_id=str(user_a["_id"]),
            title="Private Alert",
            message="Confidential alert for User A",
            notif_type="system_notice"
        )
        notif_a_id = notif_a["id"]

    # User B tries to mark read User A's notification
    mark_resp = client.patch(f"/api/notifications/{notif_a_id}/read", headers=headers_b)
    # Even if successful HTTP 200, it marks only for matched user_id in DB, so notif_a remains unread
    with app.app_context():
        from bson import ObjectId
        fetched = NotificationModel.get_collection().find_one({"_id": ObjectId(notif_a_id)})
        assert fetched["read"] is False, "User B must not be able to mark User A's notification as read"

    # User B tries to delete User A's notification -> 404
    del_notif_resp = client.delete(f"/api/notifications/{notif_a_id}", headers=headers_b)
    assert del_notif_resp.status_code == 404

