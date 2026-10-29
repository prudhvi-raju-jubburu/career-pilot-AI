import os
import logging
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from app.utils.auth import token_required
from app.models.profile import ProfileModel
from app.services.resume_parser import ResumeParserService
from app.ai.resume_analyzer import ResumeAnalyzerService

logger = logging.getLogger(__name__)
resume_bp = Blueprint("resume", __name__)

ALLOWED_EXTENSIONS = {"pdf", "docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

def is_allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@resume_bp.route("/upload", methods=["POST"])
@token_required
def upload_resume(current_user):
    """Securely uploads and saves student PDF or DOCX resume."""
    if "resume" not in request.files:
        return jsonify({
            "success": False,
            "message": "No resume file provided in the request",
            "error": "BAD_REQUEST"
        }), 400

    file = request.files["resume"]
    if file.filename == "":
        return jsonify({
            "success": False,
            "message": "No file selected for upload",
            "error": "BAD_REQUEST"
        }), 400

    if not is_allowed_file(file.filename):
        return jsonify({
            "success": False,
            "message": "Only PDF (.pdf) and DOCX (.docx) resume files are supported",
            "error": "INVALID_FILE_TYPE"
        }), 400

    # Read bytes to check file size
    file_bytes = file.read()
    file_size = len(file_bytes)
    if file_size > MAX_FILE_SIZE:
        return jsonify({
            "success": False,
            "message": "Resume exceeds maximum allowed size (10 MB)",
            "error": "FILE_TOO_LARGE"
        }), 400

    # Ensure secure user-isolated folder
    user_id = str(current_user["_id"])
    upload_root = current_app.config.get("UPLOAD_FOLDER", os.path.join(os.getcwd(), "uploads"))
    user_folder = os.path.join(upload_root, "resumes", user_id)
    os.makedirs(user_folder, exist_ok=True)

    filename = secure_filename(file.filename) or "resume.pdf"
    file_path = os.path.join(user_folder, filename)

    # Save file to disk
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    now = datetime.now(timezone.utc).isoformat()
    resume_meta = {
        "fileName": filename,
        "filePath": file_path,
        "fileSize": file_size,
        "uploadedAt": now,
        "parsed": False,
        "analysisStatus": "pending"
    }

    # Update profile with resume attachment
    ProfileModel.update_profile(user_id, {"resume": resume_meta})

    return jsonify({
        "success": True,
        "message": "Resume uploaded successfully",
        "data": {
            "fileName": filename,
            "fileSize": file_size,
            "uploadedAt": now,
            "analysisStatus": "pending"
        }
    }), 200

@resume_bp.route("/analyze", methods=["POST"])
@token_required
def analyze_resume(current_user):
    """
    Parses uploaded PDF and extracts structured career profile information via Gemini AI.
    """
    user_id = str(current_user["_id"])
    profile = ProfileModel.find_by_user_id(user_id)

    resume_info = profile.get("resume", {}) if profile else {}
    file_path = resume_info.get("filePath")

    # Check disk fallback if not in profile
    if not file_path or not os.path.exists(file_path):
        upload_root = current_app.config.get("UPLOAD_FOLDER", os.path.join(os.getcwd(), "uploads"))
        user_folder = os.path.join(upload_root, "resumes", user_id)
        if os.path.exists(user_folder):
            pdf_files = [f for f in os.listdir(user_folder) if f.lower().endswith(".pdf")]
            if pdf_files:
                latest_pdf = sorted(pdf_files, key=lambda f: os.path.getmtime(os.path.join(user_folder, f)))[-1]
                file_path = os.path.join(user_folder, latest_pdf)
                resume_info = {
                    "fileName": latest_pdf,
                    "filePath": file_path,
                    "fileSize": os.path.getsize(file_path),
                    "uploadedAt": datetime.now(timezone.utc).isoformat(),
                    "parsed": False,
                    "analysisStatus": "pending"
                }
                ProfileModel.update_profile(user_id, {"resume": resume_info})

    if not file_path or not os.path.exists(file_path):
        return jsonify({
            "success": False,
            "message": "No uploaded resume found. Please upload a PDF resume first.",
            "error": "RESUME_NOT_FOUND"
        }), 404

    try:
        # Step 1: Text Extraction (PDF or DOCX)
        clean_text = ResumeParserService.extract_text(file_path)

        # Step 2: AI Structured Extraction
        extracted_data = ResumeAnalyzerService.analyze_resume_text(clean_text)

        # Check if caller requested review mode (e.g. ?save=false or ?review=true or JSON { save: false })
        save_arg = request.args.get("save")
        review_arg = request.args.get("review")
        json_body = request.get_json(silent=True) or {}

        review_mode = False
        if save_arg is not None and save_arg.lower() in ("false", "0", "no"):
            review_mode = True
        elif review_arg is not None and review_arg.lower() in ("true", "1", "yes"):
            review_mode = True
        elif "save" in json_body and json_body["save"] is False:
            review_mode = True
        elif json_body.get("review") is True:
            review_mode = True

        if review_mode:
            # Mark status as analyzed without modifying profile content fields yet
            resume_info["analysisStatus"] = "analyzed"
            ProfileModel.update_profile(user_id, {"resume": resume_info})

            return jsonify({
                "success": True,
                "message": "Resume analyzed successfully. Review and confirm changes before saving.",
                "data": {
                    "review_mode": True,
                    "extracted_data": extracted_data,
                    "clean_text_preview": clean_text[:1000] if clean_text else "",
                    "current_profile": ProfileModel.to_dict(profile),
                    "resume_meta": {
                        "fileName": resume_info.get("fileName"),
                        "fileSize": resume_info.get("fileSize"),
                        "uploadedAt": resume_info.get("uploadedAt"),
                        "analysisStatus": "analyzed"
                    }
                }
            }), 200

        # Step 3: Default/Legacy Upsert into Profile with Provenance
        updated_profile = ProfileModel.upsert_from_resume_extraction(
            user_id=user_id,
            extracted_data=extracted_data,
            resume_meta=resume_info
        )
        res_data = ProfileModel.to_dict(updated_profile)
        res_data["extracted_data"] = extracted_data

        return jsonify({
            "success": True,
            "message": "Resume analyzed successfully",
            "data": res_data
        }), 200

    except ValueError as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "error": "EXTRACTION_ERROR"
        }), 422
    except Exception as e:
        logger.exception("Error analyzing resume for user %s: %s", user_id, str(e))
        return jsonify({
            "success": False,
            "message": "Resume analysis failed. Please verify the document format or try again later.",
            "error": "ANALYSIS_FAILED"
        }), 500

@resume_bp.route("/confirm-extraction", methods=["POST"])
@token_required
def confirm_extraction(current_user):
    """
    Applies student-reviewed and approved resume extraction fields to their profile.
    Only merges fields explicitly chosen and confirmed by the student.
    Guarantees that manual/user-confirmed fields are not overwritten without student choice.
    """
    user_id = str(current_user["_id"])
    payload = request.get_json(silent=True) or {}

    confirmed_data = payload.get("confirmed_data", payload)
    selected_fields = payload.get("selected_fields")
    field_choices = payload.get("field_choices", {})

    if not isinstance(confirmed_data, dict):
        return jsonify({
            "success": False,
            "message": "Payload must contain 'confirmed_data' as a JSON object.",
            "error": "BAD_REQUEST"
        }), 400

    try:
        updated_profile = ProfileModel.confirm_resume_extraction(
            user_id=user_id,
            confirmed_data=confirmed_data,
            selected_fields=selected_fields,
            field_choices=field_choices
        )

        return jsonify({
            "success": True,
            "message": "Confirmed resume details applied to your profile successfully.",
            "data": updated_profile
        }), 200
    except ValueError as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "error": "VALIDATION_ERROR"
        }), 400
    except Exception as e:
        logger.exception("Error confirming extraction for user %s: %s", user_id, str(e))
        return jsonify({
            "success": False,
            "message": "Failed to apply confirmed extraction changes.",
            "error": "INTERNAL_ERROR"
        }), 500

@resume_bp.route("", methods=["GET"])
@token_required
def get_resume(current_user):
    """Returns the metadata of current user's uploaded resume."""
    user_id = str(current_user["_id"])
    profile = ProfileModel.find_by_user_id(user_id)

    resume_data = profile.get("resume") if profile else None

    # Check disk fallback if profile metadata is not set
    if not resume_data or not resume_data.get("fileName") or not resume_data.get("filePath"):
        upload_root = current_app.config.get("UPLOAD_FOLDER", os.path.join(os.getcwd(), "uploads"))
        user_folder = os.path.join(upload_root, "resumes", user_id)
        if os.path.exists(user_folder):
            pdf_files = [f for f in os.listdir(user_folder) if f.lower().endswith(".pdf")]
            if pdf_files:
                latest_pdf = sorted(pdf_files, key=lambda f: os.path.getmtime(os.path.join(user_folder, f)))[-1]
                file_path = os.path.join(user_folder, latest_pdf)
                resume_data = {
                    "fileName": latest_pdf,
                    "filePath": file_path,
                    "fileSize": os.path.getsize(file_path),
                    "uploadedAt": datetime.now(timezone.utc).isoformat(),
                    "parsed": profile.get("resume", {}).get("parsed", False) if profile else False,
                    "analysisStatus": profile.get("resume", {}).get("analysisStatus", "pending") if profile else "pending"
                }
                ProfileModel.update_profile(user_id, {"resume": resume_data})

    if not resume_data or not resume_data.get("fileName"):
        return jsonify({
            "success": True,
            "message": "No resume uploaded yet",
            "data": {
                "uploaded": False,
                "resume": None
            }
        }), 200

    safe_resume = dict(resume_data)
    # Exclude internal absolute filesystem path for security
    safe_resume.pop("filePath", None)

    return jsonify({
        "success": True,
        "message": "Resume metadata retrieved",
        "data": {
            "uploaded": True,
            "resume": safe_resume
        }
    }), 200
