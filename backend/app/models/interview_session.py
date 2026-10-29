import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId
from app.config.db import Database

logger = logging.getLogger(__name__)

class InterviewSessionModel:
    """
    MongoDB model for interactive, grounded AI interview simulator sessions.
    Stored in the 'interview_sessions' collection.
    """
    COLLECTION_NAME = "interview_sessions"

    # Supported interview modes
    MODES = [
        "technical",
        "coding_discussion",
        "project_deep_dive",
        "behavioral",
        "weak_topics"
    ]

    DIFFICULTIES = ["easy", "medium", "hard"]
    STATUSES = ["active", "paused", "completed", "ended_early"]

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
            col.create_index([("user_id", 1), ("application_id", 1), ("created_at", -1)])
            col.create_index("application_id")
            col.create_index("user_id")
            col.create_index([("user_id", 1), ("status", 1)])
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

        data["questions"] = data.get("questions") or []
        data["answers"] = data.get("answers") or {}
        data["evaluations"] = data.get("evaluations") or {}
        data["follow_up_answers"] = data.get("follow_up_answers") or {}
        data["summary"] = data.get("summary") or {}
        data["current_question_index"] = data.get("current_question_index", 0)
        data["total_questions"] = data.get("total_questions", len(data["questions"]))
        data["status"] = data.get("status", "active")
        data["mode"] = data.get("mode") or data.get("session_type", "technical")
        data["difficulty"] = data.get("difficulty", "medium")
        return data

    @classmethod
    def find_by_id(cls, session_id: str, user_id: Optional[str] = None, app_id: Optional[str] = None) -> Optional[dict]:
        col = cls.get_collection()
        try:
            oid = ObjectId(session_id)
        except Exception:
            return None

        query: Dict[str, Any] = {"_id": oid}
        if user_id:
            query["user_id"] = str(user_id)
        if app_id:
            query["application_id"] = str(app_id)

        doc = col.find_one(query)
        return cls.to_dict(doc) if doc else None

    @classmethod
    def find_active(cls, user_id: str, app_id: str) -> Optional[dict]:
        """Finds any active or paused session for this application and user."""
        col = cls.get_collection()
        doc = col.find_one({
            "user_id": str(user_id),
            "application_id": str(app_id),
            "status": {"$in": ["active", "paused"]}
        }, sort=[("created_at", -1)])
        return cls.to_dict(doc) if doc else None

    @classmethod
    def list_by_application(cls, app_id: str, user_id: str, limit: int = 20) -> List[dict]:
        """Retrieves session history for an application."""
        col = cls.get_collection()
        cursor = col.find({
            "user_id": str(user_id),
            "application_id": str(app_id)
        }).sort("created_at", -1).limit(limit)

        return [cls.to_dict(doc) for doc in cursor]

    @classmethod
    def create_session(cls, data: Dict[str, Any]) -> dict:
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()

        doc = dict(data)
        doc["created_at"] = now
        doc["updated_at"] = now
        doc["status"] = doc.get("status", "active")
        doc["current_question_index"] = doc.get("current_question_index", 0)
        doc["answers"] = doc.get("answers", {})
        doc["evaluations"] = doc.get("evaluations", {})
        doc["follow_up_answers"] = doc.get("follow_up_answers", {})

        result = col.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        if "_id" in doc:
            del doc["_id"]
        return cls.to_dict(doc)

    @classmethod
    def save_answer(cls, session_id: str, user_id: str, question_index: int, answer_text: str) -> bool:
        """Atomically saves candidate answer before invoking AI evaluation."""
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        try:
            oid = ObjectId(session_id)
        except Exception:
            return False

        q_key = str(question_index)
        answer_payload = {
            "answer_text": answer_text,
            "submitted_at": now
        }

        res = col.update_one(
            {
                "_id": oid,
                "user_id": str(user_id),
                "status": {"$in": ["active", "paused"]}
            },
            {
                "$set": {
                    f"answers.{q_key}": answer_payload,
                    "updated_at": now
                }
            }
        )
        return res.modified_count > 0 or res.matched_count > 0

    @classmethod
    def save_evaluation(cls, session_id: str, user_id: str, question_index: int, evaluation: Dict[str, Any]) -> bool:
        """Stores evaluation feedback for a specific question."""
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        try:
            oid = ObjectId(session_id)
        except Exception:
            return False

        q_key = str(question_index)
        eval_payload = dict(evaluation)
        eval_payload["evaluated_at"] = now

        res = col.update_one(
            {
                "_id": oid,
                "user_id": str(user_id)
            },
            {
                "$set": {
                    f"evaluations.{q_key}": eval_payload,
                    "updated_at": now
                }
            }
        )
        return res.modified_count > 0 or res.matched_count > 0

    @classmethod
    def advance_question(cls, session_id: str, user_id: str, next_index: int) -> bool:
        """Advances current question index in active session."""
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        try:
            oid = ObjectId(session_id)
        except Exception:
            return False

        res = col.update_one(
            {
                "_id": oid,
                "user_id": str(user_id),
                "status": "active"
            },
            {
                "$set": {
                    "current_question_index": next_index,
                    "updated_at": now
                }
            }
        )
        return res.modified_count > 0

    @classmethod
    def pause_session(cls, session_id: str, user_id: str) -> bool:
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        try:
            oid = ObjectId(session_id)
        except Exception:
            return False

        res = col.update_one(
            {"_id": oid, "user_id": str(user_id), "status": "active"},
            {"$set": {"status": "paused", "updated_at": now}}
        )
        return res.modified_count > 0

    @classmethod
    def resume_session(cls, session_id: str, user_id: str) -> bool:
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        try:
            oid = ObjectId(session_id)
        except Exception:
            return False

        res = col.update_one(
            {"_id": oid, "user_id": str(user_id), "status": "paused"},
            {"$set": {"status": "active", "updated_at": now}}
        )
        return res.modified_count > 0

    @classmethod
    def complete_session(cls, session_id: str, user_id: str, summary: Dict[str, Any], status: str = "completed") -> Optional[dict]:
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        try:
            oid = ObjectId(session_id)
        except Exception:
            return None

        doc = col.find_one_and_update(
            {"_id": oid, "user_id": str(user_id)},
            {
                "$set": {
                    "status": status,
                    "summary": summary,
                    "completed_at": now,
                    "updated_at": now
                }
            },
            return_document=True
        )
        return cls.to_dict(doc) if doc else None
