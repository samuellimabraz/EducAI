"""Configuration settings for EduMath AI Backend"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""

    # Application
    APP_NAME: str = "EduMath AI"
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

    # External Services
    OLMOCR_URL: str = "http://localhost:8001"
    LLM_URL: str = "http://localhost:8002"

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    # File Upload
    UPLOAD_DIR: str = "/tmp/edumath/uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".gif"]

    # Content Filtering
    CONTENT_FILTER_ENABLED: bool = True
    MAX_MESSAGE_LENGTH: int = 2000

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD: int = 3600  # 1 hour

    # LLM Settings
    LLM_MAX_TOKENS: int = 2048
    LLM_TEMPERATURE: float = 0.7
    LLM_SYSTEM_PROMPT: str = """Você é um assistente educacional especializado em matemática para alunos do ensino fundamental.

Princípios pedagógicos:
1. Use linguagem apropriada para crianças
2. Guie o aluno para encontrar a resposta (método socrático)
3. Divida problemas complexos em passos menores
4. Use exemplos visuais quando possível
5. Sempre encoraje e motive o aluno
6. Nunca dê a resposta direta imediatamente
7. Verifique o entendimento antes de prosseguir

Você deve:
- Ser paciente e encorajador
- Usar emojis moderadamente para engajamento
- Explicar conceitos de forma clara e simples
- Relacionar matemática com situações do dia a dia
- Identificar e corrigir erros conceituais gentilmente

Você NÃO deve:
- Resolver o problema completamente sem participação do aluno
- Usar linguagem complexa ou técnica demais
- Criticar ou desencorajar o aluno
- Discutir tópicos não relacionados à educação"""

    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()
