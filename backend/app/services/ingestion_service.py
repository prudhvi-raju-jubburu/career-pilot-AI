import time
import logging
from difflib import SequenceMatcher
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from app.scrapers.base import OpportunitySource
from app.scrapers.ats_connector import ATSJobBoardConnector
from app.scrapers.unstop_connector import UnstopConnector
from app.scrapers.remotive_connector import RemotiveConnector
from app.scrapers.devfolio_connector import DevfolioConnector
from app.scrapers.codeforces_connector import CodeforcesConnector
from app.scrapers.scholarship_connector import ScholarshipConnector
from app.models.source_run import SourceRunModel
from app.models.opportunity import OpportunityModel
from app.services.opportunity_service import OpportunityService
from app.services.event_stream import EventStreamManager
from app.utils.opportunity_normalizer import is_india_eligible

logger = logging.getLogger(__name__)

class OpportunityIngestionService:
    """
    Production ingestion pipeline coordinating multiple real external sources
    focused on India tech roles, student internships, hackathons, and global remote opportunities.
    """

    def __init__(self, sources: Optional[List[OpportunitySource]] = None):
        if sources is not None:
            self.sources = sources
        else:
            self.sources = [
                ATSJobBoardConnector(limit_per_company=3),
                UnstopConnector(limit=30),
                DevfolioConnector(limit=15),
                RemotiveConnector(limit=25),
                CodeforcesConnector(limit=15),
                ScholarshipConnector(limit=15),
            ]

    def run_ingestion(self) -> Dict[str, Any]:
        """
        Executes end-to-end ingestion across all registered source providers.
        Tracks distinct telemetry: fetched, validated, accepted, updated, duplicates, rejected, failed.
        Returns execution metrics.
        """
        start_time = time.time()
        start_iso = datetime.now(timezone.utc).isoformat()
        logger.info("Real opportunity ingestion run started at %s with %d sources", start_iso, len(self.sources))

        overall_stats = {
            "started_at": start_iso,
            "total_sources": len(self.sources),
            "total_fetched": 0,
            "total_validated": 0,
            "total_accepted": 0,
            "total_updated": 0,
            "total_duplicates": 0,
            "total_rejected": 0,
            "total_failed": 0,
            "source_results": {},
            "errors": []
        }

        newly_accepted_items = []

        for source in self.sources:
            src_start = time.time()
            source_name = source.name
            src_stats = {
                "source_name": source_name,
                "source_type": source.source_type,
                "started_at": datetime.now(timezone.utc).isoformat(),
                "fetched": 0,
                "validated": 0,
                "accepted": 0,
                "updated": 0,
                "duplicates": 0,
                "rejected": 0,
                "failed": 0,
                "error": None,
                "status": "success",
                "duration_seconds": 0.0,
                "last_successful_at": None
            }

            try:
                logger.info("Fetching from source '%s'...", source_name)
                raw_items = source.fetch()
                src_stats["fetched"] = len(raw_items)
                overall_stats["total_fetched"] += len(raw_items)

                for raw_item in raw_items:
                    try:
                        normalized = source.normalize(raw_item)
                        standardized = OpportunityService.normalize_opportunity(normalized)
                        is_valid, validation_err = OpportunityService.validate_opportunity(standardized)
                        if not is_valid:
                            src_stats["rejected"] += 1
                            overall_stats["total_rejected"] += 1
                            logger.debug("Rejected opportunity from %s: %s", source_name, validation_err)
                            continue

                        # Filter for India tech roles & India-eligible opportunities
                        if not is_india_eligible(
                            standardized.get("location", {}),
                            title=standardized.get("title", ""),
                            description=standardized.get("description", ""),
                            eligibility_text=standardized.get("eligibility_text", ""),
                            source_name=source_name
                        ):
                            src_stats["rejected"] += 1
                            overall_stats["total_rejected"] += 1
                            logger.debug("Filtered out non-India opportunity from %s: %s", source_name, standardized.get("title"))
                            continue

                        src_stats["validated"] += 1
                        overall_stats["total_validated"] += 1

                        # Ingest via layered deduplication and atomic upsert
                        doc, created = OpportunityService.upsert_opportunity(standardized)
                        if created:
                            src_stats["accepted"] += 1
                            overall_stats["total_accepted"] += 1
                            newly_accepted_items.append(OpportunityModel.to_dict(doc))
                        else:
                            src_stats["updated"] += 1
                            overall_stats["total_updated"] += 1
                            src_stats["duplicates"] += 1
                            overall_stats["total_duplicates"] += 1

                    except Exception as item_err:
                        src_stats["failed"] += 1
                        overall_stats["total_failed"] += 1
                        logger.warning("Error processing item from %s: %s", source_name, str(item_err))

                src_stats["last_successful_at"] = datetime.now(timezone.utc).isoformat()
                logger.info(
                    "Source '%s' completed: %d fetched, %d accepted, %d updated, %d duplicates, %d rejected",
                    source_name,
                    src_stats["fetched"],
                    src_stats["accepted"],
                    src_stats["updated"],
                    src_stats["duplicates"],
                    src_stats["rejected"]
                )

            except Exception as src_err:
                src_stats["error"] = str(src_err)
                src_stats["status"] = "failed"
                overall_stats["errors"].append({
                    "source": source_name,
                    "error": str(src_err)
                })
                logger.error("Source '%s' failed: %s", source_name, str(src_err))

            src_stats["duration_seconds"] = round(time.time() - src_start, 2)
            src_stats["completed_at"] = datetime.now(timezone.utc).isoformat()
            overall_stats["source_results"][source_name] = src_stats

            # Record run in MongoDB `source_runs`
            try:
                SourceRunModel.record_run(src_stats)
            except Exception as rec_err:
                logger.warning("Failed to record source run in DB: %s", str(rec_err))

        # Expire past deadlines
        expired_count = OpportunityService.expire_past_opportunities()
        overall_stats["expired_marked"] = expired_count
        overall_stats["duration_seconds"] = round(time.time() - start_time, 2)
        overall_stats["completed_at"] = datetime.now(timezone.utc).isoformat()

        # Broadcast newly ingested opportunities via SSE if any
        if newly_accepted_items:
            EventStreamManager.broadcast("new_opportunities", {
                "count": len(newly_accepted_items),
                "items": newly_accepted_items[:10],
                "message": f"{len(newly_accepted_items)} new opportunities discovered from external sources"
            })

            # Match newly ingested opportunities to eligible students
            try:
                from app.services.notification_service import NotificationService
                for opp_item in newly_accepted_items:
                    NotificationService.match_new_opportunity_to_students(opp_item)
            except Exception as match_err:
                logger.warning("Error matching new opportunities to students: %s", str(match_err))

        logger.info(
            "Opportunity ingestion finished in %.2fs. Total Accepted: %d, Updated: %d, Duplicates: %d, Rejected: %d, Expired: %d",
            overall_stats["duration_seconds"],
            overall_stats["total_accepted"],
            overall_stats["total_updated"],
            overall_stats["total_duplicates"],
            overall_stats["total_rejected"],
            expired_count
        )

        return overall_stats
