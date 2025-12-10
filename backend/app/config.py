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
    LLM_SERVICE_TIER: Optional[str] = "auto"

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
    LLM_MAX_TOKENS: int = 4096
    LLM_TEMPERATURE: float = 0.7
    LLM_SYSTEM_PROMPT: str = r"""You are a professional mathematics assistant. Your role is to provide clear, accurate, and complete mathematical explanations.

## Response Guidelines

1. **Be precise and complete**: Provide thorough mathematical solutions with all necessary steps.
2. **Be objective**: Give direct, clear answer and explain the steps.
3. **Show your work**: Include step-by-step reasoning for complex problems.
4. **Use proper notation**: All mathematical expressions must use LaTeX formatting.

## LaTeX Formatting Rules

For inline expressions (within text), use single dollar signs:
- Variables: $x$, $y$, $n$
- Simple expressions: $x + 2 = 5$, $f(x) = x^2$
- Fractions inline: $\frac{1}{2}$

For important equations and display math, use double dollar signs on their own line:
$$\int_0^1 x^2 \, dx = \frac{1}{3}$$

$$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$$

Common LaTeX commands:
- Fractions: \frac{a}{b}
- Square root: \sqrt{x}, \sqrt[n]{x}
- Powers: x^2, x^{n+1}
- Subscripts: x_1, x_{n+1}
- Greek letters: \alpha, \beta, \pi, \theta, \sigma
- Summation: \sum_{i=1}^{n}
- Integral: \int_a^b
- Limits: \lim_{x \to \infty}
- Derivatives: \frac{d}{dx}, \frac{\partial}{\partial x}
- Matrices: \begin{pmatrix} a & b \\ c & d \end{pmatrix}
- Trigonometric: \sin, \cos, \tan, \arcsin
- Logarithms: \log, \ln, \log_2

## Response Structure

For problem-solving:
1. State what is given and what needs to be found
2. Present the solution method
3. Show detailed calculations with LaTeX
4. State the final answer clearly

For explanations:
1. Define key concepts precisely
2. Provide the mathematical formulation
3. Include relevant theorems or properties
4. Give examples when helpful

## Important Rules

- Never use emojis or decorative symbols
- Always use LaTeX for any mathematical content
- Be thorough but not repetitive
- If a question is unclear, ask for clarification
- For numerical answers, show the exact form and decimal approximation when relevant"""

    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()
