import os
import logging
from typing import Dict, Any, List, Generator

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are CareerPilot AI's Senior Career Advisor & Mentor.
You are assisting an ambitious engineering student in navigating technical careers, internships,
hackathons, coding contests, and campus placements.

YOUR GOAL:
Provide actionable, high-impact, candid, and structured guidance tailored specifically
to the student's background, skills, and target career goals.

GUIDELINES:
1. Always structure your responses with clear markdown headings, bullet points, and code/action blocks.
2. Focus on high-signal advice: STAR-method bullet points for resumes, system design & algorithmic tips, specific open-source or full-stack project ideas, and interview strategies.
3. Keep advice realistic, encouraging, and technically rigorous.
4. When relevant, reference their target role and specific skills to bridge gaps.
"""

class AdvisorAgentService:
    """
    AI Career Advisor service leveraging Gemini AI with student context injection.
    """

    @classmethod
    def _build_context_prompt(cls, user_message: str, student_profile: Dict[str, Any], history: List[Dict[str, Any]]) -> str:
        name = student_profile.get("name") or "Student"
        edu = student_profile.get("education") or {}
        branch = edu.get("branch") or "Computer Science"
        cgpa = edu.get("cgpa") or "N/A"
        college = edu.get("college") or "University"
        skills = student_profile.get("skills") or []
        if isinstance(skills, dict):
            flattened = []
            for v in skills.values():
                if isinstance(v, list):
                    flattened.extend(v)
                elif isinstance(v, dict) and "value" in v and isinstance(v["value"], list):
                    flattened.extend(v["value"])
            skills_str = ", ".join(flattened[:15]) if flattened else "Software Engineering fundamentals"
        elif isinstance(skills, list):
            skills_str = ", ".join(skills[:15])
        else:
            skills_str = "Python, React, Node.js, SQL"

        prefs = student_profile.get("preferences") or {}
        target_role = prefs.get("targetRoles") or prefs.get("targetRole") or "Software Engineer"
        if isinstance(target_role, list):
            target_role = target_role[0] if target_role else "Software Engineer"

        history_text = ""
        for h in history[-6:]:
            role = "Student" if h.get("role") == "user" else "Advisor"
            history_text += f"{role}: {h.get('content', '')}\n"

        prompt = f"""{SYSTEM_PROMPT}

STUDENT CONTEXT:
- Name: {name}
- College: {college}
- Branch: {branch} (CGPA: {cgpa})
- Target Role: {target_role}
- Skills: {skills_str}

CONVERSATION HISTORY:
{history_text}
Student: {user_message}
Advisor:"""
        return prompt

    @classmethod
    def generate_response(cls, user_message: str, student_profile: Dict[str, Any], history: List[Dict[str, Any]]) -> str:
        gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()

        if gemini_api_key:
            try:
                from google import genai
                client = genai.Client(api_key=gemini_api_key)
                prompt = cls._build_context_prompt(user_message, student_profile, history)
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                if response and response.text:
                    return response.text
            except Exception as e:
                logger.warning("Gemini API call failed (%s). Falling back to specialized rule advisor.", str(e))

        # Robust, high-value specialized fallback advisor
        return cls._generate_fallback_response(user_message, student_profile)

    @classmethod
    def stream_response(cls, user_message: str, student_profile: Dict[str, Any], history: List[Dict[str, Any]]) -> Generator[str, None, None]:
        gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()

        if gemini_api_key:
            try:
                from google import genai
                client = genai.Client(api_key=gemini_api_key)
                prompt = cls._build_context_prompt(user_message, student_profile, history)
                response_stream = client.models.generate_content_stream(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                for chunk in response_stream:
                    if chunk.text:
                        yield chunk.text
                return
            except Exception as e:
                logger.warning("Gemini streaming failed (%s). Yielding fallback chunks.", str(e))

        # Fallback stream
        full_text = cls._generate_fallback_response(user_message, student_profile)
        words = full_text.split(" ")
        for i in range(0, len(words), 4):
            yield " ".join(words[i:i+4]) + " "

    @classmethod
    def _generate_fallback_response(cls, user_message: str, profile: Dict[str, Any]) -> str:
        msg = user_message.lower()
        name = profile.get("name") or "there"
        edu = profile.get("education") or {}
        branch = edu.get("branch") or "Engineering"

        if any(w in msg for w in ["resume", "cv", "ats"]):
            return (
                f"### 📋 ATS Resume Optimization Audit for {name}\n\n"
                f"Based on your background in **{branch}**, here is your action plan to pass top ATS filters:\n\n"
                f"1. **STAR Impact Formula**: Transform passive task lists into quantified accomplishments:\n"
                f"   - *Instead of*: \"Built a React frontend for task management.\"\n"
                f"   - *Write*: \"Engineered responsive dashboard using React & WebSockets, cutting page load latency by 38% for 2,000+ test users.\"\n"
                f"2. **Group Technical Competencies**: Prominently display Languages, Frameworks, Cloud, and Databases at the top.\n"
                f"3. **Hyperlinked Proof of Work**: Ensure each project links directly to public GitHub repositories and deployed live demonstrations."
            )
        elif any(w in msg for w in ["interview", "prep", "dsa", "coding"]):
            return (
                f"### 🎯 Technical Interview Preparation Strategy\n\n"
                f"To excel in software engineering and technical rounds:\n\n"
                f"1. **Core Problem Patterns**: Focus on the top 5 high-yield patterns:\n"
                f"   - Two Pointers & Sliding Window\n"
                f"   - Fast & Slow Pointers (Linked Lists)\n"
                f"   - Breadth-First & Depth-First Search on Trees and Graphs\n"
                f"   - Dynamic Programming (0/1 Knapsack, Longest Common Subsequence)\n"
                f"2. **Simulate Timed Contests**: Participate in weekly Codeforces and contest rounds to build high-pressure problem-solving stamina.\n"
                f"3. **Verbalize Your Thought Process**: Always state brute force time complexity before optimizing."
            )
        else:
            return (
                f"### 🚀 Career Roadmap Acceleration\n\n"
                f"Hello {name}! Here are 3 tactical steps to maximize your placement trajectory right now:\n\n"
                f"1. **Production Portfolio Project**: Build and deploy an end-to-end full-stack application featuring authentication, background worker queues, and caching.\n"
                f"2. **Targeted Pipeline Tracking**: Move opportunities from your **Radar** into active **Applications** to keep deadlines and recruiter follow-ups organized.\n"
                f"3. **Skill Gap Remediation**: Check your **Skill Gap Analysis** dashboard to identify high-importance missing skills for your preferred roles."
            )
