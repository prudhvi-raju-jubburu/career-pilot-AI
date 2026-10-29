import json
import logging
from typing import List, Dict, Any
from app.scrapers.base import OpportunitySource
from app.utils.opportunity_normalizer import normalize_category

logger = logging.getLogger(__name__)

class DevfolioConnector(OpportunitySource):
    """
    Official public Devfolio API connector for university student hackathons and builder sprints.
    Documentation: https://devfolio.co
    """

    def __init__(self, limit: int = 15, enabled: bool = True):
        super().__init__(
            name="devfolio_api",
            source_type="hackathon",
            base_url="https://api.devfolio.co/api/hackathons?filter=all&page=1&per_page=15",
            rate_limit_delay=1.0,
            enabled=enabled
        )
        self.limit = limit

    def fetch(self) -> List[Dict[str, Any]]:
        if not self.is_enabled:
            return []

        try:
            raw_bytes = self._fetch_url(self.base_url)
            data = json.loads(raw_bytes.decode("utf-8"))
            hackathons = data.get("result", [])
            logger.info("DevfolioConnector: fetched %d hackathons", len(hackathons))
            return hackathons[:self.limit]
        except Exception as e:
            logger.error("DevfolioConnector fetch failed: %s", str(e))
            return []

    def normalize(self, raw_item: Dict[str, Any]) -> Dict[str, Any]:
        title = raw_item.get("name") or "Hackathon"
        slug = raw_item.get("slug") or "hackathon"
        tagline = raw_item.get("tagline") or ""
        location = raw_item.get("location") or "Online / Virtual"
        is_online = bool(raw_item.get("is_online", False) or "online" in location.lower())

        app_url = f"https://{slug}.devfolio.co"
        desc = (
            f"Participate in {title}. {tagline}. "
            f"Collaborate with peers, build innovative prototypes, and compete for prize pools, mentorship, and recruiting opportunities."
        )

        starts_at = raw_item.get("starts_at")
        ends_at = raw_item.get("ends_at")

        return {
            "title": title,
            "organization": {
                "name": title,
                "website": app_url
            },
            "description": desc,
            "type": "hackathon",
            "category": "hackathon",
            "location": {
                "city": "Online (India)" if is_online else (location[:50] if location else "India"),
                "country": "India",
                "is_remote": is_online
            },
            "work_mode": "Remote" if is_online else "In-Person",
            "skills": [
                "Full Stack Development",
                "UI/UX Design",
                "Rapid Prototyping",
                "Teamwork",
                "API Integration"
            ],
            "education_requirements": {
                "degrees": ["All University Students"],
                "branches": ["Computer Science", "Engineering", "Design", "Business"],
                "graduation_years": [],
                "cgpa_min": None
            },
            "experience": {"min_years": 0, "max_years": None},
            "eligibility_text": "Open to all enrolled university students and recent graduates.",
            "application_url": app_url,
            "source": {
                "name": self.name,
                "url": app_url,
                "external_id": slug
            },
            "dates": {
                "posted_at": starts_at,
                "deadline": ends_at
            },
            "compensation": {
                "type": "prizes",
                "min": None,
                "max": None,
                "currency": "INR"
            },
            "status": "active"
        }
