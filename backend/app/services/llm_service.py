"""LLM Service for educational chat interactions"""

import httpx
import json
import logging
from typing import Dict, Any, List, Optional, AsyncGenerator
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.config import settings
from app.database import AsyncSessionLocal
from app.db_models import Session, Message

logger = logging.getLogger(__name__)


class LLMService:
    """Service for interacting with the LLM server"""

    def __init__(self):
        self.base_url = settings.LLM_URL
        self.model_name = settings.LLM_MODEL

        # Configure headers with API key if using HF endpoints
        headers = {"Content-Type": "application/json"}
        if settings.LLM_API_KEY:
            headers["Authorization"] = f"Bearer {settings.LLM_API_KEY}"

        self.client = httpx.AsyncClient(timeout=120.0, headers=headers)

    async def initialize(self):
        """Initialize the service"""
        endpoint_type = "HF Endpoints" if settings.USE_HF_ENDPOINTS else "vLLM"
        logger.info(f"LLM Service initialized via {endpoint_type}")
        logger.info(f"Using model: {self.model_name} at {self.base_url}")

    async def cleanup(self):
        """Cleanup resources"""
        await self.client.aclose()

    def is_healthy(self) -> bool:
        """Check if service is healthy"""
        try:
            if settings.USE_HF_ENDPOINTS:
                # For HF endpoints, just check if URL is reachable
                return True  # Assume healthy if configured
            else:
                # Check vLLM server health
                response = httpx.get(f"{self.base_url}/health", timeout=5.0)
                return response.status_code == 200
        except:
            return False

    async def generate_response(
        self,
        prompt: str,
        session_id: Optional[str] = None,
        context: str = "elementary_math",
    ) -> Dict[str, Any]:
        """
        Generate educational response from LLM (non-streaming)

        Args:
            prompt: User's message
            session_id: Session identifier for conversation continuity
            context: Educational context

        Returns:
            Response dictionary with text and metadata
        """
        try:
            history = await self.get_session_history(session_id) if session_id else []
            messages = [{"role": "system", "content": settings.LLM_SYSTEM_PROMPT}]

            for msg in history[-10:]:
                messages.append({"role": msg["role"], "content": msg["content"]})

            messages.append({"role": "user", "content": prompt})

            request_body = {
                "model": self.model_name,
                "messages": messages,
                "temperature": settings.LLM_TEMPERATURE,
                "max_tokens": settings.LLM_MAX_TOKENS,
                "stream": False,
            }
            if settings.LLM_SERVICE_TIER:
                request_body["service_tier"] = settings.LLM_SERVICE_TIER

            response = await self.client.post(
                f"{self.base_url}/chat/completions",
                json=request_body,
            )
            response.raise_for_status()

            result = response.json()
            choice = result.get("choices", [{}])[0]
            message = choice.get("message", {})

            assistant_message = message.get("content")
            if not assistant_message and "reasoning_content" in message:
                logger.warning("Model returned reasoning but no content")
                assistant_message = (
                    "Sorry, I need more time to think. Can you rephrase your question?"
                )

            if not assistant_message:
                logger.warning("No response from LLM")
                assistant_message = (
                    "Sorry, I couldn't process your message. Please try again."
                )

            if session_id:
                has_image = "Image text:" in prompt  # Check if prompt contains image
                await self.add_to_history(
                    session_id, "user", prompt, has_image=has_image
                )
                await self.add_to_history(session_id, "assistant", assistant_message)

            suggestions = self.generate_suggestions(assistant_message, context)
            visualization = self.check_visualization_needs(assistant_message)

            return {
                "text": assistant_message,
                "session_id": session_id or "new",
                "suggestions": suggestions,
                "visualization": visualization,
            }

        except Exception as e:
            import traceback

            logger.error(f"Error generating LLM response: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise

    async def generate_response_stream(
        self,
        prompt: str,
        session_id: Optional[str] = None,
        context: str = "elementary_math",
    ):
        """
        Generate educational response from LLM with streaming

        Args:
            prompt: User's message
            session_id: Session identifier for conversation continuity
            context: Educational context

        Yields:
            Text chunks as they are generated
        """
        try:
            history = await self.get_session_history(session_id) if session_id else []
            messages = [{"role": "system", "content": settings.LLM_SYSTEM_PROMPT}]

            for msg in history[-10:]:
                messages.append({"role": msg["role"], "content": msg["content"]})

            messages.append({"role": "user", "content": prompt})

            # Stream response from LLM
            full_response = ""
            request_body = {
                "model": self.model_name,
                "messages": messages,
                "temperature": settings.LLM_TEMPERATURE,
                "max_tokens": settings.LLM_MAX_TOKENS,
                "stream": True,
            }
            if settings.LLM_SERVICE_TIER:
                request_body["service_tier"] = settings.LLM_SERVICE_TIER

            async with self.client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                json=request_body,
            ) as response:
                response.raise_for_status()

                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break

                        try:
                            chunk_data = json.loads(data)
                            delta = chunk_data.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content")

                            if content:
                                full_response += content
                                yield content
                        except json.JSONDecodeError:
                            continue

            # Store in session history
            if session_id and full_response:
                has_image = "Image text:" in prompt  # Check if prompt contains image
                await self.add_to_history(
                    session_id, "user", prompt, has_image=has_image
                )
                await self.add_to_history(session_id, "assistant", full_response)

        except Exception as e:
            import traceback

            logger.error(f"Error streaming LLM response: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            yield "An error occurred while processing your request. Please try again."

    async def get_session_history(self, session_id: str) -> List[Dict]:
        """Get conversation history for a session from database"""
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(Session)
                    .options(selectinload(Session.messages))
                    .where(Session.id == session_id)
                )
                session = result.scalar_one_or_none()

                if not session:
                    return []

                return [
                    {"role": msg.role, "content": msg.content}
                    for msg in sorted(session.messages, key=lambda x: x.timestamp)
                ]
        except Exception as e:
            logger.error(f"Error getting session history: {str(e)}")
            return []

    async def add_to_history(
        self, session_id: str, role: str, content: str, has_image: bool = False
    ):
        """Add message to session history in database"""
        try:
            async with AsyncSessionLocal() as db:
                # Ensure session exists
                result = await db.execute(
                    select(Session).where(Session.id == session_id)
                )
                session = result.scalar_one_or_none()

                if not session:
                    session = Session(id=session_id, name="New Chat")
                    db.add(session)
                else:
                    session.updated_at = datetime.utcnow()

                # Add message
                message = Message(
                    session_id=session_id,
                    role=role,
                    content=content,
                    has_image=has_image,
                )
                db.add(message)
                await db.commit()
        except Exception as e:
            logger.error(f"Error adding to history: {str(e)}")

    async def get_history(self, session_id: str) -> List[Dict]:
        """Get full conversation history with metadata"""
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(Session)
                    .options(selectinload(Session.messages))
                    .where(Session.id == session_id)
                )
                session = result.scalar_one_or_none()

                if not session:
                    return []

                return [
                    {
                        "role": msg.role,
                        "content": msg.content,
                        "timestamp": msg.timestamp.isoformat(),
                        "has_image": msg.has_image,
                    }
                    for msg in sorted(session.messages, key=lambda x: x.timestamp)
                ]
        except Exception as e:
            logger.error(f"Error getting history: {str(e)}")
            return []

    async def clear_history(self, session_id: str):
        """Clear conversation history"""
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(Session).where(Session.id == session_id)
                )
                session = result.scalar_one_or_none()

                if session:
                    await db.delete(session)
                    await db.commit()
        except Exception as e:
            logger.error(f"Error clearing history: {str(e)}")

    def generate_suggestions(self, response: str, context: str) -> List[str]:
        """Generate follow-up suggestions based on response"""
        # Simplified - return empty suggestions
        # Frontend can provide its own suggestions if needed
        return []

    def check_visualization_needs(self, response: str) -> Optional[Dict]:
        """Check if response needs visualization"""
        # Handle None response
        if not response:
            return None

        # Check for graph-related keywords
        if any(
            word in response.lower()
            for word in ["gráfico", "função", "reta", "parábola"]
        ):
            return {"type": "graph", "data": None}  # To be filled by graph service

        # Check for calculation needs
        if any(
            word in response.lower()
            for word in ["calcule", "resultado", "soma", "multiplicação"]
        ):
            return {"type": "calculation", "data": None}

        return None
