import logging
from flask import Blueprint, request, jsonify
from app.utils.auth import token_required
from app.models.application import ApplicationModel
from app.services.event_stream import EventStreamManager

logger = logging.getLogger(__name__)
application_bp = Blueprint("application", __name__)

@application_bp.route("", methods=["GET"])
@token_required
def get_applications(current_user):
    """Retrieves all tracked career applications for the authenticated student."""
    user_id = str(current_user["_id"])
    status = request.args.get("status")
    search = request.args.get("search")
    try:
        apps = ApplicationModel.find_by_user(user_id, status=status, search=search)
        return jsonify({
            "success": True,
            "message": "Applications retrieved successfully",
            "data": apps
        }), 200
    except Exception as e:
        logger.exception("Error getting applications for user %s: %s", user_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to retrieve applications",
            "error": str(e)
        }), 500

@application_bp.route("", methods=["POST"])
@token_required
def create_application(current_user):
    """Creates a new tracked application in the student's pipeline."""
    user_id = str(current_user["_id"])
    payload = request.get_json(silent=True) or {}

    if not payload.get("company") or not payload.get("role"):
        return jsonify({
            "success": False,
            "message": "Both company and role are required",
            "error": "VALIDATION_ERROR"
        }), 400

    try:
        app_doc = ApplicationModel.create_application(user_id, payload)
        opp_id = payload.get("opportunityId") or payload.get("opportunity_id")
        if opp_id:
            try:
                from app.models.feedback import FeedbackModel
                FeedbackModel.record_event(
                    user_id=user_id,
                    opportunity_id=str(opp_id),
                    event_type="application_confirmed" if payload.get("status") == "Applied" else "application_started",
                    category=payload.get("type"),
                    company=payload.get("company")
                )
            except Exception as fe:
                logger.debug("Non-blocking feedback event capture skipped: %s", str(fe))

        EventStreamManager.broadcast("application_created", {
            "user_id": user_id,
            "application": app_doc
        })
        return jsonify({
            "success": True,
            "message": "Application created successfully",
            "data": app_doc
        }), 201
    except Exception as e:
        logger.exception("Error creating application for user %s: %s", user_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to create application",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>", methods=["GET"])
@token_required
def get_application(current_user, app_id):
    """Retrieves a single application by ID with ownership verification."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    # Backfill preparation trigger for existing Applied applications that lack a prep pack
    if app_doc.get("status") == "Applied" and app_doc.get("prep_status") in ("not_requested", None, ""):
        ApplicationModel.ensure_applied_prep_triggered(app_id, user_id)
        app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id) or app_doc

    return jsonify({
        "success": True,
        "message": "Application retrieved successfully",
        "data": app_doc
    }), 200

@application_bp.route("/<app_id>/job-description", methods=["PUT", "PATCH"])
@token_required
def update_application_job_description(current_user, app_id):
    """Updates the student-tailored job description for an application without mutating shared opportunity."""
    user_id = str(current_user["_id"])
    payload = request.get_json(silent=True) or {}
    job_desc = payload.get("job_description") if "job_description" in payload else payload.get("jobDescription")
    if job_desc is None:
        return jsonify({
            "success": False,
            "message": "job_description is required",
            "error": "VALIDATION_ERROR"
        }), 400

    updated = ApplicationModel.update_job_description(app_id, user_id, str(job_desc))
    if not updated:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    return jsonify({
        "success": True,
        "message": "Application job description updated successfully",
        "data": updated
    }), 200

@application_bp.route("/<app_id>", methods=["PUT", "PATCH"])
@token_required
def update_application(current_user, app_id):
    """Updates application details, notes, or target deadlines."""
    user_id = str(current_user["_id"])
    updates = request.get_json(silent=True) or {}

    try:
        updated = ApplicationModel.update_application(app_id, user_id, updates)
        if not updated:
            return jsonify({
                "success": False,
                "message": "Application not found",
                "error": "NOT_FOUND"
            }), 404
        return jsonify({
            "success": True,
            "message": "Application updated successfully",
            "data": updated
        }), 200
    except Exception as e:
        logger.exception("Error updating application %s: %s", app_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to update application",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>/stage", methods=["PATCH", "PUT"])
@token_required
def update_application_stage(current_user, app_id):
    """Updates application status stage and records a timeline audit trail event."""
    user_id = str(current_user["_id"])
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")

    if not new_status:
        return jsonify({
            "success": False,
            "message": "New status stage is required",
            "error": "VALIDATION_ERROR"
        }), 400

    note = data.get("note")
    try:
        updated = ApplicationModel.update_stage(app_id, user_id, new_status, note=note)
        if not updated:
            return jsonify({
                "success": False,
                "message": "Application not found",
                "error": "NOT_FOUND"
            }), 404

        EventStreamManager.broadcast("application_stage_changed", {
            "user_id": user_id,
            "application_id": app_id,
            "status": new_status
        })

        return jsonify({
            "success": True,
            "message": f"Stage updated to {new_status}",
            "data": updated
        }), 200
    except Exception as e:
        logger.exception("Error updating stage for application %s: %s", app_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to update application stage",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>", methods=["DELETE"])
@token_required
def delete_application(current_user, app_id):
    """Removes an application from tracking."""
    user_id = str(current_user["_id"])
    try:
        deleted = ApplicationModel.delete_application(app_id, user_id)
        if not deleted:
            return jsonify({
                "success": False,
                "message": "Application not found",
                "error": "NOT_FOUND"
            }), 404
        return jsonify({
            "success": True,
            "message": "Application deleted successfully"
        }), 200
    except Exception as e:
        logger.exception("Error deleting application %s: %s", app_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to delete application",
            "error": str(e)
        }), 500

# -----------------------------------------------------------------------------
# Phase 5: Interview Scheduling & Event Management Endpoints
# -----------------------------------------------------------------------------

@application_bp.route("/events", methods=["GET"])
@token_required
def get_all_user_events(current_user):
    """Retrieves all interview and assessment events for the authenticated student."""
    user_id = str(current_user["_id"])
    try:
        from app.models.interview_event import InterviewEventModel
        events = InterviewEventModel.find_by_user(user_id)
        return jsonify({
            "success": True,
            "message": "Interview events retrieved successfully",
            "data": events
        }), 200
    except Exception as e:
        logger.exception("Error getting interview events for user %s: %s", user_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to retrieve interview events",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>/events", methods=["GET"])
@token_required
def get_application_events(current_user, app_id):
    """Retrieves all interview events linked to a specific application."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    try:
        from app.models.interview_event import InterviewEventModel
        events = InterviewEventModel.find_by_application(app_id, user_id=user_id)
        return jsonify({
            "success": True,
            "message": "Events retrieved successfully",
            "data": events
        }), 200
    except Exception as e:
        logger.exception("Error getting events for application %s: %s", app_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to retrieve interview events",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>/events", methods=["POST"])
@token_required
def create_interview_event(current_user, app_id):
    """Creates a new interview or assessment event linked to an application."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    payload = request.get_json(silent=True) or {}
    if not payload.get("title") or not payload.get("start_time") or not payload.get("end_time"):
        return jsonify({
            "success": False,
            "message": "Title, start_time, and end_time are required",
            "error": "VALIDATION_ERROR"
        }), 400

    try:
        from app.models.interview_event import InterviewEventModel
        event_doc = InterviewEventModel.create_event(user_id, app_id, payload)
        return jsonify({
            "success": True,
            "message": "Interview event scheduled successfully",
            "data": event_doc
        }), 201
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "VALIDATION_ERROR"
        }), 400
    except Exception as e:
        logger.exception("Error creating interview event for app %s: %s", app_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to schedule interview event",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>/events/<event_id>", methods=["PUT", "PATCH"])
@token_required
def update_interview_event(current_user, app_id, event_id):
    """Updates or reschedules an interview event."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    payload = request.get_json(silent=True) or {}
    try:
        from app.models.interview_event import InterviewEventModel
        updated = InterviewEventModel.update_event(event_id, user_id, payload)
        if not updated:
            return jsonify({
                "success": False,
                "message": "Interview event not found",
                "error": "NOT_FOUND"
            }), 404
        return jsonify({
            "success": True,
            "message": "Interview event updated successfully",
            "data": updated
        }), 200
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "VALIDATION_ERROR"
        }), 400
    except Exception as e:
        logger.exception("Error updating interview event %s: %s", event_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to update interview event",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>/events/<event_id>", methods=["DELETE"])
@token_required
def delete_interview_event(current_user, app_id, event_id):
    """Deletes or cancels an interview event."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    try:
        from app.models.interview_event import InterviewEventModel
        deleted = InterviewEventModel.delete_event(event_id, user_id)
        if not deleted:
            return jsonify({
                "success": False,
                "message": "Interview event not found",
                "error": "NOT_FOUND"
            }), 404
        return jsonify({
            "success": True,
            "message": "Interview event deleted successfully"
        }), 200
    except Exception as e:
        logger.exception("Error deleting interview event %s: %s", event_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to delete interview event",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>/events/<event_id>/calendar.ics", methods=["GET"])
@token_required
def export_event_calendar(current_user, app_id, event_id):
    """Exports an interview event as an RFC 5545 compliant .ics calendar file."""
    user_id = str(current_user["_id"])
    from app.models.interview_event import InterviewEventModel
    from app.services.calendar_service import CalendarExportService
    from flask import Response

    event = InterviewEventModel.find_by_id(event_id, user_id=user_id)
    if not event or str(event.get("application_id")) != str(app_id):
        return jsonify({
            "success": False,
            "message": "Interview event not found",
            "error": "NOT_FOUND"
        }), 404

    try:
        ics_content = CalendarExportService.generate_ics(event)
        filename = f"interview_{event_id}.ics"
        return Response(
            ics_content,
            mimetype="text/calendar",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Type": "text/calendar; charset=utf-8"
            }
        )
    except Exception as e:
        logger.exception("Error generating calendar file for event %s: %s", event_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to export calendar event",
            "error": str(e)
        }), 500

# -----------------------------------------------------------------------------
# Phase 5: Grounded Interview Preparation & Checklist Endpoints
# -----------------------------------------------------------------------------

@application_bp.route("/<app_id>/prep", methods=["GET", "POST"])
@token_required
def get_or_generate_interview_prep(current_user, app_id):
    """Retrieves or generates a personalized AI interview preparation pack."""
    user_id = str(current_user["_id"])
    payload = request.get_json(silent=True) or {}
    force_refresh = bool(payload.get("force_refresh", False)) if request.method == "POST" else False

    # Enforce application ownership
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    try:
        from app.services.interview_prep_service import InterviewPrepService
        prep_pack = InterviewPrepService.get_or_generate_prep_pack(
            user_id=user_id,
            application_id=app_id,
            force_refresh=force_refresh
        )
        return jsonify({
            "success": True,
            "message": "Interview preparation pack retrieved successfully",
            "data": prep_pack
        }), 200
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "NOT_FOUND"
        }), 404
    except Exception as e:
        logger.exception("Error generating interview prep for app %s: %s", app_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to generate interview preparation pack",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>/prep/retry", methods=["POST"])
@application_bp.route("/<app_id>/prep/generate", methods=["POST"])
@token_required
def retry_interview_prep(current_user, app_id):
    """Explicitly re-triggers or retries interview preparation generation with forced refresh."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    try:
        from app.services.interview_prep_service import InterviewPrepService
        prep_pack = InterviewPrepService.get_or_generate_prep_pack(
            user_id=user_id,
            application_id=app_id,
            force_refresh=True
        )
        return jsonify({
            "success": True,
            "message": "Interview preparation pack generated successfully",
            "data": prep_pack
        }), 200
    except Exception as e:
        logger.exception("Error retrying interview prep for app %s: %s", app_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to generate interview preparation pack",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>/prep/checklist", methods=["PATCH", "POST"])
@token_required
def toggle_interview_checklist_item(current_user, app_id):
    """Atomically toggles completion status for an interview prep checklist item."""
    user_id = str(current_user["_id"])
    payload = request.get_json(silent=True) or {}
    task_id = payload.get("taskId") or payload.get("task_id")
    completed = payload.get("completed")

    if not task_id or completed is None:
        return jsonify({
            "success": False,
            "message": "taskId and completed status are required",
            "error": "VALIDATION_ERROR"
        }), 400

    try:
        from app.services.interview_prep_service import InterviewPrepService
        updated_pack = InterviewPrepService.toggle_checklist_item(
            user_id=user_id,
            application_id=app_id,
            task_id=task_id,
            completed=bool(completed)
        )
        if not updated_pack:
            return jsonify({
                "success": False,
                "message": "Interview preparation pack not found",
                "error": "NOT_FOUND"
            }), 404
        return jsonify({
            "success": True,
            "message": "Checklist updated successfully",
            "data": updated_pack
        }), 200
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "NOT_FOUND"
        }), 404
    except Exception as e:
        logger.exception("Error toggling checklist item for app %s: %s", app_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to update checklist item",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>/prep/add-skill-to-roadmap", methods=["POST"])
@token_required
def add_skill_to_prep_roadmap(current_user, app_id):
    """Adds a targeted skill learning milestone to the application prep checklist and roadmap."""
    user_id = str(current_user["_id"])
    payload = request.get_json(silent=True) or {}
    skill_name = (payload.get("skill_name") or payload.get("skill") or "").strip()

    if not skill_name:
        return jsonify({
            "success": False,
            "message": "skill_name is required",
            "error": "VALIDATION_ERROR"
        }), 400

    # Enforce application ownership
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    try:
        from app.services.interview_prep_service import InterviewPrepService
        updated_pack = InterviewPrepService.add_skill_to_roadmap(
            user_id=user_id,
            application_id=app_id,
            skill_name=skill_name
        )
        return jsonify({
            "success": True,
            "message": f"Skill '{skill_name}' added to preparation roadmap",
            "data": updated_pack
        }), 200
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "NOT_FOUND"
        }), 404
    except Exception as e:
        logger.exception("Error adding skill to roadmap for app %s: %s", app_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to add skill to roadmap",
            "error": str(e)
        }), 500


# -----------------------------------------------------------------------------
# Stage 5: Mock Test Engine Routes
# -----------------------------------------------------------------------------

@application_bp.route("/<app_id>/mock-tests", methods=["GET"])
@token_required
def get_application_mock_tests(current_user, app_id):
    """Retrieves available mock test categories and previous attempt history for an application."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    try:
        from app.services.mock_test_service import MockTestService
        categories = MockTestService.get_available_categories(app_id, user_id)
        attempts = MockTestService.list_previous_attempts(app_id, user_id)
        return jsonify({
            "success": True,
            "data": {
                "categories": categories,
                "previous_attempts": attempts
            }
        }), 200
    except Exception as e:
        logger.exception("Error fetching mock tests for app %s: %s", app_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to load mock tests",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>/mock-tests/start", methods=["POST"])
@token_required
def start_application_mock_test(current_user, app_id):
    """Starts a new mock test attempt or resumes an active in-progress attempt."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    payload = request.get_json(silent=True) or {}
    try:
        from app.services.mock_test_service import MockTestService
        attempt = MockTestService.start_test_attempt(app_id, user_id, payload)
        return jsonify({
            "success": True,
            "message": "Mock test attempt started successfully",
            "data": attempt
        }), 201
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "VALIDATION_ERROR"
        }), 400
    except Exception as e:
        logger.exception("Error starting mock test for app %s: %s", app_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to start mock test",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>/mock-tests/<test_id>", methods=["GET"])
@token_required
def get_application_mock_test_attempt(current_user, app_id, test_id):
    """Retrieves an active or completed attempt, keeping correct answers hidden while in progress."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    try:
        from app.services.mock_test_service import MockTestService
        attempt = MockTestService.get_attempt(app_id, test_id, user_id)
        return jsonify({
            "success": True,
            "data": attempt
        }), 200
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "NOT_FOUND"
        }), 404
    except Exception as e:
        logger.exception("Error retrieving mock test attempt %s: %s", test_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to load mock test attempt",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>/mock-tests/<test_id>/answers", methods=["PUT", "PATCH"])
@token_required
def save_application_mock_test_answers(current_user, app_id, test_id):
    """Saves answers during an active test without submitting."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    payload = request.get_json(silent=True) or {}
    answers = payload.get("answers")
    if answers is None or not isinstance(answers, dict):
        return jsonify({
            "success": False,
            "message": "answers dictionary is required",
            "error": "VALIDATION_ERROR"
        }), 400

    try:
        from app.services.mock_test_service import MockTestService
        result = MockTestService.save_answers(app_id, test_id, user_id, answers)
        return jsonify({
            "success": True,
            "message": "Answers saved successfully",
            "data": result
        }), 200
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "BAD_REQUEST"
        }), 400
    except Exception as e:
        logger.exception("Error saving answers for mock test %s: %s", test_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to save answers",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>/mock-tests/<test_id>/submit", methods=["POST"])
@token_required
def submit_application_mock_test(current_user, app_id, test_id):
    """Submits a mock test for grading and returns full results and explanations."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    payload = request.get_json(silent=True) or {}
    answers = payload.get("answers")

    try:
        from app.services.mock_test_service import MockTestService
        result = MockTestService.submit_attempt(app_id, test_id, user_id, answers)
        return jsonify({
            "success": True,
            "message": "Mock test submitted and graded successfully",
            "data": result
        }), 200
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "BAD_REQUEST"
        }), 400
    except Exception as e:
        logger.exception("Error submitting mock test %s: %s", test_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to submit mock test",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>/mock-tests/<test_id>/result", methods=["GET"])
@token_required
def get_application_mock_test_result(current_user, app_id, test_id):
    """Retrieves completed test result with full explanations, topic breakdown, and revision recommendations."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    try:
        from app.services.mock_test_service import MockTestService
        result = MockTestService.get_attempt(app_id, test_id, user_id)
        if result.get("status") == "in_progress":
            return jsonify({
                "success": False,
                "message": "Test is still in progress. Submit the test to view results.",
                "error": "TEST_IN_PROGRESS"
            }), 400
        return jsonify({
            "success": True,
            "data": result
        }), 200
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "NOT_FOUND"
        }), 404
    except Exception as e:
        logger.exception("Error fetching result for mock test %s: %s", test_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to fetch test results",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>/mock-tests/<test_id>/add-weak-topic-to-roadmap", methods=["POST"])
@token_required
def add_weak_topic_to_roadmap_route(current_user, app_id, test_id):
    """Adds a weak topic identified in the mock test results directly to the application prep roadmap."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    payload = request.get_json(silent=True) or {}
    topic_name = (payload.get("topic") or payload.get("topic_name") or "").strip()
    if not topic_name:
        return jsonify({
            "success": False,
            "message": "topic is required",
            "error": "VALIDATION_ERROR"
        }), 400

    try:
        from app.services.mock_test_service import MockTestService
        updated_pack = MockTestService.add_weak_topic_to_roadmap(app_id, test_id, user_id, topic_name)
        return jsonify({
            "success": True,
            "message": f"Topic '{topic_name}' added to preparation roadmap",
            "data": updated_pack
        }), 200
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "NOT_FOUND"
        }), 404
    except Exception as e:
        logger.exception("Error adding weak topic to roadmap for test %s: %s", test_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to add topic to roadmap",
            "error": str(e)
        }), 500

# -----------------------------------------------------------------------------
# Stage 6: Personalized AI Interview Simulator Endpoints
# -----------------------------------------------------------------------------

@application_bp.route("/<app_id>/interview-simulator", methods=["GET"])
@token_required
def get_interview_simulator_overview(current_user, app_id):
    """Retrieves simulator overview: supported modes, active session (if any), and recent history."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    try:
        from app.services.interview_simulator_service import InterviewSimulatorService
        modes = InterviewSimulatorService.get_supported_modes()
        active_session = InterviewSimulatorService.get_active_session(app_id, user_id)
        history = InterviewSimulatorService.list_sessions(app_id, user_id, limit=10)

        return jsonify({
            "success": True,
            "data": {
                "modes": modes,
                "active_session": active_session,
                "history": history
            }
        }), 200
    except Exception as e:
        logger.exception("Error fetching interview simulator overview for app %s: %s", app_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to load interview simulator",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>/interview-simulator/start", methods=["POST"])
@token_required
def start_interview_simulator_session(current_user, app_id):
    """Initializes a new interview simulation session or resumes an existing active one."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    payload = request.get_json(silent=True) or {}
    try:
        from app.services.interview_simulator_service import InterviewSimulatorService
        session = InterviewSimulatorService.start_session(app_id, user_id, payload)
        return jsonify({
            "success": True,
            "message": "Interview simulator session started successfully",
            "data": session
        }), 201
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "VALIDATION_ERROR"
        }), 400
    except Exception as e:
        logger.exception("Error starting interview simulator session for app %s: %s", app_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to start interview session",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>/interview-simulator/sessions/<session_id>", methods=["GET"])
@token_required
def get_interview_simulator_session(current_user, app_id, session_id):
    """Retrieves an existing interview session state with evaluation history."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    try:
        from app.services.interview_simulator_service import InterviewSimulatorService
        session = InterviewSimulatorService.get_session(app_id, session_id, user_id)
        return jsonify({
            "success": True,
            "data": session
        }), 200
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "NOT_FOUND"
        }), 404
    except Exception as e:
        logger.exception("Error fetching session %s for app %s: %s", session_id, app_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to fetch interview session",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>/interview-simulator/sessions/<session_id>/answer", methods=["POST"])
@token_required
def submit_interview_simulator_answer(current_user, app_id, session_id):
    """Submits candidate's answer for the current question, evaluates it, and returns feedback."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    payload = request.get_json(silent=True) or {}
    question_index = payload.get("question_index")
    answer_text = payload.get("answer") or payload.get("answer_text") or ""

    if question_index is None:
        return jsonify({
            "success": False,
            "message": "question_index is required",
            "error": "VALIDATION_ERROR"
        }), 400

    try:
        from app.services.interview_simulator_service import InterviewSimulatorService
        result = InterviewSimulatorService.submit_answer(
            app_id=app_id,
            session_id=session_id,
            user_id=user_id,
            question_index=int(question_index),
            answer_text=str(answer_text)
        )
        return jsonify({
            "success": True,
            "message": "Answer evaluated successfully",
            "data": result
        }), 200
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "VALIDATION_ERROR"
        }), 400
    except Exception as e:
        logger.exception("Error evaluating answer for session %s: %s", session_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to evaluate answer",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>/interview-simulator/sessions/<session_id>/next", methods=["POST"])
@token_required
def advance_interview_simulator_question(current_user, app_id, session_id):
    """Advances session to the next question or completes the session if finished."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    try:
        from app.services.interview_simulator_service import InterviewSimulatorService
        session = InterviewSimulatorService.advance_to_next_question(app_id, session_id, user_id)
        return jsonify({
            "success": True,
            "data": session
        }), 200
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve),
            "error": "VALIDATION_ERROR"
        }), 400
    except Exception as e:
        logger.exception("Error advancing question in session %s: %s", session_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to advance session",
            "error": str(e)
        }), 500

@application_bp.route("/<app_id>/interview-simulator/sessions/<session_id>/pause", methods=["POST"])
@token_required
def pause_interview_simulator_session(current_user, app_id, session_id):
    """Pauses an active interview simulation session."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    try:
        from app.services.interview_simulator_service import InterviewSimulatorService
        session = InterviewSimulatorService.pause_session(app_id, session_id, user_id)
        return jsonify({
            "success": True,
            "message": "Session paused",
            "data": session
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@application_bp.route("/<app_id>/interview-simulator/sessions/<session_id>/resume", methods=["POST"])
@token_required
def resume_interview_simulator_session(current_user, app_id, session_id):
    """Resumes a paused interview simulation session."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    try:
        from app.services.interview_simulator_service import InterviewSimulatorService
        session = InterviewSimulatorService.resume_session(app_id, session_id, user_id)
        return jsonify({
            "success": True,
            "message": "Session resumed",
            "data": session
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@application_bp.route("/<app_id>/interview-simulator/sessions/<session_id>/end", methods=["POST"])
@token_required
def end_interview_simulator_session(current_user, app_id, session_id):
    """Ends session early and generates performance summary."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    try:
        from app.services.interview_simulator_service import InterviewSimulatorService
        session = InterviewSimulatorService.end_session_early(app_id, session_id, user_id)
        return jsonify({
            "success": True,
            "message": "Session ended",
            "data": session
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@application_bp.route("/<app_id>/interview-simulator/sessions", methods=["GET"])
@token_required
def list_interview_simulator_sessions(current_user, app_id):
    """Lists past interview simulator sessions for this application."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    try:
        from app.services.interview_simulator_service import InterviewSimulatorService
        history = InterviewSimulatorService.list_sessions(app_id, user_id, limit=20)
        return jsonify({
            "success": True,
            "data": history
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@application_bp.route("/<app_id>/interview-simulator/sessions/<session_id>/add-to-roadmap", methods=["POST"])
@token_required
def add_simulator_task_to_roadmap(current_user, app_id, session_id):
    """Adds a weak area or revision task from interview simulation to the candidate's preparation checklist."""
    user_id = str(current_user["_id"])
    app_doc = ApplicationModel.find_by_id(app_id, user_id=user_id)
    if not app_doc:
        return jsonify({
            "success": False,
            "message": "Application not found",
            "error": "NOT_FOUND"
        }), 404

    payload = request.get_json(silent=True) or {}
    task_title = (payload.get("task") or payload.get("task_title") or payload.get("topic") or "").strip()
    category = payload.get("category", "Technical")

    if not task_title:
        return jsonify({
            "success": False,
            "message": "task is required",
            "error": "VALIDATION_ERROR"
        }), 400

    try:
        from app.services.interview_simulator_service import InterviewSimulatorService
        updated_pack = InterviewSimulatorService.add_feedback_to_roadmap(
            app_id=app_id,
            session_id=session_id,
            user_id=user_id,
            task_title=task_title,
            category=category
        )
        return jsonify({
            "success": True,
            "message": f"Task '{task_title}' added to preparation checklist",
            "data": updated_pack
        }), 200
    except Exception as e:
        logger.exception("Error adding simulator task to roadmap: %s", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to add task to roadmap",
            "error": str(e)
        }), 500



