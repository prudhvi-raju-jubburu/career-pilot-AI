import json
import logging
from typing import List, Dict, Any
from app.scrapers.base import OpportunitySource
from app.utils.opportunity_normalizer import normalize_category, normalize_location, parse_iso_deadline

logger = logging.getLogger(__name__)

class UnstopConnector(OpportunitySource):
    """
    Official public Unstop API connector for verified software engineering internships,
    developer fresher roles, and technical hiring challenges across India.
    Documentation / Platform: https://unstop.com
    """

    def __init__(self, limit: int = 30, enabled: bool = True):
        super().__init__(
            name="unstop_api",
            source_type="jobs",
            base_url="https://unstop.com/api/public/opportunity/search-result",
            rate_limit_delay=1.0,
            enabled=enabled
        )
        self.limit = limit

    def fetch(self) -> List[Dict[str, Any]]:
        if not self.is_enabled:
            return []

        all_items = []
        queries = [
            ("internships", "software"),
            ("jobs", "developer")
        ]

        for opp_kind, search_term in queries:
            url = f"{self.base_url}?opportunity={opp_kind}&searchTerm={search_term}&per_page=15"
            try:
                raw_bytes = self._fetch_url(url)
                data = json.loads(raw_bytes.decode("utf-8"))
                items = data.get("data", {}).get("data", [])
                for it in items:
                    it["_opp_kind"] = opp_kind
                all_items.extend(items)
                logger.info("UnstopConnector: fetched %d %s for '%s'", len(items), opp_kind, search_term)
            except Exception as e:
                logger.error("UnstopConnector fetch failed for %s (%s): %s", opp_kind, search_term, str(e))

        return all_items[:self.limit]

    def normalize(self, raw_item: Dict[str, Any]) -> Dict[str, Any]:
        title = raw_item.get("title", "Software Developer")
        opp_kind = raw_item.get("_opp_kind", "internships")
        lower_title = title.lower()
        job_type = "internship" if ("intern" in lower_title or opp_kind == "internships") else "job"

        # Organization
        org = raw_item.get("organisation") or {}
        org_name = org.get("name") if isinstance(org, dict) else (str(org) if org else "India Tech Enterprise")
        org_logo = org.get("logoUrl") if isinstance(org, dict) else ""

        # Location extraction from India locations array
        raw_locs = raw_item.get("locations") or []
        loc_city = "Remote (India)"
        loc_state = None
        loc_country = "India"
        is_remote = False

        if raw_locs and isinstance(raw_locs, list) and len(raw_locs) > 0:
            first_loc = raw_locs[0]
            if isinstance(first_loc, dict):
                loc_city = first_loc.get("city") or "India"
                loc_state = first_loc.get("state")
                loc_country = first_loc.get("country") or "India"
        else:
            region = str(raw_item.get("region") or "").lower()
            if "online" in region or "remote" in region:
                is_remote = True
                loc_city = "Remote (India)"

        normalized_loc = normalize_location({
            "city": loc_city,
            "state": loc_state,
            "country": loc_country,
            "is_remote": is_remote
        })

        # Skills extraction
        req_skills = raw_item.get("required_skills") or []
        skills_list = []
        for s in req_skills:
            if isinstance(s, dict) and s.get("skill"):
                skills_list.append(s["skill"])
            elif isinstance(s, str):
                skills_list.append(s)

        if not skills_list:
            skills_list = ["Python", "JavaScript", "SQL", "Data Structures", "Problem Solving"]

        # Compensation & Job Details
        job_detail = raw_item.get("jobDetail") or {}
        min_salary = job_detail.get("min_salary")
        max_salary = job_detail.get("max_salary")
        is_in_office = job_detail.get("type") == "in_office"

        work_mode = "Onsite" if is_in_office else ("Remote" if is_remote else "Hybrid")

        # URL Construction
        seo_url = raw_item.get("seo_url") or str(raw_item.get("id"))
        app_url = f"https://unstop.com/{opp_kind}/{seo_url}"

        # Dates
        deadline = parse_iso_deadline(raw_item.get("end_date"))
        posted_at = parse_iso_deadline(raw_item.get("approved_date") or raw_item.get("updated_at"))

        # Description cleanup
        desc = raw_item.get("details") or f"Exciting tech opportunity for {title} at {org_name} in {normalized_loc.get('city')}, India."

        return {
            "title": title,
            "organization": {
                "name": org_name,
                "website": org_logo or "https://unstop.com"
            },
            "description": desc,
            "type": job_type,
            "category": normalize_category(
                raw_item.get("workfunction"),
                title=title,
                description=" ".join(skills_list)
            ),
            "location": normalized_loc,
            "work_mode": work_mode,
            "skills": skills_list,
            "education_requirements": {
                "degrees": ["B.Tech", "B.E.", "BCA", "MCA", "B.Sc (CS/IT)", "Equivalent"],
                "branches": ["Computer Science", "Information Technology", "Electronics", "Related Disciplines"],
                "graduation_years": [],
                "cgpa_min": None
            },
            "experience": {
                "min_years": job_detail.get("min_experience") or 0,
                "max_years": job_detail.get("max_experience") or 2
            },
            "eligibility_text": f"Open to college students and fresh graduates in India ({normalized_loc.get('city', 'India')}).",
            "application_url": app_url,
            "source": {
                "name": self.name,
                "url": app_url,
                "external_id": str(raw_item.get("id"))
            },
            "dates": {
                "posted_at": posted_at,
                "deadline": deadline
            },
            "compensation": {
                "type": "stipend" if job_type == "internship" else "salary",
                "min": min_salary,
                "max": max_salary,
                "currency": "INR"
            },
            "status": "active"
        }
