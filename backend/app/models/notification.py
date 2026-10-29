import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId
from app.config.db import Database

logger = logging.getLogger(__name__)

CANONICAL_NOTIFICATION_TYPES = {
    "new_matching_opportunity",
    "deadline_reminder",
    "application_status_reminder",
    "weekly_opportunity_digest",
    "interview_reminder",
    "application_follow_up",
    "system_notice",
    "system",
    "opportunity",
    "application",
    "deadline"
}

class NotificationModel:
    """
    MongoDB model for in-app user notifications, alerts, and delivery tracking.
    Stored in the 'notifications' collection.
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
            col.create_index([("user_id", 1), ("type", 1)])
            col.create_index("dedupe_key", unique=True, sparse=True)
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
    def find_by_user(
        cls,
        user_id: str,
        unread_only: bool = False,
        notif_type: Optional[str] = None,
        limit: int = 50,
        skip: int = 0
    ) -> List[dict]:
        col = cls.get_collection()
        query: Dict[str, Any] = {"$or": [{"user_id": str(user_id)}, {"user_id": "broadcast"}]}
        if unread_only:
            query["read"] = False
        if notif_type and notif_type.lower() != "all":
            query["type"] = notif_type.lower()

        cursor = col.find(query).sort("created_at", -1).skip(skip).limit(limit)
        return [cls.to_dict(d) for d in cursor]

    @classmethod
    def get_unread_count(cls, user_id: str) -> int:
        col = cls.get_collection()
        return col.count_documents({
            "$or": [{"user_id": str(user_id)}, {"user_id": "broadcast"}],
            "read": False
        })

    @classmethod
    def create_notification(
        cls,
        user_id: str,
        title: str,
        message: str,
        notif_type: str = "system",
        opportunity_id: Optional[str] = None,
        link: Optional[str] = None,
        channel: str = "in_app",
        dedupe_key: Optional[str] = None
    ) -> Optional[dict]:
        """
        Creates an in-app notification.
        If dedupe_key is provided and already exists, skips gracefully to avoid duplicate alerts.
        """
        col = cls.get_collection()
        norm_type = notif_type.lower() if notif_type else "system"
        if norm_type not in CANONICAL_NOTIFICATION_TYPES:
            norm_type = "system"

        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "user_id": str(user_id),
            "title": title.strip(),
            "message": message.strip(),
            "type": norm_type,
            "opportunity_id": str(opportunity_id) if opportunity_id else None,
            "link": link or (f"/opportunities?selected={opportunity_id}" if opportunity_id else None),
            "read": False,
            "channel": channel,
            "delivery_status": "delivered" if channel == "in_app" else "pending",
            "created_at": now
        }
        if dedupe_key:
            doc["dedupe_key"] = str(dedupe_key)

        try:
            res = col.insert_one(doc)
            doc["_id"] = res.inserted_id
            return cls.to_dict(doc)
        except Exception as e:
            # Handle duplicate key violation cleanly
            if "duplicate key" in str(e).lower() or "e11000" in str(e).lower():
                logger.debug("Duplicate notification skipped via dedupe_key '%s'", dedupe_key)
                existing = col.find_one({"dedupe_key": dedupe_key})
                return cls.to_dict(existing) if existing else None
            logger.warning("Could not insert notification: %s", str(e))
            return None

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

    @classmethod
    def delete_notification(cls, notif_id: str, user_id: str) -> bool:
        col = cls.get_collection()
        query: Dict[str, Any] = {"user_id": str(user_id)}
        if ObjectId.is_valid(notif_id):
            query["_id"] = ObjectId(notif_id)
        else:
            query["_id"] = notif_id
        res = col.delete_one(query)
        return res.deleted_count > 0
