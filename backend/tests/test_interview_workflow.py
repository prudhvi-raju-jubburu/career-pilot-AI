import pytest
import uuid
from datetime import datetime, timezone, timedelta
from bson import ObjectId

from app import create_app
from app.models.user import UserModel
from app.models.profile import ProfileModel
from app.models.application import ApplicationModel
from app.models.interview_event import InterviewEventModel
from app.models.interview_prep import InterviewPrepModel
from app.services.calendar_service import CalendarExportService
from app.services.interview_prep_service import InterviewPrepService
from app.services.notification_service import NotificationService
from app.utils.auth import generate_token

@pytest.fixture
def test_app():
    app = create_app()
    app.config["TESTING"] = True
    return app

@pytest.fixture
def auth_users(test_app):
    with test_app.app_context():
        u1_email = f"student1_{uuid.uuid4().hex[:8]}@example.com"
        u2_email = f"student2_{uuid.uuid4().hex[:8]}@example.com"
        user1 = UserModel.create_user(name="Alice Engineer", email=u1_email, password="password123")
        user2 = UserModel.create_user(name="Bob Designer", email=u2_email, password="password123")
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

def test_application_model_extended_fields(test_app, auth_users):
    """Verifies contact_name, contact_info, next_action, and submission_date persistence."""
    with test_app.app_context():
        u1_id = str(auth_users["user1"]["_id"])
        payload = {
            "company": "Anthropic",
            "role": "Research Engineer",
            "type": "Job",
            "status": "Applied",
            "submission_date": "2026-10-15",
            "contact_name": "Dr. Sarah Lin",
            "contact_info": "slin@anthropic.com",
            "next_action": "Complete technical take-home assignment",
            "follow_up_date": "2026-10-22"
        }
        app_doc = ApplicationModel.create_application(u1_id, payload)
        assert app_doc is not None
        assert app_doc["contact_name"] == "Dr. Sarah Lin"
        assert app_doc["contact_info"] == "slin@anthropic.com"
        assert app_doc["next_action"] == "Complete technical take-home assignment"
        assert app_doc["submission_date"] == "2026-10-15"

        # Update fields
        updated = ApplicationModel.update_application(app_doc["id"], u1_id, {
            "nextAction": "Send follow-up email after review",
            "contactName": "Dr. Sarah Lin (Hiring Manager)"
        })
        assert updated["next_action"] == "Send follow-up email after review"
        assert updated["contact_name"] == "Dr. Sarah Lin (Hiring Manager)"

def test_interview_event_model_crud_and_validation(test_app, auth_users):
    """Tests interview event scheduling, protocol validation, and ownership."""
    with test_app.app_context():
        u1_id = str(auth_users["user1"]["_id"])
        u2_id = str(auth_users["user2"]["_id"])

        app_doc = ApplicationModel.create_application(u1_id, {
            "company": "Stripe",
            "role": "Backend Engineer",
            "status": "Interview"
        })
        app_id = app_doc["id"]

        now_utc = datetime.now(timezone.utc)
        start_iso = (now_utc + timedelta(days=2)).isoformat()
        end_iso = (now_utc + timedelta(days=2, hours=1)).isoformat()

        # 1. Valid Event Creation
        event_payload = {
            "title": "System Design Round",
            "event_type": "technical_interview",
            "start_time": start_iso,
            "end_time": end_iso,
            "timezone": "America/New_York",
            "meeting_link": "https://meet.google.com/abc-defg-hij",
            "location": "Google Meet",
            "notes": "Bring distributed caching notes"
        }
        ev = InterviewEventModel.create_event(u1_id, app_id, event_payload)
        assert ev is not None
        assert ev["title"] == "System Design Round"
        assert ev["status"] == "scheduled"
        assert ev["meeting_link"] == "https://meet.google.com/abc-defg-hij"

        # 2. Reject Disallowed Protocols
        with pytest.raises(ValueError, match="must begin with http:// or https://"):
            InterviewEventModel.create_event(u1_id, app_id, {
                "title": "Malicious Round",
                "start_time": start_iso,
                "end_time": end_iso,
                "meeting_link": "javascript:alert(1)"
            })

        # 3. Reject end_time before start_time
        with pytest.raises(ValueError, match="start_time cannot be after end_time"):
            InterviewEventModel.create_event(u1_id, app_id, {
                "title": "Time Travel Round",
                "start_time": end_iso,
                "end_time": start_iso
            })

        # 4. User Isolation
        u2_events = InterviewEventModel.find_by_user(u2_id)
        assert len(u2_events) == 0
        u2_lookup = InterviewEventModel.find_by_id(ev["id"], user_id=u2_id)
        assert u2_lookup is None

        # 5. Status Update and Cancellation
        updated_ev = InterviewEventModel.update_event(ev["id"], u1_id, {"status": "cancelled"})
        assert updated_ev["status"] == "cancelled"

def test_calendar_service_rfc5545_compliance(test_app):
    """Verifies strict RFC 5545 VCALENDAR generation, byte-level line folding, and escaping."""
    event = {
        "id": "67104b901234567890abcdef",
        "title": "Senior Staff Architect Technical Evaluation — Final Round",
        "event_type": "technical_interview",
        "start_time": "2026-10-25T14:30:00Z",
        "end_time": "2026-10-25T16:00:00Z",
        "meeting_link": "https://meet.google.com/xyz-uvw-rst",
        "location": "Google Meet Video Call",
        "notes": "Comprehensive round; review microservices, event streaming, and fault tolerance."
    }

    ics = CalendarExportService.generate_ics(event)

    # 1. Structural checks
    assert "BEGIN:VCALENDAR" in ics
    assert "VERSION:2.0" in ics
    assert "PRODID:-//CareerPilot AI//Interview Scheduler//EN" in ics
    assert "BEGIN:VEVENT" in ics
    assert "UID:67104b901234567890abcdef@careerpilot.ai" in ics
    assert "SUMMARY:Senior Staff Architect Technical Evaluation — Final Round" in ics.replace("\r\n ", "")
    assert "DTSTART:20261025T143000Z" in ics
    assert "DTEND:20261025T160000Z" in ics
    assert "END:VEVENT" in ics
    assert "END:VCALENDAR" in ics

    # 2. Line Folding check: Every line must be <= 75 UTF-8 octets
    lines = ics.split("\r\n")
    for line in lines:
        assert len(line.encode("utf-8")) <= 75

def test_calendar_export_endpoint(test_app, auth_users):
    """Tests the GET /api/applications/<app_id>/events/<event_id>/calendar.ics endpoint."""
    client = test_app.test_client()
    with test_app.app_context():
        u1_id = str(auth_users["user1"]["_id"])
        app_doc = ApplicationModel.create_application(u1_id, {
            "company": "Figma",
            "role": "Frontend Architect",
            "status": "Interview"
        })
        app_id = app_doc["id"]

        now_utc = datetime.now(timezone.utc)
        ev = InterviewEventModel.create_event(u1_id, app_id, {
            "title": "Figma Systems Interview",
            "start_time": (now_utc + timedelta(days=3)).isoformat(),
            "end_time": (now_utc + timedelta(days=3, hours=1)).isoformat()
        })
        ev_id = ev["id"]

        # Call endpoint with auth headers
        res = client.get(
            f"/api/applications/{app_id}/events/{ev_id}/calendar.ics",
            headers=auth_users["headers1"]
        )
        assert res.status_code == 200
        assert "text/calendar" in res.content_type
        assert "BEGIN:VCALENDAR" in res.data.decode("utf-8")

        # User 2 cannot download User 1's calendar
        res_u2 = client.get(
            f"/api/applications/{app_id}/events/{ev_id}/calendar.ics",
            headers=auth_users["headers2"]
        )
        assert res_u2.status_code == 404

def test_grounded_interview_prep_and_checklist(test_app, auth_users):
    """Tests grounded interview prep generation and atomic checklist progress persistence."""
    with test_app.app_context():
        u1_id = str(auth_users["user1"]["_id"])

        # 1. Populate profile with student projects
        profile_col = ProfileModel.get_collection()
        profile_col.update_one(
            {"user_id": ObjectId(u1_id)},
            {"$set": {
                "skills": {"technical": ["React", "Python", "MongoDB", "FastAPI", "Docker"]},
                "projects": [
                    {
                        "name": "CloudScale Distributed Cache",
                        "technologies": ["Python", "Redis", "Docker"],
                        "description": "High-throughput in-memory caching system with TTL eviction."
                    },
                    {
                        "name": "Realtime Collaboration Canvas",
                        "technologies": ["React", "WebSockets", "Node.js"],
                        "description": "Multi-user whiteboard with operational transformation conflict resolution."
                    }
                ],
                "education": {"degree": "Bachelor of Technology", "branch": "Computer Science"}
            }},
            upsert=True
        )

        # 2. Create application
        app_doc = ApplicationModel.create_application(u1_id, {
            "company": "Netflix",
            "role": "Senior Distributed Systems Engineer",
            "status": "Interview"
        })
        app_id = app_doc["id"]

        # 3. Generate prep pack
        prep_pack = InterviewPrepService.get_or_generate_prep_pack(u1_id, app_id, force_refresh=True)
        assert prep_pack is not None
        assert "disclaimer" in prep_pack
        assert "checklist" in prep_pack
        assert len(prep_pack["checklist"]) >= 5

        # Check grounding: projects deep dives should mention candidate's real project names
        p_dives = prep_pack.get("project_deep_dives") or []
        assert len(p_dives) > 0
        proj_names = [p["project_name"] for p in p_dives]
        assert "CloudScale Distributed Cache" in proj_names

        # 4. Toggle checklist item
        first_item = prep_pack["checklist"][0]
        task_id = first_item["id"]
        assert first_item["completed"] is False

        updated_pack = InterviewPrepService.toggle_checklist_item(u1_id, app_id, task_id, completed=True)
        assert updated_pack is not None
        updated_item = next(i for i in updated_pack["checklist"] if i["id"] == task_id)
        assert updated_item["completed"] is True

        # Toggle back to False
        toggled_back = InterviewPrepService.toggle_checklist_item(u1_id, app_id, task_id, completed=False)
        assert next(i for i in toggled_back["checklist"] if i["id"] == task_id)["completed"] is False

def test_scheduled_interview_and_followup_reminders(test_app, auth_users):
    """Verifies 24h & 1h interview notifications and follow-up alerts with deduplication."""
    with test_app.app_context():
        u1_id = str(auth_users["user1"]["_id"])
        now_utc = datetime.now(timezone.utc)
        today_date = now_utc.strftime("%Y-%m-%d")

        # 1. Setup Application with follow_up_date due today
        app_doc = ApplicationModel.create_application(u1_id, {
            "company": "OpenAI",
            "role": "Platform Engineer",
            "status": "Applied",
            "follow_up_date": today_date,
            "next_action": "Follow up with recruiting coordinator"
        })
        app_id = app_doc["id"]

        # 2. Setup upcoming InterviewEvent starting in 20 hours (within 24h window)
        ev_24h = InterviewEventModel.create_event(u1_id, app_id, {
            "title": "OpenAI Architecture Screening",
            "start_time": (now_utc + timedelta(hours=20)).isoformat(),
            "end_time": (now_utc + timedelta(hours=21)).isoformat()
        })

        # 3. Setup upcoming InterviewEvent starting in 30 minutes (within 1h window)
        ev_1h = InterviewEventModel.create_event(u1_id, app_id, {
            "title": "Live Coding Session",
            "start_time": (now_utc + timedelta(minutes=30)).isoformat(),
            "end_time": (now_utc + timedelta(minutes=90)).isoformat()
        })

        # 4. Setup cancelled event that should NOT trigger a notification
        ev_cancelled = InterviewEventModel.create_event(u1_id, app_id, {
            "title": "Cancelled Phone Screen",
            "start_time": (now_utc + timedelta(hours=5)).isoformat(),
            "end_time": (now_utc + timedelta(hours=6)).isoformat()
        })
        InterviewEventModel.update_event(ev_cancelled["id"], u1_id, {"status": "cancelled"})

        # Run interview reminders scan
        sent_interview = NotificationService.check_and_notify_interview_reminders()
        assert sent_interview >= 2  # Both 24h and 1h alerts dispatched

        # Second run should deduplicate and return 0
        deduped_interview = NotificationService.check_and_notify_interview_reminders()
        assert deduped_interview == 0

        # Run application follow-up scan
        sent_followups = NotificationService.check_and_notify_application_followups()
        assert sent_followups >= 1

        # Second run should deduplicate
        deduped_followups = NotificationService.check_and_notify_application_followups()
        assert deduped_followups == 0
