import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId
from app.config.db import Database

logger = logging.getLogger(__name__)

CANONICAL_APPLICATION_STATUSES = [
    "Saved",
    "Applied",
    "Assessment",
    "Interview",
    "Offer",
    "Rejected",
    "Withdrawn"
]

# Legacy compatibility mapping
STATUS_ALIASES = {
    "interviewing": "Interview",
    "assessment": "Assessment",
    "online assessment": "Assessment",
    "offered": "Offer",
    "hired": "Offer",
    "closed": "Rejected"
}

def normalize_status(raw_status: Optional[str]) -> str:
    if not raw_status:
        return "Saved"
    s = raw_status.strip().title()
    s_lower = raw_status.strip().lower()
    if s in CANONICAL_APPLICATION_STATUSES:
        return s
    if s_lower in STATUS_ALIASES:
        return STATUS_ALIASES[s_lower]
    return "Saved"

class ApplicationModel:
    """
    MongoDB model for student career applications and tracking pipeline.
    Tracks persistent status transitions, audit history, follow-up dates, notes, and opportunity snapshots.
    """
    COLLECTION_NAME = "applications"

    @classmethod
    def get_collection(cls):
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database connection is not initialized")
        return db[cls.COLLECTION_NAME]

    @classmethod
    def ensure_indexes(cls):
        try:
            col = cls.get_collection()
            col.create_index("user_id")
            col.create_index("status")
            col.create_index("opportunity_id")
            col.create_index([("user_id", 1), ("status", 1)])
            col.create_index([("user_id", 1), ("opportunity_id", 1)])
            col.create_index([("user_id", 1), ("updated_at", -1)])
            logger.info("Successfully ensured MongoDB indexes on '%s'", cls.COLLECTION_NAME)
        except Exception as e:
            logger.warning("Could not create indexes on '%s': %s", cls.COLLECTION_NAME, str(e))

    @classmethod
    def to_dict(cls, doc: Optional[dict]) -> dict:
        if not doc:
            return {}
        data = dict(doc)
        if "_id" in data:
            data["id"] = str(data["_id"])
            del data["_id"]

        status = normalize_status(data.get("status"))
        data["status"] = status
        data["company"] = data.get("company", "Unknown Organization")
        data["role"] = data.get("role", "Opportunity")
        data["type"] = data.get("type", "Internship")
        data["appliedDate"] = data.get("applied_at") or data.get("applied_date")
        data["applied_date"] = data["appliedDate"]
        data["saved_at"] = data.get("saved_at")
        data["lastUpdated"] = data.get("updated_at", data.get("created_at"))
        data["last_updated_at"] = data["lastUpdated"]
        data["followUpDate"] = data.get("follow_up_date")
        data["follow_up_date"] = data.get("follow_up_date")
        data["matchScore"] = data.get("match_score", 85)
        data["notes"] = data.get("notes", "")
        data["timeline"] = data.get("status_history") or data.get("timeline") or []
        data["status_history"] = data["timeline"]
        data["location"] = data.get("location", "Remote")
        data["deadline"] = data.get("deadline")
        data["opportunityId"] = str(data.get("opportunity_id")) if data.get("opportunity_id") else None
        data["applicationUrl"] = data.get("application_url", "")
        data["contactName"] = data.get("contact_name", "")
        data["contact_name"] = data["contactName"]
        data["contactInfo"] = data.get("contact_info", "")
        data["contact_info"] = data["contactInfo"]
        data["nextAction"] = data.get("next_action", "")
        data["next_action"] = data["nextAction"]
        data["submissionDate"] = data.get("submission_date") or data["appliedDate"]
        data["submission_date"] = data["submissionDate"]

        # Job description snapshot & preparation tracking
        jd = data.get("job_description", "")
        jd_snap = data.get("job_description_snapshot", "")
        data["jobDescription"] = jd
        data["job_description"] = jd
        data["jobDescriptionSnapshot"] = jd_snap
        data["job_description_snapshot"] = jd_snap
        data["jobDescriptionSource"] = data.get("job_description_source", "none")
        data["job_description_source"] = data["jobDescriptionSource"]
        data["jobDescriptionStatus"] = data.get("job_description_status", "present" if bool(jd and jd.strip()) else "missing")
        data["job_description_status"] = data["jobDescriptionStatus"]
        data["jobDescriptionEdited"] = bool(data.get("job_description_edited", False))
        data["job_description_edited"] = data["jobDescriptionEdited"]
        data["prepStatus"] = data.get("prep_status", "not_requested")
        data["prep_status"] = data["prepStatus"]
        data["prepError"] = data.get("prep_error")
        data["prep_error"] = data["prepError"]
        data["prepGeneratedAt"] = data.get("prep_generated_at")
        data["prep_generated_at"] = data["prepGeneratedAt"]
        return data

    @classmethod
    def find_by_user(cls, user_id: str, status: Optional[str] = None, search: Optional[str] = None) -> List[dict]:
        col = cls.get_collection()
        query: Dict[str, Any] = {"user_id": str(user_id)}
        if status and status.upper() != "ALL":
            query["status"] = normalize_status(status)
        if search and search.strip():
            import re
            clean_search = re.escape(search.strip())
            query["$or"] = [
                {"company": {"$regex": clean_search, "$options": "i"}},
                {"role": {"$regex": clean_search, "$options": "i"}},
                {"notes": {"$regex": clean_search, "$options": "i"}}
            ]
        cursor = col.find(query).sort("updated_at", -1)
        return [cls.to_dict(doc) for doc in cursor]

    @classmethod
    def find_by_id(cls, app_id: str, user_id: Optional[str] = None) -> Optional[dict]:
        col = cls.get_collection()
        query: Dict[str, Any] = {}
        if ObjectId.is_valid(app_id):
            query["_id"] = ObjectId(app_id)
        else:
            query["_id"] = app_id
        if user_id:
            query["user_id"] = str(user_id)
        doc = col.find_one(query)
        return cls.to_dict(doc) if doc else None

    @classmethod
    def create_application(cls, user_id: str, data: Dict[str, Any]) -> dict:
        """
        Creates or updates a tracked application for this student.
        Prevents duplicate applications for the same opportunity.
        Snapshots opportunity description and safely triggers preparation on Applied.
        """
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        today = now.split("T")[0]
        status = normalize_status(data.get("status", "Saved"))

        opp_id = data.get("opportunityId") or data.get("opportunity_id")

        # Snapshot opportunity info if opportunity_id is provided
        company = data.get("company")
        role = data.get("role")
        opp_type = data.get("type", "Internship")
        location = data.get("location", "Remote")
        deadline = data.get("deadline")
        app_url = data.get("applicationUrl") or data.get("application_url", "")
        salary = data.get("salary") or data.get("compensationString")
        opp_desc = ""

        if opp_id:
            from app.models.opportunity import OpportunityModel
            opp_doc = OpportunityModel.find_by_id(str(opp_id))
            if opp_doc:
                opp_dict = OpportunityModel.to_dict(opp_doc)
                if not company:
                    company = opp_dict.get("company")
                if not role:
                    role = opp_dict.get("title")
                opp_type = opp_dict.get("type", opp_type)
                location = opp_dict.get("locationString", location)
                deadline = opp_dict.get("deadline", deadline)
                app_url = opp_dict.get("applicationUrl", app_url)
                salary = opp_dict.get("compensationString", salary)
                opp_desc = (opp_dict.get("description") or "").strip()

            # Check for existing application by this user for this opportunity
            existing = col.find_one({
                "user_id": str(user_id),
                "opportunity_id": str(opp_id)
            })
            if existing:
                # Update existing record rather than creating a duplicate
                return cls.update_stage(
                    app_id=str(existing["_id"]),
                    user_id=user_id,
                    new_status=status,
                    note=data.get("notes") or f"Updated status to {status}"
                ) or cls.to_dict(existing)

        # Snapshot and student-provided job description handling
        passed_jd = data.get("job_description") if "job_description" in data else data.get("jobDescription")
        if passed_jd is not None:
            passed_jd = str(passed_jd).strip()

        if opp_id and opp_desc:
            job_desc_snapshot = opp_desc
            if passed_jd:
                job_desc = passed_jd
                jd_source = "student_provided"
                jd_edited = (passed_jd != opp_desc)
            else:
                job_desc = opp_desc
                jd_source = "opportunity_snapshot"
                jd_edited = False
        else:
            job_desc_snapshot = opp_desc or ""
            job_desc = passed_jd or opp_desc or ""
            jd_source = "student_provided" if passed_jd else ("opportunity_snapshot" if opp_desc else "none")
            jd_edited = False

        jd_status = "present" if bool(job_desc and job_desc.strip()) else "missing"

        applied_at = data.get("appliedDate") or data.get("applied_date") or data.get("applied_at")
        saved_at = data.get("saved_at") or now
        if status == "Applied" and not applied_at:
            applied_at = today

        initial_history = data.get("timeline") or data.get("status_history") or []
        if not initial_history:
            initial_history = [{
                "date": today,
                "status": status,
                "event": f"Tracked as {status}",
                "note": data.get("notes", "")
            }]

        doc = {
            "user_id": str(user_id),
            "opportunity_id": str(opp_id) if opp_id else None,
            "company": (company or "Target Company").strip(),
            "role": (role or "Software Role").strip(),
            "type": opp_type,
            "status": status,
            "location": location,
            "deadline": deadline,
            "application_url": app_url,
            "applied_at": applied_at,
            "applied_date": applied_at,
            "submission_date": data.get("submissionDate") or data.get("submission_date") or applied_at,
            "saved_at": saved_at,
            "follow_up_date": data.get("followUpDate") or data.get("follow_up_date"),
            "contact_name": (data.get("contactName") or data.get("contact_name") or "").strip(),
            "contact_info": (data.get("contactInfo") or data.get("contact_info") or "").strip(),
            "next_action": (data.get("nextAction") or data.get("next_action") or "").strip(),
            "match_score": int(data.get("matchScore") or data.get("match_score") or 85),
            "salary": salary,
            "notes": data.get("notes", ""),
            "job_description_snapshot": job_desc_snapshot,
            "job_description": job_desc,
            "job_description_source": jd_source,
            "job_description_status": jd_status,
            "job_description_edited": jd_edited,
            "prep_status": "pending" if status == "Applied" else "not_requested",
            "prep_error": None,
            "prep_generated_at": None,
            "status_history": initial_history,
            "timeline": initial_history,
            "created_at": now,
            "updated_at": now
        }
        res = col.insert_one(doc)
        doc["_id"] = res.inserted_id

        # Trigger preparation when created directly as Applied
        if status == "Applied":
            cls._safe_trigger_prep(str(res.inserted_id), user_id)
            doc = col.find_one({"_id": res.inserted_id}) or doc

        return cls.to_dict(doc)

    @classmethod
    def update_application(cls, app_id: str, user_id: str, updates: Dict[str, Any]) -> Optional[dict]:
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()

        query: Dict[str, Any] = {"user_id": str(user_id)}
        if ObjectId.is_valid(app_id):
            query["_id"] = ObjectId(app_id)
        else:
            query["_id"] = app_id

        existing = col.find_one(query)
        if not existing:
            return None

        payload: Dict[str, Any] = {"updated_at": now}
        allowed = [
            "company", "role", "type", "location", "deadline", "salary",
            "notes", "match_score", "application_url", "follow_up_date", "applied_at",
            "contact_name", "contact_info", "next_action", "submission_date"
        ]
        for key in allowed:
            if key in updates:
                payload[key] = updates[key]

        # Handle camelCase
        if "matchScore" in updates:
            payload["match_score"] = int(updates["matchScore"])
        if "appliedDate" in updates:
            payload["applied_at"] = updates["appliedDate"]
            payload["applied_date"] = updates["appliedDate"]
        if "submissionDate" in updates:
            payload["submission_date"] = updates["submissionDate"]
        if "followUpDate" in updates:
            payload["follow_up_date"] = updates["followUpDate"]
        if "contactName" in updates:
            payload["contact_name"] = str(updates["contactName"]).strip()
        if "contactInfo" in updates:
            payload["contact_info"] = str(updates["contactInfo"]).strip()
        if "nextAction" in updates:
            payload["next_action"] = str(updates["nextAction"]).strip()
        if "notes" in updates:
            payload["notes"] = updates["notes"]

        # Student-provided job description tailoring (NEVER mutates opportunities collection)
        if "job_description" in updates or "jobDescription" in updates:
            raw_new_jd = updates.get("job_description") if "job_description" in updates else updates.get("jobDescription")
            new_jd = str(raw_new_jd or "").strip()
            payload["job_description"] = new_jd
            payload["job_description_source"] = "student_provided"
            payload["job_description_edited"] = True
            payload["job_description_status"] = "present" if bool(new_jd) else "missing"

        if "status" in updates:
            new_status = normalize_status(updates["status"])
            if new_status != existing.get("status"):
                history = list(existing.get("status_history") or existing.get("timeline") or [])
                history.append({
                    "date": now.split("T")[0],
                    "status": new_status,
                    "event": f"Status updated to {new_status}",
                    "note": updates.get("notes") or ""
                })
                payload["status"] = new_status
                payload["status_history"] = history
                payload["timeline"] = history

        col.update_one(query, {"$set": payload})
        updated_doc = col.find_one(query)

        # Trigger prep if updated to Applied
        if "status" in updates and normalize_status(updates["status"]) == "Applied":
            cls._safe_trigger_prep(str(app_id), user_id)
            updated_doc = col.find_one(query) or updated_doc

        return cls.to_dict(updated_doc)

    @classmethod
    def update_job_description(cls, app_id: str, user_id: str, job_description: str) -> Optional[dict]:
        """
        Updates the student's tailored preparation job description copy.
        Guarantees that the shared opportunity in 'opportunities' collection is NEVER modified.
        """
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        query: Dict[str, Any] = {"user_id": str(user_id)}
        if ObjectId.is_valid(app_id):
            query["_id"] = ObjectId(app_id)
        else:
            query["_id"] = app_id

        existing = col.find_one(query)
        if not existing:
            return None

        clean_jd = (job_description or "").strip()
        payload = {
            "job_description": clean_jd,
            "job_description_source": "student_provided",
            "job_description_edited": True,
            "job_description_status": "present" if bool(clean_jd) else "missing",
            "updated_at": now
        }
        col.update_one(query, {"$set": payload})
        updated = col.find_one(query)
        return cls.to_dict(updated)

    @classmethod
    def update_stage(cls, app_id: str, user_id: str, new_status: str, note: Optional[str] = None) -> Optional[dict]:
        """
        Updates status stage and safely triggers interview preparation when moving to Applied.
        AI generation failure will NEVER block or roll back the stage change.
        """
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        today = now.split("T")[0]
        canonical_status = normalize_status(new_status)

        query: Dict[str, Any] = {"user_id": str(user_id)}
        if ObjectId.is_valid(app_id):
            query["_id"] = ObjectId(app_id)
        else:
            query["_id"] = app_id

        existing = col.find_one(query)
        if not existing:
            return None

        history = list(existing.get("status_history") or existing.get("timeline") or [])
        event_text = f"Moved to {canonical_status}"
        if note:
            event_text += f": {note}"
        history.append({
            "date": today,
            "status": canonical_status,
            "event": event_text,
            "note": note or ""
        })

        payload = {
            "status": canonical_status,
            "status_history": history,
            "timeline": history,
            "updated_at": now
        }
        if canonical_status == "Applied" and not existing.get("applied_at"):
            payload["applied_at"] = today
            payload["applied_date"] = today

        if note:
            payload["notes"] = note

        col.update_one(query, {"$set": payload})
        updated = col.find_one(query)

        # Trigger preparation when an application enters Applied (non-blocking)
        if canonical_status == "Applied":
            cls._safe_trigger_prep(str(app_id), user_id)
            updated = col.find_one(query) or updated

        return cls.to_dict(updated)

    @classmethod
    def _safe_trigger_prep(cls, app_id: str, user_id: str, force_refresh: bool = False) -> Optional[dict]:
        """
        Safely triggers or checks interview preparation pack generation for an Applied application.
        Guarantees:
        - Non-blocking: will never raise an uncaught exception to the caller.
        - Idempotent: checks InterviewPrepModel first, preventing duplicate AI calls.
        - Explicit states: updates ApplicationModel prep_status to 'pending' -> 'ready' or 'failed'.
        - Preserves status: never rolls back application status change on failure.
        """
        col = cls.get_collection()
        user_str = str(user_id)
        app_str = str(app_id)
        query: Dict[str, Any] = {"user_id": user_str}
        if ObjectId.is_valid(app_str):
            query["_id"] = ObjectId(app_str)
        else:
            query["_id"] = app_str

        existing_app = col.find_one(query)
        if not existing_app:
            return None

        from app.models.interview_prep import InterviewPrepModel
        now = datetime.now(timezone.utc).isoformat()

        # If pack already exists and not forcing refresh, mark ready immediately
        if not force_refresh:
            existing_pack = InterviewPrepModel.find_by_application(app_str, user_str)
            if existing_pack and existing_pack.get("checklist"):
                col.update_one(query, {
                    "$set": {
                        "prep_status": "ready",
                        "prep_error": None,
                        "prep_generated_at": existing_pack.get("updated_at") or existing_pack.get("created_at") or now
                    }
                })
                return existing_pack

        # Avoid redundant concurrent triggers if already pending
        if existing_app.get("prep_status") == "pending" and not force_refresh:
            return None

        # Atomically mark pending
        col.update_one(query, {
            "$set": {
                "prep_status": "pending",
                "prep_error": None,
                "updated_at": now
            }
        })

        try:
            from app.services.interview_prep_service import InterviewPrepService
            pack = InterviewPrepService.get_or_generate_prep_pack(
                user_id=user_str,
                application_id=app_str,
                force_refresh=force_refresh
            )
            col.update_one(query, {
                "$set": {
                    "prep_status": "ready",
                    "prep_error": None,
                    "prep_generated_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            })
            return pack
        except Exception as e:
            err_msg = str(e)
            logger.warning("Preparation generation failed for application %s: %s", app_str, err_msg)
            col.update_one(query, {
                "$set": {
                    "prep_status": "failed",
                    "prep_error": err_msg,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            })
            return None

    @classmethod
    def ensure_applied_prep_triggered(cls, app_id: str, user_id: str) -> None:
        """
        Triggers preparation for an existing Applied application that lacks a prep pack.
        """
        app = cls.find_by_id(app_id, user_id=user_id)
        if not app:
            return
        if app.get("status") == "Applied":
            from app.models.interview_prep import InterviewPrepModel
            existing_pack = InterviewPrepModel.find_by_application(str(app_id), str(user_id))
            if not existing_pack or not existing_pack.get("checklist"):
                cls._safe_trigger_prep(str(app_id), str(user_id))

    @classmethod
    def delete_application(cls, app_id: str, user_id: str) -> bool:
        col = cls.get_collection()
        query: Dict[str, Any] = {"user_id": str(user_id)}
        if ObjectId.is_valid(app_id):
            query["_id"] = ObjectId(app_id)
        else:
            query["_id"] = app_id
        res = col.delete_one(query)
        return res.deleted_count > 0
