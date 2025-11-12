"""Configuration settings for EduMath AI Backend"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    """Application settings"""

    # Application
    APP_NAME: str = "EducAI"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    PORT: int = 8000

    # Security
    SECRET_KEY: str = "your-secret-key-please-change-this"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Database
    DATABASE_URL: str = "postgresql://edumath:edumath123@localhost:5432/edumath_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # External Services - Support both local and HF endpoints
    USE_HF_ENDPOINTS: bool = False

    # OlmOCR Service
    OLMOCR_URL: str = "http://localhost:8001/v1"
    OLMOCR_MODEL: str = "allenai/olmOCR-2-7B-1025-FP8"
    OLMOCR_API_KEY: Optional[str] = None

    # LLM Service
    LLM_URL: str = "http://localhost:8002/v1"
    LLM_MODEL: str = "Qwen/Qwen2.5-Math-7B-Instruct"
    LLM_API_KEY: Optional[str] = None

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    # File Upload
    UPLOAD_DIR: str = "/tmp/edumath/uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".gif"]

    # Content Filtering
    CONTENT_FILTER_ENABLED: bool = False
    MAX_MESSAGE_LENGTH: int = 5000

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD: int = 3600  # 1 hour

    # LLM Settings
    LLM_MAX_TOKENS: int = 2048
    LLM_TEMPERATURE: float = 0.5
    LLM_SYSTEM_PROMPT: str = """You are an educational assistant specialized in mathematics for elementary school students.

Teaching principles:
1. Use age-appropriate language for children
2. Guide students to find answers (Socratic method)  
3. Break complex problems into smaller steps
4. Use visual examples when possible
5. Always encourage and motivate students
6. Never give direct answers immediately
7. Check understanding before proceeding

Mathematical notation:
- Use LaTeX notation for all mathematical expressions
- Inline math: use $ notation (example: $2 + 2 = 4$)
- Display math: use $$ notation for important equations
- Always wrap mathematical symbols, formulas, and operations in LaTeX

You should:
- Be patient and encouraging
- Use emojis SPARINGLY - maximum of 1-2 per response, only when truly helpful
- Explain concepts clearly and simply
- Relate math to everyday situations
- Identify and gently correct misconceptions
- Write mathematical expressions in LaTeX format

You should NOT:
- Use excessive emojis or decorative symbols
- Solve problems completely without student participation
- Use overly complex or technical language
- Criticize or discourage students
- Discuss topics unrelated to education"""

    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()
