import os
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from pymongo.collection import Collection
from app.config.db import Database

logger = logging.getLogger(__name__)

class CompanyModel:
    """
    MongoDB model for target company registry and user watchlists.
    Collection: 'companies' and 'user_company_watchlist'
    """
    COLLECTION_NAME = "companies"
    WATCHLIST_COLLECTION_NAME = "user_company_watchlist"

    @classmethod
    def get_collection(cls) -> Optional[Collection]:
        db = Database.get_db()
        if db is None:
            return None
        return db[cls.COLLECTION_NAME]

    @classmethod
    def get_watchlist_collection(cls) -> Optional[Collection]:
        db = Database.get_db()
        if db is None:
            return None
        return db[cls.WATCHLIST_COLLECTION_NAME]

    @classmethod
    def ensure_indexes(cls):
        try:
            col = cls.get_collection()
            if col is None:
                return
            col.create_index("slug", unique=True)
            col.create_index("ats_type")
            col.create_index("tier")
            col.create_index("active")

            wcol = cls.get_watchlist_collection()
            if wcol is not None:
                wcol.create_index([("user_id", 1), ("company_name", 1)], unique=True)
                wcol.create_index("user_id")
            logger.info("Successfully initialized CompanyModel indexes.")
        except Exception as e:
            logger.warning("Could not create company indexes: %s", str(e))

    @classmethod
    def seed_initial_registry(cls):
        """Seeds company registry from company_registry.json if collection is empty."""
        try:
            col = cls.get_collection()
            if col is None:
                return
            if col.count_documents({}) == 0:
                path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config", "company_registry.json")
                if os.path.exists(path):
                    with open(path, "r", encoding="utf-8") as f:
                        companies = json.load(f)
                    now = datetime.now(timezone.utc).isoformat()
                    for c in companies:
                        c["created_at"] = now
                        c["updated_at"] = now
                    if companies:
                        col.insert_many(companies)
                        logger.info("Seeded %d target Indian companies into registry.", len(companies))
        except Exception as e:
            logger.warning("Failed to seed company registry: %s", str(e))

    @classmethod
    def get_all_companies(cls, active_only: bool = True) -> List[Dict[str, Any]]:
        col = cls.get_collection()
        if col is None:
            return []
        query = {"active": True} if active_only else {}
        cursor = col.find(query).sort("name", 1)
        results = []
        for doc in cursor:
            doc["id"] = str(doc.get("_id"))
            doc.pop("_id", None)
            results.append(doc)
        return results

    @classmethod
    def add_company(cls, company_data: Dict[str, Any]) -> Tuple[bool, str]:
        col = cls.get_collection()
        if col is None:
            return False, "Database not available"
        slug = company_data.get("slug", "").strip().lower()
        if not slug:
            return False, "Company slug is required."
        name = company_data.get("name", "").strip()
        if not name:
            return False, "Company name is required."

        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "slug": slug,
            "name": name,
            "ats_type": company_data.get("ats_type", "greenhouse").lower(),
            "website": company_data.get("website", ""),
            "tier": company_data.get("tier", "product_firm"),
            "active": company_data.get("active", True),
            "hiring_in_india": company_data.get("hiring_in_india", True),
            "created_at": now,
            "updated_at": now
        }
        try:
            col.update_one({"slug": slug}, {"$set": doc}, upsert=True)
            return True, "Company successfully added/updated in registry."
        except Exception as e:
            return False, str(e)

    # User Watchlist methods
    @classmethod
    def get_user_watchlist(cls, user_id: str) -> List[str]:
        wcol = cls.get_watchlist_collection()
        if wcol is None:
            return []
        cursor = wcol.find({"user_id": str(user_id)})
        return [doc.get("company_name") for doc in cursor if doc.get("company_name")]

    @classmethod
    def add_to_watchlist(cls, user_id: str, company_name: str) -> bool:
        wcol = cls.get_watchlist_collection()
        if wcol is None:
            return False
        clean_name = str(company_name).strip()
        if not clean_name:
            return False
        wcol.update_one(
            {"user_id": str(user_id), "company_name": clean_name},
            {"$set": {"user_id": str(user_id), "company_name": clean_name, "added_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
        return True

    @classmethod
    def remove_from_watchlist(cls, user_id: str, company_name: str) -> bool:
        wcol = cls.get_watchlist_collection()
        if wcol is None:
            return False
        wcol.delete_one({"user_id": str(user_id), "company_name": str(company_name).strip()})
        return True
