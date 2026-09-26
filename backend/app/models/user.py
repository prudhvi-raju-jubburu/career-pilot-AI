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
        """Creates unique index on email for quick lookup and duplicate prevention."""
        try:
            col = cls.get_collection()
            col.create_index("email", unique=True)
        except Exception as e:
            # Gracefully log if db not yet connected
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
            obj_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            col = cls.get_collection()
            return col.find_one({"_id": obj_id})
        except Exception:
            return None

    @classmethod
    def create_user(cls, name: str, email: str, password: str, role: str = "student"):
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
            "profile_completed": False,
            "created_at": now,
            "updated_at": now,
        }

        result = col.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        return user_doc

    @staticmethod
    def verify_password(stored_hash: str, password: str) -> bool:
        """Verifies candidate plaintext password against stored hash."""
        if not stored_hash or not password:
            return False
        return check_password_hash(stored_hash, password)

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
            "profile_completed": user_doc.get("profile_completed", False),
            "created_at": user_doc.get("created_at"),
            "updated_at": user_doc.get("updated_at"),
        }
