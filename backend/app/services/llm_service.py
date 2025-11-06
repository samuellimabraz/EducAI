"""LLM Service for educational chat interactions"""

import httpx
import json
import logging
from typing import Dict, Any, List, Optional
from app.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    """Service for interacting with the LLM server"""
    
    def __init__(self):
        self.base_url = settings.LLM_URL
        self.client = httpx.AsyncClient(timeout=60.0)
        self.sessions = {}  # In-memory session storage (use Redis in production)
        
    async def initialize(self):
        """Initialize the service"""
        logger.info("LLM Service initialized")
        
    async def cleanup(self):
        """Cleanup resources"""
        await self.client.aclose()
        
    def is_healthy(self) -> bool:
        """Check if service is healthy"""
        # TODO: Implement actual health check
        return True
        
    async def generate_response(
        self,
        prompt: str,
        session_id: Optional[str] = None,
        context: str = "elementary_math"
    ) -> Dict[str, Any]:
        """
        Generate educational response from LLM
        
        Args:
            prompt: User's message
            session_id: Session identifier for conversation continuity
            context: Educational context
            
        Returns:
            Response dictionary with text and metadata
        """
        try:
            # Get conversation history
            history = self.get_session_history(session_id) if session_id else []
            
            # Prepare messages for the LLM
            messages = [
                {"role": "system", "content": settings.LLM_SYSTEM_PROMPT}
            ]
            
            # Add conversation history
            for msg in history[-10:]:  # Keep last 10 messages for context
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
            
            # Add current user message
            messages.append({"role": "user", "content": prompt})
            
            # Call LLM API
            response = await self.client.post(
                f"{self.base_url}/v1/chat/completions",
                json={
                    "model": "Qwen2.5-Math-7B-Instruct",
                    "messages": messages,
                    "temperature": settings.LLM_TEMPERATURE,
                    "max_tokens": settings.LLM_MAX_TOKENS,
                    "stream": False
                }
            )
            response.raise_for_status()
            
            result = response.json()
            assistant_message = result["choices"][0]["message"]["content"]
            
            # Store in session history
            if session_id:
                self.add_to_history(session_id, "user", prompt)
                self.add_to_history(session_id, "assistant", assistant_message)
            
            # Generate suggestions based on response
            suggestions = self.generate_suggestions(assistant_message, context)
            
            # Check if visualization is needed
            visualization = self.check_visualization_needs(assistant_message)
            
            return {
                "text": assistant_message,
                "session_id": session_id or "new",
                "suggestions": suggestions,
                "visualization": visualization
            }
            
        except Exception as e:
            logger.error(f"Error generating LLM response: {str(e)}")
            raise
            
    def get_session_history(self, session_id: str) -> List[Dict]:
        """Get conversation history for a session"""
        if session_id not in self.sessions:
            self.sessions[session_id] = []
        return self.sessions[session_id]
        
    def add_to_history(self, session_id: str, role: str, content: str):
        """Add message to session history"""
        if session_id not in self.sessions:
            self.sessions[session_id] = []
        self.sessions[session_id].append({
            "role": role,
            "content": content
        })
        
    async def get_history(self, session_id: str) -> List[Dict]:
        """Get full conversation history"""
        return self.get_session_history(session_id)
        
    async def clear_history(self, session_id: str):
        """Clear conversation history"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            
    def generate_suggestions(self, response: str, context: str) -> List[str]:
        """Generate follow-up suggestions based on response"""
        suggestions = []
        
        # Math-specific suggestions
        if "equação" in response.lower():
            suggestions.append("Me mostre outro exemplo")
            suggestions.append("Como resolver equações mais difíceis?")
        elif "fração" in response.lower():
            suggestions.append("Como simplificar frações?")
            suggestions.append("Quero praticar mais frações")
        elif "geometria" in response.lower():
            suggestions.append("Mostre as fórmulas de área")
            suggestions.append("O que é perímetro?")
        else:
            # Generic suggestions
            suggestions = [
                "Quero resolver um problema",
                "Me explique a tabuada",
                "Ajude com meu dever de casa"
            ]
            
        return suggestions[:3]  # Return max 3 suggestions
        
    def check_visualization_needs(self, response: str) -> Optional[Dict]:
        """Check if response needs visualization"""
        # Check for graph-related keywords
        if any(word in response.lower() for word in ["gráfico", "função", "reta", "parábola"]):
            return {
                "type": "graph",
                "data": None  # To be filled by graph service
            }
        
        # Check for calculation needs
        if any(word in response.lower() for word in ["calcule", "resultado", "soma", "multiplicação"]):
            return {
                "type": "calculation",
                "data": None
            }
            
        return None
