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
    """Service for OCR operations using AllenAI OlmOCR via vLLM or HF Endpoints"""

    def __init__(self):
        self.base_url = settings.OLMOCR_URL
        self.model_name = settings.OLMOCR_MODEL

        # Configure headers with API key if using HF endpoints
        headers = {"Content-Type": "application/json"}
        if settings.OLMOCR_API_KEY:
            headers["Authorization"] = f"Bearer {settings.OLMOCR_API_KEY}"

        self.client = httpx.AsyncClient(timeout=180.0, headers=headers)

    async def initialize(self):
        """Initialize the service"""
        endpoint_type = "HF Endpoints" if settings.USE_HF_ENDPOINTS else "vLLM"
        logger.info(f"OCR Service initialized for OlmOCR via {endpoint_type}")
        logger.info(f"Using model: {self.model_name} at {self.base_url}")

    async def cleanup(self):
        """Cleanup resources"""
        await self.client.aclose()

    def is_healthy(self) -> bool:
        """Check if service is healthy"""
        try:
            if settings.USE_HF_ENDPOINTS:
                # For HF endpoints, just check if URL is reachable
                response = httpx.get(
                    self.base_url.replace("/v1", "/health"),
                    timeout=5.0,
                    headers=(
                        {"Authorization": f"Bearer {settings.OLMOCR_API_KEY}"}
                        if settings.OLMOCR_API_KEY
                        else {}
                    ),
                )
                return response.status_code in [200, 404]  # 404 is ok for HF endpoints
            else:
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

            # Create the request for OlmOCR
            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_base64}"
                            },
                        },
                        {
                            "type": "text",
                            "text": "Extract all text from this image. Include mathematical formulas, tables, and preserve formatting. Return the result in markdown format.",
                        },
                    ],
                }
            ]

            # Call API (works for both vLLM and HF endpoints)
            response = await self.client.post(
                f"{self.base_url}/chat/completions",
                json={
                    "model": self.model_name,
                    "messages": messages,
                    "temperature": 0.1,  # Low temperature for consistent OCR
                    "max_tokens": 4096,
                    "stream": False,
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

            # Find inline math $...$ or \(...\)
            inline_pattern1 = r"\$([^\$]+)\$"
            inline_pattern2 = r"\\\((.+?)\\\)"
            inline_matches1 = re.findall(inline_pattern1, text)
            inline_matches2 = re.findall(inline_pattern2, text)
            formulas.extend([{"type": "inline", "formula": f} for f in inline_matches1])
            formulas.extend([{"type": "inline", "formula": f} for f in inline_matches2])

            # Find display math $$...$$ or \[...\]
            display_pattern1 = r"\$\$([^\$]+)\$\$"
            display_pattern2 = r"\\\[(.+?)\\\]"
            display_matches1 = re.findall(display_pattern1, text)
            display_matches2 = re.findall(display_pattern2, text)
            formulas.extend(
                [{"type": "display", "formula": f} for f in display_matches1]
            )
            formulas.extend(
                [{"type": "display", "formula": f} for f in display_matches2]
            )

            # Check for tables (simple detection based on markdown table syntax)
            has_tables = "|" in text and "---" in text

            # Extract tables if present
            tables = []
            if has_tables:
                # Simple table extraction from markdown
                lines = text.split("\n")
                current_table = []
                in_table = False

                for line in lines:
                    if "|" in line:
                        if not in_table:
                            in_table = True
                            current_table = []
                        # Parse table row
                        cells = [cell.strip() for cell in line.split("|")]
                        cells = [c for c in cells if c]  # Remove empty cells
                        if cells and not all(
                            "---" in c for c in cells
                        ):  # Skip separator rows
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
            }

        except Exception as e:
            logger.error(f"Error in detailed text extraction: {str(e)}")
            raise
