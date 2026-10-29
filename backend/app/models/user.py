from datetime import datetime, timezone
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from app.config.db import Database

class UserModel:
    """Manages user persistence, password hashing, and queries via PyMongo."""

    @classmethod
    def get_collection(cls):
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database connection is not initialized")
        return db["users"]

    @classmethod
    def ensure_indexes(cls):
        """Creates indexes on email (unique), role, status, and created_at for quick lookup and analytics."""
        try:
            col = cls.get_collection()
            col.create_index("email", unique=True)
            col.create_index("role")
            col.create_index("status")
            col.create_index("created_at")
        except Exception:
            # Gracefully ignore if db not yet connected
            pass

    @classmethod
    def find_by_email(cls, email: str):
        """Finds user by case-insensitive email address."""
        if not email:
            return None
        col = cls.get_collection()
        normalized_email = email.strip().lower()
        return col.find_one({"email": normalized_email})

    @classmethod
    def find_by_id(cls, user_id: str):
        """Finds user by string ObjectId."""
        if not user_id:
            return None
        try:
            obj_id = ObjectId(user_id) if isinstance(user_id, str) and ObjectId.is_valid(user_id) else user_id
            col = cls.get_collection()
            return col.find_one({"_id": obj_id})
        except Exception:
            return None

    @classmethod
    def create_user(cls, name: str, email: str, password: str, role: str = "student", status: str = "active"):
        """Hashes password and creates a new user document in MongoDB."""
        col = cls.get_collection()
        normalized_email = email.strip().lower()

        password_hash = generate_password_hash(password)
        now = datetime.now(timezone.utc).isoformat()

        user_doc = {
            "name": name.strip(),
            "email": normalized_email,
            "password_hash": password_hash,
            "role": role,
            "status": status,
            "profile_completed": False,
            "created_at": now,
            "updated_at": now,
        }

        result = col.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        return user_doc

    @classmethod
    def find_paginated(cls, query: dict, skip: int = 0, limit: int = 20, sort_criteria=None):
        """Finds users matching query with pagination and sorting."""
        col = cls.get_collection()
        if sort_criteria is None:
            sort_criteria = [("created_at", -1)]
        cursor = col.find(query).sort(sort_criteria).skip(skip).limit(limit)
        return list(cursor)

    @classmethod
    def count_users(cls, query: dict) -> int:
        """Counts total users matching query."""
        col = cls.get_collection()
        return col.count_documents(query)

    @classmethod
    def update_status(cls, user_id: str, status: str):
        """Updates account status (e.g. active, suspended)."""
        col = cls.get_collection()
        obj_id = ObjectId(user_id) if isinstance(user_id, str) and ObjectId.is_valid(user_id) else user_id
        now = datetime.now(timezone.utc).isoformat()
        res = col.update_one(
            {"_id": obj_id},
            {"$set": {"status": status, "updated_at": now}}
        )
        return res.modified_count > 0

    @classmethod
    def update_role(cls, user_id: str, role: str):
        """Updates account role (e.g. student, admin)."""
        col = cls.get_collection()
        obj_id = ObjectId(user_id) if isinstance(user_id, str) and ObjectId.is_valid(user_id) else user_id
        now = datetime.now(timezone.utc).isoformat()
        res = col.update_one(
            {"_id": obj_id},
            {"$set": {"role": role, "updated_at": now}}
        )
        return res.modified_count > 0

    @staticmethod
    def verify_password(stored_hash: str, password: str) -> bool:
        """Verifies candidate plaintext password against stored hash."""
        if not stored_hash or not password:
            return False
        return check_password_hash(stored_hash, password)

    @staticmethod
    def is_suspended(user_doc: dict) -> bool:
        """Checks if account status is suspended."""
        if not user_doc:
            return False
        return user_doc.get("status") == "suspended"

    @staticmethod
    def to_dict(user_doc: dict) -> dict:
        """Converts user MongoDB document to JSON-safe dictionary, stripping sensitive hashes."""
        if not user_doc:
            return {}
        return {
            "id": str(user_doc["_id"]),
            "name": user_doc.get("name", ""),
            "email": user_doc.get("email", ""),
            "role": user_doc.get("role", "student"),
            "status": user_doc.get("status", "active"),
            "profile_completed": user_doc.get("profile_completed", False),
            "created_at": user_doc.get("created_at"),
            "updated_at": user_doc.get("updated_at"),
        }
