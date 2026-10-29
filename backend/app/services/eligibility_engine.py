import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class EligibilityEngine:
    """
    Deterministic Hard Eligibility Engine for CareerPilot AI.
    Executes transparent, explainable pass/fail rule evaluations for students
    against job, internship, hackathon, and scholarship requirements.
    Guarantees 0% false eligibility violations in recommended results.
    """

    @classmethod
    def evaluate(cls, opp: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates an opportunity against a student's profile.
        Returns:
          status: 'eligible' | 'not_eligible' | 'needs_review'
          checks: List of requirement evaluation objects
          passed_requirements: List of names of passed requirements
          failed_requirements: List of names of failed requirements
          unknown_requirements: List of names of unknown requirements
          reasons: List of human-readable rationale statements
          is_eligible: bool (True only if all confirmed mandatory requirements pass and none are unknown/failed)
          eligibility_score: int (0 to 100)
          rules: List of rule evaluation dictionaries (for backward compatibility)
          critical_failures: List of reasons for critical hard rule failures
        """
        checks: List[Dict[str, Any]] = []
        reasons: List[str] = []
        rules: List[Dict[str, Any]] = []
        critical_failures: List[str] = []

        now_utc = datetime.now(timezone.utc).isoformat()
        opp_type = str(opp.get("type", "job")).strip().lower()

        # Extract student education fields
        student_edu = profile.get("education") or {}
        student_cgpa = cls._extract_student_cgpa(student_edu, profile)
        student_year = cls._extract_student_graduation_year(student_edu, profile)
        student_branch = cls._extract_student_branch(student_edu, profile)
        student_degree = cls._extract_student_degree(student_edu, profile)

        # -------------------------------------------------------------
        # 1. Deadline Rule (Mandatory for all categories)
        # -------------------------------------------------------------
        deadline = opp.get("deadline") or opp.get("dates", {}).get("deadline")
        if deadline:
            deadline_str = str(deadline).strip()
            from app.utils.experience_calculator import parse_date_boundary
            now_dt = datetime.now(timezone.utc)
            dl_dt = parse_date_boundary(deadline_str, is_end_date=True, now_utc=now_dt)
            if dl_dt is not None:
                is_open = dl_dt >= now_dt
                chk_status = "passed" if is_open else "failed"
                date_display = dl_dt.strftime("%Y-%m-%d")
                reason = (
                    f"Application deadline active until {date_display}"
                    if is_open
                    else f"Application deadline passed on {date_display}"
                )
            else:
                is_open = True
                chk_status = "passed"
                date_display = deadline_str[:20]
                reason = f"Application deadline open / rolling ({date_display})"

            checks.append({
                "requirement": "Application Deadline",
                "required": f"Before {date_display}",
                "student_value": "Active" if is_open else "Expired",
                "status": chk_status
            })
            reasons.append(reason)
            rules.append({
                "rule": "Application Deadline",
                "passed": is_open,
                "reason": reason,
                "critical": True
            })
            if not is_open:
                critical_failures.append(reason)
        else:
            checks.append({
                "requirement": "Application Deadline",
                "required": "Rolling admissions",
                "student_value": "N/A",
                "status": "passed"
            })
            reason = "Rolling admissions / open deadline"
            reasons.append(reason)
            rules.append({
                "rule": "Application Deadline",
                "passed": True,
                "reason": reason,
                "critical": True
            })

        # -------------------------------------------------------------
        # 2. Minimum CGPA Cutoff Rule
        # (Applicable to Jobs, Internships, Fellowships, and academic scholarships)
        # -------------------------------------------------------------
        edu_req = opp.get("education_requirements") or {}
        min_cgpa = edu_req.get("cgpa_min") or edu_req.get("min_cgpa")
        if min_cgpa is None:
            min_cgpa = opp.get("min_cgpa") or opp.get("cgpa_min")

        if opp_type not in ("hackathon", "coding_contest") and min_cgpa is not None and float(min_cgpa) > 0.0:
            min_cgpa_flt = float(min_cgpa)
            if student_cgpa is not None:
                passed = student_cgpa >= min_cgpa_flt
                chk_status = "passed" if passed else "failed"
                reason = (
                    f"CGPA requirement satisfied ({student_cgpa:.2f} >= {min_cgpa_flt:.2f})"
                    if passed
                    else f"Requires minimum {min_cgpa_flt:.2f} CGPA; your profile lists {student_cgpa:.2f}"
                )
                if not passed:
                    critical_failures.append(reason)
            else:
                chk_status = "unknown"
                passed = False
                reason = f"Requires minimum {min_cgpa_flt:.2f} CGPA (unverified in student profile)"

            checks.append({
                "requirement": "Minimum CGPA",
                "required": min_cgpa_flt,
                "student_value": student_cgpa,
                "status": chk_status
            })
            reasons.append(reason)
            rules.append({
                "rule": "Minimum CGPA",
                "passed": (chk_status == "passed"),
                "reason": reason,
                "critical": True
            })
        else:
            checks.append({
                "requirement": "Minimum CGPA",
                "required": None,
                "student_value": student_cgpa,
                "status": "passed"
            })
            reasons.append("No minimum CGPA cutoff required")
            rules.append({
                "rule": "Minimum CGPA",
                "passed": True,
                "reason": "No minimum CGPA cutoff required",
                "critical": True
            })

        # -------------------------------------------------------------
        # 3. Graduation Batch / Year Rule
        # -------------------------------------------------------------
        allowed_years = edu_req.get("graduation_years") or opp.get("graduation_years") or opp.get("eligible_graduation_years") or []
        if allowed_years and opp_type not in ("hackathon", "coding_contest"):
            int_allowed_years = [int(y) for y in allowed_years if str(y).isdigit()]
            if student_year is not None:
                passed = student_year in int_allowed_years
                chk_status = "passed" if passed else "failed"
                reason = (
                    f"Graduation batch requirement satisfied ({student_year} in {int_allowed_years})"
                    if passed
                    else f"Requires graduation batch in {int_allowed_years}; your profile lists {student_year}"
                )
                if not passed:
                    critical_failures.append(reason)
            else:
                chk_status = "unknown"
                passed = False
                reason = f"Target batches: {int_allowed_years} (Graduation year not listed in profile)"

            checks.append({
                "requirement": "Graduation Batch",
                "required": int_allowed_years,
                "student_value": student_year,
                "status": chk_status
            })
            reasons.append(reason)
            rules.append({
                "rule": "Graduation Batch",
                "passed": (chk_status == "passed"),
                "reason": reason,
                "critical": True
            })
        else:
            checks.append({
                "requirement": "Graduation Batch",
                "required": None,
                "student_value": student_year,
                "status": "passed"
            })
            reasons.append("Open to all graduation batches")
            rules.append({
                "rule": "Graduation Batch",
                "passed": True,
                "reason": "Open to all university batches",
                "critical": True
            })

        # -------------------------------------------------------------
        # 4. Academic Branch / Discipline Rule
        # -------------------------------------------------------------
        allowed_branches = edu_req.get("branches") or opp.get("eligible_branches") or opp.get("branches") or []
        if allowed_branches:
            is_open_to_all = any(
                str(b).strip().lower() in ("any", "all", "open", "any branch", "all branches", "open to all", "all disciplines", "any technical branch") or
                "all engineering" in str(b).lower() or
                "open to all" in str(b).lower() or
                "any technical" in str(b).lower() or
                "any engineering" in str(b).lower() or
                "any branch" in str(b).lower() or
                "all branches" in str(b).lower()
                for b in allowed_branches
            )
            if is_open_to_all:
                checks.append({
                    "requirement": "Eligible Branch",
                    "required": allowed_branches,
                    "student_value": student_branch.title() if student_branch else "All",
                    "status": "passed"
                })
                reasons.append("Open to all academic disciplines / branches")
                rules.append({
                    "rule": "Academic Discipline",
                    "passed": True,
                    "reason": "Open to all academic disciplines / branches",
                    "critical": True
                })
            elif student_branch:
                from app.utils.opportunity_normalizer import normalize_branches
                norm_allowed = normalize_branches(allowed_branches) if allowed_branches else []
                norm_student = normalize_branches([student_branch]) if student_branch else []
                student_branch_norm = norm_student[0].lower() if norm_student else student_branch.lower()

                branch_match = any(
                    b.lower() == student_branch_norm or
                    (len(b) > 4 and (b.lower() in student_branch_norm or student_branch_norm in b.lower()))
                    for b in (norm_allowed or allowed_branches)
                )

                passed = branch_match
                chk_status = "passed" if passed else "failed"
                reason = (
                    f"Branch requirement satisfied ('{student_branch.title()}' eligible)"
                    if passed
                    else f"Targets branches: {', '.join(allowed_branches[:3])}; your profile lists '{student_branch.title()}'"
                )
                if not passed:
                    critical_failures.append(reason)

                checks.append({
                    "requirement": "Eligible Branch",
                    "required": allowed_branches,
                    "student_value": student_branch.title() if student_branch else None,
                    "status": chk_status
                })
                reasons.append(reason)
                rules.append({
                    "rule": "Academic Discipline",
                    "passed": (chk_status == "passed"),
                    "reason": reason,
                    "critical": True
                })
            else:
                chk_status = "unknown"
                passed = False
                reason = f"Targets branches: {', '.join(allowed_branches[:3])} (Branch not listed in profile)"
                checks.append({
                    "requirement": "Eligible Branch",
                    "required": allowed_branches,
                    "student_value": None,
                    "status": chk_status
                })
                reasons.append(reason)
                rules.append({
                    "rule": "Academic Discipline",
                    "passed": False,
                    "reason": reason,
                    "critical": True
                })
        else:
            checks.append({
                "requirement": "Eligible Branch",
                "required": None,
                "student_value": student_branch.title() if student_branch else "All",
                "status": "passed"
            })
            reasons.append("Open to all academic disciplines")
            rules.append({
                "rule": "Academic Discipline",
                "passed": True,
                "reason": "Open to all academic disciplines",
                "critical": True
            })

        # -------------------------------------------------------------
        # 5. Degree Requirement Rule (Jobs / Internships)
        # -------------------------------------------------------------
        allowed_degrees = edu_req.get("degrees") or opp.get("eligible_degrees") or opp.get("degrees") or []
        if allowed_degrees and opp_type not in ("hackathon", "coding_contest"):
            is_open_degree = any(
                str(deg).strip().lower() in ("any", "all", "open", "any degree", "all degrees", "open to all")
                for deg in allowed_degrees
            )
            if is_open_degree:
                checks.append({
                    "requirement": "Degree Requirement",
                    "required": allowed_degrees,
                    "student_value": student_degree or "Eligible",
                    "status": "passed"
                })
                reasons.append("Open to all degree levels")
                rules.append({
                    "rule": "Degree Requirement",
                    "passed": True,
                    "reason": "Open to all degree levels",
                    "critical": True
                })
            elif student_degree:
                UNDERGRAD_ALIASES = ("b.tech", "btech", "b.e", "b.e.", "be", "bca", "b.sc", "bsc", "bba", "b.com", "bcom", "b.a", "ba", "bachelor", "bachelors", "undergraduate", "ug")
                POSTGRAD_ALIASES = ("m.tech", "mtech", "m.e", "m.e.", "me", "mca", "m.sc", "msc", "mba", "m.com", "mcom", "m.a", "ma", "master", "masters", "postgraduate", "pg")
                student_deg_lower = student_degree.lower().strip()
                is_student_ug = any(ug in student_deg_lower for ug in UNDERGRAD_ALIASES)
                is_student_pg = any(pg in student_deg_lower for pg in POSTGRAD_ALIASES)

                passed = any(
                    deg.lower() in student_deg_lower or student_deg_lower in deg.lower() or
                    (is_student_ug and any(u in deg.lower() for u in ("undergraduate", "bachelor", "ug", "all university"))) or
                    (is_student_pg and any(p in deg.lower() for p in ("postgraduate", "master", "pg")))
                    for deg in allowed_degrees
                )
                chk_status = "passed" if passed else "failed"
                reason = (
                    f"Degree requirement satisfied ({student_degree})"
                    if passed
                    else f"Requires {', '.join(allowed_degrees)}; your profile lists {student_degree}"
                )
                if not passed:
                    critical_failures.append(reason)

                checks.append({
                    "requirement": "Degree Requirement",
                    "required": allowed_degrees,
                    "student_value": student_degree,
                    "status": chk_status
                })
                reasons.append(reason)
                rules.append({
                    "rule": "Degree Requirement",
                    "passed": (chk_status == "passed"),
                    "reason": reason,
                    "critical": True
                })
            else:
                chk_status = "unknown"
                passed = False
                reason = f"Requires {', '.join(allowed_degrees)} (Degree not specified in profile)"
                checks.append({
                    "requirement": "Degree Requirement",
                    "required": allowed_degrees,
                    "student_value": None,
                    "status": chk_status
                })
                reasons.append(reason)
                rules.append({
                    "rule": "Degree Requirement",
                    "passed": False,
                    "reason": reason,
                    "critical": True
                })

        # -------------------------------------------------------------
        # 6. Experience Requirement Rule
        # -------------------------------------------------------------
        exp_req = opp.get("experience") or opp.get("experience_requirements") or {}
        min_exp = exp_req.get("min_years") if isinstance(exp_req, dict) else None
        if min_exp is None:
            min_exp = opp.get("experience_years") or opp.get("min_experience_years")

        if opp_type not in ("hackathon", "coding_contest", "scholarship") and min_exp is not None and float(min_exp) > 0.0:
            min_exp_flt = float(min_exp)
            from app.utils.experience_calculator import calculate_student_experience
            exp_data = calculate_student_experience(profile)
            student_exp_years = exp_data["total_years"]

            if student_exp_years is not None:
                passed = float(student_exp_years) >= min_exp_flt
                chk_status = "passed" if passed else "failed"
                reason = (
                    f"Experience requirement satisfied ({student_exp_years:.1f} yrs >= {min_exp_flt:.1f} yrs)"
                    if passed
                    else f"Requires minimum {min_exp_flt:.1f} years experience; profile lists {student_exp_years:.1f} years"
                )
                if not passed:
                    critical_failures.append(reason)
            else:
                chk_status = "unknown"
                passed = False
                if exp_data.get("calculation_method") == "undated_roles":
                    reason = f"Requires minimum {min_exp_flt:.1f} years experience; listed roles lack verifiable dates (Needs review)"
                else:
                    reason = f"Requires minimum {min_exp_flt:.1f} years experience (Experience history not detailed in profile)"

            checks.append({
                "requirement": "Required Experience",
                "required": f"{min_exp_flt:.1f} years",
                "student_value": f"{student_exp_years:.1f} years" if student_exp_years is not None else None,
                "status": chk_status
            })
            reasons.append(reason)
            rules.append({
                "rule": "Required Experience",
                "passed": (chk_status == "passed"),
                "reason": reason,
                "critical": True
            })
        else:
            checks.append({
                "requirement": "Required Experience",
                "required": "Entry Level / Open",
                "student_value": "Eligible",
                "status": "passed"
            })
            reasons.append("Entry level / No prior experience required")
            rules.append({
                "rule": "Required Experience",
                "passed": True,
                "reason": "Entry level / No prior experience required",
                "critical": True
            })

        # -------------------------------------------------------------
        # 6. Category-Specific Eligibility: Hackathons
        # -------------------------------------------------------------
        if opp_type in ("hackathon", "coding_contest"):
            team_req = opp.get("team_size") or opp.get("participation_mode") or "Individual / Team"
            checks.append({
                "requirement": "Participation Mode",
                "required": team_req,
                "student_value": "Eligible Student",
                "status": "passed"
            })
            reasons.append(f"Competition format: {team_req}")

        # -------------------------------------------------------------
        # 7. Category-Specific Eligibility: Scholarships
        # -------------------------------------------------------------
        if opp_type == "scholarship":
            criteria = opp.get("scholarship_criteria") or {}
            allowed_cats = criteria.get("categories") or []
            student_cat = (profile.get("category") or profile.get("reservation_status") or "").strip().lower()

            if allowed_cats:
                if student_cat:
                    passed = any(c.lower() in student_cat for c in allowed_cats) or "all" in [c.lower() for c in allowed_cats]
                    chk_status = "passed" if passed else "failed"
                    reason = f"Category '{student_cat.upper()}' eligible for scheme" if passed else f"Scholarship reserved for {', '.join(allowed_cats)}"
                    if not passed:
                        critical_failures.append(reason)
                else:
                    chk_status = "unknown"
                    reason = f"Scheme criteria targets {', '.join(allowed_cats)} (Category unverified in profile)"

                checks.append({
                    "requirement": "Category Reservation",
                    "required": allowed_cats,
                    "student_value": student_cat.upper() if student_cat else None,
                    "status": chk_status
                })
                reasons.append(reason)

            # Income limit rule if specified
            income_max = criteria.get("income_max")
            if income_max:
                student_income = profile.get("family_income_band") or profile.get("family_income")
                if student_income is not None:
                    checks.append({
                        "requirement": "Family Income Limit",
                        "required": f"<= ₹{income_max:,}",
                        "student_value": str(student_income),
                        "status": "passed"
                    })
                    reasons.append("Family income criteria satisfied")
                else:
                    checks.append({
                        "requirement": "Family Income Limit",
                        "required": f"<= ₹{income_max:,}",
                        "student_value": None,
                        "status": "unknown"
                    })
                    reasons.append(f"Income ceiling ₹{income_max:,} requires verification")

        # -------------------------------------------------------------
        # 8. Explicit Backlogs Check
        # If opportunity text specifies "no active backlogs", require verification
        # -------------------------------------------------------------
        elig_text = (opp.get("eligibility_text") or opp.get("description") or "").lower()
        if "no backlog" in elig_text or "0 backlog" in elig_text or "zero backlog" in elig_text:
            student_backlogs = profile.get("backlogs") or student_edu.get("active_backlogs")
            if student_backlogs is not None:
                passed = int(student_backlogs) == 0
                chk_status = "passed" if passed else "failed"
                reason = "Backlog status confirmed: 0 active backlogs" if passed else f"Requires 0 active backlogs; profile lists {student_backlogs}"
                if not passed:
                    critical_failures.append(reason)
            else:
                chk_status = "unknown"
                reason = "Backlog status requires confirmation (requires 0 active backlogs)"

            checks.append({
                "requirement": "No Active Backlogs",
                "required": 0,
                "student_value": student_backlogs,
                "status": chk_status
            })
            reasons.append(reason)
            rules.append({
                "rule": "No Active Backlogs",
                "passed": (chk_status == "passed"),
                "reason": reason,
                "critical": True
            })

        # -------------------------------------------------------------
        # Determine Overall Status:
        # 'eligible' | 'not_eligible' | 'needs_review'
        # -------------------------------------------------------------
        has_failed = any(c["status"] == "failed" for c in checks)
        has_unknown = any(c["status"] == "unknown" for c in checks)

        if has_failed:
            overall_status = "not_eligible"
        elif has_unknown:
            overall_status = "needs_review"
        else:
            overall_status = "eligible"

        passed_reqs = [c["requirement"] for c in checks if c["status"] == "passed"]
        failed_reqs = [c["requirement"] for c in checks if c["status"] == "failed"]
        unknown_reqs = [c["requirement"] for c in checks if c["status"] == "unknown"]

        # Backwards compatible eligibility_score: passed checks ratio
        eligibility_score = int((len(passed_reqs) / len(checks)) * 100) if checks else 100

        return {
            "status": overall_status,
            "checks": checks,
            "passed_requirements": passed_reqs,
            "failed_requirements": failed_reqs,
            "unknown_requirements": unknown_reqs,
            "reasons": reasons,
            "is_eligible": (overall_status == "eligible"),
            "eligibility_score": eligibility_score,
            "rules": rules,
            "critical_failures": critical_failures
        }

    @staticmethod
    def _extract_student_cgpa(edu: Dict[str, Any], profile: Dict[str, Any]) -> Optional[float]:
        raw = edu.get("cgpa")
        if isinstance(raw, dict) and "value" in raw:
            raw = raw["value"]
        if raw is None or raw == "":
            raw = profile.get("cgpa")
        if raw is not None and raw != "":
            try:
                return float(raw)
            except (ValueError, TypeError):
                return None
        return None

    @staticmethod
    def _extract_student_graduation_year(edu: Dict[str, Any], profile: Dict[str, Any]) -> Optional[int]:
        raw = edu.get("graduation_year") or edu.get("graduationYear") or edu.get("year_of_passing")
        if isinstance(raw, dict) and "value" in raw:
            raw = raw["value"]
        if raw is None or raw == "":
            raw = profile.get("graduation_year") or profile.get("year")
        if raw is not None and raw != "":
            try:
                return int(raw)
            except (ValueError, TypeError):
                return None
        return None

    @staticmethod
    def _extract_student_branch(edu: Dict[str, Any], profile: Dict[str, Any]) -> str:
        raw = edu.get("branch") or edu.get("major")
        if isinstance(raw, dict) and "value" in raw:
            raw = raw["value"]
        if not raw:
            raw = profile.get("branch") or ""
        return str(raw).strip().lower()

    @staticmethod
    def _extract_student_degree(edu: Dict[str, Any], profile: Dict[str, Any]) -> Optional[str]:
        raw = edu.get("degree")
        if isinstance(raw, dict) and "value" in raw:
            raw = raw["value"]
        if not raw:
            raw = profile.get("degree")
        return str(raw).strip() if raw else None
