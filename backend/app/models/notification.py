import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId
from app.config.db import Database

logger = logging.getLogger(__name__)

class NotificationModel:
    """
    MongoDB model for in-app user notifications and real-time alerts.
    """
    COLLECTION_NAME = "notifications"

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
            col.create_index("read")
            col.create_index([("user_id", 1), ("read", 1)])
            col.create_index([("user_id", 1), ("created_at", -1)])
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
        return data

    @classmethod
    def find_by_user(cls, user_id: str, limit: int = 50) -> List[dict]:
        col = cls.get_collection()
        # Find user-specific or global broadcast notifications
        query = {"$or": [{"user_id": str(user_id)}, {"user_id": "broadcast"}]}
        cursor = col.find(query).sort("created_at", -1).limit(limit)
        return [cls.to_dict(d) for d in cursor]

    @classmethod
    def create_notification(cls, user_id: str, title: str, message: str, notif_type: str = "system", link: Optional[str] = None) -> dict:
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "user_id": str(user_id),
            "title": title,
            "message": message,
            "type": notif_type,
            "link": link,
            "read": False,
            "created_at": now
        }
        res = col.insert_one(doc)
        doc["_id"] = res.inserted_id
        return cls.to_dict(doc)

    @classmethod
    def mark_read(cls, notif_id: str, user_id: str) -> bool:
        col = cls.get_collection()
        query: Dict[str, Any] = {"$or": [{"user_id": str(user_id)}, {"user_id": "broadcast"}]}
        if ObjectId.is_valid(notif_id):
            query["_id"] = ObjectId(notif_id)
        else:
            query["_id"] = notif_id
        res = col.update_one(query, {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}})
        return res.modified_count > 0

    @classmethod
    def mark_all_read(cls, user_id: str) -> int:
        col = cls.get_collection()
        res = col.update_many(
            {"$or": [{"user_id": str(user_id)}, {"user_id": "broadcast"}], "read": False},
            {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
        )
        return res.modified_count
