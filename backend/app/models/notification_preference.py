import logging
import zoneinfo
from typing import Dict, Any, Optional, List
from bson import ObjectId
from app.config.db import Database
from app.models.profile import ProfileModel

logger = logging.getLogger(__name__)

DEFAULT_NOTIFICATION_PREFERENCES = {
    "in_app_enabled": True,
    "email_digest_enabled": True,
    "digest_frequency": "daily",  # "daily" | "weekly" | "disabled"
    "preferred_time": "09:00",
    "timezone": "Asia/Kolkata",
    "categories": ["job", "internship", "hackathon", "scholarship"],
    "min_match_score": 70,
    "deadline_reminders": True
}

VALID_FREQUENCIES = {"daily", "weekly", "disabled"}
VALID_CATEGORIES = {"job", "internship", "hackathon", "scholarship"}

class NotificationPreferenceModel:
    """
    Manages student notification preferences stored under 'preferences.notifications'
    within the student's profile document.
    """

    @classmethod
    def validate_timezone(cls, tz_name: Optional[str]) -> str:
        if not tz_name:
            return "Asia/Kolkata"
        clean_tz = str(tz_name).strip()
        try:
            available = zoneinfo.available_timezones()
            if clean_tz in available:
                return clean_tz
        except Exception:
            pass
        return "UTC"

    @classmethod
    def get_preferences(cls, user_id: str) -> Dict[str, Any]:
        """Retrieves user's notification preferences with production defaults."""
        profile = ProfileModel.find_by_user_id(user_id) or {}
        prefs = (profile.get("preferences") or {}).get("notifications") or {}
        
        # Merge with defaults
        merged = dict(DEFAULT_NOTIFICATION_PREFERENCES)
        merged.update({k: v for k, v in prefs.items() if v is not None})
        merged["timezone"] = cls.validate_timezone(merged.get("timezone"))
        return merged

    @classmethod
    def update_preferences(cls, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Validates and updates user's notification preferences."""
        current = cls.get_preferences(user_id)
        
        if "in_app_enabled" in updates:
            current["in_app_enabled"] = bool(updates["in_app_enabled"])
        if "email_digest_enabled" in updates:
            current["email_digest_enabled"] = bool(updates["email_digest_enabled"])
        if "digest_frequency" in updates:
            freq = str(updates["digest_frequency"]).strip().lower()
            current["digest_frequency"] = freq if freq in VALID_FREQUENCIES else "daily"
        if "preferred_time" in updates:
            t_str = str(updates["preferred_time"]).strip()
            # Simple HH:MM check
            if len(t_str) == 5 and t_str[2] == ":" and t_str[:2].isdigit() and t_str[3:].isdigit():
                current["preferred_time"] = t_str
        if "timezone" in updates:
            current["timezone"] = cls.validate_timezone(updates["timezone"])
        if "categories" in updates and isinstance(updates["categories"], list):
            cats = [str(c).strip().lower() for c in updates["categories"] if str(c).strip().lower() in VALID_CATEGORIES]
            current["categories"] = cats if cats else list(VALID_CATEGORIES)
        if "min_match_score" in updates:
            try:
                score = int(updates["min_match_score"])
                current["min_match_score"] = max(40, min(95, score))
            except (ValueError, TypeError):
                pass
        if "deadline_reminders" in updates:
            current["deadline_reminders"] = bool(updates["deadline_reminders"])

        col = ProfileModel.get_collection()
        uid_query = {"$in": [str(user_id), ObjectId(user_id)]} if ObjectId.is_valid(user_id) else str(user_id)
        
        # Ensure student profile exists
        existing = col.find_one({"user_id": uid_query})
        if not existing:
            from app.services.profile_service import ProfileService
            ProfileService.create_default_profile(user_id=str(user_id))

        col.update_one(
            {"user_id": uid_query},
            {"$set": {"preferences.notifications": current}}
        )
        return current
