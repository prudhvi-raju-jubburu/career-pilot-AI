import re
from datetime import datetime, timezone
from typing import Dict, Any, Optional

class CalendarExportService:
    """
    RFC 5545 compliant iCalendar (.ics) generator for scheduled interviews and assessments.
    Supports proper line-folding, character escaping, UTC conversions, and meeting URLs.
    """

    @classmethod
    def escape_text(cls, text: Optional[str]) -> str:
        """Escapes text for iCalendar format (RFC 5545 §3.3.11)."""
        if not text:
            return ""
        s = str(text)
        # Backslash first
        s = s.replace("\\", "\\\\")
        # Semicolons and commas
        s = s.replace(";", "\\;").replace(",", "\\,")
        # Newlines
        s = s.replace("\r\n", "\\n").replace("\n", "\\n").replace("\r", "\\n")
        return s

    @classmethod
    def format_iso_to_utc_ics(cls, iso_str: Optional[str]) -> str:
        """
        Converts an ISO 8601 string to standard iCalendar UTC representation (YYYYMMDDTHHMMSSZ).
        """
        if not iso_str:
            now = datetime.now(timezone.utc)
            return now.strftime("%Y%m%dT%H%M%SZ")
        try:
            # Normalize trailing Z
            clean = str(iso_str).strip()
            if clean.endswith("Z"):
                clean = clean[:-1] + "+00:00"
            dt = datetime.fromisoformat(clean)
            dt_utc = dt.astimezone(timezone.utc)
            return dt_utc.strftime("%Y%m%dT%H%M%SZ")
        except Exception:
            # Fallback formatting: extract digits
            digits = re.sub(r"[^\d]", "", str(iso_str))
            if len(digits) >= 14:
                return f"{digits[:8]}T{digits[8:14]}Z"
            now = datetime.now(timezone.utc)
            return now.strftime("%Y%m%dT%H%M%SZ")

    @classmethod
    def fold_lines(cls, content: str) -> str:
        """
        Folds iCalendar lines to maximum 75 octets per RFC 5545 §3.1.
        Continuation lines begin with a space.
        """
        folded_lines = []
        for line in content.splitlines():
            if len(line.encode("utf-8")) <= 75:
                folded_lines.append(line)
            else:
                # Byte-level chunking
                encoded = line.encode("utf-8")
                chunks = []
                # First line up to 75 bytes
                chunks.append(encoded[:75].decode("utf-8", errors="ignore"))
                remaining = encoded[75:]
                # Subsequent lines up to 74 bytes (+ 1 leading space = 75 bytes)
                while remaining:
                    take = 74
                    chunk_str = remaining[:take].decode("utf-8", errors="ignore")
                    chunks.append(" " + chunk_str)
                    remaining = remaining[len(chunk_str.encode("utf-8")):]
                folded_lines.extend(chunks)
        return "\r\n".join(folded_lines) + "\r\n"

    @classmethod
    def generate_ics(cls, event: Dict[str, Any], app: Optional[Dict[str, Any]] = None) -> str:
        """
        Generates full RFC 5545 VCALENDAR payload for a single interview or assessment event.
        """
        event_id = event.get("id") or str(event.get("_id") or "event")
        company = (app.get("company") if app else "") or "Company"
        role = (app.get("role") if app else "") or "Software Opportunity"
        title = event.get("title") or f"{company} Interview"

        start_utc = cls.format_iso_to_utc_ics(event.get("start_time"))
        end_utc = cls.format_iso_to_utc_ics(event.get("end_time"))
        now_utc = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

        status_str = "CANCELLED" if event.get("status") == "cancelled" else "CONFIRMED"
        location_str = cls.escape_text(event.get("location") or event.get("meeting_link") or "Online")
        notes = event.get("preparation_notes") or ""
        meeting_link = event.get("meeting_link") or ""

        desc_parts = [
            f"Event: {title}",
            f"Role: {role} at {company}",
            f"Type: {event.get('event_type_label', 'Interview')}",
        ]
        if meeting_link:
            desc_parts.append(f"Meeting Link: {meeting_link}")
        if notes:
            desc_parts.append(f"Preparation Notes: {notes}")
        desc_parts.append("Managed via CareerPilot AI")

        description = cls.escape_text("\n".join(desc_parts))
        summary = cls.escape_text(title)

        raw_lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//CareerPilot AI//Interview Scheduler//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "BEGIN:VEVENT",
            f"UID:{event_id}@careerpilot.ai",
            f"DTSTAMP:{now_utc}",
            f"DTSTART:{start_utc}",
            f"DTEND:{end_utc}",
            f"SUMMARY:{summary}",
            f"DESCRIPTION:{description}",
            f"LOCATION:{location_str}",
            f"STATUS:{status_str}"
        ]

        if meeting_link:
            raw_lines.append(f"URL:{meeting_link}")

        raw_lines.append("END:VEVENT")
        raw_lines.append("END:VCALENDAR")

        raw_content = "\r\n".join(raw_lines)
        return cls.fold_lines(raw_content)

    @classmethod
    def get_safe_filename(cls, event: Dict[str, Any], app: Optional[Dict[str, Any]] = None) -> str:
        company = (app.get("company") if app else "") or "interview"
        clean_company = re.sub(r"[^\w\-]", "_", company.lower()).strip("_")
        date_str = str(event.get("start_time", ""))[:10] or "event"
        return f"interview_{clean_company}_{date_str}.ics"
