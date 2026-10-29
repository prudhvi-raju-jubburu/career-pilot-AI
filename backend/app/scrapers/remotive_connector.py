import json
import logging
from typing import List, Dict, Any
from app.scrapers.base import OpportunitySource
from app.utils.opportunity_normalizer import normalize_category

logger = logging.getLogger(__name__)

class RemotiveConnector(OpportunitySource):
    """
    Official public Remotive API connector for real remote software engineering
    jobs, developer internships, and technical roles.
    Documentation: https://remotive.com/api/remote-jobs
    """

    def __init__(self, limit: int = 25, enabled: bool = True):
        super().__init__(
            name="remotive_api",
            source_type="jobs",
            base_url="https://remotive.com/api/remote-jobs?category=software-dev",
            rate_limit_delay=0.5,
            enabled=enabled
        )
        self.limit = limit

    def fetch(self) -> List[Dict[str, Any]]:
        if not self.is_enabled:
            return []

        url = f"{self.base_url}&limit=50"
        try:
            raw_bytes = self._fetch_url(url)
            data = json.loads(raw_bytes.decode("utf-8"))
            jobs = data.get("jobs", [])
            
            # Filter for India-eligible roles (Worldwide, Anywhere, India, APAC, or Asia)
            india_eligible_jobs = []
            allowed_locations = ["india", "worldwide", "anywhere", "apac", "asia", "global"]
            for job in jobs:
                loc = (job.get("candidate_required_location") or "").lower()
                # Exclude strictly foreign-restricted jobs
                foreign_only = ["usa only", "us only", "uk only", "germany only", "europe only", "canada only", "emea only", "latam only"]
                if any(f in loc for f in foreign_only):
                    continue
                if not loc or any(a in loc for a in allowed_locations):
                    india_eligible_jobs.append(job)
            
            logger.info("RemotiveConnector: fetched %d jobs (%d India-eligible)", len(jobs), len(india_eligible_jobs))
            return india_eligible_jobs[:self.limit]
        except Exception as e:
            logger.error("RemotiveConnector fetch failed: %s", str(e))
            return []

    def normalize(self, raw_item: Dict[str, Any]) -> Dict[str, Any]:
        title = raw_item.get("title", "Software Developer")
        lower_title = title.lower()
        job_type = "internship" if any(w in lower_title for w in ["intern", "trainee", "fellow"]) else "job"

        tags = raw_item.get("tags") or []
        company_name = raw_item.get("company_name", "Tech Company")
        location_text = raw_item.get("candidate_required_location", "Remote")

        return {
            "title": title,
            "organization": {
                "name": company_name,
                "website": raw_item.get("company_logo") or "https://remotive.com"
            },
            "description": raw_item.get("description", ""),
            "type": job_type,
            "category": normalize_category(
                raw_item.get("category"),
                title=title,
                description=" ".join(tags)
            ),
            "location": {
                "city": "Remote (India)" if "india" in location_text.lower() else "Remote (India Eligible)",
                "country": "India",
                "is_remote": True
            },
            "work_mode": "Remote",
            "skills": tags,
            "education_requirements": {
                "degrees": ["B.Tech", "B.S.", "B.E.", "Equivalent"],
                "branches": ["Computer Science", "Engineering", "Related"],
                "graduation_years": [],
                "cgpa_min": None
            },
            "experience": {"min_years": 0, "max_years": 3},
            "eligibility_text": f"Open to remote developers in India ({location_text}).",
            "application_url": raw_item.get("url", ""),
            "source": {
                "name": self.name,
                "url": raw_item.get("url", ""),
                "external_id": str(raw_item.get("id"))
            },
            "dates": {
                "posted_at": raw_item.get("publication_date"),
                "deadline": None
            },
            "compensation": {
                "type": "salary" if raw_item.get("salary") else None,
                "min": None,
                "max": None,
                "currency": "USD" if "$" in raw_item.get("salary", "") else "INR"
            },
            "status": "active"
        }
