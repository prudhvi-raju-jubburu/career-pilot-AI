from flask import Blueprint, request, jsonify
from app.utils.auth import token_required
from app.models.profile import ProfileModel
from app.models.learning_progress import LearningProgressModel
from app.services.skill_gap_service import SkillGapService
from app.services.resource_catalog import get_all_resources, get_resources_by_skill
from app.services.skill_requirements import TARGET_ROLE_REQUIREMENTS

skill_gap_bp = Blueprint("skill_gap", __name__)

def _extract_all_skills_from_profile(profile_data):
    """Flattens all category skills from a student's profile into a single list."""
    if not profile_data or not isinstance(profile_data, dict):
        return []
    
    skills_obj = profile_data.get("skills", {})
    all_skills = []
    
    for category, cat_data in skills_obj.items():
        if isinstance(cat_data, dict) and "value" in cat_data:
            val = cat_data["value"]
            if isinstance(val, list):
                all_skills.extend(val)
        elif isinstance(cat_data, list):
            all_skills.extend(cat_data)
            
    return list(dict.fromkeys([s.strip() for s in all_skills if isinstance(s, str) and s.strip()]))

@skill_gap_bp.route("", methods=["GET"])
@token_required
def get_skill_gap(current_user):
    """
    Computes skill gap for current student profile against their preferred target role
    or default role ('Software Engineer').
    """
    user_id = str(current_user["_id"])
    profile = ProfileModel.find_by_user_id(user_id) or {}
    
    # Extract target role from student preferences or query parameter
    target_role = request.args.get("targetRole")
    if not target_role:
        prefs = profile.get("preferences", {}) if isinstance(profile, dict) else {}
        target_roles = []
        if isinstance(prefs, dict):
            tr = prefs.get("targetRoles") or prefs.get("target_roles") or []
            if isinstance(tr, dict):
                target_roles = tr.get("value", [])
            elif isinstance(tr, list):
                target_roles = tr
            elif isinstance(tr, str):
                target_roles = [tr]
        target_role = target_roles[0] if target_roles else "Software Engineer"

    student_skills = _extract_all_skills_from_profile(profile)
    # Default skills fallback if student has not yet entered profile skills
    if not student_skills:
        student_skills = ["Python", "C++", "SQL", "React", "Flask", "MongoDB", "Git"]

    analysis = SkillGapService.analyze(
        student_skills=student_skills,
        target_role=target_role,
        user_profile=profile
    )

    # Attach any existing user learning progress
    progress_list = LearningProgressModel.get_user_progress(user_id)
    analysis["userProgress"] = progress_list

    return jsonify({
        "success": True,
        "message": f"Skill gap analysis calculated for {target_role}",
        "data": analysis
    }), 200

@skill_gap_bp.route("/analyze", methods=["POST"])
@token_required
def analyze_skill_gap(current_user):
    """
    Computes custom skill gap analysis for a specified target role, optional custom skills,
    or optional target opportunity.
    """
    user_id = str(current_user["_id"])
    profile = ProfileModel.find_by_user_id(user_id) or {}
    
    payload = request.get_json() or {}
    target_role = payload.get("targetRole", "Software Engineer")
    target_opportunity = payload.get("targetOpportunity")
    custom_skills = payload.get("skills")

    if custom_skills and isinstance(custom_skills, list):
        student_skills = custom_skills
    else:
        student_skills = _extract_all_skills_from_profile(profile)
        if not student_skills:
            student_skills = ["Python", "C++", "SQL", "React", "Flask", "MongoDB", "Git"]

    analysis = SkillGapService.analyze(
        student_skills=student_skills,
        target_role=target_role,
        target_opportunity=target_opportunity,
        user_profile=profile
    )

    progress_list = LearningProgressModel.get_user_progress(user_id)
    analysis["userProgress"] = progress_list

    return jsonify({
        "success": True,
        "message": f"Skill gap analysis generated for {target_role}",
        "data": analysis
    }), 200

@skill_gap_bp.route("/roadmap", methods=["GET"])
@token_required
def get_roadmap(current_user):
    """Returns the ordered learning roadmap (NOW -> NEXT -> AFTER THAT -> PROJECT)."""
    user_id = str(current_user["_id"])
    profile = ProfileModel.find_by_user_id(user_id) or {}
    
    target_role = request.args.get("targetRole", "Software Engineer")
    student_skills = _extract_all_skills_from_profile(profile)
    if not student_skills:
        student_skills = ["Python", "C++", "SQL", "React", "Flask", "MongoDB", "Git"]

    analysis = SkillGapService.analyze(
        student_skills=student_skills,
        target_role=target_role,
        user_profile=profile
    )

    return jsonify({
        "success": True,
        "message": "Personalized learning roadmap generated",
        "data": {
            "targetRole": target_role,
            "roadmap": analysis.get("roadmap", {}),
            "prioritySpotlight": analysis.get("prioritySpotlight", []),
            "futureSkills": analysis.get("futureSkills", [])
        }
    }), 200

@skill_gap_bp.route("/roles", methods=["GET"])
def get_supported_roles():
    """Returns all supported target roles with high-level descriptions."""
    roles = []
    for role_name, data in TARGET_ROLE_REQUIREMENTS.items():
        roles.append({
            "name": role_name,
            "category": data.get("category", "General"),
            "description": data.get("description", ""),
        })
    return jsonify({
        "success": True,
        "data": roles
    }), 200

# ---------------------------------------------------------------------------
# Learning Resources Endpoints
# ---------------------------------------------------------------------------

@skill_gap_bp.route("/resources", methods=["GET"])
def get_learning_resources():
    """Returns verified learning resources catalog, optionally filtered by skill."""
    skill = request.args.get("skill")
    if skill:
        resources = get_resources_by_skill(skill)
    else:
        resources = get_all_resources()

    return jsonify({
        "success": True,
        "count": len(resources),
        "data": resources
    }), 200

@skill_gap_bp.route("/resources/<string:skill_name>", methods=["GET"])
def get_skill_resources(skill_name):
    """Returns verified learning resources for a specific skill."""
    resources = get_resources_by_skill(skill_name)
    return jsonify({
        "success": True,
        "skill": skill_name,
        "count": len(resources),
        "data": resources
    }), 200

# ---------------------------------------------------------------------------
# Learning Progress Endpoints
# ---------------------------------------------------------------------------

@skill_gap_bp.route("/progress", methods=["GET"])
@token_required
def get_progress(current_user):
    """Retrieves all tracked skill learning progress for authenticated student."""
    user_id = str(current_user["_id"])
    progress = LearningProgressModel.get_user_progress(user_id)
    return jsonify({
        "success": True,
        "data": progress
    }), 200

@skill_gap_bp.route("/progress", methods=["POST"])
@token_required
def track_progress(current_user):
    """Creates or updates learning progress for a skill."""
    user_id = str(current_user["_id"])
    payload = request.get_json() or {}
    skill = payload.get("skill")

    if not skill:
        return jsonify({"success": False, "message": "Field 'skill' is required"}), 400

    updated = LearningProgressModel.update_progress(user_id, skill, payload)
    return jsonify({
        "success": True,
        "message": f"Updated progress for {skill}",
        "data": updated
    }), 200

@skill_gap_bp.route("/progress/<string:skill_name>", methods=["PUT"])
@token_required
def update_skill_progress(current_user, skill_name):
    """Updates status, completed topics, or progress percent for a specific skill."""
    user_id = str(current_user["_id"])
    payload = request.get_json() or {}

    updated = LearningProgressModel.update_progress(user_id, skill_name, payload)
    return jsonify({
        "success": True,
        "message": f"Updated progress for {skill_name}",
        "data": updated
    }), 200
