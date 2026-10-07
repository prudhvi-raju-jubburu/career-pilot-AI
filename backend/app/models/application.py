import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId
from app.config.db import Database

logger = logging.getLogger(__name__)

STAGES = ["Saved", "Applied", "Interviewing", "Offer", "Rejected"]

class ApplicationModel:
    """
    MongoDB model for student career applications and tracking pipeline.
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
        # Format compatibility aliases for frontend
        data["company"] = data.get("company", "Unknown Organization")
        data["role"] = data.get("role", "Opportunity")
        data["status"] = data.get("status", "Saved")
        data["type"] = data.get("type", "Internship")
        data["appliedDate"] = data.get("applied_date")
        data["lastUpdated"] = data.get("updated_at", data.get("created_at"))
        data["matchScore"] = data.get("match_score", 85)
        data["notes"] = data.get("notes", "")
        data["timeline"] = data.get("timeline", [])
        data["location"] = data.get("location", "Remote")
        data["deadline"] = data.get("deadline")
        data["opportunityId"] = data.get("opportunity_id")
        return data

    @classmethod
    def find_by_user(cls, user_id: str, status: Optional[str] = None) -> List[dict]:
        col = cls.get_collection()
        query: Dict[str, Any] = {"user_id": str(user_id)}
        if status and status.upper() != "ALL":
            query["status"] = status
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
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        status = data.get("status", "Saved")

        applied_date = data.get("appliedDate") or data.get("applied_date")
        if status == "Applied" and not applied_date:
            applied_date = now.split("T")[0]

        initial_timeline = data.get("timeline")
        if not initial_timeline:
            initial_timeline = [{
                "date": now.split("T")[0],
                "event": f"Tracked in {status}"
            }]

        doc = {
            "user_id": str(user_id),
            "opportunity_id": data.get("opportunityId") or data.get("opportunity_id"),
            "company": data.get("company", "Target Company").strip(),
            "role": data.get("role", "Software Role").strip(),
            "type": data.get("type", "Internship"),
            "status": status,
            "location": data.get("location", "Remote"),
            "deadline": data.get("deadline"),
            "applied_date": applied_date,
            "match_score": int(data.get("matchScore") or data.get("match_score") or 85),
            "salary": data.get("salary"),
            "notes": data.get("notes", ""),
            "timeline": initial_timeline,
            "created_at": now,
            "updated_at": now
        }
        res = col.insert_one(doc)
        doc["_id"] = res.inserted_id
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
        allowed = ["company", "role", "type", "location", "deadline", "salary", "notes", "match_score"]
        for key in allowed:
            if key in updates:
                payload[key] = updates[key]

        # Handle camelCase properties from frontend
        if "matchScore" in updates:
            payload["match_score"] = int(updates["matchScore"])
        if "appliedDate" in updates:
            payload["applied_date"] = updates["appliedDate"]

        if "timeline" in updates:
            payload["timeline"] = updates["timeline"]

        col.update_one(query, {"$set": payload})
        updated_doc = col.find_one(query)
        return cls.to_dict(updated_doc)

    @classmethod
    def update_stage(cls, app_id: str, user_id: str, new_status: str, note: Optional[str] = None) -> Optional[dict]:
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        today = now.split("T")[0]

        query: Dict[str, Any] = {"user_id": str(user_id)}
        if ObjectId.is_valid(app_id):
            query["_id"] = ObjectId(app_id)
        else:
            query["_id"] = app_id

        existing = col.find_one(query)
        if not existing:
            return None

        timeline = list(existing.get("timeline") or [])
        event_text = f"Moved to {new_status}"
        if note:
            event_text += f": {note}"
        timeline.append({"date": today, "event": event_text})

        payload = {
            "status": new_status,
            "timeline": timeline,
            "updated_at": now
        }
        if new_status == "Applied" and not existing.get("applied_date"):
            payload["applied_date"] = today

        col.update_one(query, {"$set": payload})
        updated = col.find_one(query)
        return cls.to_dict(updated)

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
