import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId
from app.config.db import Database

logger = logging.getLogger(__name__)

SENSITIVE_KEYS = {
    "password", "password_hash", "token", "secret", "jwt",
    "api_key", "authorization", "raw_resume", "extracted_resume"
}

def sanitize_details(details: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Sanitizes audit log payload to guarantee no passwords, secrets, or tokens are logged."""
    if not details or not isinstance(details, dict):
        return {}
    clean = {}
    for k, v in details.items():
        if k.lower() in SENSITIVE_KEYS:
            continue
        if isinstance(v, dict):
            clean[k] = sanitize_details(v)
        elif isinstance(v, list):
            clean[k] = [sanitize_details(item) if isinstance(item, dict) else item for item in v]
        else:
            clean[k] = v
    return clean

class AuditLogModel:
    """
    MongoDB model for administrative audit trails.
    Append-only: records mutations by administrators with sanitized change context.
    No deletion or mutation APIs are exposed.
    """
    COLLECTION_NAME = "audit_logs"

    @classmethod
    def get_collection(cls):
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database connection is not initialized")
        return db[cls.COLLECTION_NAME]

    @classmethod
    def ensure_indexes(cls):
        """Creates compound indexes for fast filtering and chronological queries."""
        try:
            col = cls.get_collection()
            col.create_index("created_at")
            col.create_index("admin_id")
            col.create_index("action")
            col.create_index("target_type")
            col.create_index([("action", 1), ("created_at", -1)])
            col.create_index([("admin_id", 1), ("created_at", -1)])
            logger.info("Successfully ensured MongoDB indexes on '%s'", cls.COLLECTION_NAME)
        except Exception as e:
            logger.warning("Could not create indexes on '%s': %s", cls.COLLECTION_NAME, str(e))

    @classmethod
    def record(
        cls,
        admin_id: str,
        admin_email: str,
        action: str,
        target_type: str,
        target_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Appends an immutable audit log entry.
        Never logs passwords, tokens, or API credentials.
        """
        col = cls.get_collection()
        now_iso = datetime.now(timezone.utc).isoformat()

        doc = {
            "admin_id": str(admin_id),
            "admin_email": str(admin_email or ""),
            "action": str(action).strip().upper(),
            "target_type": str(target_type).strip().lower(),
            "target_id": str(target_id) if target_id else None,
            "details": sanitize_details(details),
            "ip_address": str(ip_address) if ip_address else None,
            "user_agent": str(user_agent)[:250] if user_agent else None,
            "created_at": now_iso
        }

        res = col.insert_one(doc)
        doc["_id"] = res.inserted_id
        return cls.to_dict(doc)

    @classmethod
    def find_paginated(
        cls,
        query: Dict[str, Any],
        skip: int = 0,
        limit: int = 20,
        sort_criteria: Optional[List[tuple]] = None
    ) -> List[Dict[str, Any]]:
        """Retrieves paginated audit logs."""
        col = cls.get_collection()
        if sort_criteria is None:
            sort_criteria = [("created_at", -1)]
        cursor = col.find(query).sort(sort_criteria).skip(skip).limit(limit)
        return [cls.to_dict(doc) for doc in cursor]

    @classmethod
    def count_logs(cls, query: Dict[str, Any]) -> int:
        """Counts total audit log records matching criteria."""
        col = cls.get_collection()
        return col.count_documents(query)

    @classmethod
    def to_dict(cls, doc: Optional[dict]) -> dict:
        """Converts document to JSON-safe dictionary."""
        if not doc:
            return {}
        d = dict(doc)
        if "_id" in d:
            d["id"] = str(d["_id"])
            del d["_id"]
        return d
