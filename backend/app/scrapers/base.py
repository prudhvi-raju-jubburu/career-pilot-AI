import time
import logging
import urllib.request
import urllib.error
import json
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

USER_AGENT = "CareerPilotAI-IngestionBot/2.0 (+https://careerpilot.ai/bot; educational compliance)"

class OpportunitySource(ABC):
    """
    Pluggable connector interface for real-time external opportunity ingestion.
    Each connector encapsulates:
      - Endpoint configuration, rate limiting, and network retry logic
      - Parsing raw payloads into structured items
      - Normalization into the canonical CareerPilot opportunity schema
    """

    def __init__(
        self,
        name: str = "generic_source",
        source_type: str = "general",
        base_url: str = "",
        rate_limit_delay: float = 0.5,
        enabled: bool = True
    ):
        self._name = name
        self._source_type = source_type
        self._base_url = base_url
        self._rate_limit_delay = rate_limit_delay
        self._enabled = enabled
        self._consecutive_failures = 0
        self._circuit_broken_until = 0.0

    @property
    def name(self) -> str:
        return getattr(self, "_name", "generic_source")

    @property
    def source_type(self) -> str:
        return getattr(self, "_source_type", "general")

    @property
    def base_url(self) -> str:
        return getattr(self, "_base_url", "")

    @property
    def is_enabled(self) -> bool:
        if not getattr(self, "_enabled", True):
            return False
        cb = getattr(self, "_circuit_broken_until", 0.0)
        if time.time() < cb:
            logger.warning("Source '%s' circuit breaker active until %.1f", self.name, cb)
            return False
        return True

    def _fetch_url(self, url: str, headers: Optional[Dict[str, str]] = None, timeout: int = 15, record_failure: bool = True) -> bytes:
        """
        Executes HTTP GET with retries, exponential backoff, rate limit delays, and error handling.
        When record_failure=False, transient or 404 errors on child sub-endpoints do not count against
        the connector-level circuit breaker.
        """
        req_headers = {
            "User-Agent": USER_AGENT,
            "Accept": "application/json, application/xml, text/xml, */*"
        }
        if headers:
            req_headers.update(headers)

        req = urllib.request.Request(url, headers=req_headers)
        max_attempts = 3
        backoff = 2.0

        for attempt in range(1, max_attempts + 1):
            try:
                # Rate limit throttle
                time.sleep(self._rate_limit_delay)
                with urllib.request.urlopen(req, timeout=timeout) as response:
                    if response.status == 200:
                        self._consecutive_failures = 0
                        return response.read()
                    else:
                        raise urllib.error.HTTPError(url, response.status, f"HTTP {response.status}", response.headers, None)
            except urllib.error.HTTPError as he:
                logger.warning("[%s] HTTP error %d on attempt %d: %s", self.name, he.code, attempt, str(he))
                if he.code in (404, 403, 401):
                    # Client errors are unlikely to resolve with retries
                    if record_failure:
                        self._record_failure()
                    raise
                if attempt < max_attempts:
                    time.sleep(backoff)
                    backoff *= 2
                else:
                    if record_failure:
                        self._record_failure()
                    raise
            except Exception as e:
                logger.warning("[%s] Network error on attempt %d: %s", self.name, attempt, str(e))
                if attempt < max_attempts:
                    time.sleep(backoff)
                    backoff *= 2
                else:
                    if record_failure:
                        self._record_failure()
                    raise

        raise RuntimeError(f"Failed to fetch {url} after {max_attempts} attempts")

    def _record_failure(self):
        self._consecutive_failures += 1
        if self._consecutive_failures >= 5:
            # Trip circuit breaker for 10 minutes
            self._circuit_broken_until = time.time() + 600
            logger.error("Tripped circuit breaker for source '%s' after %d failures", self.name, self._consecutive_failures)

    @abstractmethod
    def fetch(self) -> List[Dict[str, Any]]:
        """Retrieves and parses raw opportunity items from the external source."""
        raise NotImplementedError

    @abstractmethod
    def normalize(self, raw_item: Dict[str, Any]) -> Dict[str, Any]:
        """Transforms external item structure into the canonical Opportunity schema."""
        raise NotImplementedError
