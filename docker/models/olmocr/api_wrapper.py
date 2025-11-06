"""API Wrapper for OlmOCR using the official pipeline"""

from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.responses import JSONResponse
import tempfile
import os
import subprocess
import json
import logging
from pathlib import Path
import shutil
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model configuration
MODEL_NAME = os.getenv("OLMOCR_MODEL", "allenai/olmOCR-2-7B-1025-FP8")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup resources"""
    logger.info(f"Starting OlmOCR API wrapper with model: {MODEL_NAME}")
    
    # Download model if needed (this happens automatically with olmocr)
    logger.info("Initializing OlmOCR pipeline...")
    
    # Create workspace directory
    Path("/tmp/olmocr_workspace").mkdir(parents=True, exist_ok=True)
    
    yield
    
    # Cleanup
    logger.info("Shutting down OlmOCR API wrapper...")
    if Path("/tmp/olmocr_workspace").exists():
        shutil.rmtree("/tmp/olmocr_workspace", ignore_errors=True)


# Create FastAPI app
app = FastAPI(
    title="OlmOCR API Service",
    description="OCR service using AllenAI OlmOCR pipeline",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "OlmOCR API Service",
        "model": MODEL_NAME,
        "status": "operational"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    # Check if olmocr command is available
    try:
        result = subprocess.run(
            ["python", "-m", "olmocr", "--help"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            return {"status": "healthy", "olmocr": "available"}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
    
    return JSONResponse(
        status_code=503,
        content={"status": "unhealthy", "error": "OlmOCR not available"}
    )


@app.post("/extract")
async def extract_text(file: UploadFile = File(...)):
    """
    Extract text from an image or PDF using OlmOCR pipeline
    
    Args:
        file: Image file (PNG, JPEG) or PDF
    
    Returns:
        Extracted text in markdown format
    """
    temp_dir = None
    try:
        # Create temporary directory for processing
        temp_dir = tempfile.mkdtemp(prefix="olmocr_")
        
        # Save uploaded file
        file_path = os.path.join(temp_dir, file.filename)
        with open(file_path, "wb") as f:
            contents = await file.read()
            f.write(contents)
        
        # Create workspace for this extraction
        workspace = os.path.join(temp_dir, "workspace")
        os.makedirs(workspace, exist_ok=True)
        
        # Run OlmOCR pipeline
        logger.info(f"Processing file: {file.filename}")
        
        cmd = [
            "python", "-m", "olmocr.pipeline",
            workspace,
            "--markdown",
            "--pdfs", file_path,
            "--model", MODEL_NAME,
            "--pages_per_group", "5",  # Process 5 pages at a time
            "--gpu-memory-utilization", "0.9"
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        if result.returncode != 0:
            logger.error(f"OlmOCR failed: {result.stderr}")
            raise HTTPException(status_code=500, detail="OCR processing failed")
        
        # Read the markdown output
        markdown_dir = os.path.join(workspace, "markdown")
        markdown_files = list(Path(markdown_dir).glob("*.md"))
        
        if not markdown_files:
            raise HTTPException(status_code=500, detail="No output generated")
        
        # Read the first markdown file (should be only one for single input)
        with open(markdown_files[0], "r") as f:
            extracted_text = f.read()
        
        # Parse for math content
        has_math = "$$" in extracted_text or "$" in extracted_text
        
        return {
            "text": extracted_text,
            "format": "markdown",
            "has_math": has_math,
            "source": file.filename,
            "model": MODEL_NAME
        }
        
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Processing timeout")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temporary files
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)


@app.post("/extract_base64")
async def extract_text_base64(data: Dict[str, Any]):
    """
    Extract text from a base64 encoded image
    
    Args:
        data: JSON with image_base64 field
    
    Returns:
        Extracted text in markdown format
    """
    import base64
    from PIL import Image
    import io
    
    temp_dir = None
    try:
        image_base64 = data.get("image_base64")
        if not image_base64:
            raise HTTPException(status_code=400, detail="image_base64 is required")
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Create temporary directory
        temp_dir = tempfile.mkdtemp(prefix="olmocr_")
        
        # Save image to temporary file
        image_path = os.path.join(temp_dir, "input.png")
        image.save(image_path, "PNG")
        
        # Create workspace
        workspace = os.path.join(temp_dir, "workspace")
        os.makedirs(workspace, exist_ok=True)
        
        # Run OlmOCR pipeline
        cmd = [
            "python", "-m", "olmocr.pipeline",
            workspace,
            "--markdown",
            "--pdfs", image_path,  # OlmOCR handles images too
            "--model", MODEL_NAME,
            "--gpu-memory-utilization", "0.9"
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode != 0:
            logger.error(f"OlmOCR failed: {result.stderr}")
            raise HTTPException(status_code=500, detail="OCR processing failed")
        
        # Read the markdown output
        markdown_dir = os.path.join(workspace, "markdown")
        markdown_files = list(Path(markdown_dir).glob("*.md"))
        
        if not markdown_files:
            raise HTTPException(status_code=500, detail="No output generated")
        
        with open(markdown_files[0], "r") as f:
            extracted_text = f.read()
        
        # Parse for formulas
        import re
        formulas = []
        
        # Find inline math
        inline_pattern = r'\$([^\$]+)\$'
        inline_matches = re.findall(inline_pattern, extracted_text)
        formulas.extend([{"type": "inline", "formula": f} for f in inline_matches])
        
        # Find display math
        display_pattern = r'\$\$([^\$]+)\$\$'
        display_matches = re.findall(display_pattern, extracted_text)
        formulas.extend([{"type": "display", "formula": f} for f in display_matches])
        
        return {
            "text": extracted_text,
            "format": "markdown",
            "has_math": len(formulas) > 0,
            "formulas": formulas
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing base64 image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
