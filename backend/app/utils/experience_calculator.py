"""
CareerPilot AI — Reliable Work Experience Calculator
Provides robust date parsing, interval merging (union of time intervals to eliminate double-counting),
current role handling without end dates, and distinction between confirmed zero experience and missing data.
"""

import re
import calendar
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)

MONTH_NAMES = {
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "september": 9, "sept": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12
}

def parse_date_boundary(raw_date: Any, is_end_date: bool = False, now_utc: Optional[datetime] = None) -> Optional[datetime]:
    """
    Parses diverse date strings into a timezone-aware UTC datetime.
    For month-level or year-level dates:
      - Start dates resolve to the beginning of the period.
      - End dates resolve to the end of the period.
    Returns None if date is malformed or invalid.
    """
    if now_utc is None:
        now_utc = datetime.now(timezone.utc)

    if not raw_date:
        return None

    if isinstance(raw_date, datetime):
        if raw_date.tzinfo is None:
            return raw_date.replace(tzinfo=timezone.utc)
        return raw_date.astimezone(timezone.utc)

    s = str(raw_date).strip()
    if not s:
        return None

    s_lower = s.lower()
    if s_lower in ("present", "current", "now", "ongoing", "today"):
        return now_utc

    # 1. Try ISO timestamp with explicit time component (containing 'T')
    if "T" in s or " " in s:
        try:
            clean_iso = s.replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean_iso)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except Exception:
            pass

    # 2. Match YYYY-MM-DD (date-only)
    m_ymd = re.match(r"^(\d{4})-(\d{1,2})-(\d{1,2})$", s)
    if m_ymd:
        y, m, d = int(m_ymd.group(1)), int(m_ymd.group(2)), int(m_ymd.group(3))
        try:
            hour, minute, second = (23, 59, 59) if is_end_date else (0, 0, 0)
            return datetime(y, m, d, hour, minute, second, tzinfo=timezone.utc)
        except ValueError:
            return None

    # 3. Match YYYY-MM
    m_ym = re.match(r"^(\d{4})-(\d{1,2})$", s)
    if m_ym:
        y, m = int(m_ym.group(1)), int(m_ym.group(2))
        try:
            if is_end_date:
                last_day = calendar.monthrange(y, m)[1]
                return datetime(y, m, last_day, 23, 59, 59, tzinfo=timezone.utc)
            return datetime(y, m, 1, 0, 0, 0, tzinfo=timezone.utc)
        except ValueError:
            return None

    # 4. Match "Month YYYY" or "MMM YYYY" (e.g. "June 2024", "Jun 2024", "06/2024")
    m_my = re.match(r"^([a-zA-Z]+)[,\s]+(\d{4})$", s)
    if m_my:
        m_str, y_str = m_my.group(1).lower(), m_my.group(2)
        if m_str in MONTH_NAMES:
            m = MONTH_NAMES[m_str]
            y = int(y_str)
            if is_end_date:
                last_day = calendar.monthrange(y, m)[1]
                return datetime(y, m, last_day, 23, 59, 59, tzinfo=timezone.utc)
            return datetime(y, m, 1, 0, 0, 0, tzinfo=timezone.utc)

    # 5. Match MM/YYYY
    m_slash = re.match(r"^(\d{1,2})/(\d{4})$", s)
    if m_slash:
        m, y = int(m_slash.group(1)), int(m_slash.group(2))
        try:
            if is_end_date:
                last_day = calendar.monthrange(y, m)[1]
                return datetime(y, m, last_day, 23, 59, 59, tzinfo=timezone.utc)
            return datetime(y, m, 1, 0, 0, 0, tzinfo=timezone.utc)
        except ValueError:
            return None

    # 6. Match plain YYYY (year only)
    m_y = re.match(r"^(\d{4})$", s)
    if m_y:
        y = int(m_y.group(1))
        if 1970 <= y <= 2100:
            if is_end_date:
                return datetime(y, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
            return datetime(y, 1, 1, 0, 0, 0, tzinfo=timezone.utc)

    return None

def merge_date_intervals(intervals: List[Tuple[datetime, datetime]]) -> List[Tuple[datetime, datetime]]:
    """
    Merges overlapping or touching date intervals to prevent double-counting experience.
    Standard interval union algorithm: O(N log N).
    """
    if not intervals:
        return []

    # Sort intervals by start time
    sorted_intervals = sorted(intervals, key=lambda x: x[0])
    merged: List[Tuple[datetime, datetime]] = []

    current_start, current_end = sorted_intervals[0]

    for next_start, next_end in sorted_intervals[1:]:
        if next_start <= current_end:
            # Overlapping or contiguous interval: extend current_end
            current_end = max(current_end, next_end)
        else:
            merged.append((current_start, current_end))
            current_start, current_end = next_start, next_end

    merged.append((current_start, current_end))
    return merged

def calculate_student_experience(profile: Dict[str, Any], now_utc: Optional[datetime] = None) -> Dict[str, Any]:
    """
    Calculates total elapsed professional work experience in years.
    Returns:
      {
        "has_experience_data": bool, # False if omitted / missing altogether
        "is_fresher": bool,          # True if confirmed 0.0 years
        "total_years": Optional[float], # Float value or None if missing / unverified
        "intervals_count": int,
        "calculation_method": str,   # 'explicit_total' | 'dated_intervals' | 'empty_confirmed' | 'missing'
        "details": List[Dict[str, Any]]
      }
    """
    if now_utc is None:
        now_utc = datetime.now(timezone.utc)

    # 1. Check if total_experience_years is explicitly provided and valid
    explicit_total = profile.get("total_experience_years")
    if explicit_total is None:
        explicit_total = profile.get("experience_years")

    if explicit_total is not None and explicit_total != "":
        try:
            flt_val = float(explicit_total)
            if flt_val >= 0.0:
                return {
                    "has_experience_data": True,
                    "is_fresher": (flt_val == 0.0),
                    "total_years": round(flt_val, 2),
                    "intervals_count": 0,
                    "calculation_method": "explicit_total",
                    "details": []
                }
        except (ValueError, TypeError):
            pass

    # 2. Check profile experience list
    raw_exp = profile.get("experience")

    # If experience field is missing or None
    if raw_exp is None:
        return {
            "has_experience_data": False,
            "is_fresher": False,
            "total_years": None,
            "intervals_count": 0,
            "calculation_method": "missing",
            "details": []
        }

    if not isinstance(raw_exp, list):
        return {
            "has_experience_data": False,
            "is_fresher": False,
            "total_years": None,
            "intervals_count": 0,
            "calculation_method": "missing",
            "details": []
        }

    # If explicitly empty list: confirmed fresher with 0.0 years experience
    if len(raw_exp) == 0:
        return {
            "has_experience_data": True,
            "is_fresher": True,
            "total_years": 0.0,
            "intervals_count": 0,
            "calculation_method": "empty_confirmed",
            "details": []
        }

    # 3. Extract and parse dated intervals from each role
    valid_intervals: List[Tuple[datetime, datetime]] = []
    item_details: List[Dict[str, Any]] = []

    for item in raw_exp:
        if not isinstance(item, dict):
            continue

        role_title = item.get("role") or item.get("title") or item.get("position") or "Role"
        company = item.get("company") or item.get("organization") or ""
        is_current = bool(item.get("is_current", False) or item.get("current", False))

        start_raw = item.get("start_date") or item.get("startDate") or item.get("from")
        end_raw = item.get("end_date") or item.get("endDate") or item.get("to")

        start_dt = parse_date_boundary(start_raw, is_end_date=False, now_utc=now_utc)

        if is_current or not end_raw:
            end_dt = now_utc
        else:
            end_dt = parse_date_boundary(end_raw, is_end_date=True, now_utc=now_utc)

        # Validate interval
        if start_dt and end_dt:
            if end_dt < start_dt:
                logger.warning("Invalid date range in experience item (%s at %s): end %s < start %s", role_title, company, end_dt, start_dt)
                continue
            valid_intervals.append((start_dt, end_dt))
            item_details.append({
                "role": role_title,
                "company": company,
                "start": start_dt.isoformat()[:10],
                "end": end_dt.isoformat()[:10],
                "is_current": is_current
            })

    # If we have valid dated intervals, union them to prevent double-counting overlapping roles
    if valid_intervals:
        merged = merge_date_intervals(valid_intervals)
        total_seconds = sum((end - start).total_seconds() for start, end in merged)
        total_days = total_seconds / 86400.0
        # Standard Gregorian year duration = 365.2425 days
        total_years = max(0.0, total_days / 365.2425)

        return {
            "has_experience_data": True,
            "is_fresher": (total_years < 0.08),  # Under ~1 month counts as fresher baseline
            "total_years": round(total_years, 2),
            "intervals_count": len(merged),
            "calculation_method": "dated_intervals",
            "details": item_details
        }

    # If roles were listed, but without parseable dates:
    # Do NOT invent 0.5 years per role. Signal unverified experience history.
    return {
        "has_experience_data": False,
        "is_fresher": False,
        "total_years": None,
        "intervals_count": 0,
        "calculation_method": "undated_roles",
        "details": []
    }
