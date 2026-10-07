import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId
from app.config.db import Database

logger = logging.getLogger(__name__)

class SourceRunModel:
    """
    MongoDB model for recording ingestion execution telemetry per external source.
    Stores start/finish timestamps, record counts (fetched, accepted, duplicates, rejected),
    errors, and status.
    """
    COLLECTION_NAME = "source_runs"

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
            col.create_index("source_name")
            col.create_index("started_at")
            col.create_index([("source_name", 1), ("started_at", -1)])
            logger.info("Successfully ensured MongoDB indexes on '%s'", cls.COLLECTION_NAME)
        except Exception as e:
            logger.warning("Could not create indexes on '%s': %s", cls.COLLECTION_NAME, str(e))

    @classmethod
    def record_run(cls, run_data: Dict[str, Any]) -> str:
        """Inserts a run record and returns its string ID."""
        col = cls.get_collection()
        doc = dict(run_data)
        if "created_at" not in doc:
            doc["created_at"] = datetime.now(timezone.utc).isoformat()
        res = col.insert_one(doc)
        return str(res.inserted_id)

    @classmethod
    def get_latest_runs(cls) -> List[Dict[str, Any]]:
        """Returns the most recent run for each distinct source."""
        col = cls.get_collection()
        pipeline = [
            {"$sort": {"started_at": -1}},
            {"$group": {
                "_id": "$source_name",
                "latest_run": {"$first": "$$ROOT"}
            }},
            {"$replaceRoot": {"newRoot": "$latest_run"}}
        ]
        results = list(col.aggregate(pipeline))
        for r in results:
            if "_id" in r:
                r["id"] = str(r["_id"])
                del r["_id"]
        return results

    @classmethod
    def get_source_history(cls, source_name: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Returns recent run history for a specific source."""
        col = cls.get_collection()
        cursor = col.find({"source_name": source_name}).sort("started_at", -1).limit(limit)
        items = []
        for doc in cursor:
            if "_id" in doc:
                doc["id"] = str(doc["_id"])
                del doc["_id"]
            items.append(doc)
        return items
