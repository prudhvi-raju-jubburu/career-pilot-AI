import time
import json
import logging
import queue
from datetime import datetime, timezone
from flask import Blueprint, Response, stream_with_context, request
from app.services.event_stream import EventStreamManager

logger = logging.getLogger(__name__)
stream_bp = Blueprint("stream", __name__)

@stream_bp.route("/opportunities", methods=["GET"])
def stream_opportunities():
    """
    Server-Sent Events (SSE) endpoint pushing live real-time opportunities,
    ingestion updates, application status transitions, and deadline alerts to frontend clients.
    """
    def event_generator():
        client_queue = EventStreamManager.subscribe()
        # Send initial connected heartbeat
        initial_event = {
            "type": "connected",
            "message": "Connected to CareerPilot live telemetry stream",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        yield f"event: connected\ndata: {json.dumps(initial_event)}\n\n"

        try:
            while True:
                try:
                    # Wait up to 15 seconds for new events; if none, send keep-alive ping
                    raw_event = client_queue.get(timeout=15.0)
                    yield f"event: update\ndata: {raw_event}\n\n"
                except queue.Empty:
                    # Keep-alive heartbeat ping to prevent connection timeout
                    ping_payload = json.dumps({"type": "ping", "timestamp": datetime.now(timezone.utc).isoformat()})
                    yield f": ping\ndata: {ping_payload}\n\n"
        except GeneratorExit:
            logger.info("SSE client closed connection")
        finally:
            EventStreamManager.unsubscribe(client_queue)

    response = Response(
        stream_with_context(event_generator()),
        mimetype="text/event-stream"
    )
    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"
    response.headers["Connection"] = "keep-alive"
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response
