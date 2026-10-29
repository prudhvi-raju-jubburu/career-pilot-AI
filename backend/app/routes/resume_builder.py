import logging
from flask import Blueprint, request, jsonify, send_file
from app.utils.auth import token_required
from app.models.profile import ProfileModel
from app.models.opportunity import OpportunityModel
from app.models.generated_resume import GeneratedResumeModel
from app.services.resume_builder_service import ResumeBuilderService
from app.services.resume_quality_service import ResumeQualityService
from app.services.resume_template_service import ResumeTemplateService
from app.services.resume_export_service import ResumeExportService
from app.services.resume_parser import ResumeParserService
from app.ai.resume_analyzer import ResumeAnalyzerService

logger = logging.getLogger(__name__)

resume_builder_bp = Blueprint("resume_builder", __name__)

@resume_builder_bp.route("/source-data", methods=["GET"])
@token_required
def get_source_data(current_user):
    """
    Returns authenticated student's profile, uploaded resume metadata,
    and count of saved resume versions.
    """
    user_id = str(current_user["_id"])
    profile_doc = ProfileModel.find_by_user_id(user_id)
    profile_data = ProfileModel.to_dict(profile_doc) if profile_doc else {}

    resume_meta = profile_doc.get("resume", {}) if profile_doc else {}
    has_uploaded_resume = bool(resume_meta.get("fileName") and resume_meta.get("filePath"))

    saved_versions = GeneratedResumeModel.list_by_user(user_id)

    return jsonify({
        "success": True,
        "message": "Resume source data retrieved successfully",
        "data": {
            "profile": profile_data,
            "has_uploaded_resume": has_uploaded_resume,
            "resume_meta": {
                "fileName": resume_meta.get("fileName"),
                "uploadedAt": resume_meta.get("uploadedAt") or resume_meta.get("uploaded_at"),
                "fileSize": resume_meta.get("fileSize")
            } if has_uploaded_resume else None,
            "saved_versions_count": len(saved_versions)
        }
    }), 200

@resume_builder_bp.route("/merge", methods=["POST"])
@token_required
def merge_resume_sources(current_user):
    """
    Merges uploaded resume extraction with the student's saved profile safely.
    Preserves manual fields and identifies any conflicts.
    """
    user_id = str(current_user["_id"])
    profile_doc = ProfileModel.find_by_user_id(user_id)
    profile_data = ProfileModel.to_dict(profile_doc) if profile_doc else {}

    body = request.get_json(silent=True) or {}
    extracted_data = body.get("extracted_resume")

    # If not passed in body, try parsing uploaded resume on disk
    if not extracted_data:
        resume_info = profile_doc.get("resume", {}) if profile_doc else {}
        file_path = resume_info.get("filePath")
        if file_path:
            try:
                raw_text = ResumeParserService.extract_text(file_path)
                extracted_data = ResumeAnalyzerService.analyze_resume_text(raw_text)
            except Exception as e:
                logger.warning("Could not auto-extract from file_path %s: %s", file_path, str(e))
                extracted_data = {}
        else:
            extracted_data = {}

    merged = ResumeBuilderService.merge_profile_and_resume(profile_data, extracted_data)

    return jsonify({
        "success": True,
        "message": "Profile and resume data merged successfully",
        "data": merged
    }), 200

@resume_builder_bp.route("/analyze-job", methods=["POST"])
@token_required
def analyze_job(current_user):
    """
    Extracts requirements & keywords from an opportunity ID or pasted job description.
    """
    body = request.get_json(silent=True) or {}
    opportunity_id = body.get("opportunity_id")
    job_description = body.get("job_description", "")
    target_role = body.get("target_role", "")

    if opportunity_id:
        opp = OpportunityModel.find_by_id(opportunity_id)
        if opp:
            opp_dict = OpportunityModel.to_dict(opp)
            target_role = opp_dict.get("title") or target_role
            job_description = f"{opp_dict.get('title', '')}\n{opp_dict.get('company', '')}\n{opp_dict.get('description', '')}\n" + "\n".join(opp_dict.get("requirements", []))

    keywords = ResumeQualityService._extract_top_technical_keywords(job_description or target_role)

    return jsonify({
        "success": True,
        "message": "Job details analyzed",
        "data": {
            "target_role": target_role,
            "job_description": job_description,
            "extracted_keywords": keywords
        }
    }), 200

@resume_builder_bp.route("/score", methods=["POST"])
@token_required
def calculate_score(current_user):
    """
    Calculates deterministic ATS-related resume quality assessment (0-100 pts)
    across the 5 transparent dimensions.
    """
    body = request.get_json(silent=True) or {}
    resume_data = body.get("resume_data")
    if not resume_data or not isinstance(resume_data, dict):
        return jsonify({
            "success": False,
            "message": "Field 'resume_data' is required",
            "error": "BAD_REQUEST"
        }), 400

    target_role = str(body.get("target_role", "")).strip()
    target_jd = str(body.get("target_job_description", "")).strip()

    assessment = ResumeQualityService.evaluate(
        resume_data=resume_data,
        target_role=target_role,
        target_job_description=target_jd
    )

    return jsonify({
        "success": True,
        "message": "ATS Readiness assessment calculated successfully",
        "data": assessment
    }), 200

@resume_builder_bp.route("/improve", methods=["POST"])
@token_required
def generate_improvements(current_user):
    """
    Generates grounded AI rewrite recommendations for project bullets and experiences.
    Never fabricates metrics or skills.
    """
    body = request.get_json(silent=True) or {}
    resume_data = body.get("resume_data")
    if not resume_data or not isinstance(resume_data, dict):
        return jsonify({
            "success": False,
            "message": "Field 'resume_data' is required",
            "error": "BAD_REQUEST"
        }), 400

    target_role = str(body.get("target_role", "")).strip()
    target_jd = str(body.get("target_job_description", "")).strip()

    suggestions = ResumeBuilderService.generate_ai_improvements(
        resume_data=resume_data,
        target_role=target_role,
        target_jd=target_jd
    )

    return jsonify({
        "success": True,
        "message": "Grounded improvements generated successfully",
        "data": {
            "suggestions": suggestions,
            "count": len(suggestions)
        }
    }), 200

@resume_builder_bp.route("/summaries", methods=["POST"])
@token_required
def generate_summaries(current_user):
    """
    Generates 3 grounded professional summary options based on student profile.
    """
    body = request.get_json(silent=True) or {}
    resume_data = body.get("resume_data", {})
    target_role = str(body.get("target_role", "")).strip()

    summaries = ResumeBuilderService.generate_professional_summaries(
        resume_data=resume_data,
        target_role=target_role
    )

    return jsonify({
        "success": True,
        "message": "Professional summaries generated successfully",
        "data": summaries
    }), 200

@resume_builder_bp.route("/templates", methods=["GET"])
def get_templates():
    """
    Returns available resume template library metadata and supported options.
    """
    templates = ResumeTemplateService.list_templates()
    return jsonify({
        "success": True,
        "message": "Templates retrieved successfully",
        "data": templates
    }), 200

@resume_builder_bp.route("/versions", methods=["GET"])
@token_required
def list_versions(current_user):
    """
    Lists all saved resume versions for authenticated student.
    """
    user_id = str(current_user["_id"])
    versions = GeneratedResumeModel.list_by_user(user_id)
    return jsonify({
        "success": True,
        "message": "Saved resume versions retrieved",
        "data": versions
    }), 200

@resume_builder_bp.route("/versions", methods=["POST"])
@token_required
def create_version(current_user):
    """
    Creates a new named resume version.
    """
    user_id = str(current_user["_id"])
    body = request.get_json(silent=True) or {}

    if not body.get("title"):
        body["title"] = f"{body.get('target_role', 'Software Engineer')} Resume"

    created = GeneratedResumeModel.create_version(user_id, body)
    return jsonify({
        "success": True,
        "message": "Resume version saved successfully",
        "data": created
    }), 201

@resume_builder_bp.route("/versions/<version_id>", methods=["GET"])
@token_required
def get_version(current_user, version_id):
    """
    Retrieves a single saved resume version with ownership check.
    """
    user_id = str(current_user["_id"])
    version = GeneratedResumeModel.find_by_id_and_user(version_id, user_id)
    if not version:
        return jsonify({
            "success": False,
            "message": "Resume version not found",
            "error": "NOT_FOUND"
        }), 404

    return jsonify({
        "success": True,
        "message": "Resume version retrieved",
        "data": GeneratedResumeModel.to_dict(version)
    }), 200

@resume_builder_bp.route("/versions/<version_id>", methods=["PUT"])
@token_required
def update_version(current_user, version_id):
    """
    Updates an existing resume version with ownership check.
    """
    user_id = str(current_user["_id"])
    body = request.get_json(silent=True) or {}

    updated = GeneratedResumeModel.update_version(version_id, user_id, body)
    if not updated:
        return jsonify({
            "success": False,
            "message": "Resume version not found or unauthorized",
            "error": "NOT_FOUND"
        }), 404

    return jsonify({
        "success": True,
        "message": "Resume version updated successfully",
        "data": updated
    }), 200

@resume_builder_bp.route("/versions/<version_id>", methods=["DELETE"])
@token_required
def delete_version(current_user, version_id):
    """
    Deletes an existing resume version with ownership check.
    """
    user_id = str(current_user["_id"])
    deleted = GeneratedResumeModel.delete_version(version_id, user_id)
    if not deleted:
        return jsonify({
            "success": False,
            "message": "Resume version not found or unauthorized",
            "error": "NOT_FOUND"
        }), 404

    return jsonify({
        "success": True,
        "message": "Resume version deleted successfully"
    }), 200

@resume_builder_bp.route("/versions/<version_id>/duplicate", methods=["POST"])
@token_required
def duplicate_version(current_user, version_id):
    """
    Duplicates an existing resume version.
    """
    user_id = str(current_user["_id"])
    body = request.get_json(silent=True) or {}
    new_title = body.get("title")

    duplicated = GeneratedResumeModel.duplicate_version(version_id, user_id, new_title)
    if not duplicated:
        return jsonify({
            "success": False,
            "message": "Resume version not found or unauthorized",
            "error": "NOT_FOUND"
        }), 404

    return jsonify({
        "success": True,
        "message": "Resume version duplicated successfully",
        "data": duplicated
    }), 201

@resume_builder_bp.route("/export", methods=["POST"])
@token_required
def export_resume(current_user):
    """
    Generates and streams an authentic downloadable document (PDF or DOCX).
    """
    body = request.get_json(silent=True) or {}
    resume_data = body.get("resume_data")
    if not resume_data or not isinstance(resume_data, dict):
        return jsonify({
            "success": False,
            "message": "Field 'resume_data' is required for export",
            "error": "BAD_REQUEST"
        }), 400

    file_format = str(body.get("format", "pdf")).lower().strip()
    template_id = str(body.get("template_id", "ats_classic")).strip()
    formatting = body.get("formatting", {})

    personal = resume_data.get("personal", {})
    candidate_name = personal.get("fullName") or personal.get("full_name") or "Resume"
    safe_name = "".join(c for c in candidate_name if c.isalnum() or c in (" ", "_", "-")).strip().replace(" ", "_")

    if file_format == "docx":
        docx_buffer = ResumeExportService.generate_docx(resume_data, template_id, formatting)
        filename = f"{safe_name}_CareerPilot_Resume.docx"
        return send_file(
            docx_buffer,
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            as_attachment=True,
            download_name=filename
        )
    else:
        pdf_buffer = ResumeExportService.generate_pdf(resume_data, template_id, formatting)
        filename = f"{safe_name}_CareerPilot_Resume.pdf"
        return send_file(
            pdf_buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename
        )
