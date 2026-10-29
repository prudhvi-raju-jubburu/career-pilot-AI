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

def run_deadline_reminders_job():
    """Scheduled task to scan saved opportunities and applications for 48h deadline reminders."""
    logger.info("Executing scheduled deadline reminders scan...")
    try:
        from app.services.notification_service import NotificationService
        count = NotificationService.check_and_notify_upcoming_deadlines()
        logger.info("Scheduled deadline reminders scan completed: %d notifications sent.", count)
    except Exception as e:
        logger.exception("Scheduled deadline reminders job error: %s", str(e))

def run_daily_digest_job():
    """Scheduled task to dispatch daily opportunity digests to students."""
    logger.info("Executing scheduled daily digest dispatch...")
    try:
        from app.services.notification_service import NotificationService
        res = NotificationService.generate_and_dispatch_digests(frequency="daily")
        logger.info("Scheduled daily digest completed: %s", res)
    except Exception as e:
        logger.exception("Scheduled daily digest job error: %s", str(e))

def run_weekly_digest_job():
    """Scheduled task to dispatch weekly opportunity digests to students."""
    logger.info("Executing scheduled weekly digest dispatch...")
    try:
        from app.services.notification_service import NotificationService
        res = NotificationService.generate_and_dispatch_digests(frequency="weekly")
        logger.info("Scheduled weekly digest completed: %s", res)
    except Exception as e:
        logger.exception("Scheduled weekly digest job error: %s", str(e))

def run_interview_reminders_job():
    """Scheduled task to scan upcoming interview events and dispatch 24h & 1h alerts."""
    logger.info("Executing scheduled interview reminders scan...")
    try:
        from app.services.notification_service import NotificationService
        count = NotificationService.check_and_notify_interview_reminders()
        logger.info("Scheduled interview reminders scan completed: %d notifications sent.", count)
    except Exception as e:
        logger.exception("Scheduled interview reminders job error: %s", str(e))

def run_application_followup_job():
    """Scheduled task to scan applications and dispatch follow-up due notifications."""
    logger.info("Executing scheduled application follow-ups scan...")
    try:
        from app.services.notification_service import NotificationService
        count = NotificationService.check_and_notify_application_followups()
        logger.info("Scheduled application follow-up scan completed: %d notifications sent.", count)
    except Exception as e:
        logger.exception("Scheduled application follow-up job error: %s", str(e))

def init_scheduler(app=None):
    """
    Initializes and starts the APScheduler background scheduler if not already running.
    Does not block Flask app startup.
    Supports ENABLE_BACKGROUND_SCHEDULER environment variable to allow multi-worker
    deployments where only one designated worker runs the background scheduler.
    """
    global _scheduler

    # Allow disabling scheduler in multi-worker WSGI/container environments
    enable_scheduler = os.getenv("ENABLE_BACKGROUND_SCHEDULER", "true").lower() in ("true", "1", "yes")
    if not enable_scheduler:
        logger.info("Background scheduler is disabled via ENABLE_BACKGROUND_SCHEDULER=false.")
        return None

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

        # Deadline reminders (every 6 hours)
        _scheduler.add_job(
            func=run_deadline_reminders_job,
            trigger="interval",
            hours=6,
            id="deadline_reminders_job",
            name="Upcoming Deadline Reminders Scan",
            replace_existing=True
        )

        # Daily digests (once every 24 hours)
        _scheduler.add_job(
            func=run_daily_digest_job,
            trigger="interval",
            hours=24,
            id="daily_digest_job",
            name="Daily Career Opportunity Digest",
            replace_existing=True
        )

        # Weekly digests (once every 7 days)
        _scheduler.add_job(
            func=run_weekly_digest_job,
            trigger="interval",
            days=7,
            id="weekly_digest_job",
            name="Weekly Career Opportunity Digest",
            replace_existing=True
        )

        # Interview reminders scan (every 15 minutes)
        _scheduler.add_job(
            func=run_interview_reminders_job,
            trigger="interval",
            minutes=15,
            id="interview_reminders_job",
            name="Upcoming Interview Reminders Scan",
            replace_existing=True
        )

        # Application follow-up scan (every 4 hours)
        _scheduler.add_job(
            func=run_application_followup_job,
            trigger="interval",
            hours=4,
            id="application_followup_job",
            name="Application Follow-up Reminders Scan",
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
        logger.info("CareerPilot background scheduler started with ingestion, deadline scan, and digest jobs.")
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
