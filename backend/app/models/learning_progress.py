from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from bson import ObjectId
from app.config.db import Database

class LearningProgressModel:
    """Manages student learning progress per skill in MongoDB."""

    @classmethod
    def get_collection(cls):
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database connection is not initialized")
        return db["learning_progress"]

    @classmethod
    def ensure_indexes(cls):
        """Creates compound index on (user_id, skill) to ensure fast lookups."""
        try:
            col = cls.get_collection()
            col.create_index([("user_id", 1), ("skill", 1)], unique=True)
        except Exception:
            pass

    @classmethod
    def get_user_progress(cls, user_id: str) -> List[Dict[str, Any]]:
        """Retrieves all tracked learning skills for a user."""
        try:
            col = cls.get_collection()
            cursor = col.find({"user_id": str(user_id)})
            results = []
            for doc in cursor:
                doc["_id"] = str(doc["_id"])
                results.append(doc)
            return results
        except Exception:
            return []

    @classmethod
    def get_skill_progress(cls, user_id: str, skill: str) -> Optional[Dict[str, Any]]:
        """Retrieves progress document for a specific skill."""
        try:
            col = cls.get_collection()
            doc = col.find_one({"user_id": str(user_id), "skill": skill})
            if doc:
                doc["_id"] = str(doc["_id"])
            return doc
        except Exception:
            return None

    @classmethod
    def update_progress(cls, user_id: str, skill: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Upserts learning progress for a user and skill."""
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()

        update_fields = {
            "updated_at": now,
        }

        if "status" in data:
            update_fields["status"] = data["status"] # "not_started" | "learning" | "completed"
        if "progress" in data:
            update_fields["progress"] = min(max(int(data["progress"]), 0), 100)
        if "completed_topics" in data:
            update_fields["completed_topics"] = list(data["completed_topics"])
        if "target_role" in data:
            update_fields["target_role"] = data["target_role"]
        if "notes" in data:
            update_fields["notes"] = data["notes"]

        doc = col.find_one_and_update(
            {"user_id": str(user_id), "skill": skill},
            {
                "$set": update_fields,
                "$setOnInsert": {
                    "created_at": now,
                    "user_id": str(user_id),
                    "skill": skill,
                    "status": data.get("status", "learning"),
                    "progress": data.get("progress", 0),
                    "completed_topics": data.get("completed_topics", []),
                }
            },
            upsert=True,
            return_document=True
        )
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc or {}
