import json
import logging
import re
from typing import List, Dict, Any
from app.scrapers.base import OpportunitySource
from app.models.company import CompanyModel
from app.utils.opportunity_normalizer import (
    INDIAN_TECH_HUBS,
    is_india_eligible,
    extract_skills_from_text,
    normalize_work_mode
)

logger = logging.getLogger(__name__)

class ATSJobBoardConnector(OpportunitySource):
    """
    Tier 1 Compliance-First Connector for public ATS job boards used by Indian
    tech companies, product unicorns, and global capability centers (GCCs).
    Supports Greenhouse, Lever, Ashby, and SmartRecruiters public board APIs.
    """

    def __init__(self, limit_per_company: int = 5):
        super().__init__(
            name="ats_job_boards",
            source_type="ats_public_api",
            base_url="https://boards-api.greenhouse.io",
            rate_limit_delay=0.4,
            enabled=True
        )
        self.limit_per_company = limit_per_company

    def fetch(self) -> List[Dict[str, Any]]:
        """
        Iterates through registered companies, fetches their public job boards,
        and returns Indian tech opportunities.
        """
        CompanyModel.seed_initial_registry()
        companies = CompanyModel.get_all_companies(active_only=True)
        all_opportunities = []

        # Target roles for university students & early-career devs
        student_keywords = [
            "intern", "internship", "graduate", "fresher", "junior", "associate",
            "software", "engineer", "developer", "backend", "frontend", "full stack",
            "data", "analyst", "ai", "machine learning", "qa", "sde"
        ]

        for comp in companies:
            slug = comp.get("slug")
            ats_type = comp.get("ats_type", "greenhouse").lower()
            comp_name = comp.get("name", slug.title())
            comp_website = comp.get("website", "")

            try:
                if ats_type == "greenhouse":
                    raw_items = self._fetch_greenhouse(slug)
                elif ats_type == "lever":
                    raw_items = self._fetch_lever(slug)
                elif ats_type == "smartrecruiters":
                    raw_items = self._fetch_smartrecruiters(slug)
                else:
                    continue

                ingested_for_company = 0
                for item in raw_items:
                    if ingested_for_company >= self.limit_per_company:
                        break

                    title = item.get("title", "")
                    title_lower = title.lower()

                    # Filter for student / engineering relevance
                    if not any(k in title_lower for k in student_keywords):
                        continue

                    location_info = item.get("location", {})
                    # Verify India eligibility
                    if not is_india_eligible(
                        location=location_info,
                        title=title,
                        description=item.get("description", ""),
                        source_name="ats_job_boards"
                    ):
                        continue

                    # Construct standard opportunity payload
                    opp_type = "internship" if "intern" in title_lower else "job"
                    opp = {
                        "title": title,
                        "organization": {
                            "name": comp_name,
                            "website": comp_website
                        },
                        "description": item.get("description", f"{title} role at {comp_name}."),
                        "type": opp_type,
                        "category": "software",
                        "location": location_info,
                        "work_mode": item.get("work_mode", "Onsite"),
                        "application_url": item.get("apply_url"),
                        "source": {
                            "name": f"ats_{ats_type}",
                            "url": item.get("apply_url"),
                            "external_id": f"{slug}_{item.get('id')}"
                        },
                        "compensation": item.get("compensation", {}),
                        "education_requirements": {
                            "degrees": ["B.Tech", "B.E.", "M.Tech", "MCA", "B.Sc (CS)"],
                            "branches": ["Computer Science & Engineering", "Information Technology", "Electronics & Communication"],
                            "graduation_years": [2024, 2025, 2026, 2027],
                            "cgpa_min": 7.0
                        },
                        "experience": {
                            "min_years": 0,
                            "max_years": 2
                        },
                        "skills": item.get("skills", []),
                        "metadata": {
                            "company_tier": comp.get("tier", "product_firm"),
                            "ats_source": ats_type,
                            "verified_ats": True
                        }
                    }
                    all_opportunities.append(opp)
                    ingested_for_company += 1

            except Exception as e:
                logger.debug("[%s] Could not fetch ATS board for '%s': %s", self.name, slug, str(e))
                continue

        logger.info("[%s] Ingested %d India tech opportunities from public ATS boards.", self.name, len(all_opportunities))
        return all_opportunities

    def _fetch_greenhouse(self, slug: str) -> List[Dict[str, Any]]:
        url = f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true"
        try:
            raw_data = self._fetch_url(url, timeout=10, record_failure=False)
            data = json.loads(raw_data.decode("utf-8"))
            jobs = data.get("jobs", [])
            results = []
            for j in jobs:
                loc_raw = j.get("location", {}).get("name", "")
                desc = j.get("content", "")
                # Strip HTML tags from description
                clean_desc = re.sub(r'<[^>]+>', ' ', desc).strip()[:1500]

                is_remote = "remote" in loc_raw.lower()
                work_mode = "Remote" if is_remote else ("Hybrid" if "hybrid" in loc_raw.lower() else "Onsite")

                results.append({
                    "id": str(j.get("id")),
                    "title": j.get("title", ""),
                    "apply_url": j.get("absolute_url"),
                    "location": {
                        "city": loc_raw,
                        "country": "India" if "india" in loc_raw.lower() else None,
                        "is_remote": is_remote
                    },
                    "work_mode": work_mode,
                    "description": clean_desc,
                    "skills": extract_skills_from_text(f"{j.get('title')} {clean_desc}")
                })
            return results
        except Exception:
            return []

    def _fetch_lever(self, slug: str) -> List[Dict[str, Any]]:
        url = f"https://api.lever.co/v0/postings/{slug}?mode=json"
        try:
            raw_data = self._fetch_url(url, timeout=10, record_failure=False)
            data = json.loads(raw_data.decode("utf-8"))
            results = []
            for j in data:
                loc_raw = j.get("categories", {}).get("location", "")
                workplace = j.get("workplaceType", "onsite").lower()
                is_remote = workplace == "remote" or "remote" in loc_raw.lower()
                work_mode = "Remote" if is_remote else ("Hybrid" if workplace == "hybrid" else "Onsite")
                desc = j.get("descriptionPlain", "")[:1500]

                results.append({
                    "id": str(j.get("id")),
                    "title": j.get("text", ""),
                    "apply_url": j.get("hostedUrl"),
                    "location": {
                        "city": loc_raw,
                        "country": "India" if "india" in loc_raw.lower() else None,
                        "is_remote": is_remote
                    },
                    "work_mode": work_mode,
                    "description": desc,
                    "skills": extract_skills_from_text(f"{j.get('text')} {desc}")
                })
            return results
        except Exception:
            return []

    def _fetch_smartrecruiters(self, slug: str) -> List[Dict[str, Any]]:
        url = f"https://api.smartrecruiters.com/v1/companies/{slug}/postings"
        try:
            raw_data = self._fetch_url(url, timeout=10, record_failure=False)
            data = json.loads(raw_data.decode("utf-8"))
            content = data.get("content", [])
            results = []
            for j in content:
                loc = j.get("location", {})
                city = loc.get("city", "")
                country = loc.get("country", "")
                is_remote = loc.get("remote", False)
                work_mode = "Remote" if is_remote else "Onsite"

                results.append({
                    "id": str(j.get("id")),
                    "title": j.get("name", ""),
                    "apply_url": f"https://jobs.smartrecruiters.com/{slug}/{j.get('id')}",
                    "location": {
                        "city": city,
                        "country": country,
                        "is_remote": is_remote
                    },
                    "work_mode": work_mode,
                    "description": f"{j.get('name')} at {slug.title()}.",
                    "skills": extract_skills_from_text(j.get("name", ""))
                })
            return results
        except Exception:
            return []

    def normalize(self, raw_item: Dict[str, Any]) -> Dict[str, Any]:
        return raw_item
