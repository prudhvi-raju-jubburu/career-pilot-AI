import math
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Set, Tuple

from app.models.feedback import FeedbackModel
from app.models.application import ApplicationModel
from app.models.opportunity import OpportunityModel
from app.models.profile import ProfileModel

logger = logging.getLogger(__name__)

# Recency Half-Life: 30 days
HALF_LIFE_DAYS = 30.0
LAMBDA_DECAY = math.log(2.0) / HALF_LIFE_DAYS  # ~0.0231

# Base signal weights
SIGNAL_WEIGHTS = {
    "application_confirmed": 8.0,
    "application_started": 4.0,
    "opportunity_saved": 5.0,
    "opportunity_unsaved": -3.0,
    "relevance_feedback_relevant": 6.0,
    "relevance_feedback_not_relevant": -8.0,
    "recommendation_dismissed": -5.0,
    "opportunity_viewed": 1.0,
}

# Personalization adjustment clamp
MAX_PERSONALIZATION_BOOST = 10
MIN_PERSONALIZATION_PENALTY = -10

class SignalInterpreter:
    """
    Centralized, deterministic student interaction signal interpreter.
    Extracts positive and negative preferences with exponential recency decay,
    computing bounded personalization adjustments grounded in user history.
    """

    @classmethod
    def get_decay_factor(cls, event_time_iso: Optional[str], now_utc: Optional[datetime] = None) -> float:
        """Computes exponential temporal decay factor e^(-lambda * delta_days)."""
        if not event_time_iso:
            return 1.0
        if now_utc is None:
            now_utc = datetime.now(timezone.utc)
        try:
            # Handle ISO string with or without Z/offset
            clean_str = event_time_iso.replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            delta_seconds = max(0.0, (now_utc - dt).total_seconds())
            delta_days = delta_seconds / 86400.0
            decay = math.exp(-LAMBDA_DECAY * delta_days)
            return max(0.05, min(1.0, decay))
        except Exception:
            return 1.0

    @classmethod
    def build_student_preference_profile(cls, user_id: str) -> Dict[str, Any]:
        """
        Gathers interaction signals from user_feedback, student_profiles.saved_opportunities,
        and applications to construct a weighted student interest profile.
        """
        now_utc = datetime.now(timezone.utc)

        category_weights: Dict[str, float] = {}
        skill_weights: Dict[str, float] = {}
        company_weights: Dict[str, float] = {}
        dismissed_opp_ids: Set[str] = set()
        not_relevant_opp_ids: Set[str] = set()
        saved_opp_ids: Set[str] = set()
        applied_opp_ids: Set[str] = set()
        positive_signal_count = 0

        # 1. Inspect user_feedback collection
        feedback_events = FeedbackModel.get_user_events(user_id=user_id, limit=200)
        for ev in feedback_events:
            ev_type = ev.get("event_type")
            opp_id = str(ev.get("opportunity_id"))
            decay = cls.get_decay_factor(ev.get("created_at"), now_utc=now_utc)
            rating = ev.get("rating")

            if ev_type == "recommendation_dismissed":
                dismissed_opp_ids.add(opp_id)
                continue

            if ev_type == "relevance_feedback_submitted":
                if rating == "not_relevant":
                    not_relevant_opp_ids.add(opp_id)
                    continue
                elif rating == "relevant":
                    positive_signal_count += 1
                    weight = SIGNAL_WEIGHTS["relevance_feedback_relevant"] * decay
                else:
                    continue
            elif ev_type == "opportunity_saved":
                saved_opp_ids.add(opp_id)
                positive_signal_count += 1
                weight = SIGNAL_WEIGHTS["opportunity_saved"] * decay
            elif ev_type == "opportunity_unsaved":
                saved_opp_ids.discard(opp_id)
                weight = SIGNAL_WEIGHTS["opportunity_unsaved"] * decay
            elif ev_type in ("application_confirmed", "application_started"):
                applied_opp_ids.add(opp_id)
                positive_signal_count += 1
                weight = SIGNAL_WEIGHTS.get(ev_type, 6.0) * decay
            elif ev_type == "opportunity_viewed":
                weight = SIGNAL_WEIGHTS["opportunity_viewed"] * decay
            else:
                weight = 1.0 * decay

            cat = (ev.get("category") or "").strip().lower()
            if cat:
                category_weights[cat] = category_weights.get(cat, 0.0) + weight

            comp = (ev.get("company") or "").strip()
            if comp:
                company_weights[comp] = company_weights.get(comp, 0.0) + weight

            for s in (ev.get("skills") or []):
                s_low = str(s).strip().lower()
                if s_low:
                    skill_weights[s_low] = skill_weights.get(s_low, 0.0) + (weight * 0.5)

        # 2. Inspect student_profiles.saved_opportunities (Canonical Source of Truth for saves)
        profile_doc = ProfileModel.find_by_user_id(user_id) or {}
        raw_saves = profile_doc.get("saved_opportunities") or []
        for s_id in raw_saves:
            s_str = str(s_id)
            saved_opp_ids.add(s_str)

        # 3. Inspect tracked applications in ApplicationModel
        try:
            user_apps = ApplicationModel.find_by_user(user_id=user_id)
            for app in user_apps:
                app_opp_id = app.get("opportunityId") or app.get("opportunity_id")
                if app_opp_id:
                    applied_opp_ids.add(str(app_opp_id))
                    positive_signal_count += 1

                app_cat = (app.get("type") or "").strip().lower()
                if app_cat:
                    category_weights[app_cat] = category_weights.get(app_cat, 0.0) + (SIGNAL_WEIGHTS["application_confirmed"] * 0.8)

                app_comp = (app.get("company") or "").strip()
                if app_comp:
                    company_weights[app_comp] = company_weights.get(app_comp, 0.0) + (SIGNAL_WEIGHTS["application_confirmed"] * 0.8)
        except Exception as e:
            logger.warning("Could not read applications for user %s: %s", user_id, str(e))

        return {
            "user_id": str(user_id),
            "category_weights": category_weights,
            "skill_weights": skill_weights,
            "company_weights": company_weights,
            "dismissed_opp_ids": dismissed_opp_ids,
            "not_relevant_opp_ids": not_relevant_opp_ids,
            "saved_opp_ids": saved_opp_ids,
            "applied_opp_ids": applied_opp_ids,
            "positive_signal_count": positive_signal_count,
            "has_history": bool(positive_signal_count > 0 or dismissed_opp_ids or not_relevant_opp_ids)
        }

    @classmethod
    def calculate_personalization_adjustment(
        cls,
        opp: Dict[str, Any],
        student_prefs: Dict[str, Any]
    ) -> Tuple[int, List[str]]:
        """
        Computes a bounded personalization adjustment [-10, +10] and explainability highlights.
        Guaranteed: Returns 0 for new students without interaction history.
        """
        if not student_prefs.get("has_history"):
            return 0, []

        opp_id = str(opp.get("_id") or opp.get("id", ""))
        highlights: List[str] = []

        # 1. Explicit negative signals check
        if opp_id in student_prefs["dismissed_opp_ids"] or opp_id in student_prefs["not_relevant_opp_ids"]:
            return MIN_PERSONALIZATION_PENALTY, ["Marked as not relevant by you"]

        score_adjustment = 0.0

        # 2. Category interest affinity
        opp_type = str(opp.get("type", "job")).strip().lower()
        cat_weight = student_prefs["category_weights"].get(opp_type, 0.0)
        if cat_weight >= 10.0:
            score_adjustment += 4.0
            highlights.append(f"Frequently saved {opp_type.title()} opportunities")
        elif cat_weight >= 4.0:
            score_adjustment += 2.0
            highlights.append(f"Matches your recent interest in {opp_type.title()}s")

        # 3. Company affinity
        comp_name = (opp.get("organization", {}).get("name") or "").strip()
        comp_weight = student_prefs["company_weights"].get(comp_name, 0.0)
        if comp_weight >= 8.0:
            score_adjustment += 3.0
            highlights.append(f"Followed organization: {comp_name}")
        elif comp_weight >= 4.0:
            score_adjustment += 1.5

        # 4. Skill affinity from saved / applied jobs
        opp_skills = [str(s).lower().strip() for s in (opp.get("skills") or []) if str(s).strip()]
        matched_pref_skills = []
        for s in opp_skills:
            if student_prefs["skill_weights"].get(s, 0.0) >= 3.0:
                matched_pref_skills.append(s)

        if matched_pref_skills:
            boost = min(4.0, len(matched_pref_skills) * 1.5)
            score_adjustment += boost
            highlights.append(f"Matches skills from your saved history: {', '.join(matched_pref_skills[:2])}")

        # 5. Direct interaction on this item (Already saved or applied)
        if opp_id in student_prefs["saved_opp_ids"]:
            score_adjustment += 3.0
            highlights.append("In your saved bookmarks")
        if opp_id in student_prefs["applied_opp_ids"]:
            score_adjustment += 2.0
            highlights.append("In your application tracker")

        # Clamp bounded delta strictly to [-10, +10]
        clamped = max(MIN_PERSONALIZATION_PENALTY, min(MAX_PERSONALIZATION_BOOST, int(round(score_adjustment))))
        return clamped, highlights[:2]
