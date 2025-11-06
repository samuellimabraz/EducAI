"""OCR Service for extracting text from images using OlmOCR"""

import httpx
import base64
import logging
from typing import Dict, Any, Optional
from PIL import Image
import io
from app.config import settings

logger = logging.getLogger(__name__)


class OCRService:
    """Service for OCR operations using AllenAI OlmOCR via vLLM"""

    def __init__(self):
        self.base_url = settings.OLMOCR_URL  # This points to vLLM server
        self.client = httpx.AsyncClient(timeout=120.0)
        self.model_name = "olmocr"

    async def initialize(self):
        """Initialize the service"""
        logger.info("OCR Service initialized for OlmOCR via vLLM")

    async def cleanup(self):
        """Cleanup resources"""
        await self.client.aclose()

    def is_healthy(self) -> bool:
        """Check if service is healthy"""
        try:
            # Check vLLM server health
            response = httpx.get(f"{self.base_url}/health", timeout=5.0)
            return response.status_code == 200
        except:
            return False

    async def extract_text(self, image_path: str) -> str:
        """
        Extract text from image file using OlmOCR

        Args:
            image_path: Path to image file

        Returns:
            Extracted text in markdown format
        """
        try:
            # Read and process image
            with Image.open(image_path) as img:
                # Convert to RGB if necessary
                if img.mode != "RGB":
                    img = img.convert("RGB")
                
                # Convert to base64
                buffered = io.BytesIO()
                img.save(buffered, format="PNG")
                image_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

            # Create the request for OlmOCR via vLLM
            # OlmOCR expects messages in OpenAI format
            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_base64}"
                            }
                        },
                        {
                            "type": "text",
                            "text": "Extract all text from this image. Include mathematical formulas, tables, and preserve formatting. Return the result in markdown format."
                        }
                    ]
                }
            ]

            # Call vLLM API with OlmOCR model
            response = await self.client.post(
                f"{self.base_url}/chat/completions",
                json={
                    "model": self.model_name,
                    "messages": messages,
                    "temperature": 0.1,  # Low temperature for consistent OCR
                    "max_tokens": 4096,
                    "stream": False
                },
            )
            response.raise_for_status()

            result = response.json()
            extracted_text = result["choices"][0]["message"]["content"]
            
            logger.info(f"Successfully extracted text from {image_path}")
            return extracted_text

        except Exception as e:
            logger.error(f"Error extracting text from {image_path}: {str(e)}")
            raise

    async def extract_text_detailed(self, image_path: str) -> Dict[str, Any]:
        """
        Extract text with detailed information including formulas and tables

        Args:
            image_path: Path to image file

        Returns:
            Detailed extraction results including formulas and tables
        """
        try:
            # Extract text using the main method
            text = await self.extract_text(image_path)
            
            # Parse the markdown for additional information
            import re
            
            # Extract LaTeX formulas
            formulas = []
            
            # Find inline math $...$
            inline_pattern = r'\$([^\$]+)\$'
            inline_matches = re.findall(inline_pattern, text)
            formulas.extend([{"type": "inline", "formula": f} for f in inline_matches])
            
            # Find display math $$...$$
            display_pattern = r'\$\$([^\$]+)\$\$'
            display_matches = re.findall(display_pattern, text)
            formulas.extend([{"type": "display", "formula": f} for f in display_matches])
            
            # Check for tables (simple detection based on markdown table syntax)
            has_tables = '|' in text and '---' in text
            
            # Extract tables if present
            tables = []
            if has_tables:
                # Simple table extraction from markdown
                lines = text.split('\n')
                current_table = []
                in_table = False
                
                for line in lines:
                    if '|' in line:
                        if not in_table:
                            in_table = True
                            current_table = []
                        # Parse table row
                        cells = [cell.strip() for cell in line.split('|')]
                        cells = [c for c in cells if c]  # Remove empty cells
                        if cells and not all('---' in c for c in cells):  # Skip separator rows
                            current_table.append(cells)
                    else:
                        if in_table and current_table:
                            tables.append(current_table)
                            current_table = []
                        in_table = False
                
                # Add last table if exists
                if current_table:
                    tables.append(current_table)
            
            return {
                "text": text,
                "format": "markdown",
                "has_math": len(formulas) > 0,
                "has_tables": has_tables,
                "formulas": formulas,
                "tables": tables,
                "confidence": 0.95  # OlmOCR generally has high confidence
            }

        except Exception as e:
            logger.error(f"Error in detailed text extraction: {str(e)}")
            raise