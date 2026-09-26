import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base application configuration loaded from environment variables."""
    ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = ENV == "development"
    PORT = int(os.getenv("FLASK_PORT", 5000))
    SECRET_KEY = os.getenv("SECRET_KEY", "careerpilot_default_secret_key")
    
    # MongoDB
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/careerpilot_ai")
    
    # JWT
    JWT_SECRET = os.getenv("JWT_SECRET", "supersecret_jwt_dev_key")
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRATION_HOURS = 24
    
    # Gemini
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    
    # CORS
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # Uploads
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB limit
