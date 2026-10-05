from typing import Optional, Dict, Any
from app.config.db import Database
from app.services.profile_service import ProfileService

class ProfileModel:
    """
    Model interface for student profiles stored in the 'student_profiles' MongoDB collection.
    Delegates domain logic, merge rules, and calculations to ProfileService.
    """

    @classmethod
    def get_collection(cls):
        return ProfileService.get_collection()

    @classmethod
    def ensure_indexes(cls):
        """Creates unique index on student_profiles.user_id."""
        ProfileService.ensure_indexes()

    @classmethod
    def find_by_user_id(cls, user_id: str) -> Optional[dict]:
        """Finds student profile by user_id string or ObjectId."""
        return ProfileService.get_profile_by_user_id(user_id)

    @staticmethod
    def calculate_completion(profile_doc: dict) -> dict:
        """Calculates deterministic profile completion and missing fields."""
        return ProfileService.calculate_profile_completion(profile_doc)

    @classmethod
    def upsert_from_resume_extraction(cls, user_id: str, extracted_data: dict, resume_meta: dict) -> dict:
        """
        Integrates AI-extracted resume data into student profile with source tracking.
        Preserves manual fields and transitions verification status to 'needs_review'.
        """
        doc = ProfileService.merge_resume_data_into_profile(user_id, extracted_data, resume_meta)
        return cls.to_dict(doc)

    @classmethod
    def update_profile(cls, user_id: str, updates: dict) -> dict:
        """Updates student profile fields, marking changed fields with source 'manual'."""
        doc = ProfileService.update_profile_for_user(user_id, updates)
        return cls.to_dict(doc)

    @classmethod
    def verify_profile(cls, user_id: str) -> dict:
        """Validates and marks profile as verified by the student."""
        doc = ProfileService.verify_profile(user_id)
        return cls.to_dict(doc)

    @staticmethod
    def to_dict(profile_doc: dict) -> dict:
        """Converts MongoDB document to JSON-safe dictionary with compatibility properties."""
        return ProfileService.to_dict(profile_doc)
