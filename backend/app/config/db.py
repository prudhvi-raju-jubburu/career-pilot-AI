import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

logger = logging.getLogger(__name__)

class Database:
    """MongoDB connection manager using PyMongo."""
    _client = None
    _db = None

    @classmethod
    def init_app(cls, app):
        mongo_uri = app.config.get("MONGO_URI", "mongodb://localhost:27017/careerpilot_ai")
        try:
            # Set short server selection timeout (2 seconds) so health check / boot doesn't hang if Mongo isn't running locally
            cls._client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
            # Default database extracted from URI or fallback to careerpilot_ai
            db_name = mongo_uri.rsplit("/", 1)[-1].split("?")[0] or "careerpilot_ai"
            cls._db = cls._client[db_name]
            logger.info("MongoDB client initialized for database: %s", db_name)
        except Exception as e:
            logger.error("Failed to initialize MongoDB client: %s", str(e))
            cls._client = None
            cls._db = None

    @classmethod
    def get_db(cls):
        """Returns the PyMongo database instance."""
        return cls._db

    @classmethod
    def get_client(cls):
        """Returns the PyMongo client instance."""
        return cls._client

    @classmethod
    def check_connection(cls):
        """Pings MongoDB to verify active connectivity."""
        if cls._client is None:
            return False, "MongoDB client not initialized"
        try:
            cls._client.admin.command("ping")
            return True, "Connected"
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            return False, f"Connection error: {str(e)}"
        except Exception as e:
            return False, f"Unexpected error: {str(e)}"
