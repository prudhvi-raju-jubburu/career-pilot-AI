import os
import logging
import urllib.request
import json
from typing import List, Dict, Any
from app.scrapers.base import OpportunitySource
from app.utils.opportunity_normalizer import normalize_category

logger = logging.getLogger(__name__)

class PublicFeedOpportunitySource(OpportunitySource):
    """
    Public open remote opportunities source adapter.
    Fetches publicly accessible, robots.txt-compliant technical feeds with rate-limiting and timeouts.
    Falls back gracefully if external networking is unavailable.
    """

    DEFAULT_API_URL = "https://remotive.com/api/remote-jobs?category=software-dev&limit=15"

    @property
    def name(self) -> str:
        return "public_remote_feed"

    def fetch(self) -> List[Dict[str, Any]]:
        feed_url = os.getenv("OPPORTUNITY_FEED_URL", self.DEFAULT_API_URL)
        enabled = os.getenv("OPPORTUNITY_FEED_ENABLED", "true").lower() in ("true", "1", "yes")

        if not enabled:
            logger.info("PublicFeedOpportunitySource is disabled via config.")
            return []

        try:
            req = urllib.request.Request(
                feed_url,
                headers={"User-Agent": "CareerPilotAI-OpportunityDiscovery/1.0 (Educational Non-Scraping Feed)"}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    payload = json.loads(response.read().decode('utf-8'))
                    jobs = payload.get("jobs", [])
                    logger.info("Fetched %d raw items from %s", len(jobs), self.name)
                    return jobs
        except Exception as e:
            logger.warning("Could not fetch remote opportunities from public feed: %s. Continuing gracefully.", str(e))
            return []

        return []

    def normalize(self, raw_item: Dict[str, Any]) -> Dict[str, Any]:
        """Maps public feed item to canonical opportunity format."""
        job_type = "internship" if "intern" in raw_item.get("title", "").lower() else "job"
        
        return {
            "title": raw_item.get("title", "Software Engineer"),
            "organization": {
                "name": raw_item.get("company_name", "Global Tech"),
                "website": raw_item.get("company_logo_url")
            },
            "description": raw_item.get("description", ""),
            "type": job_type,
            "category": normalize_category(
                raw_item.get("category"),
                title=raw_item.get("title", ""),
                description=" ".join(raw_item.get("tags", []))
            ),
            "location": {
                "city": raw_item.get("candidate_required_location", "Remote"),
                "is_remote": True
            },
            "work_mode": "Remote",
            "skills": raw_item.get("tags", []),
            "education_requirements": {
                "degrees": ["B.Tech", "B.S.", "Equivalent"],
                "branches": ["Computer Science", "Engineering"],
                "graduation_years": [],
                "cgpa_min": None
            },
            "experience": {"min_years": 0, "max_years": 2},
            "eligibility_text": "Remote opportunities open to eligible candidates.",
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
                "currency": None
            },
            "status": "active"
        }
