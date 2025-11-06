"""OlmOCR Server Wrapper for vLLM API"""

from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
import base64
import io
import logging
import httpx
import os
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# vLLM server configuration
VLLM_URL = "http://localhost:8001/v1"
MODEL_NAME = "olmocr"

# Global HTTP client
client = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup resources"""
    global client
    
    logger.info("Starting OlmOCR wrapper service...")
    client = httpx.AsyncClient(timeout=120.0)
    
    # Wait for vLLM server to be ready
    import time
    for _ in range(30):
        try:
            response = await client.get(f"{VLLM_URL}/models")
            if response.status_code == 200:
                logger.info("vLLM server is ready")
                break
        except:
            pass
        time.sleep(2)
    
    yield
    
    # Cleanup
    logger.info("Shutting down OlmOCR wrapper service...")
    if client:
        await client.aclose()


# Create FastAPI app
app = FastAPI(
    title="OlmOCR Service",
    description="OCR service using AllenAI OlmOCR for mathematical text extraction",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "OlmOCR Service",
        "model": MODEL_NAME,
        "status": "operational"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    try:
        # Check vLLM server health
        response = await client.get(f"{VLLM_URL}/health")
        if response.status_code == 200:
            return {"status": "healthy", "vllm": "connected"}
    except:
        pass
    
    return JSONResponse(
        status_code=503,
        content={"status": "unhealthy", "error": "vLLM server not responding"}
    )


@app.post("/extract")
async def extract_text(
    file: UploadFile = File(...),
    extract_math: bool = True,
    markdown: bool = True
):
    """
    Extract text from an image using OlmOCR
    
    Args:
        file: Image file (PNG, JPEG) or PDF
        extract_math: Whether to extract mathematical formulas
        markdown: Return result as markdown
    
    Returns:
        Extracted text and metadata
    """
    try:
        # Read file content
        contents = await file.read()
        
        # Determine file type
        file_ext = file.filename.lower().split('.')[-1] if '.' in file.filename else ''
        
        # For images, convert to base64
        if file_ext in ['png', 'jpg', 'jpeg']:
            # Open and convert image
            image = Image.open(io.BytesIO(contents))
            
            # Convert to RGB if necessary
            if image.mode != "RGB":
                image = image.convert("RGB")
            
            # Convert to base64
            buffered = io.BytesIO()
            image.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode()
            
            # Create the prompt for OlmOCR
            # OlmOCR expects specific formatting
            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{img_base64}"
                            }
                        },
                        {
                            "type": "text",
                            "text": "Convert this image to markdown format, preserving all mathematical formulas, tables, and formatting."
                        }
                    ]
                }
            ]
            
            # Call vLLM API
            response = await client.post(
                f"{VLLM_URL}/chat/completions",
                json={
                    "model": MODEL_NAME,
                    "messages": messages,
                    "temperature": 0.1,
                    "max_tokens": 4096,
                    "stream": False
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="vLLM API error")
            
            result = response.json()
            extracted_text = result["choices"][0]["message"]["content"]
            
            return {
                "text": extracted_text,
                "format": "markdown" if markdown else "text",
                "has_math": "$$" in extracted_text or "$" in extracted_text,
                "source": file.filename
            }
            
        elif file_ext == 'pdf':
            # For PDFs, we would need to use the olmocr pipeline
            # For now, return an error suggesting to use the pipeline directly
            raise HTTPException(
                status_code=400,
                detail="PDF processing requires using the olmocr pipeline. Please convert PDF pages to images first."
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_ext}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/extract_base64")
async def extract_text_base64(
    image_base64: str,
    extract_math: bool = True,
    markdown: bool = True
):
    """
    Extract text from a base64 encoded image
    
    Args:
        image_base64: Base64 encoded image
        extract_math: Whether to extract mathematical formulas
        markdown: Return result as markdown
    
    Returns:
        Extracted text and metadata
    """
    try:
        # Create messages for OlmOCR
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
                        "text": "Convert this image to markdown format, preserving all mathematical formulas, tables, and formatting."
                    }
                ]
            }
        ]
        
        # Call vLLM API
        response = await client.post(
            f"{VLLM_URL}/chat/completions",
            json={
                "model": MODEL_NAME,
                "messages": messages,
                "temperature": 0.1,
                "max_tokens": 4096,
                "stream": False
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="vLLM API error")
        
        result = response.json()
        extracted_text = result["choices"][0]["message"]["content"]
        
        # Parse for math formulas
        formulas = []
        if extract_math:
            import re
            # Find inline math $...$
            inline_pattern = r'\$([^\$]+)\$'
            inline_matches = re.findall(inline_pattern, extracted_text)
            formulas.extend([{"type": "inline", "formula": f} for f in inline_matches])
            
            # Find display math $$...$$ 
            display_pattern = r'\$\$([^\$]+)\$\$'
            display_matches = re.findall(display_pattern, extracted_text)
            formulas.extend([{"type": "display", "formula": f} for f in display_matches])
        
        return {
            "text": extracted_text,
            "format": "markdown" if markdown else "text",
            "has_math": len(formulas) > 0,
            "formulas": formulas if extract_math else []
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing base64 image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    # This runs on port 8002 as a wrapper, while vLLM runs on 8001
    uvicorn.run(app, host="0.0.0.0", port=8002)