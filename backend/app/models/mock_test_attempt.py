import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId
from app.config.db import Database

logger = logging.getLogger(__name__)

class MockTestAttemptModel:
    """
    MongoDB model for student mock-test attempts and performance analytics.
    Stored in the 'mock_test_attempts' collection.
    """
    COLLECTION_NAME = "mock_test_attempts"

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
    def to_dict(cls, doc: Optional[dict], include_answers: bool = False) -> dict:
        """
        Serializes attempt document into API format.
        If include_answers is False (active in-progress test), strips correct_answer,
        explanation, and learning_resources to prevent client-side answer leaking.
        """
        if not doc:
            return {}
        data = dict(doc)
        if "_id" in data:
            data["id"] = str(data["_id"])
            del data["_id"]

        status = data.get("status", "in_progress")
        is_completed = status in ("completed", "expired")

        # Sanitize questions if test is still active and include_answers not explicitly requested
        should_reveal = include_answers or is_completed
        raw_questions = data.get("questions") or []
        sanitized_questions = []

        for q in raw_questions:
            q_copy = dict(q)
            if not should_reveal:
                q_copy.pop("correct_answer", None)
                q_copy.pop("explanation", None)
                q_copy.pop("learning_resources", None)
            if "question_text" in q_copy and "question" not in q_copy:
                q_copy["question"] = q_copy["question_text"]
            elif "question" in q_copy and "question_text" not in q_copy:
                q_copy["question_text"] = q_copy["question"]
            sanitized_questions.append(q_copy)

        data["questions"] = sanitized_questions
        data["submitted_answers"] = data.get("submitted_answers") or {}
        data["topic_breakdown"] = data.get("topic_breakdown") or {}
        data["weak_topics"] = data.get("weak_topics") or []
        data["recommended_revisions"] = data.get("recommended_revisions") or []
        data["score"] = data.get("score", 0)
        data["percentage"] = data.get("percentage", 0.0)
        data["total_questions"] = data.get("total_questions", len(sanitized_questions))
        data["correct_count"] = data.get("correct_count", 0)
        data["incorrect_count"] = data.get("incorrect_count", 0)
        data["unanswered_count"] = data.get("unanswered_count", 0)
        return data

    @classmethod
    def create_attempt(cls, attempt_data: Dict[str, Any]) -> dict:
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        doc = dict(attempt_data)
        doc["created_at"] = now
        doc["updated_at"] = now
        doc.setdefault("status", "in_progress")
        doc.setdefault("submitted_answers", {})

        res = col.insert_one(doc)
        doc["_id"] = res.inserted_id
        return cls.to_dict(doc, include_answers=False)

    @classmethod
    def find_by_id(cls, attempt_id: str, user_id: Optional[str] = None, application_id: Optional[str] = None) -> Optional[dict]:
        col = cls.get_collection()
        query: Dict[str, Any] = {}
        try:
            query["_id"] = ObjectId(attempt_id)
        except Exception:
            return None

        if user_id:
            query["user_id"] = str(user_id)
        if application_id:
            query["application_id"] = str(application_id)

        doc = col.find_one(query)
        return doc

    @classmethod
    def find_by_application(cls, app_id: str, user_id: str) -> List[dict]:
        col = cls.get_collection()
        cursor = col.find({
            "application_id": str(app_id),
            "user_id": str(user_id)
        }).sort("created_at", -1)

        results = []
        for doc in cursor:
            # History list shows summary with answers included only if completed
            results.append(cls.to_dict(doc, include_answers=False))
        return results

    @classmethod
    def get_attempts_for_application(cls, app_id: str, user_id: Optional[str] = None) -> List[dict]:
        col = cls.get_collection()
        q: Dict[str, Any] = {"application_id": str(app_id)}
        if user_id:
            q["user_id"] = str(user_id)
        cursor = col.find(q).sort("created_at", -1)
        return [cls.to_dict(doc, include_answers=False) for doc in cursor]

    @classmethod
    def save_answers(cls, attempt_id: str, user_id: str, answers: Dict[str, Any]) -> bool:
        """Atomically updates in-progress answers if test is still active."""
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        try:
            oid = ObjectId(attempt_id)
        except Exception:
            return False

        res = col.update_one(
            {
                "_id": oid,
                "user_id": str(user_id),
                "status": "in_progress"
            },
            {
                "$set": {
                    "submitted_answers": answers,
                    "updated_at": now
                }
            }
        )
        return res.modified_count > 0 or res.matched_count > 0

    @classmethod
    def complete_attempt(cls, attempt_id: str, user_id: str, results_data: Dict[str, Any], status: str = "completed") -> Optional[dict]:
        """Atomically records grading results and marks test completed/expired."""
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        try:
            oid = ObjectId(attempt_id)
        except Exception:
            return None

        update_fields = dict(results_data)
        update_fields["status"] = status
        update_fields["submitted_at"] = now
        update_fields["updated_at"] = now

        res = col.find_one_and_update(
            {
                "_id": oid,
                "user_id": str(user_id),
                "status": "in_progress"
            },
            {"$set": update_fields},
            return_document=True
        )
        if res:
            return cls.to_dict(res, include_answers=True)

        # If already completed, return existing doc
        existing = col.find_one({"_id": oid, "user_id": str(user_id)})
        return cls.to_dict(existing, include_answers=True) if existing else None
