"""Content Filter Service for child safety"""

import logging
from typing import List
from app.config import settings

logger = logging.getLogger(__name__)


class ContentFilter:
    """Service for filtering inappropriate content"""

    def __init__(self):
        # Basic list of inappropriate keywords for children
        self.blocked_keywords = [
            # Add inappropriate keywords here
            # This is a simplified version
        ]

        # Educational keywords to ensure content is on-topic (Portuguese and English)
        self.educational_keywords = [
            # Portuguese
            "matemática",
            "número",
            "conta",
            "problema",
            "equação",
            "soma",
            "subtração",
            "multiplicação",
            "divisão",
            "fração",
            "decimal",
            "geometria",
            "álgebra",
            "calcular",
            "resolver",
            "exercício",
            "tarefa",
            "ajuda",
            "explicar",
            "entender",
            "aprender",
            # English
            "math",
            "number",
            "count",
            "problem",
            "equation",
            "addition",
            "subtraction",
            "multiplication",
            "division",
            "fraction",
            "decimal",
            "geometry",
            "algebra",
            "calculate",
            "solve",
            "exercise",
            "homework",
            "help",
            "explain",
            "understand",
            "learn",
            "operation",
            "drew",
            "sketch",
            "image",
        ]

    async def is_appropriate(self, text: str) -> bool:
        """
        Check if content is appropriate for children

        Args:
            text: Text to check

        Returns:
            True if content is appropriate
        """
        if not settings.CONTENT_FILTER_ENABLED:
            return True

        text_lower = text.lower()

        # Check for blocked content
        for keyword in self.blocked_keywords:
            if keyword in text_lower:
                logger.warning(f"Blocked content detected: {keyword}")
                return False

        # Check message length
        if len(text) > settings.MAX_MESSAGE_LENGTH:
            logger.warning(f"Message too long: {len(text)} characters")
            return False

        # For very short messages, always allow
        if len(text) < 10:
            return True

        # Check if message is educational (optional)
        # This helps ensure the chat stays focused on math education
        has_educational_content = any(
            keyword in text_lower for keyword in self.educational_keywords
        )

        # Allow greetings and basic interactions
        greetings = [
            "olá",
            "oi",
            "bom dia",
            "boa tarde",
            "boa noite",
            "obrigado",
            "obrigada",
            "tchau",
            "até",
        ]
        is_greeting = any(g in text_lower for g in greetings)

        # If it's not a greeting and has no educational content, log it
        # but still allow it (you can make this stricter if needed)
        if not has_educational_content and not is_greeting:
            logger.info(f"Non-educational content: {text[:50]}...")

        return True
