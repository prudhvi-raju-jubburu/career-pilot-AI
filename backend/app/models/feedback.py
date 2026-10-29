import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId
from app.config.db import Database

logger = logging.getLogger(__name__)

CANONICAL_EVENT_TYPES = {
    "opportunity_viewed",
    "opportunity_saved",
    "opportunity_unsaved",
    "application_started",
    "application_confirmed",
    "application_status_changed",
    "recommendation_dismissed",
    "relevance_feedback_submitted"
}

# Compatibility mapping for legacy events
EVENT_TYPE_ALIASES = {
    "click": "opportunity_viewed",
    "view": "opportunity_viewed",
    "save": "opportunity_saved",
    "unsave": "opportunity_unsaved",
    "apply": "application_started",
    "dismiss": "recommendation_dismissed",
    "feedback": "relevance_feedback_submitted"
}

VALID_FEEDBACK_RATINGS = {"relevant", "not_relevant"}

VALID_FEEDBACK_REASONS = {
    "wrong_role",
    "wrong_location",
    "not_eligible",
    "already_applied",
    "not_interested",
    "salary_too_low",
    "missing_skills",
    "good_match",
    "dream_company",
    "other"
}

class FeedbackModel:
    """
    MongoDB model for student interaction signals and explicit relevance feedback.
    Stored in the 'user_feedback' collection.
    """
    COLLECTION_NAME = "user_feedback"

    @classmethod
    def get_collection(cls):
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database connection is not initialized")
        return db[cls.COLLECTION_NAME]

    @classmethod
    def ensure_indexes(cls):
        """Creates compound indexes for fast per-user event retrieval and deduplication."""
        try:
            col = cls.get_collection()
            col.create_index([("user_id", 1), ("opportunity_id", 1)])
            col.create_index([("user_id", 1), ("event_type", 1)])
            col.create_index([("user_id", 1), ("created_at", -1)])
            col.create_index([("created_at", 1)])
            logger.info("Successfully ensured MongoDB indexes on '%s'", cls.COLLECTION_NAME)
        except Exception as e:
            logger.warning("Could not create indexes on '%s': %s", cls.COLLECTION_NAME, str(e))

    @classmethod
    def normalize_event_type(cls, raw_type: Optional[str]) -> Optional[str]:
        if not raw_type:
            return None
        t = str(raw_type).strip().lower()
        if t in CANONICAL_EVENT_TYPES:
            return t
        return EVENT_TYPE_ALIASES.get(t)

    @classmethod
    def record_event(
        cls,
        user_id: str,
        opportunity_id: str,
        event_type: str,
        rating: Optional[str] = None,
        reason: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        category: Optional[str] = None,
        company: Optional[str] = None,
        skills: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Validates and records a student interaction event.
        Returns the created document.
        """
        col = cls.get_collection()
        norm_type = cls.normalize_event_type(event_type)
        if not norm_type:
            raise ValueError(f"Invalid event_type '{event_type}'. Must be one of: {sorted(CANONICAL_EVENT_TYPES)}")

        if rating:
            rating = str(rating).strip().lower()
            if rating not in VALID_FEEDBACK_RATINGS:
                raise ValueError(f"Invalid rating '{rating}'. Must be 'relevant' or 'not_relevant'")

        if reason:
            reason = str(reason).strip().lower()
            if reason not in VALID_FEEDBACK_REASONS:
                reason = "other"

        now_iso = datetime.now(timezone.utc).isoformat()

        # Deduplication for views: limit to 1 'opportunity_viewed' per user per opportunity per 24h
        if norm_type == "opportunity_viewed":
            one_day_ago = datetime.fromtimestamp(datetime.now(timezone.utc).timestamp() - 86400, timezone.utc).isoformat()
            existing_view = col.find_one({
                "user_id": str(user_id),
                "opportunity_id": str(opportunity_id),
                "event_type": "opportunity_viewed",
                "created_at": {"$gte": one_day_ago}
            })
            if existing_view:
                return cls.to_dict(existing_view)

        # For explicit feedback (relevance_feedback_submitted / dismissed), upsert so a student can change their answer
        if norm_type in ("relevance_feedback_submitted", "recommendation_dismissed"):
            existing = col.find_one({
                "user_id": str(user_id),
                "opportunity_id": str(opportunity_id),
                "event_type": norm_type
            })
            if existing:
                col.update_one(
                    {"_id": existing["_id"]},
                    {
                        "$set": {
                            "rating": rating,
                            "reason": reason,
                            "context": context or {},
                            "updated_at": now_iso
                        }
                    }
                )
                existing.update({
                    "rating": rating,
                    "reason": reason,
                    "context": context or {},
                    "updated_at": now_iso
                })
                return cls.to_dict(existing)

        doc = {
            "user_id": str(user_id),
            "opportunity_id": str(opportunity_id),
            "event_type": norm_type,
            "rating": rating,
            "reason": reason,
            "context": context or {},
            "category": category,
            "company": company,
            "skills": [str(s).strip() for s in (skills or []) if str(s).strip()][:15],
            "created_at": now_iso,
            "updated_at": now_iso
        }
        res = col.insert_one(doc)
        doc["_id"] = res.inserted_id
        return cls.to_dict(doc)

    @classmethod
    def get_user_events(
        cls,
        user_id: str,
        event_types: Optional[List[str]] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Retrieves chronological events for the authenticated student."""
        col = cls.get_collection()
        query: Dict[str, Any] = {"user_id": str(user_id)}
        if event_types:
            norm_types = [cls.normalize_event_type(t) for t in event_types if cls.normalize_event_type(t)]
            if norm_types:
                query["event_type"] = {"$in": norm_types}

        cursor = col.find(query).sort("created_at", -1).limit(limit)
        return [cls.to_dict(d) for d in cursor]

    @classmethod
    def delete_feedback(cls, user_id: str, opportunity_id: str) -> bool:
        """Removes explicit feedback or dismissal on an opportunity for the student."""
        col = cls.get_collection()
        res = col.delete_many({
            "user_id": str(user_id),
            "opportunity_id": str(opportunity_id),
            "event_type": {"$in": ["relevance_feedback_submitted", "recommendation_dismissed"]}
        })
        return res.deleted_count > 0

    @classmethod
    def get_feedback_for_opportunity(cls, user_id: str, opportunity_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves current student's feedback for a specific opportunity."""
        col = cls.get_collection()
        doc = col.find_one({
            "user_id": str(user_id),
            "opportunity_id": str(opportunity_id),
            "event_type": {"$in": ["relevance_feedback_submitted", "recommendation_dismissed"]}
        }, sort=[("created_at", -1)])
        return cls.to_dict(doc) if doc else None

    @classmethod
    def get_user_feedback_summary(cls, user_id: str) -> Dict[str, Any]:
        """Returns summary counts of student's feedback interactions."""
        col = cls.get_collection()
        events = list(col.find({"user_id": str(user_id)}))
        total_events = len(events)
        relevant_count = sum(1 for e in events if e.get("rating") == "relevant")
        not_relevant_count = sum(1 for e in events if e.get("rating") == "not_relevant")
        dismissed_count = sum(1 for e in events if e.get("event_type") == "recommendation_dismissed")
        reasons_breakdown: Dict[str, int] = {}
        for e in events:
            r = e.get("reason")
            if r:
                reasons_breakdown[r] = reasons_breakdown.get(r, 0) + 1

        return {
            "total_events": total_events,
            "relevant_count": relevant_count,
            "not_relevant_count": not_relevant_count,
            "dismissed_count": dismissed_count,
            "reasons": reasons_breakdown
        }

    @classmethod
    def to_dict(cls, doc: Optional[dict]) -> dict:
        if not doc:
            return {}
        d = dict(doc)
        if "_id" in d:
            d["id"] = str(d["_id"])
            del d["_id"]
        return d
