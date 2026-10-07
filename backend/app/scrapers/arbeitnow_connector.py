import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.scrapers.base import OpportunitySource
from app.utils.opportunity_normalizer import normalize_category

logger = logging.getLogger(__name__)

class ArbeitnowConnector(OpportunitySource):
    """
    Official public Arbeitnow API connector for technical and engineering job opportunities.
    Documentation: https://www.arbeitnow.com/api/job-board-api
    """

    def __init__(self, limit: int = 30, enabled: bool = True):
        super().__init__(
            name="arbeitnow_api",
            source_type="jobs",
            base_url="https://www.arbeitnow.com/api/job-board-api",
            rate_limit_delay=0.5,
            enabled=enabled
        )
        self.limit = limit

    def fetch(self) -> List[Dict[str, Any]]:
        if not self.is_enabled:
            return []

        try:
            raw_bytes = self._fetch_url(self.base_url)
            data = json.loads(raw_bytes.decode("utf-8"))
            items = data.get("data", [])
            logger.info("ArbeitnowConnector: fetched %d jobs", len(items))
            return items[:self.limit]
        except Exception as e:
            logger.error("ArbeitnowConnector fetch failed: %s", str(e))
            return []

    def normalize(self, raw_item: Dict[str, Any]) -> Dict[str, Any]:
        title = raw_item.get("title", "Software Engineer")
        lower_title = title.lower()
        job_type = "internship" if any(w in lower_title for w in ["intern", "trainee", "fellow", "working student"]) else "job"

        is_remote = bool(raw_item.get("remote", False))
        location_raw = raw_item.get("location", "Remote" if is_remote else "Global")
        tags = raw_item.get("tags") or []
        company = raw_item.get("company_name", "Global Tech")

        created_epoch = raw_item.get("created_at")
        posted_at = None
        if created_epoch:
            try:
                posted_at = datetime.fromtimestamp(created_epoch, tz=timezone.utc).isoformat()
            except Exception:
                pass

        return {
            "title": title,
            "organization": {
                "name": company,
                "website": "https://www.arbeitnow.com"
            },
            "description": raw_item.get("description", ""),
            "type": job_type,
            "category": normalize_category(
                None,
                title=title,
                description=" ".join(tags)
            ),
            "location": {
                "city": location_raw,
                "is_remote": is_remote
            },
            "work_mode": "Remote" if is_remote else "Onsite",
            "skills": tags,
            "education_requirements": {
                "degrees": ["B.Tech", "B.S.", "Related"],
                "branches": ["Computer Science", "Information Technology", "Engineering"],
                "graduation_years": [],
                "cgpa_min": None
            },
            "experience": {"min_years": 0, "max_years": 3},
            "eligibility_text": f"Open to candidates eligible to work in {location_raw}.",
            "application_url": raw_item.get("url", ""),
            "source": {
                "name": self.name,
                "url": raw_item.get("url", ""),
                "external_id": raw_item.get("slug")
            },
            "dates": {
                "posted_at": posted_at,
                "deadline": None
            },
            "compensation": {
                "type": "salary",
                "min": None,
                "max": None,
                "currency": "EUR"
            },
            "status": "active"
        }
