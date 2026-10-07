import json
import pytest
from app import create_app
from app.config.db import Database
from app.models.application import ApplicationModel
from app.models.notification import NotificationModel
from app.models.source_run import SourceRunModel
from app.models.opportunity import OpportunityModel

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def get_auth_token(client, email="prod_test@student.edu"):
    client.post("/api/auth/register", json={
        "name": "Production Test Student",
        "email": email,
        "password": "Password123!"
    })
    res = client.post("/api/auth/login", json={
        "email": email,
        "password": "Password123!"
    })
    return res.get_json()["data"]["token"]

def test_applications_lifecycle(client):
    token = get_auth_token(client, "app_lifecycle@student.edu")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Application
    create_res = client.post("/api/applications", headers=headers, json={
        "company": "Real Scale Technologies",
        "role": "Backend Infrastructure Intern",
        "type": "Internship",
        "status": "Saved",
        "location": "Bengaluru",
        "notes": "Spoke with recruiter at career fair"
    })
    assert create_res.status_code == 201
    app_data = create_res.get_json()["data"]
    app_id = app_data["id"]
    assert app_data["company"] == "Real Scale Technologies"
    assert app_data["status"] == "Saved"

    # 2. List Applications
    list_res = client.get("/api/applications", headers=headers)
    assert list_res.status_code == 200
    apps = list_res.get_json()["data"]
    assert any(a["id"] == app_id for a in apps)

    # 3. Update Stage (advance to Applied)
    stage_res = client.patch(f"/api/applications/{app_id}/stage", headers=headers, json={
        "status": "Applied",
        "note": "Submitted official portal application"
    })
    assert stage_res.status_code == 200
    updated_app = stage_res.get_json()["data"]
    assert updated_app["status"] == "Applied"
    assert len(updated_app["timeline"]) >= 2

    # 4. Delete Application
    del_res = client.delete(f"/api/applications/{app_id}", headers=headers)
    assert del_res.status_code == 200

def test_sources_and_health_endpoints(client):
    # 1. Health endpoint
    health_res = client.get("/api/health")
    assert health_res.status_code == 200
    h_data = health_res.get_json()["data"]
    assert h_data["service"] == "careerpilot-ai-backend"
    assert "database" in h_data

    # 2. Sources status endpoint
    sources_res = client.get("/api/sources/status")
    assert sources_res.status_code == 200
    sources = sources_res.get_json()["data"]
    assert len(sources) >= 5
    source_names = [s["source_name"] for s in sources]
    assert "remotive_api" in source_names
    assert "codeforces_api" in source_names

def test_dashboard_stats_endpoint(client):
    token = get_auth_token(client, "dashboard_stats@student.edu")
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/dashboard/stats", headers=headers)
    assert res.status_code == 200
    stats = res.get_json()["data"]
    assert "total_opportunities" in stats
    assert "pipeline" in stats
    assert "sparkline_data" in stats
    assert len(stats["sparkline_data"]) == 7

def test_notifications_and_digest(client):
    token = get_auth_token(client, "notif_test@student.edu")
    headers = {"Authorization": f"Bearer {token}"}

    # List notifications
    res = client.get("/api/notifications", headers=headers)
    assert res.status_code == 200
    notifs = res.get_json()["data"]
    assert len(notifs) >= 1

    # Daily digest
    digest_res = client.get("/api/notifications/digest", headers=headers)
    assert digest_res.status_code == 200
    d_data = digest_res.get_json()["data"]
    assert "summary" in d_data
    assert "top_upcoming_deadlines" in d_data

def test_advisor_chat_and_history(client):
    token = get_auth_token(client, "advisor_test@student.edu")
    headers = {"Authorization": f"Bearer {token}"}

    chat_res = client.post("/api/advisor/chat", headers=headers, json={
        "message": "How do I optimize my resume bullet points for software engineering internships?"
    })
    assert chat_res.status_code == 200
    data = chat_res.get_json()["data"]
    assert "content" in data
    assert len(data["content"]) > 20

    # Retrieve history
    hist_res = client.get("/api/advisor/history", headers=headers)
    assert hist_res.status_code == 200
    messages = hist_res.get_json()["data"]
    assert len(messages) >= 2
