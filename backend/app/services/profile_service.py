import re
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from bson import ObjectId

from app.config.db import Database
from app.utils.skill_normalizer import normalize_skill_list, normalize_skill

logger = logging.getLogger(__name__)

class ProfileService:
    """
    Core production service managing student profile lifecycle, field-level provenance tracking,
    deterministic completion calculation, safe resume-to-profile merges, and validation.
    """

    COLLECTION_NAME = "student_profiles"
    LEGACY_COLLECTION_NAME = "profiles"

    @classmethod
    def get_collection(cls):
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database connection is not initialized")
        return db[cls.COLLECTION_NAME]

    @classmethod
    def ensure_indexes(cls):
        """Creates unique index on student_profiles.user_id to guarantee one profile per student."""
        try:
            col = cls.get_collection()
            col.create_index("user_id", unique=True)
        except Exception as e:
            logger.warning("Could not ensure unique index on student_profiles: %s", str(e))

    @staticmethod
    def _clean_str(val: Any, max_len: int = 255) -> Optional[str]:
        if val is None:
            return None
        s = str(val).strip()
        if not s:
            return None
        return s[:max_len]

    @classmethod
    def get_profile_by_user_id(cls, user_id: str) -> Optional[dict]:
        """Finds student profile in student_profiles, with fallback migration from legacy profiles."""
        if not user_id:
            return None
        col = cls.get_collection()
        try:
            obj_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
            profile = col.find_one({"user_id": obj_id})
            if not profile and isinstance(user_id, str):
                profile = col.find_one({"user_id": user_id})
            
            # Legacy fallback if not found
            if not profile:
                db = Database.get_db()
                if db is not None:
                    legacy_col = db[cls.LEGACY_COLLECTION_NAME]
                    legacy_doc = legacy_col.find_one({"user_id": obj_id}) or (
                        legacy_col.find_one({"user_id": str(user_id)}) if isinstance(user_id, str) else None
                    )
                    if legacy_doc:
                        # Migrate document to student_profiles
                        cls.migrate_legacy_profile(legacy_doc)
                        return cls.get_profile_by_user_id(user_id)
            return profile
        except Exception as e:
            logger.warning("Error fetching profile for user %s: %s", user_id, str(e))
            return None

    @classmethod
    def create_default_profile(cls, user_id: str, user_email: str = "", user_name: str = "") -> dict:
        """Initializes a new draft student profile document following the canonical Phase 1 schema."""
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        obj_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id

        doc = {
            "user_id": obj_id,
            "personal": {
                "full_name": cls._clean_str(user_name),
                "email": cls._clean_str(user_email),
                "phone": None,
                "location": None
            },
            "education": {
                "college": None,
                "degree": None,
                "branch": None,
                "graduation_year": None,
                "cgpa": None
            },
            "skills": {
                "programming_languages": [],
                "frameworks": [],
                "databases": [],
                "ai_ml": [],
                "cloud": [],
                "devops": [],
                "tools": [],
                "other": []
            },
            "projects": [],
            "experience": [],
            "certifications": [],
            "achievements": [],
            "interests": [],
            "preferences": {
                "target_roles": [],
                "preferred_locations": [],
                "opportunity_types": [],
                "work_modes": ["Remote", "Hybrid"]
            },
            "resume": {
                "file_name": None,
                "file_path": None,
                "uploaded_at": None,
                "analysis_status": "none",
                "analysis_version": None
            },
            "profile_completion": {
                "percentage": 0,
                "missing_fields": []
            },
            "verification": {
                "status": "draft",
                "verified_at": None
            },
            "field_sources": {},
            "created_at": now,
            "updated_at": now
        }

        if user_name:
            doc["field_sources"]["personal.full_name"] = "system"
        if user_email:
            doc["field_sources"]["personal.email"] = "system"

        comp = cls.calculate_profile_completion(doc)
        doc["profile_completion"] = {
            "percentage": comp["percentage"],
            "missing_fields": comp["missing_fields"]
        }

        try:
            res = col.insert_one(doc)
            doc["_id"] = res.inserted_id
        except Exception:
            # If race condition with unique index
            existing = cls.get_profile_by_user_id(user_id)
            if existing:
                return existing
        return doc

    @classmethod
    def calculate_profile_completion(cls, profile_doc: Optional[dict]) -> dict:
        """
        Deterministic profile completion engine without LLM dependencies.
        Calculates weighted profile completeness score (0-100) and missing field paths.
        
        Sections:
          - Personal (20%): full_name (8%), email (5%), phone (4%), location (3%)
          - Education (25%): college (6%), degree (5%), branch (5%), graduation_year (5%), cgpa (4%)
          - Skills (20%): at least one technical skill across any skill bucket
          - Projects/Experience (15%): at least one project or work experience item
          - Preferences (10%): target_roles (5%), preferred_locations (5%)
          - Resume (10%): uploaded / parsed resume file
        """
        if not profile_doc:
            return {
                "percentage": 0,
                "missing_fields": [
                    "personal.full_name",
                    "personal.email",
                    "personal.phone",
                    "education.college",
                    "education.degree",
                    "education.branch",
                    "education.graduation_year",
                    "education.cgpa",
                    "skills.programming_languages",
                    "projects",
                    "preferences.target_roles",
                    "preferences.preferred_locations",
                    "resume"
                ],
                "breakdown": {},
                "missing_items": ["Personal Information", "Education", "Skills", "Projects", "Preferences", "Resume"]
            }

        score = 0
        missing_fields = []
        missing_items = []
        breakdown = {}

        # 1. Personal (20%)
        personal = profile_doc.get("personal", {})
        # Support both direct value and nested {value: ...}
        def get_val(section_obj, key):
            if not isinstance(section_obj, dict):
                return None
            v = section_obj.get(key)
            if isinstance(v, dict) and "value" in v:
                return v["value"]
            return v

        full_name = get_val(personal, "full_name") or get_val(personal, "fullName")
        email = get_val(personal, "email")
        phone = get_val(personal, "phone")
        location = get_val(personal, "location")

        p_score = 0
        if full_name and str(full_name).strip():
            p_score += 8
        else:
            missing_fields.append("personal.full_name")
            missing_items.append("Full Name")

        if email and str(email).strip():
            p_score += 5
        else:
            missing_fields.append("personal.email")
            missing_items.append("Email Address")

        if phone and str(phone).strip():
            p_score += 4
        else:
            missing_fields.append("personal.phone")
            missing_items.append("Phone Number")

        if location and str(location).strip():
            p_score += 3
        else:
            missing_fields.append("personal.location")

        score += p_score
        breakdown["personal"] = round((p_score / 20) * 100)

        # 2. Education (25%)
        edu = profile_doc.get("education", {})
        college = get_val(edu, "college")
        degree = get_val(edu, "degree")
        branch = get_val(edu, "branch")
        grad_year = get_val(edu, "graduation_year") or get_val(edu, "graduationYear")
        cgpa = get_val(edu, "cgpa")

        e_score = 0
        if college and str(college).strip():
            e_score += 6
        else:
            missing_fields.append("education.college")
            missing_items.append("College Name")

        if degree and str(degree).strip():
            e_score += 5
        else:
            missing_fields.append("education.degree")
            missing_items.append("Degree")

        if branch and str(branch).strip():
            e_score += 5
        else:
            missing_fields.append("education.branch")
            missing_items.append("Branch")

        if grad_year:
            e_score += 5
        else:
            missing_fields.append("education.graduation_year")
            missing_items.append("Graduation Year")

        if cgpa is not None and cgpa != "":
            e_score += 4
        else:
            missing_fields.append("education.cgpa")
            missing_items.append("CGPA")

        score += e_score
        breakdown["education"] = round((e_score / 25) * 100)

        # 3. Skills (20%)
        skills_sec = profile_doc.get("skills", {})
        all_skills = []
        if isinstance(skills_sec, dict):
            for k, val in skills_sec.items():
                items = val.get("value") if isinstance(val, dict) and "value" in val else val
                if isinstance(items, list):
                    all_skills.extend(items)

        skills_count = len(all_skills)
        if skills_count >= 1:
            s_score = 20
        else:
            s_score = 0
            missing_fields.append("skills.programming_languages")
            missing_items.append("At least 1 Technical Skill")
        score += s_score
        breakdown["skills"] = round((s_score / 20) * 100)

        # 4. Projects / Experience (15%)
        projects = profile_doc.get("projects", [])
        experience = profile_doc.get("experience", [])
        has_proj = (isinstance(projects, list) and len(projects) > 0) or (
            isinstance(experience, list) and len(experience) > 0
        )
        if has_proj:
            proj_score = 15
        else:
            proj_score = 0
            missing_fields.append("projects")
            missing_items.append("At least 1 Project or Experience")
        score += proj_score
        breakdown["projects"] = round((proj_score / 15) * 100)

        # 5. Preferences (10%)
        prefs = profile_doc.get("preferences", {})
        roles = get_val(prefs, "target_roles") or get_val(prefs, "targetRoles") or []
        locs = get_val(prefs, "preferred_locations") or get_val(prefs, "preferredLocations") or []

        pref_score = 0
        if isinstance(roles, list) and len(roles) > 0:
            pref_score += 5
        else:
            missing_fields.append("preferences.target_roles")
            missing_items.append("Target Roles")

        if isinstance(locs, list) and len(locs) > 0:
            pref_score += 5
        else:
            missing_fields.append("preferences.preferred_locations")
            missing_items.append("Preferred Locations")

        score += pref_score
        breakdown["preferences"] = round((pref_score / 10) * 100)

        # 6. Resume (10%)
        resume = profile_doc.get("resume", {})
        has_resume = bool(
            resume.get("file_name") or resume.get("fileName") or
            resume.get("file_path") or resume.get("filePath") or
            resume.get("parsed")
        )
        if has_resume:
            r_score = 10
        else:
            r_score = 0
            missing_fields.append("resume")
            missing_items.append("Resume Document")
        score += r_score
        breakdown["resume"] = round((r_score / 10) * 100)

        final_percentage = min(100, score)
        return {
            "percentage": final_percentage,
            "missing_fields": missing_fields,
            "breakdown": breakdown,
            "missing_items": missing_items
        }

    @classmethod
    def validate_profile_payload(cls, updates: dict) -> None:
        """Validates incoming student profile updates against business rules."""
        if not isinstance(updates, dict):
            raise ValueError("Profile payload must be a JSON object.")

        # CGPA Validation
        edu = updates.get("education")
        if isinstance(edu, dict):
            cgpa_val = edu.get("cgpa")
            if isinstance(cgpa_val, dict) and "value" in cgpa_val:
                cgpa_val = cgpa_val["value"]
            if cgpa_val is not None and cgpa_val != "":
                try:
                    num_cgpa = float(cgpa_val)
                    if num_cgpa < 0.0 or num_cgpa > 10.0:
                        raise ValueError("CGPA must be a numeric value between 0.0 and 10.0.")
                except (ValueError, TypeError):
                    raise ValueError("CGPA must be a valid numeric value.")

            # Graduation Year Validation
            grad_val = edu.get("graduation_year") if "graduation_year" in edu else edu.get("graduationYear")
            if isinstance(grad_val, dict) and "value" in grad_val:
                grad_val = grad_val["value"]
            if grad_val is not None and grad_val != "":
                try:
                    num_grad = int(grad_val)
                    if num_grad < 1970 or num_grad > 2040:
                        raise ValueError("Graduation year must be between 1970 and 2040.")
                except (ValueError, TypeError):
                    raise ValueError("Graduation year must be a valid 4-digit integer.")

        # Email format validation if updated
        personal = updates.get("personal")
        if isinstance(personal, dict):
            email_val = personal.get("email")
            if isinstance(email_val, dict) and "value" in email_val:
                email_val = email_val["value"]
            if email_val and str(email_val).strip():
                if not re.match(r"[^@]+@[^@]+\.[^@]+", str(email_val).strip()):
                    raise ValueError("Provided email address is invalid.")

        # Lists validation
        for array_key in ["projects", "experience", "certifications", "achievements", "interests"]:
            if array_key in updates:
                val = updates[array_key]
                if not isinstance(val, list):
                    raise ValueError(f"Field '{array_key}' must be an array.")

        # Preferences validation
        prefs = updates.get("preferences")
        if isinstance(prefs, dict):
            for k, val in prefs.items():
                items = val.get("value") if isinstance(val, dict) and "value" in val else val
                if items is not None and not isinstance(items, list):
                    raise ValueError(f"Preference '{k}' must be an array of strings.")

    @classmethod
    def update_profile_for_user(cls, user_id: str, updates: dict) -> dict:
        """
        Updates student profile fields.
        Enforces:
          - Field source tracking: marked as 'manual'
          - If profile was 'verified', resets status to 'needs_review'
          - Skill normalization
          - Deterministic profile completion recalculation
        """
        cls.validate_profile_payload(updates)
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        
        profile = cls.get_profile_by_user_id(user_id)
        if not profile:
            profile = cls.create_default_profile(user_id)

        field_sources = profile.get("field_sources", {})

        # Handle Personal Section
        if "personal" in updates and isinstance(updates["personal"], dict):
            p_updates = updates["personal"]
            for field in ["full_name", "email", "phone", "location"]:
                alt_field = "fullName" if field == "full_name" else field
                if field in p_updates or alt_field in p_updates:
                    val = p_updates.get(field, p_updates.get(alt_field))
                    if isinstance(val, dict) and "value" in val:
                        val = val["value"]
                    profile["personal"][field] = cls._clean_str(val)
                    field_sources[f"personal.{field}"] = "manual"

        # Handle Education Section
        if "education" in updates and isinstance(updates["education"], dict):
            e_updates = updates["education"]
            for field in ["college", "degree", "branch", "graduation_year", "cgpa"]:
                alt_field = "graduationYear" if field == "graduation_year" else field
                if field in e_updates or alt_field in e_updates:
                    val = e_updates.get(field, e_updates.get(alt_field))
                    if isinstance(val, dict) and "value" in val:
                        val = val["value"]
                    if field == "cgpa" and val is not None and val != "":
                        val = float(val)
                    elif field == "graduation_year" and val is not None and val != "":
                        val = int(val)
                    else:
                        val = cls._clean_str(val) if isinstance(val, str) else val
                    profile["education"][field] = val
                    field_sources[f"education.{field}"] = "manual"

        # Handle Skills Section
        if "skills" in updates and isinstance(updates["skills"], dict):
            s_updates = updates["skills"]
            cat_map = {
                "programming_languages": ["programming_languages", "programmingLanguages"],
                "frameworks": ["frameworks"],
                "databases": ["databases"],
                "ai_ml": ["ai_ml", "aiMl"],
                "cloud": ["cloud"],
                "devops": ["devops"],
                "tools": ["tools"],
                "other": ["other", "technical"]
            }
            for canonical_cat, aliases in cat_map.items():
                for alias in aliases:
                    if alias in s_updates:
                        val = s_updates[alias]
                        items = val.get("value") if isinstance(val, dict) and "value" in val else val
                        if isinstance(items, list):
                            normalized = normalize_skill_list(items)
                            profile["skills"][canonical_cat] = normalized
                            field_sources[f"skills.{canonical_cat}"] = "manual"
                        break

        # Handle Preferences Section
        if "preferences" in updates and isinstance(updates["preferences"], dict):
            pref_updates = updates["preferences"]
            pref_map = {
                "target_roles": ["target_roles", "targetRoles"],
                "preferred_locations": ["preferred_locations", "preferredLocations"],
                "opportunity_types": ["opportunity_types", "opportunityTypes"],
                "work_modes": ["work_modes", "workModes"]
            }
            for canonical_pref, aliases in pref_map.items():
                for alias in aliases:
                    if alias in pref_updates:
                        val = pref_updates[alias]
                        items = val.get("value") if isinstance(val, dict) and "value" in val else val
                        if isinstance(items, list):
                            profile["preferences"][canonical_pref] = [
                                cls._clean_str(item) for item in items if cls._clean_str(item)
                            ]
                            field_sources[f"preferences.{canonical_pref}"] = "manual"
                        break

        # Handle Arrays (Projects, Experience, etc.)
        for arr_key in ["projects", "experience", "certifications", "achievements", "interests"]:
            if arr_key in updates and isinstance(updates[arr_key], list):
                profile[arr_key] = updates[arr_key]
                field_sources[arr_key] = "manual"

        # Handle Resume Metadata updates if specified
        if "resume" in updates and isinstance(updates["resume"], dict):
            r_in = updates["resume"]
            profile["resume"]["file_name"] = r_in.get("file_name", r_in.get("fileName", profile["resume"].get("file_name")))
            profile["resume"]["file_path"] = r_in.get("file_path", r_in.get("filePath", profile["resume"].get("file_path")))
            profile["resume"]["uploaded_at"] = r_in.get("uploaded_at", r_in.get("uploadedAt", profile["resume"].get("uploaded_at")))
            profile["resume"]["analysis_status"] = r_in.get("analysis_status", r_in.get("analysisStatus", profile["resume"].get("analysis_status")))
            profile["resume"]["analysis_version"] = r_in.get("analysis_version", profile["resume"].get("analysis_version", "1.0"))

        # Reversion Rule: If previously verified, any manual edits trigger transition back to needs_review
        current_status = profile.get("verification", {}).get("status")
        if current_status == "verified":
            profile["verification"]["status"] = "needs_review"
            profile["verification"]["verified_at"] = None

        profile["field_sources"] = field_sources
        profile["updated_at"] = now

        # Recalculate deterministic completion
        comp = cls.calculate_profile_completion(profile)
        profile["profile_completion"] = {
            "percentage": comp["percentage"],
            "missing_fields": comp["missing_fields"]
        }

        col.update_one({"_id": profile["_id"]}, {"$set": profile})
        return profile

    @classmethod
    def merge_resume_data_into_profile(cls, user_id: str, extracted_data: dict, resume_meta: dict) -> dict:
        """
        Merges AI-extracted resume data into the student profile.
        Strict Rules:
          1. NEVER overwrite manually entered information (field_sources == 'manual').
          2. NEVER invent/hallucinate absent information (use null or []).
          3. Sourced fields marked as 'resume'.
          4. Transition verification.status to 'needs_review'.
          5. Skills are normalized using canonical skill aliases.
        """
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()

        profile = cls.get_profile_by_user_id(user_id)
        if not profile:
            profile = cls.create_default_profile(user_id)

        field_sources = profile.get("field_sources", {})

        # 1. Personal Section
        ext_personal = extracted_data.get("personal", {})
        if isinstance(ext_personal, dict):
            name_val = ext_personal.get("fullName", ext_personal.get("full_name"))
            if name_val and field_sources.get("personal.full_name") != "manual":
                profile["personal"]["full_name"] = cls._clean_str(name_val)
                field_sources["personal.full_name"] = "resume"

            email_val = ext_personal.get("email")
            if email_val and field_sources.get("personal.email") != "manual":
                profile["personal"]["email"] = cls._clean_str(email_val)
                field_sources["personal.email"] = "resume"

            phone_val = ext_personal.get("phone")
            if phone_val and field_sources.get("personal.phone") != "manual":
                profile["personal"]["phone"] = cls._clean_str(phone_val)
                field_sources["personal.phone"] = "resume"

            loc_val = ext_personal.get("location")
            if loc_val and field_sources.get("personal.location") != "manual":
                profile["personal"]["location"] = cls._clean_str(loc_val)
                field_sources["personal.location"] = "resume"

        # 2. Education Section
        ext_edu = extracted_data.get("education", {})
        if isinstance(ext_edu, dict):
            college_val = ext_edu.get("college")
            if college_val and field_sources.get("education.college") != "manual":
                profile["education"]["college"] = cls._clean_str(college_val)
                field_sources["education.college"] = "resume"

            degree_val = ext_edu.get("degree")
            if degree_val and field_sources.get("education.degree") != "manual":
                profile["education"]["degree"] = cls._clean_str(degree_val)
                field_sources["education.degree"] = "resume"

            branch_val = ext_edu.get("branch")
            if branch_val and field_sources.get("education.branch") != "manual":
                profile["education"]["branch"] = cls._clean_str(branch_val)
                field_sources["education.branch"] = "resume"

            grad_val = ext_edu.get("graduationYear", ext_edu.get("graduation_year"))
            if grad_val is not None and field_sources.get("education.graduation_year") != "manual":
                try:
                    profile["education"]["graduation_year"] = int(grad_val)
                    field_sources["education.graduation_year"] = "resume"
                except (ValueError, TypeError):
                    pass

            cgpa_val = ext_edu.get("cgpa")
            if cgpa_val is not None and field_sources.get("education.cgpa") != "manual":
                try:
                    profile["education"]["cgpa"] = float(cgpa_val)
                    field_sources["education.cgpa"] = "resume"
                except (ValueError, TypeError):
                    pass

        # 3. Skills Section (Normalized)
        ext_skills = extracted_data.get("skills", {})
        if isinstance(ext_skills, dict):
            cat_mapping = {
                "programming_languages": ["programmingLanguages", "programming_languages"],
                "frameworks": ["frameworks"],
                "databases": ["databases"],
                "ai_ml": ["ai_ml", "aiMl"],
                "cloud": ["cloud"],
                "devops": ["devops"],
                "tools": ["tools"],
                "other": ["other", "technical"]
            }
            for canonical_cat, aliases in cat_mapping.items():
                # Check if manually entered
                if field_sources.get(f"skills.{canonical_cat}") == "manual" and profile["skills"].get(canonical_cat):
                    continue

                extracted_list = []
                for alias in aliases:
                    if alias in ext_skills and isinstance(ext_skills[alias], list):
                        extracted_list.extend(ext_skills[alias])

                if extracted_list:
                    normalized = normalize_skill_list(extracted_list)
                    profile["skills"][canonical_cat] = normalized
                    field_sources[f"skills.{canonical_cat}"] = "resume"

        # 4. Projects & Experience & Certifications
        for sec in ["projects", "experience", "certifications", "achievements", "interests"]:
            ext_items = extracted_data.get(sec, [])
            if isinstance(ext_items, list) and ext_items:
                if field_sources.get(sec) != "manual" or not profile.get(sec):
                    profile[sec] = ext_items
                    field_sources[sec] = "resume"

        # 5. Resume Metadata
        profile["resume"] = {
            "file_name": resume_meta.get("fileName", resume_meta.get("file_name")),
            "file_path": resume_meta.get("filePath", resume_meta.get("file_path")),
            "uploaded_at": resume_meta.get("uploadedAt", resume_meta.get("uploaded_at", now)),
            "analysis_status": "completed",
            "analysis_version": "1.0"
        }

        # 6. Verification Status: Must always be 'needs_review' after resume analysis
        profile["verification"] = {
            "status": "needs_review",
            "verified_at": None
        }

        profile["field_sources"] = field_sources
        profile["updated_at"] = now

        # Recalculate completion
        comp = cls.calculate_profile_completion(profile)
        profile["profile_completion"] = {
            "percentage": comp["percentage"],
            "missing_fields": comp["missing_fields"]
        }

        col.update_one({"_id": profile["_id"]}, {"$set": profile})
        return profile

    @classmethod
    def verify_profile(cls, user_id: str) -> dict:
        """
        Marks student profile as verified after validating required baseline information.
        Sets verification.status = 'verified'.
        """
        profile = cls.get_profile_by_user_id(user_id)
        if not profile:
            raise ValueError("Student profile not found. Please create a profile or upload a resume first.")

        # Baseline verification requirements
        personal = profile.get("personal", {})
        has_name = bool(personal.get("full_name") or personal.get("fullName"))
        has_email = bool(personal.get("email"))
        if not has_name and not has_email:
            raise ValueError("Profile verification requires at least full name and email.")

        edu = profile.get("education", {})
        has_edu = bool(edu.get("college") or edu.get("degree") or edu.get("branch"))
        skills = profile.get("skills", {})
        has_skills = any(len(v) > 0 for v in skills.values() if isinstance(v, list))
        projects = profile.get("projects", [])
        has_proj = isinstance(projects, list) and len(projects) > 0

        if not has_edu and not has_skills and not has_proj:
            raise ValueError("Profile must have at least education, technical skills, or a project before verification.")

        now = datetime.now(timezone.utc).isoformat()
        profile["verification"] = {
            "status": "verified",
            "verified_at": now
        }
        profile["updated_at"] = now

        col = cls.get_collection()
        col.update_one(
            {"_id": profile["_id"]},
            {"$set": {"verification": profile["verification"], "updated_at": now}}
        )

        # Update users collection flag
        db = Database.get_db()
        if db is not None:
            obj_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
            db["users"].update_one({"_id": obj_id}, {"$set": {"profile_completed": True, "updated_at": now}})

        return profile

    @classmethod
    def migrate_legacy_profile(cls, legacy_doc: dict):
        """Converts legacy profile structure into the canonical student_profiles schema."""
        now = datetime.now(timezone.utc).isoformat()
        personal = legacy_doc.get("personal", {})
        edu = legacy_doc.get("education", {})
        skills = legacy_doc.get("skills", {})
        prefs = legacy_doc.get("preferences", {})
        resume = legacy_doc.get("resume", {})

        def extract_val(d, k):
            v = d.get(k)
            return v.get("value") if isinstance(v, dict) and "value" in v else v

        field_sources = {}
        for sec_name, sec_dict in [("personal", personal), ("education", edu), ("preferences", prefs)]:
            if isinstance(sec_dict, dict):
                for k, v in sec_dict.items():
                    if isinstance(v, dict) and "source" in v:
                        canonical_k = k
                        if k == "fullName": canonical_k = "full_name"
                        elif k == "graduationYear": canonical_k = "graduation_year"
                        elif k == "targetRoles": canonical_k = "target_roles"
                        elif k == "preferredLocations": canonical_k = "preferred_locations"
                        field_sources[f"{sec_name}.{canonical_k}"] = v["source"]

        canonical_doc = {
            "user_id": legacy_doc.get("user_id"),
            "personal": {
                "full_name": extract_val(personal, "fullName") or extract_val(personal, "full_name"),
                "email": extract_val(personal, "email"),
                "phone": extract_val(personal, "phone"),
                "location": extract_val(personal, "location"),
            },
            "education": {
                "college": extract_val(edu, "college"),
                "degree": extract_val(edu, "degree"),
                "branch": extract_val(edu, "branch"),
                "graduation_year": extract_val(edu, "graduationYear") or extract_val(edu, "graduation_year"),
                "cgpa": extract_val(edu, "cgpa"),
            },
            "skills": {
                "programming_languages": extract_val(skills, "programmingLanguages") or extract_val(skills, "programming_languages") or [],
                "frameworks": extract_val(skills, "frameworks") or [],
                "databases": extract_val(skills, "databases") or [],
                "ai_ml": extract_val(skills, "ai_ml") or [],
                "cloud": extract_val(skills, "cloud") or [],
                "devops": extract_val(skills, "devops") or [],
                "tools": extract_val(skills, "tools") or [],
                "other": extract_val(skills, "other") or extract_val(skills, "technical") or [],
            },
            "projects": legacy_doc.get("projects", []),
            "experience": legacy_doc.get("experience", []),
            "certifications": legacy_doc.get("certifications", []),
            "achievements": legacy_doc.get("achievements", []),
            "interests": legacy_doc.get("interests", []),
            "preferences": {
                "target_roles": extract_val(prefs, "targetRoles") or extract_val(prefs, "target_roles") or [],
                "preferred_locations": extract_val(prefs, "preferredLocations") or extract_val(prefs, "preferred_locations") or [],
                "opportunity_types": extract_val(prefs, "opportunityTypes") or extract_val(prefs, "opportunity_types") or [],
                "work_modes": extract_val(prefs, "workModes") or extract_val(prefs, "work_modes") or ["Remote", "Hybrid"],
            },
            "resume": {
                "file_name": resume.get("fileName", resume.get("file_name")),
                "file_path": resume.get("filePath", resume.get("file_path")),
                "uploaded_at": resume.get("uploadedAt", resume.get("uploaded_at")),
                "analysis_status": resume.get("analysisStatus", resume.get("analysis_status", "none")),
                "analysis_version": "1.0",
            },
            "profile_completion": {
                "percentage": legacy_doc.get("profileCompletion", 0),
                "missing_fields": []
            },
            "verification": {
                "status": legacy_doc.get("verification_status", "draft"),
                "verified_at": legacy_doc.get("verified_at")
            },
            "field_sources": field_sources,
            "created_at": legacy_doc.get("created_at", now),
            "updated_at": legacy_doc.get("updated_at", now)
        }
        cls.get_collection().replace_one(
            {"user_id": canonical_doc["user_id"]},
            canonical_doc,
            upsert=True
        )

    @classmethod
    def to_dict(cls, profile_doc: Optional[dict]) -> dict:
        """
        Converts MongoDB student_profiles document to JSON-safe dictionary.
        Attaches backward-compatibility aliases and completion calculation.
        """
        if not profile_doc:
            return {}

        data = dict(profile_doc)
        if "_id" in data:
            data["id"] = str(data["_id"])
            del data["_id"]
        if "user_id" in data:
            data["user_id"] = str(data["user_id"])

        field_sources = data.get("field_sources", {})

        # Ensure canonical sections exist
        personal = data.setdefault("personal", {})
        education = data.setdefault("education", {})
        skills = data.setdefault("skills", {})
        preferences = data.setdefault("preferences", {})
        verification = data.setdefault("verification", {"status": "draft", "verified_at": None})
        resume = data.setdefault("resume", {})

        # Attach backward-compatible property wrappers for existing frontend pages
        # Personal
        personal["fullName"] = {
            "value": personal.get("full_name"),
            "source": field_sources.get("personal.full_name", "manual"),
            "confidence": 1.0
        }
        personal["email"] = {
            "value": personal.get("email"),
            "source": field_sources.get("personal.email", "system"),
            "confidence": 1.0
        }
        personal["phone"] = {
            "value": personal.get("phone"),
            "source": field_sources.get("personal.phone", "manual"),
            "confidence": 1.0
        }
        personal["location"] = {
            "value": personal.get("location"),
            "source": field_sources.get("personal.location", "manual"),
            "confidence": 1.0
        }

        # Education
        education["college"] = {
            "value": education.get("college"),
            "source": field_sources.get("education.college", "manual"),
            "confidence": 1.0
        }
        education["degree"] = {
            "value": education.get("degree"),
            "source": field_sources.get("education.degree", "manual"),
            "confidence": 1.0
        }
        education["branch"] = {
            "value": education.get("branch"),
            "source": field_sources.get("education.branch", "manual"),
            "confidence": 1.0
        }
        education["graduationYear"] = {
            "value": education.get("graduation_year"),
            "source": field_sources.get("education.graduation_year", "manual"),
            "confidence": 1.0
        }
        education["cgpa"] = {
            "value": education.get("cgpa"),
            "source": field_sources.get("education.cgpa", "manual"),
            "confidence": 1.0
        }

        # Skills categories
        skills["programmingLanguages"] = {
            "value": skills.get("programming_languages", []),
            "source": field_sources.get("skills.programming_languages", "manual"),
            "confidence": 1.0
        }
        skills["frameworks"] = {
            "value": skills.get("frameworks", []),
            "source": field_sources.get("skills.frameworks", "manual"),
            "confidence": 1.0
        }
        skills["databases"] = {
            "value": skills.get("databases", []),
            "source": field_sources.get("skills.databases", "manual"),
            "confidence": 1.0
        }
        skills["cloud"] = {
            "value": skills.get("cloud", []),
            "source": field_sources.get("skills.cloud", "manual"),
            "confidence": 1.0
        }
        skills["tools"] = {
            "value": skills.get("tools", []),
            "source": field_sources.get("skills.tools", "manual"),
            "confidence": 1.0
        }
        skills["technical"] = {
            "value": skills.get("other", []),
            "source": field_sources.get("skills.other", "manual"),
            "confidence": 1.0
        }

        # Preferences
        preferences["targetRoles"] = {
            "value": preferences.get("target_roles", []),
            "source": field_sources.get("preferences.target_roles", "manual")
        }
        preferences["preferredLocations"] = {
            "value": preferences.get("preferred_locations", []),
            "source": field_sources.get("preferences.preferred_locations", "manual")
        }
        preferences["opportunityTypes"] = {
            "value": preferences.get("opportunity_types", []),
            "source": field_sources.get("preferences.opportunity_types", "manual")
        }
        preferences["workModes"] = {
            "value": preferences.get("work_modes", ["Remote", "Hybrid"]),
            "source": field_sources.get("preferences.work_modes", "manual")
        }

        # Resume compatibility aliases
        resume["fileName"] = resume.get("file_name")
        resume["filePath"] = resume.get("file_path")
        resume["uploadedAt"] = resume.get("uploaded_at")
        resume["analysisStatus"] = resume.get("analysis_status")
        resume["parsed"] = resume.get("analysis_status") == "completed"

        # Top-level status aliases
        data["verification_status"] = verification.get("status", "draft")
        data["verified_at"] = verification.get("verified_at")

        # Deterministic completion breakdown
        comp = cls.calculate_profile_completion(data)
        data["profileCompletion"] = comp["percentage"]
        data["completion_details"] = comp
        data["profile_completion"] = {
            "percentage": comp["percentage"],
            "missing_fields": comp["missing_fields"]
        }

        return data
