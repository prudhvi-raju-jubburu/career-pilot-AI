import logging
import re
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId
from app.config.db import Database
from app.models.application import ApplicationModel

logger = logging.getLogger(__name__)

CANONICAL_EVENT_TYPES = {
    "technical_interview": "Technical Interview",
    "hr_interview": "HR Interview",
    "online_assessment": "Online Assessment",
    "coding_test": "Coding Test",
    "group_discussion": "Group Discussion",
    "other": "Other Event"
}

VALID_STATUSES = {"scheduled", "completed", "cancelled"}

def normalize_event_type(raw_type: Optional[str]) -> str:
    if not raw_type:
        return "technical_interview"
    clean = str(raw_type).strip().lower().replace(" ", "_").replace("-", "_")
    if clean in CANONICAL_EVENT_TYPES:
        return clean
    # Check partials
    if "tech" in clean or "system" in clean or "code" in clean:
        return "technical_interview"
    if "hr" in clean or "behavior" in clean or "culture" in clean:
        return "hr_interview"
    if "oa" in clean or "assessment" in clean or "test" in clean:
        return "online_assessment"
    if "group" in clean or "gd" in clean:
        return "group_discussion"
    return "other"

def validate_meeting_link(link: Optional[str]) -> Optional[str]:
    """Validates meeting link allowing only secure web protocols (http/https)."""
    if not link:
        return None
    trimmed = str(link).strip()
    if not trimmed:
        return None
    # Block dangerous URI schemes
    if not (trimmed.startswith("http://") or trimmed.startswith("https://")):
        raise ValueError("Meeting link must begin with http:// or https://")
    # Basic URL structure check
    if not re.match(r"^https?://[^\s/$.?#].[^\s]*$", trimmed, re.IGNORECASE):
        raise ValueError("Invalid meeting link URL format")
    return trimmed

class InterviewEventModel:
    """
    MongoDB model for scheduled interviews, assessments, and rounds linked to applications.
    Stored in the 'interview_events' collection.
    """
    COLLECTION_NAME = "interview_events"

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
            col.create_index("application_id")
            col.create_index([("user_id", 1), ("application_id", 1)])
            col.create_index([("user_id", 1), ("start_time", 1)])
            col.create_index([("status", 1), ("start_time", 1)])
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

        ev_type = normalize_event_type(data.get("event_type"))
        data["event_type"] = ev_type
        data["event_type_label"] = CANONICAL_EVENT_TYPES.get(ev_type, "Interview / Assessment")
        data["status"] = data.get("status", "scheduled")
        data["timezone"] = data.get("timezone", "Asia/Kolkata")
        data["reminder_offsets"] = data.get("reminder_offsets") or [1440, 60]  # 24h & 1h default
        return data

    @classmethod
    def find_by_application(cls, app_id: str, user_id: str) -> List[dict]:
        col = cls.get_collection()
        query = {"application_id": str(app_id), "user_id": str(user_id)}
        cursor = col.find(query).sort("start_time", 1)
        return [cls.to_dict(doc) for doc in cursor]

    @classmethod
    def find_by_user(cls, user_id: str, status: Optional[str] = None) -> List[dict]:
        col = cls.get_collection()
        query: Dict[str, Any] = {"user_id": str(user_id)}
        if status and status.lower() != "all":
            query["status"] = status.lower()
        cursor = col.find(query).sort("start_time", 1)
        return [cls.to_dict(doc) for doc in cursor]

    @classmethod
    def find_by_id(cls, event_id: str, user_id: Optional[str] = None) -> Optional[dict]:
        col = cls.get_collection()
        query: Dict[str, Any] = {}
        if ObjectId.is_valid(event_id):
            query["_id"] = ObjectId(event_id)
        else:
            query["_id"] = event_id
        if user_id:
            query["user_id"] = str(user_id)
        doc = col.find_one(query)
        return cls.to_dict(doc) if doc else None

    @classmethod
    def create_event(cls, user_id: str, app_id: str, data: Dict[str, Any]) -> dict:
        """
        Creates a scheduled interview or assessment linked to the student's application.
        Validates timestamps, links, and ownership.
        """
        # Verify parent application exists and belongs to student
        app = ApplicationModel.find_by_id(app_id, user_id=user_id)
        if not app:
            raise ValueError("Associated application not found or access unauthorized")

        title = str(data.get("title") or "").strip()
        if not title:
            ev_label = CANONICAL_EVENT_TYPES.get(normalize_event_type(data.get("event_type")), "Interview")
            title = f"{app.get('company', 'Company')} {ev_label}"

        start_time = str(data.get("start_time") or data.get("startTime") or "").strip()
        end_time = str(data.get("end_time") or data.get("endTime") or "").strip()

        if not start_time:
            raise ValueError("start_time is required")

        # Fallback end_time to +60 minutes if omitted
        if not end_time:
            try:
                from datetime import timedelta
                st_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
                end_time = (st_dt + timedelta(minutes=60)).isoformat()
            except Exception:
                end_time = start_time

        # Validate start <= end
        try:
            st_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            et_dt = datetime.fromisoformat(end_time.replace("Z", "+00:00"))
            if st_dt > et_dt:
                raise ValueError("start_time cannot be after end_time")
        except ValueError as ve:
            if "start_time cannot be after end_time" in str(ve):
                raise
            # Ignore parsing errors for non-standard formats, preserving strings safely
            pass

        meeting_link = validate_meeting_link(data.get("meeting_link") or data.get("meetingLink"))
        location = str(data.get("location") or "").strip()
        notes = str(data.get("preparation_notes") or data.get("notes") or "").strip()

        # Parse reminder offsets
        raw_offsets = data.get("reminder_offsets") or data.get("reminderOffsets")
        offsets = [1440, 60]
        if isinstance(raw_offsets, list):
            valid_offsets = []
            for ro in raw_offsets:
                try:
                    val = int(ro)
                    if 0 <= val <= 10080:  # Up to 7 days
                        valid_offsets.append(val)
                except (ValueError, TypeError):
                    pass
            if valid_offsets:
                offsets = sorted(list(set(valid_offsets)), reverse=True)

        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "user_id": str(user_id),
            "application_id": str(app_id),
            "event_type": normalize_event_type(data.get("event_type") or data.get("eventType")),
            "title": title,
            "start_time": start_time,
            "end_time": end_time,
            "timezone": str(data.get("timezone") or "Asia/Kolkata").strip(),
            "meeting_link": meeting_link,
            "location": location,
            "preparation_notes": notes,
            "reminder_offsets": offsets,
            "status": "scheduled",
            "created_at": now,
            "updated_at": now
        }

        col = cls.get_collection()
        res = col.insert_one(doc)
        doc["_id"] = res.inserted_id

        # Also append milestone to application timeline
        try:
            today = now.split("T")[0]
            ApplicationModel.update_application(
                app_id=app_id,
                user_id=user_id,
                updates={
                    "status": "Interview" if "interview" in doc["event_type"] else "Assessment"
                }
            )
        except Exception as te:
            logger.debug("Non-critical timeline sync skipped: %s", str(te))

        return cls.to_dict(doc)

    @classmethod
    def update_event(cls, event_id: str, user_id: str, updates: Dict[str, Any]) -> Optional[dict]:
        col = cls.get_collection()
        query: Dict[str, Any] = {"user_id": str(user_id)}
        if ObjectId.is_valid(event_id):
            query["_id"] = ObjectId(event_id)
        else:
            query["_id"] = event_id

        existing = col.find_one(query)
        if not existing:
            return None

        payload: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc).isoformat()}

        if "title" in updates:
            t = str(updates["title"]).strip()
            if t:
                payload["title"] = t

        if "event_type" in updates or "eventType" in updates:
            payload["event_type"] = normalize_event_type(updates.get("event_type") or updates.get("eventType"))

        if "start_time" in updates or "startTime" in updates:
            st = str(updates.get("start_time") or updates.get("startTime")).strip()
            if st:
                payload["start_time"] = st

        if "end_time" in updates or "endTime" in updates:
            et = str(updates.get("end_time") or updates.get("endTime")).strip()
            if et:
                payload["end_time"] = et

        if "timezone" in updates:
            payload["timezone"] = str(updates["timezone"]).strip()

        if "meeting_link" in updates or "meetingLink" in updates:
            payload["meeting_link"] = validate_meeting_link(updates.get("meeting_link") or updates.get("meetingLink"))

        if "location" in updates:
            payload["location"] = str(updates["location"]).strip()

        if "preparation_notes" in updates or "notes" in updates:
            payload["preparation_notes"] = str(updates.get("preparation_notes") or updates.get("notes") or "").strip()

        if "status" in updates:
            st = str(updates["status"]).strip().lower()
            if st in VALID_STATUSES:
                payload["status"] = st

        if "reminder_offsets" in updates or "reminderOffsets" in updates:
            raw_offsets = updates.get("reminder_offsets") or updates.get("reminderOffsets")
            if isinstance(raw_offsets, list):
                valid_offsets = [int(ro) for ro in raw_offsets if str(ro).isdigit()]
                if valid_offsets:
                    payload["reminder_offsets"] = sorted(list(set(valid_offsets)), reverse=True)

        col.update_one(query, {"$set": payload})
        updated = col.find_one(query)
        return cls.to_dict(updated)

    @classmethod
    def delete_event(cls, event_id: str, user_id: str) -> bool:
        col = cls.get_collection()
        query: Dict[str, Any] = {"user_id": str(user_id)}
        if ObjectId.is_valid(event_id):
            query["_id"] = ObjectId(event_id)
        else:
            query["_id"] = event_id
        res = col.delete_one(query)
        return res.deleted_count > 0
