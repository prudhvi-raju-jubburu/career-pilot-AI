import re
import socket
import logging
import ipaddress
import urllib.parse
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Tuple, Optional
import requests
import urllib3.util.connection as urllib_conn
from bson import ObjectId

from app.config.db import Database

logger = logging.getLogger(__name__)

# Cloud metadata addresses to strictly block
CLOUD_METADATA_IPS = {
    "169.254.169.254", # AWS, GCP, Azure, OpenStack
    "169.254.170.2",   # AWS Task Metadata
    "metadata.google.internal",
}

# Strict semantic phrases indicating closed positions (checked in title or headings only)
STRICT_EXPIRED_PHRASES = [
    "job no longer available",
    "job is no longer available",
    "this job has expired",
    "job listing has expired",
    "position has been filled",
    "this position has been filled",
    "application deadline has passed",
    "applications are no longer being accepted",
    "no longer accepting applications",
    "this posting has been removed",
    "requisition has been closed",
    "this vacancy is closed"
]

MAX_REDIRECT_HOPS = 3
MAX_RESPONSE_BYTES = 51200  # 50 KB ceiling to prevent memory denial-of-service / decompression bombs
DEFAULT_TIMEOUT = 5        # 5 second timeout

from requests.adapters import HTTPAdapter
from urllib3.connection import HTTPConnection, HTTPSConnection
from urllib3.connectionpool import HTTPConnectionPool, HTTPSConnectionPool
from urllib3.poolmanager import PoolManager
from urllib3.exceptions import NewConnectionError, NameResolutionError

# ==============================================================================
# ISOLATED BULLETPROOF DNS REBINDING & SSRF HTTP TRANSPORT
# ==============================================================================

def is_ip_blocked(ip_obj: ipaddress._BaseAddress) -> Tuple[bool, Optional[str]]:
    """Evaluates whether an IP address is private, loopback, multicast, or metadata."""
    if isinstance(ip_obj, ipaddress.IPv6Address) and ip_obj.ipv4_mapped:
        ip_obj = ip_obj.ipv4_mapped

    if ip_obj.is_loopback:
        return True, f"Loopback IP {ip_obj} is prohibited"
    if ip_obj.is_private:
        return True, f"Private subnet IP {ip_obj} (RFC 1918) is prohibited"
    if ip_obj.is_link_local:
        return True, f"Link-local IP {ip_obj} (RFC 3927) is prohibited"
    if ip_obj.is_multicast:
        return True, f"Multicast IP {ip_obj} is prohibited"
    if ip_obj.is_reserved:
        return True, f"Reserved IP {ip_obj} is prohibited"
    if str(ip_obj) in CLOUD_METADATA_IPS:
        return True, f"Cloud metadata IP {ip_obj} is prohibited"

    return False, None

def _resolve_and_validate_destination(host: str, port: int) -> str:
    """
    Pins the socket connection to a verified destination IP.
    Prevents DNS rebinding by resolving destination address once, validating,
    and connecting directly to that validated IP while preserving TLS Host verification.
    """
    clean_host = host.strip("[]")

    try:
        addr_info = socket.getaddrinfo(clean_host, port, 0, socket.SOCK_STREAM)
    except socket.gaierror as e:
        raise ConnectionError(f"DNS resolution failed for {host}: {str(e)}")

    if not addr_info:
        raise ConnectionError(f"No address records found for {host}")

    for addr in addr_info:
        ip_str = addr[4][0]
        try:
            ip_obj = ipaddress.ip_address(ip_str)
            blocked, reason = is_ip_blocked(ip_obj)
            if blocked:
                raise PermissionError(f"SSRF blocked: {reason}")
        except ValueError:
            raise PermissionError(f"Malformed IP returned by DNS: {ip_str}")

    return addr_info[0][4][0]

class SSRFSafeHTTPConnection(HTTPConnection):
    def _new_conn(self) -> socket.socket:
        try:
            validated_ip = _resolve_and_validate_destination(self._dns_host, self.port)
            return urllib_conn.create_connection(
                (validated_ip, self.port),
                self.timeout,
                source_address=self.source_address,
                socket_options=self.socket_options,
            )
        except (PermissionError, ConnectionError) as e:
            raise NewConnectionError(self, f"SSRF security restriction: {e}") from e

class SSRFSafeHTTPSConnection(HTTPSConnection, SSRFSafeHTTPConnection):
    pass

class SSRFSafeHTTPConnectionPool(HTTPConnectionPool):
    ConnectionCls = SSRFSafeHTTPConnection

class SSRFSafeHTTPSConnectionPool(HTTPSConnectionPool):
    ConnectionCls = SSRFSafeHTTPSConnection

class SSRFSafePoolManager(PoolManager):
    def _new_pool(self, scheme, host, port, request_context=None):
        if scheme == "http":
            return SSRFSafeHTTPConnectionPool(host, port, **(self.connection_pool_kw or {}))
        elif scheme == "https":
            return SSRFSafeHTTPSConnectionPool(host, port, **(self.connection_pool_kw or {}))
        return super()._new_pool(scheme, host, port, request_context)

class SSRFSafeHTTPAdapter(HTTPAdapter):
    """
    Isolated HTTPAdapter that enforces DNS rebinding protection and SSRF IP pinning
    strictly on the request session it is mounted to, leaving global urllib3 untouched.
    """
    def init_poolmanager(self, connections, maxsize, block=False, **pool_kwargs):
        self.poolmanager = SSRFSafePoolManager(
            num_pools=connections, maxsize=maxsize, block=block, **pool_kwargs
        )


class OpportunityLinkVerificationService:
    """
    Production SSRF-protected link verification service.
    Features:
      - Validates protocol (http/https only)
      - Blocks embedded credentials
      - Detects unusual IP representations (decimal, hex, octal, IPv4-mapped IPv6)
      - Strict manual redirect loop (max 3 hops) validating every intermediate destination
      - Prevents DNS rebinding attacks via socket-level IP pinning
      - Limits response payload to 50KB
      - Accurate state classification (distinct states for verified, redirected, expired,
        http_error, blocked, timeout, invalid_url, unverified)
      - Non-destructive caching with 24-hour TTL in MongoDB
    """

    @classmethod
    def is_safe_url(cls, url: str) -> Tuple[bool, Optional[str]]:
        """
        Validates URL syntax, protocol, credentials, and hostname against SSRF attacks.
        """
        if not url or not isinstance(url, str):
            return False, "Empty or non-string URL"

        url = url.strip()
        try:
            parsed = urllib.parse.urlparse(url)
        except Exception as e:
            return False, f"Malformed URL syntax: {str(e)}"

        # 1. Protocol validation: HTTP and HTTPS only
        if parsed.scheme not in ("http", "https"):
            return False, f"Unsupported scheme '{parsed.scheme}'. Only http and https permitted."

        # 2. Reject embedded URL credentials (e.g. http://user:pass@domain)
        if parsed.username or parsed.password:
            return False, "Embedded URL credentials are not permitted"

        # 3. Hostname validation
        hostname = parsed.hostname
        if not hostname:
            return False, "Missing hostname in URL"

        hostname_lower = hostname.lower()

        # Reject known loopback/metadata hostnames
        if hostname_lower in ("localhost", "0.0.0.0") or hostname_lower in CLOUD_METADATA_IPS:
            return False, "Target points to loopback or cloud metadata"

        if hostname_lower.endswith(".local") or hostname_lower.endswith(".internal"):
            return False, "Target belongs to private internal domain"

        # 4. Unusual IP representations (decimal, octal, hex)
        clean_host = hostname_lower.strip("[]")

        # Decimal integer IP representation (e.g. 2130706433)
        if clean_host.isdigit():
            try:
                ip_obj = ipaddress.ip_address(int(clean_host))
                blocked, reason = is_ip_blocked(ip_obj)
                if blocked:
                    return False, reason
            except Exception:
                return False, "Malformed integer IP"

        # Hexadecimal IP representation (e.g. 0x7f000001)
        if clean_host.startswith("0x") or clean_host.startswith("0X"):
            try:
                ip_obj = ipaddress.ip_address(int(clean_host, 16))
                blocked, reason = is_ip_blocked(ip_obj)
                if blocked:
                    return False, reason
            except Exception:
                return False, "Malformed hex IP"

        # Octal IPv4 representation (e.g. 0177.0.0.1)
        host_parts = clean_host.split(".")
        if len(host_parts) == 4 and any(p.startswith("0") and len(p) > 1 for p in host_parts):
            try:
                octal_ip = ".".join(str(int(p, 8)) for p in host_parts)
                ip_obj = ipaddress.ip_address(octal_ip)
                blocked, reason = is_ip_blocked(ip_obj)
                if blocked:
                    return False, reason
            except Exception:
                return False, "Malformed octal IP"

        # 5. Direct IP literal check (IPv4 or IPv6)
        try:
            ip_obj = ipaddress.ip_address(clean_host)
            blocked, reason = is_ip_blocked(ip_obj)
            if blocked:
                return False, reason
        except ValueError:
            # Hostname is a domain name, proceed to DNS check
            pass

        # 6. DNS resolution check
        try:
            addr_info = socket.getaddrinfo(clean_host, None)
            if not addr_info:
                return False, f"DNS resolution returned no records for {clean_host}"
            for addr in addr_info:
                ip_str = addr[4][0]
                ip_obj = ipaddress.ip_address(ip_str)
                blocked, reason = is_ip_blocked(ip_obj)
                if blocked:
                    return False, reason
        except socket.gaierror as e:
            return False, f"DNS resolution failed: {str(e)}"
        except Exception as e:
            return False, f"Host verification error: {str(e)}"

        return True, None

    @classmethod
    def _inspect_page_content_for_expiration(cls, html_snippet: str) -> Optional[str]:
        """
        Inspects <title>, <h1>, and 2 tags for unambiguous opportunity closure phrases.
        Avoids broad false positives from general text body occurrences.
        """
        if not html_snippet:
            return None

        # Extract title and headings
        titles = re.findall(r"<title[^>]*>(.*?)</title>", html_snippet, flags=re.IGNORECASE | re.DOTALL)
        h1s = re.findall(r"<h1[^>]*>(.*?)</h1>", html_snippet, flags=re.IGNORECASE | re.DOTALL)
        h2s = re.findall(r"<h2[^>]*>(.*?)</h2>", html_snippet, flags=re.IGNORECASE | re.DOTALL)

        header_text = " ".join(titles + h1s + h2s).lower()
        # Clean HTML tags inside headers
        clean_text = re.sub(r"<[^>]+>", " ", header_text)

        for phrase in STRICT_EXPIRED_PHRASES:
            if phrase in clean_text:
                return phrase

        return None

    @classmethod
    def verify_url(cls, url: str, timeout: int = DEFAULT_TIMEOUT) -> Dict[str, Any]:
        """
        Performs active external URL verification with manual redirect following,
        DNS rebinding immunity, 50KB payload ceiling, and accurate status categorization.
        """
        now_iso = datetime.now(timezone.utc).isoformat()

        # Initial URL safety validation
        is_safe, error_reason = cls.is_safe_url(url)
        if not is_safe:
            return {
                "status": "invalid_url",
                "is_expired": True,
                "http_status": None,
                "final_url": url,
                "redirect_count": 0,
                "error_reason": f"SSRF Check: {error_reason}",
                "last_verified_at": now_iso
            }

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 CareerPilotBot/1.0"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }

        current_url = url
        redirect_count = 0
        final_resp = None

        # Create session with zero proxy exposure to internal services
        session = requests.Session()
        session.trust_env = False  # Avoid inheriting unvetted system/environment proxies
        adapter = SSRFSafeHTTPAdapter()
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        try:
            # Manual redirect loop: validates each hop explicitly before connection
            for hop in range(MAX_REDIRECT_HOPS + 1):
                try:
                    resp = session.head(
                        current_url,
                        timeout=timeout,
                        allow_redirects=False,
                        headers=headers
                    )
                except requests.exceptions.RequestException:
                    # If HEAD fails or is rejected, attempt GET
                    resp = session.get(
                        current_url,
                        timeout=timeout,
                        allow_redirects=False,
                        headers=headers,
                        stream=True
                    )

                final_resp = resp
                status_code = resp.status_code

                # Handle HTTP Redirects
                if status_code in (301, 302, 303, 307, 308):
                    redirect_location = resp.headers.get("Location")
                    if not redirect_location:
                        break

                    next_url = urllib.parse.urljoin(current_url, redirect_location)
                    redirect_count += 1

                    if hop >= MAX_REDIRECT_HOPS:
                        return {
                            "status": "http_error",
                            "is_expired": False,
                            "http_status": status_code,
                            "final_url": next_url,
                            "redirect_count": redirect_count,
                            "error_reason": f"Exceeded maximum redirect limit ({MAX_REDIRECT_HOPS} hops)",
                            "last_verified_at": now_iso
                        }

                    # Validate redirect target BEFORE connection
                    safe_dest, dest_err = cls.is_safe_url(next_url)
                    if not safe_dest:
                        return {
                            "status": "blocked",
                            "is_expired": False,  # Blocked is NOT expired!
                            "http_status": status_code,
                            "final_url": next_url,
                            "redirect_count": redirect_count,
                            "error_reason": f"Redirect to unsafe destination blocked: {dest_err}",
                            "last_verified_at": now_iso
                        }

                    current_url = next_url
                    continue
                else:
                    # Non-redirect status reached
                    break

            status_code = final_resp.status_code

            # 1. Definitive HTTP Expiration: 404 Not Found, 410 Gone
            if status_code in (404, 410):
                return {
                    "status": "expired",
                    "is_expired": True,
                    "http_status": status_code,
                    "final_url": current_url,
                    "redirect_count": redirect_count,
                    "error_reason": f"HTTP {status_code} Not Found / Gone",
                    "last_verified_at": now_iso
                }

            # 2. Access Restricted / Bot Protection (401 Unauthorized, 403 Forbidden)
            if status_code in (401, 403):
                return {
                    "status": "blocked",
                    "is_expired": False,  # Blocked request must NOT be marked expired
                    "http_status": status_code,
                    "final_url": current_url,
                    "redirect_count": redirect_count,
                    "error_reason": f"Target portal returned HTTP {status_code} (access restricted)",
                    "last_verified_at": now_iso
                }

            # 3. Successful Reachability (2xx)
            if 200 <= status_code < 400:
                # If page was streamed or if 200 OK, check title/h1 for explicit closed notices
                try:
                    with session.get(current_url, timeout=timeout, headers=headers, stream=True) as get_resp:
                        raw_chunk = next(get_resp.iter_content(chunk_size=MAX_RESPONSE_BYTES), b"")
                        html_text = raw_chunk.decode("utf-8", errors="ignore")
                        found_phrase = cls._inspect_page_content_for_expiration(html_text)
                        if found_phrase:
                            return {
                                "status": "expired",
                                "is_expired": True,
                                "http_status": status_code,
                                "final_url": current_url,
                                "redirect_count": redirect_count,
                                "error_reason": f"Page heading indicates closed opportunity: '{found_phrase}'",
                                "last_verified_at": now_iso
                            }
                except Exception:
                    pass

                status_label = "redirected" if redirect_count > 0 else "verified"
                return {
                    "status": status_label,
                    "is_expired": False,
                    "http_status": status_code,
                    "final_url": current_url,
                    "redirect_count": redirect_count,
                    "error_reason": None,
                    "last_verified_at": now_iso
                }

            # 4. Server/Client Error (4xx, 5xx)
            return {
                "status": "http_error",
                "is_expired": False,  # Temporary 500 error does not prove expired
                "http_status": status_code,
                "final_url": current_url,
                "redirect_count": redirect_count,
                "error_reason": f"Target server returned HTTP {status_code}",
                "last_verified_at": now_iso
            }

        except PermissionError as e:
            return {
                "status": "blocked",
                "is_expired": False,
                "http_status": None,
                "final_url": current_url,
                "redirect_count": redirect_count,
                "error_reason": str(e),
                "last_verified_at": now_iso
            }
        except requests.exceptions.Timeout:
            return {
                "status": "timeout",
                "is_expired": False,  # Timed out is NOT expired
                "http_status": None,
                "final_url": current_url,
                "redirect_count": redirect_count,
                "error_reason": f"Connection timed out after {timeout} seconds",
                "last_verified_at": now_iso
            }
        except Exception as e:
            return {
                "status": "http_error",
                "is_expired": False,
                "http_status": None,
                "final_url": current_url,
                "redirect_count": redirect_count,
                "error_reason": str(e),
                "last_verified_at": now_iso
            }
        finally:
            session.close()

    @classmethod
    def verify_opportunity_link(cls, opp_id: str, force: bool = False) -> Dict[str, Any]:
        """
        Retrieves opportunity, checks 24-hour cache, verifies URL, and updates MongoDB.
        """
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database connection not initialized")

        query_id = ObjectId(opp_id) if ObjectId.is_valid(opp_id) else opp_id
        opp = db.opportunities.find_one({"_id": query_id})
        if not opp:
            return {
                "status": "invalid_url",
                "is_expired": True,
                "error_reason": "Opportunity not found"
            }

        target_url = (
            opp.get("application_url")
            or (opp.get("source") or {}).get("url")
            or (opp.get("source_links") or [{}])[0].get("url")
            or opp.get("canonical_url")
        )

        if not target_url:
            verification = {
                "status": "invalid_url",
                "is_expired": True,
                "http_status": None,
                "final_url": None,
                "redirect_count": 0,
                "error_reason": "No application or source URL defined on opportunity",
                "last_verified_at": datetime.now(timezone.utc).isoformat()
            }
            db.opportunities.update_one({"_id": opp["_id"]}, {"$set": {"link_verification": verification}})
            return verification

        # Check existing cached verification (valid for 24 hours unless forced)
        cached = opp.get("link_verification")
        if not force and isinstance(cached, dict) and cached.get("last_verified_at"):
            try:
                cached_time = datetime.fromisoformat(cached["last_verified_at"])
                if datetime.now(timezone.utc) - cached_time < timedelta(hours=24):
                    return cached
            except Exception:
                pass

        # Perform live verification
        verification = cls.verify_url(target_url)

        # Cache result in opportunity document
        db.opportunities.update_one(
            {"_id": opp["_id"]},
            {"$set": {"link_verification": verification}}
        )

        return verification
