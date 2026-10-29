import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId
from app.config.db import Database

logger = logging.getLogger(__name__)

class DigestDeliveryModel:
    """
    Tracks email and in-app digest deliveries to guarantee idempotency and delivery observability.
    Stored in the 'digest_deliveries' collection.
    """
    COLLECTION_NAME = "digest_deliveries"

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
            col.create_index([("user_id", 1), ("digest_date", 1), ("frequency", 1)], unique=True)
            col.create_index("user_id")
            col.create_index("status")
            col.create_index("created_at")
            logger.info("Successfully ensured MongoDB indexes on '%s'", cls.COLLECTION_NAME)
        except Exception as e:
            logger.warning("Could not create indexes on '%s': %s", cls.COLLECTION_NAME, str(e))

    @classmethod
    def has_delivered_today(cls, user_id: str, digest_date: str, frequency: str = "daily") -> bool:
        """Checks if a digest was already dispatched or recorded for this window."""
        col = cls.get_collection()
        doc = col.find_one({
            "user_id": str(user_id),
            "digest_date": str(digest_date),
            "frequency": str(frequency),
            "status": {"$in": ["sent", "simulated"]}
        })
        return doc is not None

    @classmethod
    def record_delivery(
        cls,
        user_id: str,
        recipient_email: str,
        digest_date: str,
        frequency: str = "daily",
        opportunity_ids: Optional[List[str]] = None,
        status: str = "sent",
        error: Optional[str] = None
    ) -> Dict[str, Any]:
        """Records a digest delivery attempt."""
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "user_id": str(user_id),
            "recipient_email": str(recipient_email),
            "digest_date": str(digest_date),
            "frequency": str(frequency),
            "opportunity_ids": opportunity_ids or [],
            "status": status,
            "error": error,
            "created_at": now
        }
        try:
            res = col.insert_one(doc)
            doc["_id"] = res.inserted_id
            return doc
        except Exception as e:
            if "duplicate key" in str(e).lower() or "e11000" in str(e).lower():
                # Already recorded
                existing = col.find_one({
                    "user_id": str(user_id),
                    "digest_date": str(digest_date),
                    "frequency": str(frequency)
                })
                return existing or doc
            logger.warning("Could not record digest delivery: %s", str(e))
            return doc
