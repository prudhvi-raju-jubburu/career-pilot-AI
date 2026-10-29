import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from bson import ObjectId

from app.models.notification import NotificationModel
from app.models.notification_preference import NotificationPreferenceModel
from app.models.profile import ProfileModel
from app.models.opportunity import OpportunityModel
from app.models.application import ApplicationModel
from app.models.user import UserModel
from app.services.eligibility_engine import EligibilityEngine
from app.services.recommendation_engine import RecommendationEngine
from app.services.signal_interpreter import SignalInterpreter
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)

class NotificationService:
    """
    Core matching, notification dispatch, deadline monitoring,
    and personalized digest generation service.
    """

    @classmethod
    def match_new_opportunity_to_students(cls, opp: Dict[str, Any]) -> int:
        """
        Evaluates a newly ingested or updated opportunity against all active students.
        Creates in-app notifications only when:
          1. Student enabled in-app notifications.
          2. Category matches student's notification preferences.
          3. Mandatory eligibility requirements are NOT violated.
          4. Relevance match score >= student's minimum threshold.
          5. Notification has not already been created (dedupe_key).
        Returns count of notifications created.
        """
        opp_id = str(opp.get("_id") or opp.get("id", ""))
        if not opp_id:
            return 0

        # Must be active
        if opp.get("status") not in ("active", "open"):
            return 0

        # Check deadline: do not notify for expired
        deadline = (opp.get("dates") or {}).get("deadline") or opp.get("deadline")
        now_utc = datetime.now(timezone.utc).isoformat()
        if deadline and deadline < now_utc[:10]:
            return 0

        opp_type = str(opp.get("type", "job")).strip().lower()
        company = (opp.get("organization") or {}).get("name") or opp.get("company", "Organization")
        title = opp.get("title", "Opportunity")

        # Fetch student profiles
        col = ProfileModel.get_collection()
        profiles = list(col.find({}))
        notified_count = 0

        for profile in profiles:
            uid = str(profile.get("user_id"))
            if not uid or uid == "None":
                continue

            prefs = NotificationPreferenceModel.get_preferences(uid)
            if not prefs.get("in_app_enabled"):
                continue

            if opp_type not in prefs.get("categories", []):
                continue

            # Deterministic hard eligibility evaluation
            eligibility = EligibilityEngine.evaluate(opp, profile)
            if not eligibility.get("is_eligible", False):
                # Ineligible: strictly skip
                continue

            # Relevance scoring
            student_skills = RecommendationEngine._extract_student_skills(profile)
            student_roles = RecommendationEngine._extract_student_preferred_roles(profile)
            watchlist = set()

            score_data = RecommendationEngine._score_opportunity(
                opp=opp,
                profile=profile,
                student_skills=student_skills,
                student_roles=student_roles,
                watchlist=watchlist,
                eligibility=eligibility
            )

            student_prefs = SignalInterpreter.build_student_preference_profile(uid)
            pers_delta, pers_hl = SignalInterpreter.calculate_personalization_adjustment(opp, student_prefs)
            final_score = int(min(98, max(30, score_data["total_score"] + pers_delta)))

            min_threshold = prefs.get("min_match_score", 70)
            if final_score < min_threshold:
                continue

            # Dedupe key ensures exactly one alert per opportunity per student
            dedupe_key = f"{uid}_newopp_{opp_id}"

            why = pers_hl[0] if (pers_delta > 0 and pers_hl) else (
                score_data["highlights"][0] if score_data["highlights"] else f"Matches your background in {opp_type.title()}s"
            )

            notif = NotificationModel.create_notification(
                user_id=uid,
                title=f"New Match: {title} at {company}",
                message=f"{final_score}% Fit &bull; {why}",
                notif_type="new_matching_opportunity",
                opportunity_id=opp_id,
                link=f"/opportunities?selected={opp_id}",
                dedupe_key=dedupe_key
            )
            if notif:
                notified_count += 1

        logger.info("Matched opportunity '%s' to %d eligible students.", title, notified_count)
        return notified_count

    @classmethod
    def check_and_notify_upcoming_deadlines(cls) -> int:
        """
        Scans saved opportunities and applications for deadlines within the next 48 hours.
        Dispatches in-app deadline reminders with deduplication.
        """
        now_utc = datetime.now(timezone.utc)
        in_48h_iso = (now_utc + timedelta(hours=48)).isoformat()
        now_iso = now_utc.isoformat()
        notified_count = 0

        # 1. Iterate over student profiles with saved opportunities
        profile_col = ProfileModel.get_collection()
        opp_col = OpportunityModel.get_collection()

        profiles = list(profile_col.find({"saved_opportunities": {"$exists": True, "$ne": []}}))
        for prof in profiles:
            uid = str(prof.get("user_id"))
            prefs = NotificationPreferenceModel.get_preferences(uid)
            if not prefs.get("in_app_enabled") or not prefs.get("deadline_reminders"):
                continue

            saved_ids = prof.get("saved_opportunities") or []
            for s_id in saved_ids:
                q_id = ObjectId(s_id) if ObjectId.is_valid(s_id) else s_id
                opp = opp_col.find_one({"_id": q_id, "status": "active"})
                if not opp:
                    continue

                deadline = (opp.get("dates") or {}).get("deadline") or opp.get("deadline")
                if not deadline:
                    continue

                # Check if deadline is between now and +48h
                if now_iso[:10] <= deadline[:10] <= in_48h_iso[:10]:
                    opp_id_str = str(opp["_id"])
                    dedupe_key = f"{uid}_deadline_{opp_id_str}_{deadline[:10]}"
                    comp = (opp.get("organization") or {}).get("name") or opp.get("company", "Company")
                    title = opp.get("title", "Opportunity")

                    notif = NotificationModel.create_notification(
                        user_id=uid,
                        title=f"Deadline Approaching: {title}",
                        message=f"Application for {comp} closes on {deadline[:10]}. Complete and submit your application soon.",
                        notif_type="deadline_reminder",
                        opportunity_id=opp_id_str,
                        link=f"/opportunities?selected={opp_id_str}",
                        dedupe_key=dedupe_key
                    )
                    if notif:
                        notified_count += 1

        logger.info("Dispatched %d upcoming deadline reminders.", notified_count)
        return notified_count

    @classmethod
    def generate_and_dispatch_digests(cls, frequency: str = "daily") -> Dict[str, Any]:
        """
        Generates and sends personalized digests to eligible students matching their frequency preference.
        Guarantees idempotency via DigestDeliveryModel.
        """
        now_utc = datetime.now(timezone.utc)
        today_date = now_utc.strftime("%Y-%m-%d")

        profile_col = ProfileModel.get_collection()
        user_col = UserModel.get_collection()

        profiles = list(profile_col.find({}))
        results = {"total_students": len(profiles), "sent": 0, "simulated": 0, "skipped": 0, "failed": 0}

        for prof in profiles:
            uid = str(prof.get("user_id"))
            prefs = NotificationPreferenceModel.get_preferences(uid)

            if not prefs.get("email_digest_enabled"):
                results["skipped"] += 1
                continue

            if prefs.get("digest_frequency") != frequency:
                results["skipped"] += 1
                continue

            # Fetch user email and name
            user_obj_id = ObjectId(uid) if ObjectId.is_valid(uid) else uid
            user_doc = user_col.find_one({"_id": user_obj_id}) or {}
            recipient_email = user_doc.get("email") or (prof.get("personal") or {}).get("email")
            user_name = user_doc.get("name") or (prof.get("personal") or {}).get("full_name") or "Student"

            if not recipient_email or "@" not in recipient_email:
                results["skipped"] += 1
                continue

            # Get top recommended opportunities tailored to this student
            rec_result = RecommendationEngine.get_recommendations(user_id=uid, tab="recommended", limit=5)
            top_opps = rec_result.get("items", [])

            if not top_opps:
                results["skipped"] += 1
                continue

            # Send or simulate digest
            send_res = EmailService.send_digest_email(
                user_id=uid,
                user_name=user_name,
                recipient_email=recipient_email,
                opportunities=top_opps,
                digest_date=today_date,
                frequency=frequency
            )

            st = send_res.get("status")
            if st == "sent":
                results["sent"] += 1
            elif st == "simulated":
                results["simulated"] += 1
            elif st == "skipped":
                results["skipped"] += 1
            else:
                results["failed"] += 1

        logger.info("Digest batch completed: %s", results)
        return results

    @classmethod
    def check_and_notify_interview_reminders(cls) -> int:
        """
        Scans upcoming interview and assessment events.
        Dispatches in-app reminders at 24-hour and 1-hour offsets with deduplication.
        Skips cancelled or completed events.
        """
        now_utc = datetime.now(timezone.utc)
        in_24h = now_utc + timedelta(hours=24)
        in_1h = now_utc + timedelta(hours=1)
        now_iso = now_utc.isoformat()
        in_24h_iso = in_24h.isoformat()
        in_1h_iso = in_1h.isoformat()

        from app.models.interview_event import InterviewEventModel
        try:
            col = InterviewEventModel.get_collection()
        except Exception as e:
            logger.warning("Could not access interview_events collection: %s", str(e))
            return 0

        # Find scheduled events whose start_time is between now and 24h
        # We query status="scheduled" and start_time >= now_iso[:10]
        query = {
            "status": "scheduled",
            "start_time": {"$gte": now_iso[:10]}
        }
        events = list(col.find(query))
        notif_col = NotificationModel.get_collection()
        notified_count = 0

        for event in events:
            uid = str(event.get("user_id"))
            ev_id = str(event.get("_id"))
            start_raw = event.get("start_time")
            if not start_raw:
                continue

            try:
                # Parse ISO start time
                st_str = start_raw.replace("Z", "+00:00")
                st_dt = datetime.fromisoformat(st_str)
                if st_dt.tzinfo is None:
                    st_dt = st_dt.replace(tzinfo=timezone.utc)
            except Exception:
                continue

            # Must be strictly in the future
            if st_dt <= now_utc:
                continue

            diff = st_dt - now_utc
            diff_hours = diff.total_seconds() / 3600.0

            title = event.get("title") or "Interview"
            ev_type = event.get("event_type", "interview").replace("_", " ").title()

            # 1. 1-hour reminder offset (<= 1.5 hours remaining)
            if diff_hours <= 1.5:
                dedupe_1h = f"{uid}_interview_reminder_1h_{ev_id}"
                if notif_col.find_one({"dedupe_key": dedupe_1h}):
                    continue
                notif = NotificationModel.create_notification(
                    user_id=uid,
                    title=f"Starting Soon: {title}",
                    message=f"Your {ev_type} starts in under an hour ({start_raw}). Check your meeting link and prep checklist.",
                    notif_type="interview_reminder",
                    link="/applications",
                    dedupe_key=dedupe_1h
                )
                if notif:
                    notified_count += 1

            # 2. 24-hour reminder offset (<= 25 hours remaining)
            elif diff_hours <= 25.0:
                dedupe_24h = f"{uid}_interview_reminder_24h_{ev_id}"
                if notif_col.find_one({"dedupe_key": dedupe_24h}):
                    continue
                notif = NotificationModel.create_notification(
                    user_id=uid,
                    title=f"Upcoming Tomorrow: {title}",
                    message=f"You have a {ev_type} scheduled tomorrow at {start_raw}. Review your preparation pack in Applications.",
                    notif_type="interview_reminder",
                    link="/applications",
                    dedupe_key=dedupe_24h
                )
                if notif:
                    notified_count += 1

        logger.info("Dispatched %d interview reminders.", notified_count)
        return notified_count

    @classmethod
    def check_and_notify_application_followups(cls) -> int:
        """
        Scans applications with scheduled follow-up dates.
        Dispatches in-app notifications when a follow-up is due today.
        """
        now_utc = datetime.now(timezone.utc)
        today_date = now_utc.strftime("%Y-%m-%d")

        try:
            col = ApplicationModel.get_collection()
            notif_col = NotificationModel.get_collection()
        except Exception as e:
            logger.warning("Could not access database collections: %s", str(e))
            return 0

        # Query active applications where follow_up_date is set and <= today
        active_statuses = ["Applied", "Assessment", "Interview"]
        query = {
            "status": {"$in": active_statuses},
            "follow_up_date": {"$exists": True, "$ne": None, "$lte": today_date}
        }

        apps = list(col.find(query))
        notified_count = 0

        for app_doc in apps:
            uid = str(app_doc.get("user_id"))
            app_id = str(app_doc.get("_id"))
            company = app_doc.get("company_name") or "Company"
            role = app_doc.get("role_title") or "Opportunity"
            next_action = app_doc.get("next_action") or "Send follow-up message to recruiter"

            dedupe_key = f"{uid}_app_followup_{app_id}_{today_date}"
            if notif_col.find_one({"dedupe_key": dedupe_key}):
                continue

            notif = NotificationModel.create_notification(
                user_id=uid,
                title=f"Follow-up Due: {role} at {company}",
                message=f"Scheduled follow-up is due today. Next action: {next_action}.",
                notif_type="application_follow_up",
                link="/applications",
                dedupe_key=dedupe_key
            )
            if notif:
                notified_count += 1

        logger.info("Dispatched %d application follow-up reminders.", notified_count)
        return notified_count

