import json
import logging
import queue
import threading
from datetime import datetime, timezone
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class EventStreamManager:
    """
    In-memory pub/sub broker for Server-Sent Events (SSE).
    Distributes real-time events (new opportunities, ingestion telemetry, status updates)
    to connected web clients.
    """
    _subscribers: List[queue.Queue] = []
    _lock = threading.Lock()

    @classmethod
    def subscribe(cls) -> queue.Queue:
        """Registers a new SSE client queue."""
        q = queue.Queue(maxsize=100)
        with cls._lock:
            cls._subscribers.append(q)
            logger.info("New SSE client subscribed. Total listeners: %d", len(cls._subscribers))
        return q

    @classmethod
    def unsubscribe(cls, q: queue.Queue):
        """Removes a disconnected client queue."""
        with cls._lock:
            if q in cls._subscribers:
                cls._subscribers.remove(q)
                logger.info("SSE client disconnected. Remaining listeners: %d", len(cls._subscribers))

    @classmethod
    def broadcast(cls, event_type: str, data: Dict[str, Any]):
        """Publishes an event to all connected clients."""
        payload = {
            "type": event_type,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        json_data = json.dumps(payload)
        with cls._lock:
            stale = []
            for q in cls._subscribers:
                try:
                    q.put_nowait(json_data)
                except queue.Full:
                    stale.append(q)
            for s in stale:
                if s in cls._subscribers:
                    cls._subscribers.remove(s)
