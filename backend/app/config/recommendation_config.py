"""
CareerPilot AI — Configurable Recommendation Weights & Thresholds
Tuneable hyperparameters for the hybrid recommendation engine.
"""

# Production-grade 5-factor scoring model
RECOMMENDATION_WEIGHTS = {
    # 1. Confirmed skill relevance (35%)
    "skill_relevance": 0.35,

    # 2. Target role and career preference (25%)
    "role_preference": 0.25,

    # 3. Project and experience relevance (15%)
    "project_experience": 0.15,

    # 4. Education and graduation fit (15%)
    "education_fit": 0.15,

    # 5. Location and work-mode preference (10%)
    "location_workmode": 0.10,

    # Compatibility aliases for legacy tests and inspectors
    "skill_match": 0.35,
    "semantic_fit": 0.25,
    "academic_fit": 0.15,
    "preference_fit": 0.10,
    "recency_quality": 0.05,
    "behavioral_signal": 0.05
}

# Quality thresholds
MIN_RECOMMENDED_SCORE = 50
MAX_STRETCH_SCORE = 49
MAX_REPETITIVE_COMPANY_PER_PAGE = 2

# Urgency boost settings
URGENCY_DAYS_THRESHOLD = 5
URGENCY_SCORE_BOOST = 10

# Watchlist boost
WATCHLIST_COMPANY_BOOST = 10
