import pytest
import uuid
from datetime import datetime, timezone, timedelta
from bson import ObjectId

from app import create_app
from app.config.db import Database
from app.models.user import UserModel
from app.models.profile import ProfileModel
from app.models.opportunity import OpportunityModel
from app.models.notification import NotificationModel, CANONICAL_NOTIFICATION_TYPES
from app.models.notification_preference import NotificationPreferenceModel
from app.models.digest_delivery import DigestDeliveryModel
from app.services.email_service import EmailService
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
        user1 = UserModel.create_user(name="Student One", email=u1_email, password="password123")
        user2 = UserModel.create_user(name="Student Two", email=u2_email, password="password123")
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

def test_notification_creation_and_deduplication(test_app, auth_users):
    """Test notification insertion and dedupe_key uniqueness."""
    with test_app.app_context():
        u1_id = str(auth_users["user1"]["_id"])
        dedupe = f"dedupe_test_{uuid.uuid4().hex}"

        # 1. First insert
        n1 = NotificationModel.create_notification(
            user_id=u1_id,
            title="First Match Alert",
            message="You matched with Stripe!",
            notif_type="new_matching_opportunity",
            dedupe_key=dedupe
        )
        assert n1 is not None
        assert n1["title"] == "First Match Alert"
        assert n1["read"] is False

        # 2. Second insert with identical dedupe key should not duplicate
        n2 = NotificationModel.create_notification(
            user_id=u1_id,
            title="Second Match Alert",
            message="Duplicate attempt!",
            notif_type="new_matching_opportunity",
            dedupe_key=dedupe
        )
        assert n2 is not None
        assert n2["id"] == n1["id"]

        # Verify only 1 document exists in MongoDB with this dedupe_key
        col = NotificationModel.get_collection()
        count = col.count_documents({"dedupe_key": dedupe})
        assert count == 1

def test_notification_user_isolation(test_app, auth_users):
    """Ensure notifications belonging to User 1 cannot be read or deleted by User 2."""
    with test_app.app_context():
        u1_id = str(auth_users["user1"]["_id"])
        u2_id = str(auth_users["user2"]["_id"])

        notif = NotificationModel.create_notification(
            user_id=u1_id,
            title="Private Alert for User 1",
            message="Confidential match data",
            notif_type="system_notice"
        )
        notif_id = notif["id"]

        # User 2 tries to mark as read -> Should fail / return False
        marked = NotificationModel.mark_read(notif_id, user_id=u2_id)
        assert marked is False

        # User 2 tries to delete -> Should fail / return False
        deleted = NotificationModel.delete_notification(notif_id, user_id=u2_id)
        assert deleted is False

        # Verify notif is still unread for User 1
        u1_notifs = NotificationModel.find_by_user(u1_id)
        matching = [n for n in u1_notifs if n["id"] == notif_id]
        assert len(matching) == 1
        assert matching[0]["read"] is False

        # User 1 marks as read -> succeeds
        assert NotificationModel.mark_read(notif_id, user_id=u1_id) is True
        # User 1 deletes -> succeeds
        assert NotificationModel.delete_notification(notif_id, user_id=u1_id) is True

def test_read_unread_state_transitions(test_app, auth_users):
    """Test transitions between unread and read status and unread count tally."""
    with test_app.app_context():
        u1_id = str(auth_users["user1"]["_id"])
        col = NotificationModel.get_collection()
        col.delete_many({"user_id": u1_id})

        # Create 3 unread notifications
        n1 = NotificationModel.create_notification(u1_id, "Alert 1", "Msg 1")
        n2 = NotificationModel.create_notification(u1_id, "Alert 2", "Msg 2")
        n3 = NotificationModel.create_notification(u1_id, "Alert 3", "Msg 3")

        assert NotificationModel.get_unread_count(u1_id) == 3

        # Mark 1 as read
        NotificationModel.mark_read(n1["id"], u1_id)
        assert NotificationModel.get_unread_count(u1_id) == 2

        # Mark all as read
        modified = NotificationModel.mark_all_read(u1_id)
        assert modified == 2
        assert NotificationModel.get_unread_count(u1_id) == 0

def test_notification_preferences_defaults_and_validation(test_app, auth_users):
    """Test default values, timezone validation, and score clamping in preferences."""
    with test_app.app_context():
        u1_id = str(auth_users["user1"]["_id"])

        # Fetch defaults
        prefs = NotificationPreferenceModel.get_preferences(u1_id)
        assert prefs["in_app_enabled"] is True
        assert prefs["email_digest_enabled"] is True
        assert prefs["digest_frequency"] == "daily"
        assert prefs["timezone"] == "Asia/Kolkata"
        assert prefs["min_match_score"] == 70

        # Update with invalid timezone & out-of-bound min_match_score
        updated = NotificationPreferenceModel.update_preferences(u1_id, {
            "timezone": "Invalid/Alien_Galaxy",
            "min_match_score": 150,
            "digest_frequency": "super_frequent"  # invalid frequency
        })

        assert updated["timezone"] == "UTC"  # Safe fallback
        assert updated["min_match_score"] == 95  # Clamped to upper bound 95
        assert updated["digest_frequency"] == "daily"  # Fallback to daily

        # Update with valid inputs
        valid_update = NotificationPreferenceModel.update_preferences(u1_id, {
            "timezone": "America/New_York",
            "digest_frequency": "weekly",
            "min_match_score": 80,
            "categories": ["job", "internship"]
        })
        assert valid_update["timezone"] == "America/New_York"
        assert valid_update["digest_frequency"] == "weekly"
        assert valid_update["min_match_score"] == 80
        assert valid_update["categories"] == ["job", "internship"]

def test_new_opportunity_matching_respects_eligibility(test_app, auth_users):
    """
    CRITICAL INVARIANT: Ineligible students must NEVER receive notifications for
    ineligible opportunities, even if keyword or skill scores are high.
    """
    with test_app.app_context():
        u1_id = str(auth_users["user1"]["_id"])
        
        # Setup student profile: CGPA 7.0, Computer Science, Grad year 2026
        prof_col = ProfileModel.get_collection()
        prof_col.delete_many({"user_id": u1_id})
        prof_col.insert_one({
            "user_id": u1_id,
            "personal": {"full_name": "Eligible Student", "email": "student@example.com"},
            "education": {
                "cgpa": {"value": 7.0},
                "branch": {"value": "Computer Science"},
                "graduation_year": {"value": 2026}
            },
            "skills": [{"name": "Python"}, {"name": "React"}],
            "preferences": {
                "roles": ["Software Engineering Intern"],
                "notifications": {
                    "in_app_enabled": True,
                    "categories": ["job", "internship"],
                    "min_match_score": 40
                }
            }
        })

        # Opportunity 1: Ineligible (Cutoff CGPA 8.5)
        ineligible_opp = {
            "_id": ObjectId(),
            "title": "Principal AI Architect",
            "organization": {"name": "BigTech High Bar"},
            "type": "job",
            "status": "active",
            "skills": ["Python", "React"],
            "education_requirements": {
                "cgpa_min": 8.5,
                "branches": ["Computer Science"],
                "graduation_years": [2026]
            },
            "dates": {"deadline": "2028-12-31"}
        }

        NotificationService.match_new_opportunity_to_students(ineligible_opp)

        # Verify no notification was created for u1 because u1's CGPA (7.0) is below cutoff (8.5)
        u1_ineligible_notifs = [
            n for n in NotificationModel.find_by_user(u1_id)
            if n.get("opportunity_id") == str(ineligible_opp["_id"])
        ]
        assert len(u1_ineligible_notifs) == 0

        # Opportunity 2: Eligible (Cutoff CGPA 6.5, Grad year 2026)
        eligible_opp = {
            "_id": ObjectId(),
            "title": "Software Engineering Intern",
            "organization": {"name": "TechStars Labs"},
            "type": "internship",
            "status": "active",
            "skills": ["Python", "React"],
            "education_requirements": {
                "cgpa_min": 6.5,
                "branches": ["Computer Science"],
                "graduation_years": [2026]
            },
            "dates": {"deadline": "2028-12-31"}
        }

        NotificationService.match_new_opportunity_to_students(eligible_opp)

        notifs = NotificationModel.find_by_user(u1_id)
        opp_notifs = [n for n in notifs if n.get("opportunity_id") == str(eligible_opp["_id"])]
        assert len(opp_notifs) == 1
        assert "TechStars Labs" in opp_notifs[0]["title"]

        # Running matching again on the same opportunity should dedupe and not create another for u1
        NotificationService.match_new_opportunity_to_students(eligible_opp)
        notifs_after = NotificationModel.find_by_user(u1_id)
        opp_notifs_after = [n for n in notifs_after if n.get("opportunity_id") == str(eligible_opp["_id"])]
        assert len(opp_notifs_after) == 1

def test_expired_opportunity_excluded_from_matching(test_app, auth_users):
    """Closed or expired opportunities must never trigger new match notifications."""
    with test_app.app_context():
        expired_opp = {
            "_id": ObjectId(),
            "title": "Expired Hackathon",
            "organization": {"name": "Past Event"},
            "type": "hackathon",
            "status": "active",
            "dates": {"deadline": "2020-01-01"}  # Past date
        }
        count = NotificationService.match_new_opportunity_to_students(expired_opp)
        assert count == 0

        closed_opp = {
            "_id": ObjectId(),
            "title": "Closed Role",
            "organization": {"name": "Closed Corp"},
            "type": "job",
            "status": "closed",
            "dates": {"deadline": "2029-01-01"}
        }
        count_closed = NotificationService.match_new_opportunity_to_students(closed_opp)
        assert count_closed == 0

def test_deadline_reminder_scan(test_app, auth_users):
    """Test upcoming deadline reminder dispatch for saved opportunities."""
    with test_app.app_context():
        u1_id = str(auth_users["user1"]["_id"])
        
        # Create an opportunity closing in 24 hours
        tomorrow_iso = (datetime.now(timezone.utc) + timedelta(hours=24)).strftime("%Y-%m-%d")
        opp_col = OpportunityModel.get_collection()
        opp_res = opp_col.insert_one({
            "title": "Urgent Hackathon Entry",
            "organization": {"name": "Hackathon Org"},
            "type": "hackathon",
            "status": "active",
            "dates": {"deadline": tomorrow_iso}
        })
        opp_id = str(opp_res.inserted_id)

        # Save opportunity in student profile
        prof_col = ProfileModel.get_collection()
        prof_col.update_one(
            {"user_id": u1_id},
            {"$set": {
                "saved_opportunities": [opp_id],
                "preferences.notifications.in_app_enabled": True,
                "preferences.notifications.deadline_reminders": True
            }},
            upsert=True
        )

        # Trigger deadline reminders scan
        count = NotificationService.check_and_notify_upcoming_deadlines()
        assert count >= 1

        notifs = NotificationModel.find_by_user(u1_id)
        deadline_notifs = [n for n in notifs if n.get("opportunity_id") == opp_id and n.get("type") == "deadline_reminder"]
        assert len(deadline_notifs) == 1
        assert "Deadline Approaching" in deadline_notifs[0]["title"]

def test_digest_delivery_idempotency(test_app, auth_users):
    """Test DigestDeliveryModel records delivery and prevents duplicate runs."""
    with test_app.app_context():
        u1_id = str(auth_users["user1"]["_id"])
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # Initial check -> False
        assert DigestDeliveryModel.has_delivered_today(u1_id, today, "daily") is False

        # Record delivery
        DigestDeliveryModel.record_delivery(
            user_id=u1_id,
            recipient_email="student@example.com",
            digest_date=today,
            frequency="daily",
            opportunity_ids=["opp_1", "opp_2"],
            status="simulated"
        )

        # Check again -> True
        assert DigestDeliveryModel.has_delivered_today(u1_id, today, "daily") is True

        # Second record with same key should be handled idempotently
        rec = DigestDeliveryModel.record_delivery(
            user_id=u1_id,
            recipient_email="student@example.com",
            digest_date=today,
            frequency="daily",
            status="simulated"
        )
        assert rec is not None

def test_email_service_escaping_and_safe_links(test_app):
    """Test HTML escaping and safe link construction in email service."""
    with test_app.app_context():
        malicious_input = "<script>alert('xss')</script>"
        sample_opps = [{
            "id": "12345",
            "title": malicious_input,
            "organization": {"name": "SafeOrg"},
            "type": "job",
            "dates": {"deadline": "2027-12-31"},
            "eligibility": {"status": "eligible"},
            "explanation": "Great fit"
        }]

        text_body, html_body = EmailService.build_digest_email(
            user_name="Student & Co",
            opportunities=sample_opps,
            digest_date="2026-10-16",
            frequency="daily"
        )

        # Raw script tags must NOT appear in HTML body
        assert "<script>" not in html_body
        assert "&lt;script&gt;" in html_body
        assert "http://localhost:5173/opportunities?selected=12345" in html_body

def test_notification_api_endpoints(test_app, auth_users):
    """Test Flask HTTP routes for notification management and preferences."""
    client = test_app.test_client()
    h1 = auth_users["headers1"]
    h2 = auth_users["headers2"]

    # 1. GET /api/notifications
    res = client.get("/api/notifications", headers=h1)
    assert res.status_code == 200
    json_data = res.get_json()
    assert json_data["success"] is True
    assert "data" in json_data
    assert "unread_count" in json_data

    # 2. GET /api/notifications/unread-count
    res_count = client.get("/api/notifications/unread-count", headers=h1)
    assert res_count.status_code == 200
    assert "unread_count" in res_count.get_json()["data"]

    # 3. GET & PUT /api/notifications/preferences
    res_pref = client.get("/api/notifications/preferences", headers=h1)
    assert res_pref.status_code == 200
    prefs = res_pref.get_json()["data"]
    assert "in_app_enabled" in prefs

    put_res = client.put("/api/notifications/preferences", headers=h1, json={
        "in_app_enabled": False,
        "digest_frequency": "weekly",
        "min_match_score": 85
    })
    assert put_res.status_code == 200
    updated = put_res.get_json()["data"]
    assert updated["in_app_enabled"] is False
    assert updated["digest_frequency"] == "weekly"
    assert updated["min_match_score"] == 85

    # 4. POST /api/notifications/digest/send
    res_digest = client.post("/api/notifications/digest/send", headers=h1, json={"frequency": "daily"})
    assert res_digest.status_code == 200
    assert res_digest.get_json()["success"] is True
