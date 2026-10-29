import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId
from app.config.db import Database

logger = logging.getLogger(__name__)

class GeneratedResumeModel:
    """
    MongoDB model for saved student resume versions in the 'generated_resumes' collection.
    Enforces user isolation, schema validation, and version lifecycle management.
    """
    COLLECTION_NAME = "generated_resumes"

    @classmethod
    def get_collection(cls):
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database connection is not initialized")
        return db[cls.COLLECTION_NAME]

    @classmethod
    def ensure_indexes(cls):
        """Ensures compound and single indexes for fast user queries and sorting."""
        try:
            col = cls.get_collection()
            col.create_index("user_id")
            col.create_index([("user_id", 1), ("updated_at", -1)])
            col.create_index([("user_id", 1), ("target_role", 1)])
            logger.info("Successfully ensured MongoDB indexes on '%s'", cls.COLLECTION_NAME)
        except Exception as e:
            logger.warning("Could not create indexes on '%s': %s", cls.COLLECTION_NAME, str(e))

    @classmethod
    def to_dict(cls, doc: Optional[dict]) -> dict:
        """Converts MongoDB document to JSON-safe dictionary with normalized string IDs."""
        if not doc:
            return {}
        data = dict(doc)
        if "_id" in data:
            data["id"] = str(data["_id"])
            del data["_id"]
        if "user_id" in data:
            data["user_id"] = str(data["user_id"])
        return data

    @classmethod
    def create_version(cls, user_id: str, version_payload: dict) -> dict:
        """
        Creates a new saved resume version for the authenticated user.
        """
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        u_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id

        doc = {
            "user_id": u_id,
            "title": str(version_payload.get("title", "Untitled Resume")).strip() or "Untitled Resume",
            "target_role": str(version_payload.get("target_role", "Software Engineer")).strip(),
            "target_opportunity_id": version_payload.get("target_opportunity_id"),
            "template_id": version_payload.get("template_id", "ats_classic"),
            "formatting": version_payload.get("formatting", {
                "font_size": "standard",
                "spacing": "standard",
                "accent_color": "#1e3a8a",
                "visible_sections": {
                    "summary": True,
                    "education": True,
                    "skills": True,
                    "projects": True,
                    "experience": True,
                    "certifications": True,
                    "achievements": True
                }
            }),
            "resume_data": version_payload.get("resume_data", {}),
            "target_job_description": version_payload.get("target_job_description"),
            "quality_assessment": version_payload.get("quality_assessment", {}),
            "created_at": now,
            "updated_at": now
        }

        result = col.insert_one(doc)
        doc["_id"] = result.inserted_id
        return cls.to_dict(doc)

    @classmethod
    def find_by_id_and_user(cls, version_id: str, user_id: str) -> Optional[dict]:
        """Fetches a specific version ensuring strict user-level data isolation."""
        if not version_id or not user_id:
            return None
        col = cls.get_collection()
        try:
            v_id = ObjectId(version_id) if ObjectId.is_valid(version_id) else version_id
            u_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
            doc = col.find_one({"_id": v_id, "user_id": u_id})
            if not doc and isinstance(user_id, str):
                doc = col.find_one({"_id": v_id, "user_id": user_id})
            return doc
        except Exception as e:
            logger.warning("Error fetching resume version %s for user %s: %s", version_id, user_id, str(e))
            return None

    @classmethod
    def list_by_user(cls, user_id: str, limit: int = 50) -> List[dict]:
        """Lists all resume versions belonging to the authenticated user, newest first."""
        if not user_id:
            return []
        col = cls.get_collection()
        try:
            u_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
            cursor = col.find({"user_id": u_id}).sort("updated_at", -1).limit(limit)
            docs = list(cursor)
            if not docs and isinstance(user_id, str):
                docs = list(col.find({"user_id": user_id}).sort("updated_at", -1).limit(limit))
            return [cls.to_dict(d) for d in docs]
        except Exception as e:
            logger.warning("Error listing resume versions for user %s: %s", user_id, str(e))
            return []

    @classmethod
    def update_version(cls, version_id: str, user_id: str, updates: dict) -> Optional[dict]:
        """Updates a resume version, preserving user ownership and updating the timestamp."""
        existing = cls.find_by_id_and_user(version_id, user_id)
        if not existing:
            return None

        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        
        safe_updates = {}
        for field in ["title", "target_role", "target_opportunity_id", "template_id", 
                      "formatting", "resume_data", "target_job_description", "quality_assessment"]:
            if field in updates:
                safe_updates[field] = updates[field]
        
        safe_updates["updated_at"] = now

        col.update_one({"_id": existing["_id"]}, {"$set": safe_updates})
        updated = cls.find_by_id_and_user(version_id, user_id)
        return cls.to_dict(updated)

    @classmethod
    def delete_version(cls, version_id: str, user_id: str) -> bool:
        """Deletes a resume version with user ownership check."""
        existing = cls.find_by_id_and_user(version_id, user_id)
        if not existing:
            return False
        col = cls.get_collection()
        result = col.delete_one({"_id": existing["_id"]})
        return result.deleted_count > 0

    @classmethod
    def duplicate_version(cls, version_id: str, user_id: str, new_title: Optional[str] = None) -> Optional[dict]:
        """Duplicates an existing resume version with a distinct title."""
        original = cls.find_by_id_and_user(version_id, user_id)
        if not original:
            return None

        clean_original = dict(original)
        clean_original.pop("_id", None)
        orig_title = clean_original.get("title", "Resume")
        clean_original["title"] = new_title or f"{orig_title} (Copy)"
        return cls.create_version(user_id, clean_original)
