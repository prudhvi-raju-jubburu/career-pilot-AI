import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId
from app.config.db import Database

logger = logging.getLogger(__name__)

class CopilotConversationModel:
    """
    MongoDB model for persistent multi-turn Student Career Copilot conversations.
    Ensures authenticated user ownership, isolated conversation threads, and message history.
    """
    COLLECTION_NAME = "copilot_conversations"

    @classmethod
    def get_collection(cls):
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database connection is not initialized")
        return db[cls.COLLECTION_NAME]

    @classmethod
    def ensure_indexes(cls):
        """Creates indexes for user ownership, active conversation lookup, and ordering."""
        try:
            col = cls.get_collection()
            col.create_index([("user_id", 1), ("updated_at", -1)])
            col.create_index([("user_id", 1), ("_id", 1)])
            logger.info("Successfully ensured MongoDB indexes on '%s'", cls.COLLECTION_NAME)
        except Exception as e:
            logger.warning("Could not ensure indexes on %s: %s", cls.COLLECTION_NAME, str(e))

    @classmethod
    def create_conversation(cls, user_id: str, title: Optional[str] = None) -> Dict[str, Any]:
        """Creates a new conversation thread for the authenticated student."""
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "user_id": str(user_id),
            "title": (title or "New Career Discussion").strip()[:100],
            "messages": [],
            "created_at": now,
            "updated_at": now
        }
        res = col.insert_one(doc)
        doc["_id"] = res.inserted_id
        return cls.to_dict(doc)

    @classmethod
    def find_by_id(cls, conversation_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Finds a conversation strictly verifying authenticated user ownership."""
        if not conversation_id or not ObjectId.is_valid(conversation_id):
            return None
        col = cls.get_collection()
        doc = col.find_one({"_id": ObjectId(conversation_id), "user_id": str(user_id)})
        return cls.to_dict(doc) if doc else None

    @classmethod
    def list_user_conversations(cls, user_id: str, limit: int = 25) -> List[Dict[str, Any]]:
        """Lists conversations for the student ordered by most recently active."""
        col = cls.get_collection()
        cursor = col.find(
            {"user_id": str(user_id)},
            {"messages": {"$slice": -1}}  # only fetch last message snippet for performance
        ).sort("updated_at", -1).limit(limit)

        items = []
        for doc in cursor:
            d = cls.to_dict(doc)
            last_msg = doc.get("messages", [])
            snippet = ""
            if last_msg and isinstance(last_msg, list):
                snippet = last_msg[-1].get("content", "")[:120]
            d["snippet"] = snippet
            items.append(d)
        return items

    @classmethod
    def append_messages(
        cls,
        conversation_id: str,
        user_id: str,
        user_msg: Dict[str, Any],
        assistant_msg: Dict[str, Any],
        update_title: Optional[str] = None
    ) -> bool:
        """Appends a user message and assistant reply to the conversation thread atomically."""
        if not ObjectId.is_valid(conversation_id):
            return False
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        
        update_doc: Dict[str, Any] = {
            "$push": {
                "messages": {"$each": [user_msg, assistant_msg]}
            },
            "$set": {
                "updated_at": now
            }
        }
        if update_title:
            update_doc["$set"]["title"] = update_title.strip()[:100]

        res = col.update_one(
            {"_id": ObjectId(conversation_id), "user_id": str(user_id)},
            update_doc
        )
        return res.modified_count > 0

    @classmethod
    def append_single_message(
        cls,
        conversation_id: str,
        user_id: str,
        message: Dict[str, Any],
        update_title: Optional[str] = None
    ) -> bool:
        """Appends a single message (user or assistant) to the conversation thread atomically."""
        if not ObjectId.is_valid(conversation_id):
            return False
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()

        update_doc: Dict[str, Any] = {
            "$push": {
                "messages": message
            },
            "$set": {
                "updated_at": now
            }
        }
        if update_title:
            update_doc["$set"]["title"] = update_title.strip()[:100]

        res = col.update_one(
            {"_id": ObjectId(conversation_id), "user_id": str(user_id)},
            update_doc
        )
        return res.modified_count > 0

    @classmethod
    def delete_conversation(cls, conversation_id: str, user_id: str) -> bool:
        """Permanently deletes a conversation verifying user ownership."""
        if not ObjectId.is_valid(conversation_id):
            return False
        col = cls.get_collection()
        res = col.delete_one({"_id": ObjectId(conversation_id), "user_id": str(user_id)})
        return res.deleted_count > 0

    @classmethod
    def clear_all_for_user(cls, user_id: str) -> int:
        """Clears all conversations for the user (used in settings/reset/account deletion)."""
        col = cls.get_collection()
        res = col.delete_many({"user_id": str(user_id)})
        return res.deleted_count

    @staticmethod
    def to_dict(doc: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        if not doc:
            return {}
        d = dict(doc)
        if "_id" in d:
            d["id"] = str(d["_id"])
            del d["_id"]
        return d

