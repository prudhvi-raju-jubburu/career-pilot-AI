from app.scrapers.base import OpportunitySource
from app.scrapers.unstop_connector import UnstopConnector
from app.scrapers.remotive_connector import RemotiveConnector
from app.scrapers.devfolio_connector import DevfolioConnector
from app.scrapers.codeforces_connector import CodeforcesConnector
from app.scrapers.scholarship_connector import ScholarshipConnector
from app.scrapers.arbeitnow_connector import ArbeitnowConnector

__all__ = [
    "OpportunitySource",
    "UnstopConnector",
    "RemotiveConnector",
    "DevfolioConnector",
    "CodeforcesConnector",
    "ScholarshipConnector",
    "ArbeitnowConnector"
]
