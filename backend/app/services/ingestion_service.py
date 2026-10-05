import time
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from app.scrapers.base import OpportunitySource
from app.scrapers.sample_source import SampleOpportunitySource
from app.scrapers.public_feed_source import PublicFeedOpportunitySource
from app.services.opportunity_service import OpportunityService

logger = logging.getLogger(__name__)

class OpportunityIngestionService:
    """
    Orchestrates the opportunity ingestion pipeline across configured source adapters.
    Ensures safe error boundaries: failure of one source never crashes the pipeline.
    """

    def __init__(self, sources: Optional[List[OpportunitySource]] = None):
        if sources is not None:
            self.sources = sources
        else:
            self.sources = [
                SampleOpportunitySource(),
                PublicFeedOpportunitySource()
            ]

    def run_ingestion(self) -> Dict[str, Any]:
        """
        Executes end-to-end ingestion across all registered source providers.
        Returns detailed execution metrics for observability.
        """
        start_time = time.time()
        start_iso = datetime.now(timezone.utc).isoformat()
        logger.info("Opportunity ingestion run started at %s with %d sources", start_iso, len(self.sources))

        overall_stats = {
            "started_at": start_iso,
            "total_sources": len(self.sources),
            "total_fetched": 0,
            "total_accepted": 0,
            "total_duplicates": 0,
            "total_rejected": 0,
            "source_results": {},
            "errors": []
        }

        for source in self.sources:
            src_start = time.time()
            source_name = source.name
            src_stats = {
                "fetched": 0,
                "accepted": 0,
                "duplicates": 0,
                "rejected": 0,
                "error": None,
                "duration_seconds": 0.0
            }

            try:
                logger.info("Fetching opportunities from source '%s'...", source_name)
                raw_items = source.fetch()
                src_stats["fetched"] = len(raw_items)
                overall_stats["total_fetched"] += len(raw_items)

                for raw_item in raw_items:
                    try:
                        normalized = source.normalize(raw_item)
                        is_valid, validation_err = OpportunityService.validate_opportunity(
                            OpportunityService.normalize_opportunity(normalized)
                        )
                        if not is_valid:
                            src_stats["rejected"] += 1
                            overall_stats["total_rejected"] += 1
                            logger.debug("Rejected opportunity from %s: %s", source_name, validation_err)
                            continue

                        doc, created = OpportunityService.upsert_opportunity(normalized)
                        if created:
                            src_stats["accepted"] += 1
                            overall_stats["total_accepted"] += 1
                        else:
                            src_stats["duplicates"] += 1
                            overall_stats["total_duplicates"] += 1
                    except Exception as item_err:
                        src_stats["rejected"] += 1
                        overall_stats["total_rejected"] += 1
                        logger.warning("Error processing item from %s: %s", source_name, str(item_err))

                logger.info(
                    "Source '%s' completed: %d fetched, %d accepted, %d duplicates, %d rejected",
                    source_name,
                    src_stats["fetched"],
                    src_stats["accepted"],
                    src_stats["duplicates"],
                    src_stats["rejected"]
                )

            except Exception as src_err:
                src_stats["error"] = str(src_err)
                overall_stats["errors"].append({
                    "source": source_name,
                    "error": str(src_err)
                })
                logger.error("Source '%s' encountered a failure: %s. Continuing with remaining sources.", source_name, str(src_err))

            src_stats["duration_seconds"] = round(time.time() - src_start, 2)
            overall_stats["source_results"][source_name] = src_stats

        # Also expire any past opportunities
        expired_count = OpportunityService.expire_past_opportunities()
        overall_stats["expired_marked"] = expired_count
        overall_stats["duration_seconds"] = round(time.time() - start_time, 2)
        overall_stats["completed_at"] = datetime.now(timezone.utc).isoformat()

        logger.info(
            "Opportunity ingestion finished in %.2fs. Total Accepted: %d, Duplicates: %d, Rejected: %d, Expired: %d",
            overall_stats["duration_seconds"],
            overall_stats["total_accepted"],
            overall_stats["total_duplicates"],
            overall_stats["total_rejected"],
            expired_count
        )

        return overall_stats
