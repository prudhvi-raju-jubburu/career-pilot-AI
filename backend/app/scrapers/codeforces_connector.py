import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.scrapers.base import OpportunitySource

logger = logging.getLogger(__name__)

class CodeforcesConnector(OpportunitySource):
    """
    Official public Codeforces API connector for competitive programming contests.
    Documentation: https://codeforces.com/apiHelp
    """

    def __init__(self, limit: int = 15, enabled: bool = True):
        super().__init__(
            name="codeforces_api",
            source_type="coding_contest",
            base_url="https://codeforces.com/api/contest.list?gym=false",
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
            if data.get("status") != "OK":
                logger.warning("Codeforces API returned non-OK status: %s", data.get("comment"))
                return []

            contests = data.get("result", [])
            # Prioritize upcoming ('BEFORE') and recently active/current contests
            upcoming = [c for c in contests if c.get("phase") in ("BEFORE", "CODING")]
            recent = [c for c in contests if c.get("phase") == "FINISHED"][:10]
            selected = (upcoming + recent)[:self.limit]

            logger.info("CodeforcesConnector: fetched %d contests (%d upcoming)", len(selected), len(upcoming))
            return selected
        except Exception as e:
            logger.error("CodeforcesConnector fetch failed: %s", str(e))
            return []

    def normalize(self, raw_item: Dict[str, Any]) -> Dict[str, Any]:
        contest_id = raw_item.get("id")
        title = raw_item.get("name", f"Codeforces Round #{contest_id}")
        start_seconds = raw_item.get("startTimeSeconds")
        duration_seconds = raw_item.get("durationSeconds", 7200)

        deadline_iso = None
        posted_iso = None
        if start_seconds:
            try:
                start_dt = datetime.fromtimestamp(start_seconds, tz=timezone.utc)
                end_dt = datetime.fromtimestamp(start_seconds + duration_seconds, tz=timezone.utc)
                deadline_iso = end_dt.isoformat()
                posted_iso = start_dt.isoformat()
            except Exception:
                pass

        contest_url = f"https://codeforces.com/contest/{contest_id}"
        duration_hrs = round(duration_seconds / 3600, 1)

        description = (
            f"Official Codeforces competitive programming contest. Duration: {duration_hrs} hours. "
            f"Solve algorithmic challenges covering Dynamic Programming, Graphs, Data Structures, and Number Theory. "
            f"Participate to boost your global competitive programming rating."
        )

        return {
            "title": title,
            "organization": {
                "name": "Codeforces",
                "website": "https://codeforces.com"
            },
            "description": description,
            "type": "coding_contest",
            "category": "competitive_programming",
            "location": {
                "city": "Online",
                "is_remote": True
            },
            "work_mode": "Remote",
            "skills": [
                "Algorithms",
                "Data Structures",
                "C++",
                "Python",
                "Competitive Programming",
                "Problem Solving"
            ],
            "education_requirements": {
                "degrees": ["All Degrees"],
                "branches": ["Open to all engineering and science students"],
                "graduation_years": [],
                "cgpa_min": None
            },
            "experience": {"min_years": 0, "max_years": None},
            "eligibility_text": "Open to all students and developers globally. Free registration on Codeforces.",
            "application_url": contest_url,
            "source": {
                "name": self.name,
                "url": contest_url,
                "external_id": str(contest_id)
            },
            "dates": {
                "posted_at": posted_iso,
                "deadline": deadline_iso
            },
            "compensation": {
                "type": "ratings",
                "min": None,
                "max": None,
                "currency": "Points"
            },
            "status": "active"
        }
