import logging
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import List, Dict, Any
from app.scrapers.base import OpportunitySource
from app.utils.opportunity_normalizer import normalize_category

logger = logging.getLogger(__name__)

class ScholarshipConnector(OpportunitySource):
    """
    Official public RSS connector for scholarships, youth fellowships, and global education grants.
    Source: OpportunityDesk (https://opportunitydesk.org/feed/)
    """

    def __init__(self, limit: int = 15, enabled: bool = True):
        super().__init__(
            name="opportunitydesk_rss",
            source_type="scholarship",
            base_url="https://opportunitydesk.org/feed/",
            rate_limit_delay=1.0,
            enabled=enabled
        )
        self.limit = limit

    def fetch(self) -> List[Dict[str, Any]]:
        if not self.is_enabled:
            return []

        try:
            raw_bytes = self._fetch_url(self.base_url)
            root = ET.fromstring(raw_bytes)
            items = []
            for item in root.findall(".//item"):
                title_el = item.find("title")
                link_el = item.find("link")
                pubdate_el = item.find("pubDate")
                desc_el = item.find("description")
                categories = [c.text for c in item.findall("category") if c.text]

                if title_el is not None and link_el is not None:
                    items.append({
                        "title": title_el.text or "",
                        "link": link_el.text or "",
                        "pubDate": pubdate_el.text if pubdate_el is not None else None,
                        "description": desc_el.text if desc_el is not None else "",
                        "categories": categories
                    })

            logger.info("ScholarshipConnector: fetched %d opportunities", len(items))
            return items[:self.limit]
        except Exception as e:
            logger.error("ScholarshipConnector fetch failed: %s", str(e))
            return []

    def normalize(self, raw_item: Dict[str, Any]) -> Dict[str, Any]:
        title = raw_item.get("title", "Scholarship / Fellowship Program").strip()
        link = raw_item.get("link", "").strip()
        pub_str = raw_item.get("pubDate")
        cats = raw_item.get("categories") or []

        posted_iso = None
        if pub_str:
            try:
                dt = parsedate_to_datetime(pub_str)
                posted_iso = dt.astimezone(timezone.utc).isoformat()
            except Exception:
                pass

        opp_type = "fellowship" if "fellowship" in title.lower() else "scholarship"

        return {
            "title": title,
            "organization": {
                "name": "Global Fellowship / Scholarship Foundation",
                "website": link
            },
            "description": f"{title}. Open program for eligible international and national applicants. Check full requirements on the portal.",
            "type": opp_type,
            "category": "scholarship",
            "location": {
                "city": "Global / Remote",
                "is_remote": True
            },
            "work_mode": "Remote",
            "skills": ["Academic Excellence", "Leadership", "Research", "Communication"],
            "education_requirements": {
                "degrees": ["Undergraduate", "Postgraduate", "High School"],
                "branches": ["Open to all academic disciplines"],
                "graduation_years": [],
                "cgpa_min": None
            },
            "experience": {"min_years": 0, "max_years": None},
            "eligibility_text": "Open to eligible students, scholars, and early-career leaders.",
            "application_url": link,
            "source": {
                "name": self.name,
                "url": link,
                "external_id": link
            },
            "dates": {
                "posted_at": posted_iso,
                "deadline": None
            },
            "compensation": {
                "type": "grant",
                "min": None,
                "max": None,
                "currency": "USD"
            },
            "status": "active"
        }
