import os
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from app.services.ingestion_service import OpportunityIngestionService

logger = logging.getLogger(__name__)

_scheduler = None

def run_opportunity_ingestion_job():
    """Scheduled task to execute opportunity discovery ingestion."""
    logger.info("Executing scheduled opportunity ingestion job...")
    try:
        service = OpportunityIngestionService()
        metrics = service.run_ingestion()
        logger.info(
            "Scheduled opportunity ingestion completed successfully: %d accepted, %d duplicates, %d expired",
            metrics.get("total_accepted", 0),
            metrics.get("total_duplicates", 0),
            metrics.get("expired_marked", 0)
        )
    except Exception as e:
        logger.exception("Scheduled opportunity ingestion job encountered an error: %s", str(e))

def init_scheduler(app=None):
    """
    Initializes and starts the APScheduler background scheduler if not already running.
    Does not block Flask app startup.
    """
    global _scheduler
    # Prevent multiple schedulers during debug reloading
    if os.environ.get("WERKZEUG_RUN_MAIN") == "false":
        return None

    if _scheduler is not None and _scheduler.running:
        return _scheduler

    try:
        _scheduler = BackgroundScheduler(daemon=True)
        
        # Ingestion interval configurable via env (default: every 6 hours)
        interval_hours = int(os.getenv("OPPORTUNITY_INGESTION_HOURS", 6))
        _scheduler.add_job(
            func=run_opportunity_ingestion_job,
            trigger="interval",
            hours=interval_hours,
            id="opportunity_ingestion_job",
            name="Periodic Career Opportunity Ingestion",
            replace_existing=True
        )

        # Run an initial gentle seeding job shortly after startup (e.g. 5 seconds after start)
        seed_on_startup = os.getenv("OPPORTUNITY_SEED_ON_STARTUP", "true").lower() in ("true", "1", "yes")
        if seed_on_startup:
            from datetime import datetime, timedelta, timezone
            run_date = datetime.now(timezone.utc) + timedelta(seconds=2)
            _scheduler.add_job(
                func=run_opportunity_ingestion_job,
                trigger="date",
                run_date=run_date,
                id="opportunity_startup_seed",
                replace_existing=True
            )

        _scheduler.start()
        logger.info("Opportunity discovery APScheduler started with %d-hour interval.", interval_hours)
        return _scheduler
    except Exception as e:
        logger.warning("Could not initialize opportunity scheduler: %s. Continuing without background scheduler.", str(e))
        return None

def shutdown_scheduler():
    """Safely shuts down the scheduler if active."""
    global _scheduler
    if _scheduler and _scheduler.running:
        try:
            _scheduler.shutdown(wait=False)
            logger.info("Opportunity scheduler shut down cleanly.")
        except Exception:
            pass
        _scheduler = None
