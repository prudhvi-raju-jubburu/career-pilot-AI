import os
import re
import math
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

from app.models.opportunity import OpportunityModel
from app.models.company import CompanyModel
from app.models.profile import ProfileModel
from app.services.eligibility_engine import EligibilityEngine
from app.services.resource_catalog import get_learning_resources_for_skill
from app.config.recommendation_config import (
    RECOMMENDATION_WEIGHTS,
    WATCHLIST_COMPANY_BOOST,
    URGENCY_DAYS_THRESHOLD,
    URGENCY_SCORE_BOOST,
    MAX_REPETITIVE_COMPANY_PER_PAGE
)

logger = logging.getLogger(__name__)

# In-memory rationale cache to avoid repeated LLM calls
_RATIONALE_CACHE: Dict[str, str] = {}

class RecommendationEngine:
    """
    Hybrid, Explainable, Personalized Opportunity Recommendation Engine for CareerPilot AI.
    Features:
      1. Deterministic Hard Eligibility Evaluation (Strictly decoupled from relevance score)
      2. 5-Factor Weighted Scoring Model:
         - Confirmed skill relevance: 35%
         - Target role and career preference: 25%
         - Project and experience relevance: 15%
         - Education and graduation fit: 15%
         - Location and work-mode preference: 10%
      3. Grounded, evidence-based explanations (No fabricated claims or hallucinated criteria)
      4. Actionable Skill-Gap Breakdown with educational learning paths
      5. Anti-clustering Diversity Ranking across organizations
    """

    @classmethod
    def build_student_evidence_profile(cls, profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Builds a multi-signal, verified evidence profile combining:
          1. Manually entered profile details (strict precedence over raw parser inferences)
          2. Parsed skills and experience from the uploaded resume
          3. Demonstrated skills grounded in verified projects, internships, and certifications
          4. Listed skills from profile tags and resume text
          5. Education and graduation credentials
        """
        from app.utils.skill_normalizer import normalize_skill
        from app.utils.opportunity_normalizer import extract_skills_from_text

        demonstrated_skills: Set[str] = set()
        demonstrated_evidence: Dict[str, List[str]] = {}
        listed_skills: Set[str] = set()

        def _record_demonstrated(skill_name: str, source_label: str):
            clean = str(skill_name).strip()
            if not clean:
                return
            canon = normalize_skill(clean)
            c_low = canon.lower().strip() if canon else clean.lower().strip()
            demonstrated_skills.add(c_low)
            demonstrated_skills.add(clean.lower())
            if c_low not in demonstrated_evidence:
                demonstrated_evidence[c_low] = []
            if source_label not in demonstrated_evidence[c_low]:
                demonstrated_evidence[c_low].append(source_label)

        def _record_listed(skill_name: str):
            clean = str(skill_name).strip()
            if not clean:
                return
            canon = normalize_skill(clean)
            c_low = canon.lower().strip() if canon else clean.lower().strip()
            listed_skills.add(c_low)
            listed_skills.add(clean.lower())

        # 1. Demonstrated from Projects (Profile projects take precedence, supplemented by resume_data)
        projects = profile.get("projects") or []
        resume_data = profile.get("resume_data") or profile.get("parsed_resume") or {}
        if not projects and isinstance(resume_data, dict):
            projects = resume_data.get("projects") or []

        for p in projects:
            p_title = p.get("title") or p.get("name") or "Project"
            techs = p.get("technologies") or p.get("tech_stack") or []
            if isinstance(techs, str):
                techs = [t.strip() for t in techs.split(",") if t.strip()]
            for t in techs:
                _record_demonstrated(t, f"Project '{p_title}'")
            desc = p.get("description", "")
            if desc:
                inferred = extract_skills_from_text(desc)
                for s in inferred:
                    _record_demonstrated(s, f"Project '{p_title}'")

        # 2. Demonstrated from Work Experience / Internships
        experience = profile.get("experience") or []
        if not experience and isinstance(resume_data, dict):
            experience = resume_data.get("experience") or []

        for exp in experience:
            role = exp.get("role") or exp.get("position") or "Experience"
            comp = exp.get("company") or exp.get("organization") or ""
            label = f"{role} at {comp}" if comp else role
            techs = exp.get("technologies") or []
            if isinstance(techs, str):
                techs = [t.strip() for t in techs.split(",") if t.strip()]
            for t in techs:
                _record_demonstrated(t, f"Experience ({label})")
            desc = exp.get("description", "")
            if desc:
                inferred = extract_skills_from_text(desc)
                for s in inferred:
                    _record_demonstrated(s, f"Experience ({label})")

        # 3. Demonstrated from Certifications
        certs = profile.get("certifications") or []
        if not certs and isinstance(resume_data, dict):
            certs = resume_data.get("certifications") or []

        for c in certs:
            c_name = c.get("name") or c.get("title") or "Certification"
            techs = c.get("skills") or []
            if isinstance(techs, str):
                techs = [t.strip() for t in techs.split(",") if t.strip()]
            for t in techs:
                _record_demonstrated(t, f"Certification: {c_name}")
            inferred = extract_skills_from_text(c_name)
            for s in inferred:
                _record_demonstrated(s, f"Certification: {c_name}")

        # 4. Listed from Profile Skills (manual profile skills take precedence)
        raw_skills = profile.get("skills") or []
        if isinstance(raw_skills, list):
            for s in raw_skills:
                _record_listed(str(s))
        elif isinstance(raw_skills, dict):
            for v in raw_skills.values():
                if isinstance(v, list):
                    for item in v:
                        _record_listed(str(item))
                elif isinstance(v, dict) and "value" in v:
                    val = v["value"]
                    if isinstance(val, list):
                        for item in val:
                            _record_listed(str(item))
                    elif isinstance(val, str):
                        _record_listed(val)

        # 5. Listed from Uploaded Resume Data (if available)
        has_resume = False
        resume_meta = profile.get("resume") or {}
        if resume_meta.get("fileName") or profile.get("resume_data") or profile.get("has_resume"):
            has_resume = True
            r_skills = resume_data.get("skills") or []
            if isinstance(r_skills, list):
                for s in r_skills:
                    if isinstance(s, dict):
                        _record_listed(str(s.get("name") or s.get("skill") or ""))
                    else:
                        _record_listed(str(s))
            elif isinstance(r_skills, dict):
                for v in r_skills.values():
                    if isinstance(v, list):
                        for item in v:
                            _record_listed(str(item))

        all_skills = demonstrated_skills.union(listed_skills)

        return {
            "has_resume": has_resume,
            "has_profile": bool(profile),
            "demonstrated_skills": demonstrated_skills,
            "demonstrated_evidence": demonstrated_evidence,
            "listed_skills": listed_skills,
            "all_student_skills": all_skills,
            "target_roles": cls._extract_student_preferred_roles(profile),
            "projects_count": len(projects),
            "experience_count": len(experience),
            "certifications_count": len(certs)
        }

    @classmethod
    def get_recommendations(
        cls,
        user_id: str,
        opp_type: Optional[str] = None,
        location: Optional[str] = None,
        work_mode: Optional[str] = None,
        min_stipend: Optional[int] = None,
        tab: str = "recommended",  # 'recommended' | 'stretch' | 'saved' | 'applied'
        limit: int = 20,
        cursor: Optional[int] = 0
    ) -> Dict[str, Any]:
        """
        Retrieves personalized recommendations tailored to the student.
        Decouples hard eligibility strictly before relevance ranking.
        Excludes already applied opportunities from active recommended feed.
        """
        # 1. Fetch student profile and build evidence profile
        profile_doc = ProfileModel.find_by_user_id(user_id) or {}
        evidence = cls.build_student_evidence_profile(profile_doc)

        # 2. Fetch user's company watchlist
        watchlist = set(CompanyModel.get_user_watchlist(user_id))

        # 3. Retrieve student interaction preferences (Signal interpretation)
        from app.services.signal_interpreter import SignalInterpreter
        student_prefs = SignalInterpreter.build_student_preference_profile(user_id)

        # 4. Fetch tracked user applications to avoid recommending already applied opportunities
        applied_map: Dict[str, str] = {}
        try:
            from app.models.application import ApplicationModel
            user_applications = ApplicationModel.find_by_user(user_id)
            applied_map = {
                str(app.get("opportunity_id")): app.get("status", "Applied")
                for app in user_applications if app.get("opportunity_id")
            }
        except Exception as e:
            logger.warning("Could not fetch user applications for dedup: %s", str(e))

        # 5. Retrieve candidates from MongoDB
        candidates = cls._retrieve_candidates(
            opp_type=opp_type,
            location=location,
            work_mode=work_mode,
            min_stipend=min_stipend,
            limit=200
        )

        recommended_items = []
        stretch_items = []
        applied_items = []

        student_skills = evidence["all_student_skills"]
        student_roles = evidence["target_roles"]

        for opp in candidates:
            opp_id = str(opp.get("_id") or opp.get("id", ""))
            is_applied = opp_id in applied_map

            # Deterministic hard eligibility check
            eligibility = EligibilityEngine.evaluate(opp, profile_doc)

            # Compute 5-factor personalized relevance score
            score_data = cls._score_opportunity(
                opp=opp,
                profile=profile_doc,
                student_skills=student_skills,
                student_roles=student_roles,
                watchlist=watchlist,
                eligibility=eligibility,
                evidence=evidence
            )

            # Calculate bounded personalization adjustment from interaction history
            pers_delta, pers_highlights = SignalInterpreter.calculate_personalization_adjustment(opp, student_prefs)
            base_score = score_data["total_score"]
            final_match_score = int(min(98, max(30, base_score + pers_delta)))
            score_data["breakdown"]["personalization_adjustment"] = pers_delta
            score_data["breakdown"]["base_score"] = base_score

            highlights = list(score_data["highlights"])
            if pers_delta > 0 and pers_highlights:
                highlights.insert(0, pers_highlights[0])

            # Build grounded skill gap breakdown distinguishing demonstrated vs listed
            skill_gap = cls._build_skill_gap(opp, evidence)

            # Construct explainable card payload
            enriched_item = {
                **OpportunityModel.to_dict(opp),
                "match_score": final_match_score,
                "base_score": base_score,
                "personalization_adjustment": pers_delta,
                "score_breakdown": score_data["breakdown"],
                "eligibility": eligibility,
                "skill_gap": skill_gap,
                "demonstrated_skills": [d["skill"] for d in skill_gap["demonstrated"]],
                "listed_skills": [l["skill"] for l in skill_gap["listed"]],
                "potential_gaps": skill_gap["potential_gaps"],
                "has_resume_evidence": evidence["has_resume"],
                "is_watched_company": opp.get("organization", {}).get("name") in watchlist,
                "why_matched": highlights[:3],
                "personal_rationale": cls._generate_rationale(opp, profile_doc, score_data, evidence=evidence)
            }

            if is_applied:
                enriched_item["already_applied"] = True
                enriched_item["application_status"] = applied_map[opp_id]
                applied_items.append(enriched_item)

            # Filter out explicitly dismissed/not-relevant opportunities
            is_dismissed = opp_id in student_prefs["dismissed_opp_ids"] or opp_id in student_prefs["not_relevant_opp_ids"]

            # Decouple Hard Eligibility from Relevance Ranking:
            # A high relevance score must NEVER override failed mandatory requirements.
            if is_applied:
                # Do not recommend in default feed if already applied
                enriched_item["stretch_reasons"] = [f"Already applied ({applied_map[opp_id]})"]
                stretch_items.append(enriched_item)
            elif not eligibility.get("is_eligible", False):
                enriched_item["stretch_reasons"] = eligibility.get("critical_failures") or eligibility.get("unknown_requirements", [])
                stretch_items.append(enriched_item)
            elif is_dismissed:
                enriched_item["stretch_reasons"] = ["Dismissed by you"]
                stretch_items.append(enriched_item)
            else:
                recommended_items.append(enriched_item)

        # Sort by total match score descending
        recommended_items.sort(key=lambda x: x["match_score"], reverse=True)
        stretch_items.sort(key=lambda x: x["match_score"], reverse=True)
        applied_items.sort(key=lambda x: x["match_score"], reverse=True)

        # Feed-Level Deduplication: Guarantee recommended, stretch, and applied feeds never serve duplicate cards
        from app.services.dedup_service import DeduplicationService

        def _dedupe_opportunity_list(item_list):
            seen_feed_keys = set()
            unique_items = []
            for itm in item_list:
                org = (itm.get("organization") or {}).get("name") or itm.get("organization_name") or ""
                norm_org = DeduplicationService.normalize_org_name(org)
                title = itm.get("title") or ""
                norm_title = DeduplicationService.normalize_title(title)
                opp_type = str(itm.get("type") or "job").strip().lower()
                loc = DeduplicationService.normalize_location_token(itm.get("location"))
                feed_key = f"{norm_org}::{norm_title}::{opp_type}::{loc}" if (norm_org and norm_title) else str(itm.get("id") or itm.get("_id"))
                if feed_key in seen_feed_keys:
                    continue
                seen_feed_keys.add(feed_key)
                unique_items.append(itm)
            return unique_items

        recommended_items = _dedupe_opportunity_list(recommended_items)
        stretch_items = _dedupe_opportunity_list(stretch_items)
        applied_items = _dedupe_opportunity_list(applied_items)

        # Apply diversity reranking
        diversified_recommended = cls._apply_diversity(recommended_items)

        # Select tab
        if tab == "stretch":
            active_list = stretch_items
        elif tab == "applied":
            active_list = applied_items
        elif tab == "saved":
            from app.services.opportunity_service import OpportunityService
            saved_ids = set(OpportunityService.get_saved_opportunity_ids(user_id))
            all_pool = diversified_recommended + stretch_items
            active_list = [item for item in all_pool if item.get("id") in saved_ids]
        else:
            active_list = diversified_recommended

        # Pagination cursor
        start = cursor or 0
        paginated = active_list[start:start + limit]
        has_next = (start + limit) < len(active_list)

        from app.services.opportunity_service import OpportunityService
        saved_count = len(OpportunityService.get_saved_opportunity_ids(user_id))

        return {
            "items": paginated,
            "total": len(active_list),
            "counts": {
                "recommended": len(diversified_recommended),
                "stretch": len(stretch_items),
                "saved": saved_count,
                "applied": len(applied_items)
            },
            "evidence_summary": {
                "has_resume": evidence["has_resume"],
                "demonstrated_skills_count": len(evidence["demonstrated_skills"]),
                "listed_skills_count": len(evidence["listed_skills"]),
                "projects_count": evidence["projects_count"]
            },
            "next_cursor": (start + limit) if has_next else None,
            "weights": {
                "skill_relevance": 0.35,
                "role_preference": 0.25,
                "project_experience": 0.15,
                "education_fit": 0.15,
                "location_workmode": 0.10,
                "personalization_cap": 10
            }
        }

    @classmethod
    def explain_recommendation(cls, opp_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Returns full explainability inspector for a single recommendation.
        Grounded in student verified evidence and opportunity criteria.
        """
        opp = OpportunityModel.find_by_id(opp_id)
        if not opp:
            return None

        profile_doc = ProfileModel.find_by_user_id(user_id) or {}
        evidence = cls.build_student_evidence_profile(profile_doc)
        watchlist = set(CompanyModel.get_user_watchlist(user_id))

        from app.services.signal_interpreter import SignalInterpreter
        student_prefs = SignalInterpreter.build_student_preference_profile(user_id)

        student_skills = evidence["all_student_skills"]
        student_roles = evidence["target_roles"]
        eligibility = EligibilityEngine.evaluate(opp, profile_doc)

        score_data = cls._score_opportunity(
            opp=opp,
            profile=profile_doc,
            student_skills=student_skills,
            student_roles=student_roles,
            watchlist=watchlist,
            eligibility=eligibility,
            evidence=evidence
        )

        pers_delta, pers_highlights = SignalInterpreter.calculate_personalization_adjustment(opp, student_prefs)
        base_score = score_data["total_score"]
        final_match_score = int(min(98, max(30, base_score + pers_delta)))
        score_data["breakdown"]["personalization_adjustment"] = pers_delta
        score_data["breakdown"]["base_score"] = base_score

        highlights = list(score_data["highlights"])
        if pers_delta > 0 and pers_highlights:
            highlights.insert(0, pers_highlights[0])

        skill_gap = cls._build_skill_gap(opp, evidence)

        return {
            "opportunity_id": str(opp_id),
            "title": opp.get("title"),
            "company": opp.get("organization", {}).get("name"),
            "match_score": final_match_score,
            "base_score": base_score,
            "personalization_adjustment": pers_delta,
            "score_breakdown": score_data["breakdown"],
            "weights": {
                "skill_relevance": 0.35,
                "role_preference": 0.25,
                "project_experience": 0.15,
                "education_fit": 0.15,
                "location_workmode": 0.10,
                "personalization_cap": 10
            },
            "highlights": highlights,
            "eligibility": eligibility,
            "skill_gap": skill_gap,
            "demonstrated_skills": [d["skill"] for d in skill_gap["demonstrated"]],
            "listed_skills": [l["skill"] for l in skill_gap["listed"]],
            "potential_gaps": skill_gap["potential_gaps"],
            "has_resume_evidence": evidence["has_resume"],
            "personal_rationale": cls._generate_rationale(opp, profile_doc, score_data, evidence=evidence)
        }

    @classmethod
    def _retrieve_candidates(
        cls,
        opp_type: Optional[str] = None,
        location: Optional[str] = None,
        work_mode: Optional[str] = None,
        min_stipend: Optional[int] = None,
        limit: int = 200
    ) -> List[Dict[str, Any]]:
        """Retrieves eligible active candidate opportunities from MongoDB."""
        col = OpportunityModel.get_collection()
        now_utc = datetime.now(timezone.utc).isoformat()
        today_date = now_utc[:10]

        query: Dict[str, Any] = {
            "status": {"$in": ["active", "open"]},
            "$or": [
                {"dates.deadline": None},
                {"dates.deadline": ""},
                {"dates.deadline": {"$gte": today_date}}
            ]
        }

        if opp_type and opp_type.lower() != "all":
            query["type"] = opp_type.lower()

        if work_mode and work_mode.lower() != "all":
            query["work_mode"] = {"$regex": f"^{re.escape(work_mode)}$", "$options": "i"}

        if location and location.lower() not in ("all", "all india"):
            query["$or"] = [
                {"location.city": {"$regex": re.escape(location), "$options": "i"}},
                {"location.state": {"$regex": re.escape(location), "$options": "i"}},
                {"location.is_remote": True}
            ]

        if min_stipend and min_stipend > 0:
            query["$or"] = [
                {"compensation.min_amount": {"$gte": min_stipend}},
                {"compensation.min": {"$gte": min_stipend}},
                {"compensation.max_amount": {"$gte": min_stipend}}
            ]

        cursor = col.find(query).sort("dates.posted_at", -1).limit(limit)
        return list(cursor)

    @classmethod
    def _score_opportunity(
        cls,
        opp: Dict[str, Any],
        profile: Dict[str, Any],
        student_skills: set,
        student_roles: List[str],
        watchlist: set,
        eligibility: Dict[str, Any],
        evidence: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculates production 5-factor weighted match score between 0 and 100.
        Factors:
          1. Confirmed skill relevance: 35% (weights demonstrated project skills higher than self-reported)
          2. Target role and career preference: 25%
          3. Project and experience relevance: 15%
          4. Education and graduation fit: 15%
          5. Location and work-mode preference: 10%
        """
        from app.utils.skill_normalizer import normalize_skill
        from app.utils.opportunity_normalizer import normalize_branches

        highlights = []
        opp_type = str(opp.get("type", "job")).strip().lower()

        # -------------------------------------------------------------
        # Factor 1: Confirmed Skill Relevance (35%)
        # -------------------------------------------------------------
        opp_skills_raw = opp.get("skills") or []
        opp_skills = []
        for s in opp_skills_raw:
            s_str = str(s).strip()
            if s_str:
                opp_skills.append(s_str.lower())

        demonstrated_set = evidence.get("demonstrated_skills", set()) if evidence else set()
        listed_set = evidence.get("listed_skills", set()) if evidence else set()

        matched_skills = []
        demonstrated_matched = []
        listed_matched = []

        for s in opp_skills_raw:
            s_low = str(s).strip().lower()
            c = normalize_skill(s)
            c_low = c.lower().strip() if c else s_low
            if s_low in demonstrated_set or c_low in demonstrated_set:
                demonstrated_matched.append(s)
                matched_skills.append(s)
            elif s_low in listed_set or c_low in listed_set or s_low in student_skills or c_low in student_skills:
                listed_matched.append(s)
                matched_skills.append(s)

        if opp_type in ("scholarship", "fellowship"):
            # Scholarships evaluate field-of-study alignment and academic foundation
            from app.utils.field_of_study import (
                classify_text_to_fields,
                extract_student_fields_of_study,
                compute_field_relevance
            )
            student_fields = extract_student_fields_of_study(profile)
            opp_text = f"{opp.get('title', '')} {opp.get('description', '')} {opp.get('eligibility_text', '')}"
            opp_branches = (opp.get("education_requirements") or {}).get("branches") or []
            opp_fields = classify_text_to_fields(opp_text, branches=opp_branches)

            field_score, field_hl = compute_field_relevance(student_fields, opp_fields)
            if field_hl and field_score >= 80:
                highlights.append(field_hl)

            student_cgpa = profile.get("cgpa") or profile.get("education", {}).get("cgpa")
            try:
                cgpa_f = float(student_cgpa) if student_cgpa else None
            except (ValueError, TypeError):
                cgpa_f = None

            if cgpa_f and cgpa_f >= 8.5:
                skill_score = min(98, int((field_score * 0.7) + 30))
                highlights.append(f"Strong academic foundation (CGPA {cgpa_f:.2f}) fits fellowship criteria")
            elif cgpa_f and cgpa_f >= 7.0:
                skill_score = min(92, int((field_score * 0.7) + 20))
            else:
                skill_score = max(40, int(field_score * 0.8))

            if matched_skills:
                skill_score = min(98, skill_score + 10)
        elif opp_skills:
            if evidence:
                weighted_matches = (len(demonstrated_matched) * 1.0) + (len(listed_matched) * 0.8)
                skill_score = min(100, int((weighted_matches / len(opp_skills)) * 100))
            else:
                skill_score = min(100, int((len(matched_skills) / len(opp_skills)) * 100))
        elif student_skills:
            # Word-boundary text matching for skills in title + description
            title_desc = f"{opp.get('title', '')} {opp.get('description', '')}".lower()
            text_matches = []
            for s in student_skills:
                if len(s) >= 2 and re.search(rf"\b{re.escape(s)}\b", title_desc):
                    text_matches.append(s)
            skill_score = min(90, 50 + len(text_matches) * 15) if text_matches else 65
        else:
            skill_score = 60

        if demonstrated_matched:
            highlights.append(f"Demonstrated project skills match {', '.join(demonstrated_matched[:3])}")
        elif matched_skills:
            highlights.append(f"Matches your confirmed skills in {', '.join(matched_skills[:3])}")

        # -------------------------------------------------------------
        # Factor 2: Target Role & Career Preference (25%)
        # -------------------------------------------------------------
        title_lower = str(opp.get("title", "")).lower()
        desc_lower = str(opp.get("description", "")).lower()
        target_role = str(profile.get("target_role") or "").lower().strip()
        pref = profile.get("preferences") or {}
        pref_types = [t.lower() for t in (pref.get("opportunity_types") or []) if t]
        role_score = 60

        # Common role stop-words that must not match on their own
        ROLE_STOP_WORDS = {
            "intern", "internship", "engineer", "developer", "trainee", "associate",
            "specialist", "junior", "lead", "senior", "entry", "level", "role", "position"
        }

        # Canonical role synonyms
        ROLE_SYNONYMS = {
            "software engineer": ["software developer", "sde", "swe", "backend developer", "programmer"],
            "full-stack developer": ["full stack developer", "full stack engineer", "fullstack", "web developer", "mern"],
            "frontend developer": ["front end developer", "ui developer", "react developer", "web developer"],
            "backend developer": ["back end developer", "python developer", "node developer", "api engineer"],
            "data analyst": ["analytics", "business intelligence", "bi analyst", "data specialist"],
            "ai/ml intern": ["machine learning", "ai engineer", "ml engineer", "data scientist", "deep learning"],
            "python developer": ["python engineer", "python backend", "django developer", "flask developer"]
        }

        if target_role:
            if target_role in title_lower:
                role_score = 100
                highlights.append(f"Direct match for your target role: {target_role.title()}")
            else:
                synonyms = ROLE_SYNONYMS.get(target_role, [])
                if any(syn in title_lower for syn in synonyms):
                    role_score = 95
                    highlights.append(f"Aligns with your focus in {target_role.title()}")
                else:
                    meaningful_words = [w for w in target_role.split() if w not in ROLE_STOP_WORDS and len(w) > 2]
                    if meaningful_words and any(w in title_lower for w in meaningful_words):
                        role_score = 85
                        highlights.append(f"Aligns with your focus in {target_role.title()}")
                    elif target_role in desc_lower:
                        role_score = 75

        # Check secondary preferred roles
        if role_score < 90:
            for r in student_roles:
                r_clean = r.lower().strip()
                if r_clean:
                    if r_clean in title_lower:
                        role_score = max(role_score, 85)
                        highlights.append(f"Matches your preferred role: {r.title()}")
                        break
                    r_meaningful = [w for w in r_clean.split() if w not in ROLE_STOP_WORDS and len(w) > 2]
                    if r_meaningful and any(w in title_lower for w in r_meaningful):
                        role_score = max(role_score, 80)
                        highlights.append(f"Matches your preferred role: {r.title()}")
                        break

        # Category preference alignment
        if pref_types:
            if opp_type in pref_types:
                role_score = min(100, role_score + 15)
                highlights.append(f"Matches your preferred category: {opp_type.title()}")
            elif opp_type in ("hackathon", "coding_contest") and any(t in pref_types for t in ("hackathon", "coding_contest")):
                role_score = min(100, role_score + 15)
                highlights.append("Matches your competition preference")

        # -------------------------------------------------------------
        # Factor 3: Project & Experience Relevance (15%)
        # -------------------------------------------------------------
        projects = profile.get("projects") or []
        experience = profile.get("experience") or []
        project_score = 65

        project_texts = []
        for p in projects:
            p_title = p.get("title", "") or p.get("name", "")
            p_desc = p.get("description", "") or ""
            p_tech = " ".join(p.get("technologies") or p.get("tech_stack") or [])
            project_texts.append(f"{p_title} {p_desc} {p_tech}".lower())

        for exp in experience:
            e_role = exp.get("role", "") or exp.get("position", "")
            e_desc = exp.get("description", "") or ""
            project_texts.append(f"{e_role} {e_desc}".lower())

        all_portfolio_text = " ".join(project_texts)
        if all_portfolio_text and opp_skills:
            portfolio_skill_matches = []
            for s in opp_skills:
                if len(s) >= 2 and re.search(rf"\b{re.escape(s)}\b", all_portfolio_text):
                    portfolio_skill_matches.append(s)
            if portfolio_skill_matches:
                project_score = min(100, 70 + len(portfolio_skill_matches) * 10)
                highlights.append(f"Relevant to your projects demonstrating {', '.join(portfolio_skill_matches[:2])}")
            elif len(projects) > 0 or len(experience) > 0:
                project_score = 75
        elif len(projects) > 0:
            project_score = 70

        # -------------------------------------------------------------
        # Factor 4: Education & Graduation Fit (15%)
        # -------------------------------------------------------------
        edu_req = opp.get("education_requirements") or {}
        student_edu = profile.get("education") or {}
        raw_year = student_edu.get("graduation_year") or student_edu.get("graduationYear") or profile.get("graduation_year")
        if isinstance(raw_year, dict) and "value" in raw_year:
            student_year = raw_year["value"]
        else:
            student_year = raw_year

        raw_branch = student_edu.get("branch") or profile.get("branch") or ""
        if isinstance(raw_branch, dict) and "value" in raw_branch:
            raw_branch = raw_branch["value"]
        student_branch = str(raw_branch or "").strip().lower()

        edu_score = 80
        allowed_years = edu_req.get("graduation_years") or opp.get("graduation_years") or []
        if allowed_years and student_year:
            try:
                if int(student_year) in [int(y) for y in allowed_years if str(y).isdigit()]:
                    edu_score += 10
                    highlights.append(f"Your graduation batch ({student_year}) matches the requirement")
                else:
                    edu_score -= 20
            except (ValueError, TypeError):
                pass

        allowed_branches = edu_req.get("branches") or opp.get("eligible_branches") or []
        if allowed_branches and student_branch:
            norm_allowed = normalize_branches(allowed_branches) if allowed_branches else []
            norm_student = normalize_branches([student_branch]) if student_branch else []
            student_branch_norm = norm_student[0].lower() if norm_student else student_branch.lower()
            is_open_branch = any(
                b.lower() in ("any", "all", "open", "any branch", "all branches", "open to all", "all disciplines", "any technical branch") or
                "all engineering" in b.lower() or "any technical" in b.lower()
                for b in allowed_branches
            )
            if is_open_branch or any(b.lower() == student_branch_norm or student_branch_norm in b.lower() for b in (norm_allowed or allowed_branches)):
                edu_score = min(100, edu_score + 10)

        # -------------------------------------------------------------
        # Factor 5: Location & Work-Mode Preference (10%)
        # -------------------------------------------------------------
        pref_locs = [c.lower() for c in (pref.get("preferred_locations") or pref.get("locations") or []) if c]
        pref_modes = [m.lower() for m in (pref.get("work_modes") or []) if m]
        opp_loc = opp.get("location") or {}
        opp_city = str(opp_loc.get("city") or "").lower()
        opp_mode = str(opp.get("work_mode") or "Onsite").lower()
        is_remote = opp_loc.get("is_remote", False) or opp_mode == "remote"

        willing_relocate = pref.get("willing_to_relocate")
        if is_remote:
            loc_score = 95
            highlights.append("Remote (accessible across India)")
        elif any(c in opp_city for c in pref_locs if c):
            loc_score = 95
            highlights.append(f"Located in your preferred city: {opp_city.title()}")
        elif pref_modes and opp_mode in pref_modes:
            loc_score = 85
        elif not opp_city:
            loc_score = 70  # Neutral for unspecified location
        elif willing_relocate is True:
            loc_score = 80
        elif willing_relocate is False:
            loc_score = 50
        else:
            loc_score = 70  # Neutral when relocation preference is unstated

        # Optional Watchlist bonus
        comp_name = opp.get("organization", {}).get("name", "")
        if comp_name in watchlist:
            highlights.append(f"Company '{comp_name}' is in your followed watchlist (+{WATCHLIST_COMPANY_BOOST}% boost)")

        # Weighted calculation
        raw_total = (
            (skill_score * 0.35) +
            (role_score * 0.25) +
            (project_score * 0.15) +
            (edu_score * 0.15) +
            (loc_score * 0.10)
        )

        if comp_name in watchlist:
            raw_total = min(98, raw_total + WATCHLIST_COMPANY_BOOST)

        final_score = int(min(98, max(35, round(raw_total))))

        # Detailed breakdown
        breakdown = {
            "skill_relevance": skill_score,
            "role_preference": role_score,
            "project_experience": project_score,
            "education_fit": edu_score,
            "location_workmode": loc_score,
            # Legacy compatibility aliases
            "skill_score": skill_score,
            "semantic_score": role_score,
            "academic_score": edu_score,
            "preference_score": loc_score,
            "recency_score": 75,
            "behavioral_score": 80 if comp_name in watchlist else 50
        }

        return {
            "total_score": final_score,
            "breakdown": breakdown,
            "highlights": highlights[:3]
        }

    @classmethod
    def _build_skill_gap(cls, opp: Dict[str, Any], student_skills: Any) -> Dict[str, Any]:
        """
        Calculates matched vs missing skills and links to learning resources.
        Distinguishes demonstrated vs listed skills vs potential gaps.
        """
        from app.utils.skill_normalizer import normalize_skill

        opp_skills = opp.get("skills") or []

        if isinstance(student_skills, dict):
            demonstrated_set = student_skills.get("demonstrated_skills", set())
            listed_set = student_skills.get("listed_skills", set())
            demonstrated_evidence = student_skills.get("demonstrated_evidence", {})
            has_profile_data = bool(student_skills.get("all_student_skills"))
            has_resume = student_skills.get("has_resume", False)
        else:
            demonstrated_set = set()
            listed_set = student_skills or set()
            demonstrated_evidence = {}
            has_profile_data = bool(student_skills)
            has_resume = False

        demonstrated = []
        listed = []
        potential_gaps = []
        unknown = []
        matched_skills = []

        for s in opp_skills:
            s_clean = str(s).strip()
            if not s_clean:
                continue
            c = normalize_skill(s_clean)
            c_low = c.lower().strip() if c else s_clean.lower().strip()
            s_low = s_clean.lower()

            if not has_profile_data:
                unknown.append(s_clean)
            elif c_low in demonstrated_set or s_low in demonstrated_set:
                sources = demonstrated_evidence.get(c_low) or demonstrated_evidence.get(s_low) or []
                src_label = sources[0] if sources else "Demonstrated in verified projects/experience"
                demonstrated.append({
                    "skill": s_clean,
                    "evidence": src_label
                })
                matched_skills.append(s_clean)
            elif c_low in listed_set or s_low in listed_set:
                listed.append({
                    "skill": s_clean,
                    "evidence": "Listed in profile or resume"
                })
                matched_skills.append(s_clean)
            else:
                potential_gaps.append(s_clean)

        total_reqs = len(opp_skills)
        if total_reqs == 0:
            readiness = "Ready to Apply"
            estimated_effort = "Immediate"
        elif len(matched_skills) >= math.ceil(total_reqs * 0.7):
            readiness = "Ready to Apply"
            estimated_effort = "1-2 days (review JD)"
        elif len(potential_gaps) <= 2:
            readiness = f"Review {potential_gaps[0]}" if potential_gaps else "Ready to Apply"
            estimated_effort = "1-2 weeks"
        else:
            readiness = f"Learn {potential_gaps[0]} First" if potential_gaps else "Needs Preparation"
            estimated_effort = "3-4 weeks"

        learning_resources = []
        for m in potential_gaps[:2]:
            res = get_learning_resources_for_skill(m)
            if res:
                learning_resources.extend(res[:1])

        return {
            "demonstrated": demonstrated,
            "listed": listed,
            "potential_gaps": potential_gaps,
            "unknown": unknown,
            "matched_skills": matched_skills,
            "missing_skills": potential_gaps,
            "readiness_status": readiness,
            "estimated_effort": estimated_effort,
            "learning_resources": learning_resources,
            "has_resume_evidence": has_resume
        }

    @classmethod
    def _apply_diversity(cls, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Prevents company clustering by limiting consecutive items from the same company."""
        result = []
        company_counts: Dict[str, int] = {}
        deferred = []

        for item in items:
            org = item.get("organization", {}).get("name", "Unknown")
            count = company_counts.get(org, 0)
            if count < MAX_REPETITIVE_COMPANY_PER_PAGE:
                company_counts[org] = count + 1
                result.append(item)
            else:
                deferred.append(item)

        result.extend(deferred)
        return result

    @classmethod
    def _generate_rationale(
        cls,
        opp: Dict[str, Any],
        profile: Dict[str, Any],
        score_data: Dict[str, Any],
        evidence: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generates personalized rationale grounded strictly in student profile & opportunity text.
        """
        opp_id = str(opp.get("_id") or opp.get("id", ""))
        user_id = str(profile.get("user_id", ""))
        cache_key = f"{user_id}_{opp_id}"

        if cache_key in _RATIONALE_CACHE:
            return _RATIONALE_CACHE[cache_key]

        company = opp.get("organization", {}).get("name", "Target Organization")
        matched = score_data.get("highlights", [])

        if matched:
            fallback = f"Recommended for you: {matched[0]}."
        elif evidence and not evidence.get("has_resume"):
            title = opp.get("title", "Role")
            fallback = f"Matched to {title} at {company} based on your profile preferences. Upload a resume to enable verified project skill matching."
        else:
            title = opp.get("title", "Role")
            fallback = f"Relevant opening for {title} at {company} matching your profile."

        _RATIONALE_CACHE[cache_key] = fallback
        return fallback

    @staticmethod
    def _extract_student_skills(profile: Dict[str, Any]) -> set:
        from app.utils.skill_normalizer import normalize_skill

        skills = set()
        raw = profile.get("skills") or []
        candidate_list = []
        if isinstance(raw, list):
            candidate_list.extend(raw)
        elif isinstance(raw, dict):
            for v in raw.values():
                if isinstance(v, list):
                    candidate_list.extend(v)
                elif isinstance(v, dict) and "value" in v and isinstance(v["value"], list):
                    candidate_list.extend(v["value"])

        # Projects skills
        for p in (profile.get("projects") or []):
            techs = p.get("technologies") or p.get("tech_stack") or []
            if isinstance(techs, list):
                candidate_list.extend(techs)
            elif isinstance(techs, str):
                candidate_list.extend(techs.split(","))

        # Experience skills
        for exp in (profile.get("experience") or []):
            techs = exp.get("technologies") or []
            if isinstance(techs, list):
                candidate_list.extend(techs)
            elif isinstance(techs, str):
                candidate_list.extend(techs.split(","))

        # Resume data skills
        resume_data = profile.get("resume_data") or profile.get("parsed_resume") or {}
        if isinstance(resume_data, dict):
            r_skills = resume_data.get("skills") or []
            if isinstance(r_skills, list):
                for s in r_skills:
                    if isinstance(s, dict):
                        candidate_list.append(s.get("name") or s.get("skill") or "")
                    else:
                        candidate_list.append(s)

        for s in candidate_list:
            s_str = str(s).strip()
            if s_str:
                s_low = s_str.lower()
                skills.add(s_low)
                c = normalize_skill(s_str)
                if c:
                    skills.add(c.lower().strip())
        return skills

    @staticmethod
    def _extract_student_preferred_roles(profile: Dict[str, Any]) -> List[str]:
        roles = []
        target = profile.get("target_role")
        if target:
            roles.append(target)
        pref = profile.get("preferences") or {}
        pref_roles = pref.get("target_roles") or pref.get("preferred_roles") or []
        if isinstance(pref_roles, list):
            roles.extend(pref_roles)
        return roles
