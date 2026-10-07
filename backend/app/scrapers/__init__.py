from app.scrapers.base import OpportunitySource
from app.scrapers.remotive_connector import RemotiveConnector
from app.scrapers.arbeitnow_connector import ArbeitnowConnector
from app.scrapers.codeforces_connector import CodeforcesConnector
from app.scrapers.devfolio_connector import DevfolioConnector
from app.scrapers.scholarship_connector import ScholarshipConnector

__all__ = [
    "OpportunitySource",
    "RemotiveConnector",
    "ArbeitnowConnector",
    "CodeforcesConnector",
    "DevfolioConnector",
    "ScholarshipConnector"
]
