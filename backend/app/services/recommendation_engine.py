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
    def get_recommendations(
        cls,
        user_id: str,
        opp_type: Optional[str] = None,
        location: Optional[str] = None,
        work_mode: Optional[str] = None,
        min_stipend: Optional[int] = None,
        tab: str = "recommended",  # 'recommended' | 'stretch' | 'saved'
        limit: int = 20,
        cursor: Optional[int] = 0
    ) -> Dict[str, Any]:
        """
        Retrieves personalized recommendations tailored to the student.
        """
        # 1. Fetch student profile
        profile_doc = ProfileModel.find_by_user_id(user_id) or {}

        # 2. Fetch user's company watchlist
        watchlist = set(CompanyModel.get_user_watchlist(user_id))

        # 3. Retrieve student interaction preferences (Signal interpretation)
        from app.services.signal_interpreter import SignalInterpreter
        student_prefs = SignalInterpreter.build_student_preference_profile(user_id)

        # 4. Retrieve candidates from MongoDB
        candidates = cls._retrieve_candidates(
            opp_type=opp_type,
            location=location,
            work_mode=work_mode,
            min_stipend=min_stipend,
            limit=200
        )

        recommended_items = []
        stretch_items = []

        student_skills = cls._extract_student_skills(profile_doc)
        student_roles = cls._extract_student_preferred_roles(profile_doc)

        for opp in candidates:
            opp_id = str(opp.get("_id") or opp.get("id", ""))

            # Deterministic hard eligibility check
            eligibility = EligibilityEngine.evaluate(opp, profile_doc)

            # Compute 5-factor personalized relevance score
            score_data = cls._score_opportunity(
                opp=opp,
                profile=profile_doc,
                student_skills=student_skills,
                student_roles=student_roles,
                watchlist=watchlist,
                eligibility=eligibility
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

            # Build skill gap breakdown
            skill_gap = cls._build_skill_gap(opp, student_skills)

            # Construct explainable card payload
            enriched_item = {
                **OpportunityModel.to_dict(opp),
                "match_score": final_match_score,
                "base_score": base_score,
                "personalization_adjustment": pers_delta,
                "score_breakdown": score_data["breakdown"],
                "eligibility": eligibility,
                "skill_gap": skill_gap,
                "is_watched_company": opp.get("organization", {}).get("name") in watchlist,
                "why_matched": highlights[:3],
                "personal_rationale": cls._generate_rationale(opp, profile_doc, score_data)
            }

            # Filter out explicitly dismissed/not-relevant opportunities from recommended feed
            is_dismissed = opp_id in student_prefs["dismissed_opp_ids"] or opp_id in student_prefs["not_relevant_opp_ids"]

            # Decouple Eligibility from Relevance:
            # High match score must NEVER override failed mandatory requirements.
            if eligibility.get("is_eligible", False):
                if not is_dismissed:
                    recommended_items.append(enriched_item)
                else:
                    enriched_item["stretch_reasons"] = ["Dismissed by you"]
                    stretch_items.append(enriched_item)
            else:
                enriched_item["stretch_reasons"] = eligibility.get("critical_failures") or eligibility.get("unknown_requirements", [])
                stretch_items.append(enriched_item)

        # Sort by total match score descending
        recommended_items.sort(key=lambda x: x["match_score"], reverse=True)
        stretch_items.sort(key=lambda x: x["match_score"], reverse=True)

        # Apply diversity reranking
        diversified_recommended = cls._apply_diversity(recommended_items)

        # Select tab
        if tab == "stretch":
            active_list = stretch_items
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
                "saved": saved_count
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
        """
        opp = OpportunityModel.find_by_id(opp_id)
        if not opp:
            return None

        profile_doc = ProfileModel.find_by_user_id(user_id) or {}
        watchlist = set(CompanyModel.get_user_watchlist(user_id))

        from app.services.signal_interpreter import SignalInterpreter
        student_prefs = SignalInterpreter.build_student_preference_profile(user_id)

        student_skills = cls._extract_student_skills(profile_doc)
        student_roles = cls._extract_student_preferred_roles(profile_doc)
        eligibility = EligibilityEngine.evaluate(opp, profile_doc)

        score_data = cls._score_opportunity(
            opp=opp,
            profile=profile_doc,
            student_skills=student_skills,
            student_roles=student_roles,
            watchlist=watchlist,
            eligibility=eligibility
        )

        pers_delta, pers_highlights = SignalInterpreter.calculate_personalization_adjustment(opp, student_prefs)
        base_score = score_data["total_score"]
        final_match_score = int(min(98, max(30, base_score + pers_delta)))
        score_data["breakdown"]["personalization_adjustment"] = pers_delta
        score_data["breakdown"]["base_score"] = base_score

        highlights = list(score_data["highlights"])
        if pers_delta > 0 and pers_highlights:
            highlights.insert(0, pers_highlights[0])

        skill_gap = cls._build_skill_gap(opp, student_skills)

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
            "personal_rationale": cls._generate_rationale(opp, profile_doc, score_data)
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
        eligibility: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculates production 5-factor weighted match score between 0 and 100.
        Factors:
          1. Confirmed skill relevance: 35%
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

        matched_skills = []
        for s in opp_skills_raw:
            s_low = str(s).strip().lower()
            c = normalize_skill(s)
            c_low = c.lower().strip() if c else s_low
            if s_low in student_skills or c_low in student_skills:
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

        if matched_skills:
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
    def _build_skill_gap(cls, opp: Dict[str, Any], student_skills: set) -> Dict[str, Any]:
        """Calculates matched vs missing skills and links to learning resources."""
        opp_skills = opp.get("skills") or []
        matched = []
        missing = []

        for s in opp_skills:
            if str(s).lower().strip() in student_skills:
                matched.append(s)
            else:
                missing.append(s)

        readiness = (
            "Ready to Apply"
            if len(matched) >= math.ceil(len(opp_skills) * 0.6) or len(missing) <= 1
            else f"Learn {missing[0]} First" if missing else "Ready to Apply"
        )
        estimated_effort = "1-2 weeks" if len(missing) <= 2 else "3-4 weeks"

        learning_resources = []
        for m in missing[:2]:
            res = get_learning_resources_for_skill(m)
            if res:
                learning_resources.extend(res[:1])

        return {
            "matched_skills": matched,
            "missing_skills": missing,
            "readiness_status": readiness,
            "estimated_effort": estimated_effort,
            "learning_resources": learning_resources
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
    def _generate_rationale(cls, opp: Dict[str, Any], profile: Dict[str, Any], score_data: Dict[str, Any]) -> str:
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
