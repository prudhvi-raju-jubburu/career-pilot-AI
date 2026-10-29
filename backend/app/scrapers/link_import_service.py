import re
import json
import logging
import socket
import ipaddress
import urllib.request
import urllib.error
from urllib.parse import urlparse
from typing import Dict, Any, Tuple
from app.utils.opportunity_normalizer import (
    extract_skills_from_text,
    normalize_opportunity_type,
    normalize_category,
    normalize_work_mode,
    parse_inr_compensation,
    parse_iso_deadline
)

logger = logging.getLogger(__name__)

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (CareerPilotAI Link Importer)"


class SafeRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Prevents HTTP redirects from escaping to internal, loopback, or private networks."""
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        is_safe, err_msg = LinkImportService.is_safe_public_url(newurl)
        if not is_safe:
            raise urllib.error.HTTPError(newurl, 403, f"SSRF Protection: Redirect destination blocked ({err_msg})", headers, fp)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class LinkImportService:
    """
    Tier 2 Compliance-First User-Initiated Link Importer.
    Fetches only single public URLs explicitly requested by the authenticated user.
    Extracts schema.org JobPosting JSON-LD and OpenGraph metadata.
    Provides graceful fallback to pre-filled draft if blocked by third-party paywall/login.
    Guarded against SSRF, internal network scanning, and redirect exploits.
    """

    @classmethod
    def is_safe_public_url(cls, target_url: str) -> Tuple[bool, str]:
        """
        Validates target URL against Server-Side Request Forgery (SSRF).
        Enforces length limits, HTTP/HTTPS scheme, allowed standard ports,
        and ensures resolved host IP addresses are not loopback, private,
        link-local, or reserved network addresses.
        """
        if not target_url or not isinstance(target_url, str):
            return False, "A valid URL string is required."

        clean_url = target_url.strip()
        if len(clean_url) > 2048:
            return False, "URL exceeds maximum permitted length (2048 characters)."

        parsed = urlparse(clean_url)
        if parsed.scheme.lower() not in ("http", "https"):
            return False, "Only HTTP and HTTPS protocols are permitted."

        if not re.match(r"^https?://[^\s/$.?#].[^\s]*$", clean_url, re.IGNORECASE):
            return False, "Invalid HTTP/HTTPS URL format."

        hostname = parsed.hostname
        if not hostname:
            return False, "URL does not contain a valid hostname."

        lower_host = hostname.lower()
        blocked_hosts = {
            "localhost", "localhost.localdomain", "broadcasthost",
            "metadata.google.internal", "instance-data"
        }
        if lower_host in blocked_hosts or lower_host.endswith(".local") or lower_host.endswith(".internal"):
            return False, "Access to private or internal hosts is restricted."

        if parsed.port and parsed.port not in (80, 443, 8080, 8443):
            return False, f"Port {parsed.port} is not permitted for external opportunity links."

        try:
            addr_info = socket.getaddrinfo(hostname, None)
            if not addr_info:
                return False, "Unable to resolve target hostname."

            for item in addr_info:
                ip_str = item[4][0]
                ip_obj = ipaddress.ip_address(ip_str)
                if (
                    ip_obj.is_private
                    or ip_obj.is_loopback
                    or ip_obj.is_link_local
                    or ip_obj.is_reserved
                    or ip_obj.is_multicast
                    or ip_obj.is_unspecified
                ):
                    return False, "Access to private, loopback, or internal IP addresses is restricted."
        except (socket.gaierror, ValueError, OSError) as e:
            return False, f"Hostname resolution failed: {str(e)}"

        return True, "URL is safe"

    @classmethod
    def import_from_url(cls, target_url: str, user_id: str) -> Tuple[bool, Dict[str, Any], str]:
        """
        Parses a user-supplied opportunity link.
        Returns (success: bool, parsed_data: dict, message: str)
        """
        is_safe, safe_msg = cls.is_safe_public_url(target_url)
        if not is_safe:
            return False, {}, safe_msg

        clean_url = target_url.strip()
        domain = urlparse(clean_url).netloc.lower()

        # Identify source platform
        platform_name = "External Listing"
        if "linkedin.com" in domain:
            platform_name = "LinkedIn"
        elif "internshala.com" in domain:
            platform_name = "Internshala"
        elif "unstop.com" in domain:
            platform_name = "Unstop"
        elif "naukri.com" in domain:
            platform_name = "Naukri"
        elif "wellfound.com" in domain or "angel.co" in domain:
            platform_name = "Wellfound"
        elif "glassdoor" in domain:
            platform_name = "Glassdoor"
        else:
            platform_name = domain.replace("www.", "").split(".")[0].title()

        html_text = ""
        fetch_error = None
        try:
            req = urllib.request.Request(
                clean_url,
                headers={
                    "User-Agent": USER_AGENT,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9"
                }
            )
            opener = urllib.request.build_opener(SafeRedirectHandler())
            with opener.open(req, timeout=8) as response:
                content_type = response.headers.get("Content-Type", "")
                if "text/html" in content_type or "xml" in content_type or "text" in content_type:
                    raw_bytes = response.read(250000) # Read max 250KB
                    html_text = raw_bytes.decode("utf-8", errors="ignore")
        except urllib.error.HTTPError as he:
            fetch_error = f"HTTP {he.code}"
            logger.info("Direct fetch for %s returned %s; falling back to URL metadata.", domain, fetch_error)
        except Exception as e:
            fetch_error = str(e)
            logger.info("Direct fetch error for %s: %s; falling back to URL metadata.", domain, fetch_error)

        extracted = cls._extract_metadata(html_text, clean_url, platform_name)

        if not extracted.get("title"):
            # Derive title from URL path
            path_segments = [p for p in urlparse(clean_url).path.split("/") if p and len(p) > 2]
            fallback_title = " ".join([p.replace("-", " ").title() for p in path_segments[-2:]]) if path_segments else f"Role at {platform_name}"
            extracted["title"] = fallback_title

        # Mark source attribution clearly
        extracted["source"] = {
            "name": f"imported_{platform_name.lower()}",
            "display_name": f"Saved from {platform_name}",
            "tier": "tier_2_user_import",
            "url": clean_url,
            "imported_by": str(user_id)
        }
        extracted["application_url"] = clean_url

        msg = f"Successfully parsed listing from {platform_name}."
        if fetch_error:
            msg = f"Imported with basic metadata ({fetch_error}). Please review and confirm fields."

        return True, extracted, msg

    @classmethod
    def _extract_metadata(cls, html: str, url: str, platform_name: str) -> Dict[str, Any]:
        """Extracts schema.org JobPosting JSON-LD, OpenGraph, or HTML headers."""
        data = {
            "title": "",
            "organization": {"name": platform_name, "website": f"https://{urlparse(url).netloc}"},
            "description": "",
            "location": {"city": "India", "country": "India", "is_remote": False},
            "work_mode": "Onsite",
            "type": "job",
            "category": "software",
            "compensation": {},
            "skills": []
        }

        if not html:
            return data

        # 1. Look for schema.org JobPosting in <script type="application/ld+json">
        json_ld_matches = re.findall(r'<script[^>]*type=[\'"]application/ld\+json[\'"][^>]*>(.*?)</script>', html, re.DOTALL | re.IGNORECASE)
        for block in json_ld_matches:
            try:
                parsed = json.loads(block.strip())
                items = parsed if isinstance(parsed, list) else [parsed]
                for item in items:
                    if isinstance(item, dict) and item.get("@type") in ("JobPosting", "http://schema.org/JobPosting"):
                        data["title"] = str(item.get("title", "")).strip()
                        hiring_org = item.get("hiringOrganization") or {}
                        if isinstance(hiring_org, dict) and hiring_org.get("name"):
                            data["organization"]["name"] = str(hiring_org["name"]).strip()
                        elif isinstance(hiring_org, str):
                            data["organization"]["name"] = hiring_org.strip()

                        data["description"] = re.sub(r'<[^>]+>', ' ', str(item.get("description", ""))).strip()[:1500]

                        # Location
                        job_loc = item.get("jobLocation") or {}
                        if isinstance(job_loc, dict):
                            address = job_loc.get("address") or {}
                            if isinstance(address, dict):
                                data["location"]["city"] = address.get("addressLocality") or address.get("addressRegion") or "India"
                                data["location"]["country"] = address.get("addressCountry") or "India"

                        # Base salary
                        salary = item.get("baseSalary") or {}
                        if isinstance(salary, dict):
                            val = salary.get("value") or {}
                            if isinstance(val, dict):
                                data["compensation"]["min_amount"] = val.get("minValue") or val.get("value")
                                data["compensation"]["max_amount"] = val.get("maxValue") or val.get("value")
                                data["compensation"]["currency"] = salary.get("currency", "INR")

                        break
            except Exception:
                continue

        # 2. OpenGraph Meta Tags fallback
        if not data["title"]:
            og_title = re.search(r'<meta[^>]*property=[\'"]og:title[\'"][^>]*content=[\'"](.*?)[\'"]', html, re.IGNORECASE)
            if og_title:
                data["title"] = og_title.group(1).strip()

        if not data["description"]:
            og_desc = re.search(r'<meta[^>]*property=[\'"]og:description[\'"][^>]*content=[\'"](.*?)[\'"]', html, re.IGNORECASE)
            if og_desc:
                data["description"] = og_desc.group(1).strip()

        # 3. HTML Title tag fallback
        if not data["title"]:
            t_match = re.search(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE)
            if t_match:
                raw_title = t_match.group(1).strip()
                # Clean up typical "| LinkedIn", "| Internshala" suffixes
                clean_title = re.split(r'[-|•]', raw_title)[0].strip()
                data["title"] = clean_title

        # Determine internship vs job
        full_text = f"{data['title']} {data['description']}".lower()
        if "intern" in full_text:
            data["type"] = "internship"
        elif "hackathon" in full_text:
            data["type"] = "hackathon"
        elif "scholarship" in full_text:
            data["type"] = "scholarship"

        # Determine work mode
        if "remote" in full_text or "work from home" in full_text:
            data["work_mode"] = "Remote"
            data["location"]["is_remote"] = True

        # Extract skills
        data["skills"] = extract_skills_from_text(full_text)

        # Parse compensation
        data["compensation"] = parse_inr_compensation(full_text, data["compensation"])

        return data
