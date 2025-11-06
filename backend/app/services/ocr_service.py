"""OCR Service for extracting text from images"""

import httpx
import base64
import logging
from typing import Dict, Any, Optional
from PIL import Image
import io
from app.config import settings

logger = logging.getLogger(__name__)


class OCRService:
    """Service for OCR operations using OlmOCR2"""
    
    def __init__(self):
        self.base_url = settings.OLMOCR_URL
        self.client = httpx.AsyncClient(timeout=30.0)
        
    async def initialize(self):
        """Initialize the service"""
        logger.info("OCR Service initialized")
        
    async def cleanup(self):
        """Cleanup resources"""
        await self.client.aclose()
        
    def is_healthy(self) -> bool:
        """Check if service is healthy"""
        # TODO: Implement actual health check
        return True
        
    async def extract_text(self, image_path: str) -> str:
        """
        Extract text from image file
        
        Args:
            image_path: Path to image file
            
        Returns:
            Extracted text
        """
        try:
            # Read and encode image
            with open(image_path, "rb") as f:
                image_bytes = f.read()
            
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            
            # Call OCR API
            response = await self.client.post(
                f"{self.base_url}/extract_base64",
                json={
                    "image_base64": image_base64,
                    "extract_math": True,
                    "extract_tables": True
                }
            )
            response.raise_for_status()
            
            result = response.json()
            return result["text"]
            
        except Exception as e:
            logger.error(f"Error extracting text: {str(e)}")
            raise
            
    async def extract_text_detailed(self, image_path: str) -> Dict[str, Any]:
        """
        Extract text with detailed information
        
        Args:
            image_path: Path to image file
            
        Returns:
            Detailed extraction results including formulas and tables
        """
        try:
            # Read and encode image
            with open(image_path, "rb") as f:
                image_bytes = f.read()
            
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            
            # Call OCR API
            response = await self.client.post(
                f"{self.base_url}/extract_base64",
                json={
                    "image_base64": image_base64,
                    "extract_math": True,
                    "extract_tables": True
                }
            )
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"Error in detailed text extraction: {str(e)}")
            raise
