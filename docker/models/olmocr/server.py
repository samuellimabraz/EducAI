"""OlmOCR2 Server for mathematical text extraction"""

from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
import torch
from transformers import AutoModel, AutoTokenizer, AutoProcessor
import io
import base64
import logging
import os
from typing import Optional, Dict, Any
import asyncio
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for model
model = None
processor = None
tokenizer = None
device = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup model"""
    global model, processor, tokenizer, device
    
    try:
        logger.info("Loading OlmOCR2 model...")
        
        # Set device
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {device}")
        
        # Model name from environment or default
        model_name = os.getenv("MODEL_NAME", "allenai/OlmOCR-GPT4o-mini")
        
        # Load model components
        model = AutoModel.from_pretrained(
            model_name,
            trust_remote_code=True,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
        ).to(device)
        
        processor = AutoProcessor.from_pretrained(
            model_name,
            trust_remote_code=True
        )
        
        tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            trust_remote_code=True
        )
        
        # Set model to evaluation mode
        model.eval()
        
        logger.info("OlmOCR2 model loaded successfully!")
        
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        raise
    
    yield
    
    # Cleanup
    logger.info("Shutting down OlmOCR2 server...")
    if model:
        del model
    torch.cuda.empty_cache()


# Create FastAPI app
app = FastAPI(
    title="OlmOCR2 Server",
    description="OCR service for mathematical text extraction",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "OlmOCR2 Server",
        "status": "operational",
        "device": str(device) if device else "not initialized"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    if model is None:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "error": "Model not loaded"}
        )
    return {"status": "healthy"}


@app.post("/extract")
async def extract_text(
    file: UploadFile = File(...),
    extract_math: bool = True,
    extract_tables: bool = True
):
    """
    Extract text from an image
    
    Args:
        file: Image file
        extract_math: Whether to extract mathematical formulas
        extract_tables: Whether to extract tables
    
    Returns:
        Extracted text and metadata
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if necessary
        if image.mode != "RGB":
            image = image.convert("RGB")
        
        # Process image
        result = await process_image(image, extract_math, extract_tables)
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/extract_base64")
async def extract_text_base64(
    image_base64: str,
    extract_math: bool = True,
    extract_tables: bool = True
):
    """
    Extract text from a base64 encoded image
    
    Args:
        image_base64: Base64 encoded image
        extract_math: Whether to extract mathematical formulas
        extract_tables: Whether to extract tables
    
    Returns:
        Extracted text and metadata
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != "RGB":
            image = image.convert("RGB")
        
        # Process image
        result = await process_image(image, extract_math, extract_tables)
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing base64 image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def process_image(
    image: Image.Image,
    extract_math: bool = True,
    extract_tables: bool = True
) -> Dict[str, Any]:
    """
    Process image and extract text
    
    Args:
        image: PIL Image
        extract_math: Whether to extract mathematical formulas
        extract_tables: Whether to extract tables
    
    Returns:
        Dictionary with extracted content
    """
    try:
        # Prepare inputs
        inputs = processor(images=image, return_tensors="pt").to(device)
        
        # Generate predictions
        with torch.no_grad():
            # Set generation parameters
            generation_config = {
                "max_new_tokens": 1024,
                "temperature": 0.1,
                "do_sample": False,
                "num_beams": 1,
            }
            
            # Generate text
            outputs = model.generate(
                **inputs,
                **generation_config
            )
            
            # Decode output
            text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Parse output for math and tables if needed
        result = {
            "text": text,
            "has_math": False,
            "has_tables": False,
            "formulas": [],
            "tables": []
        }
        
        if extract_math:
            # Extract LaTeX formulas
            formulas = extract_latex_formulas(text)
            if formulas:
                result["has_math"] = True
                result["formulas"] = formulas
        
        if extract_tables:
            # Extract table data
            tables = extract_table_data(text)
            if tables:
                result["has_tables"] = True
                result["tables"] = tables
        
        return result
        
    except Exception as e:
        logger.error(f"Error in process_image: {str(e)}")
        raise


def extract_latex_formulas(text: str) -> list:
    """Extract LaTeX formulas from text"""
    formulas = []
    
    # Look for inline math $...$
    import re
    inline_pattern = r'\$([^\$]+)\$'
    inline_matches = re.findall(inline_pattern, text)
    formulas.extend([{"type": "inline", "formula": f} for f in inline_matches])
    
    # Look for display math $$...$$ or \[...\]
    display_pattern = r'\$\$([^\$]+)\$\$|\\\[([^\]]+)\\\]'
    display_matches = re.findall(display_pattern, text)
    for match in display_matches:
        formula = match[0] if match[0] else match[1]
        formulas.append({"type": "display", "formula": formula})
    
    return formulas


def extract_table_data(text: str) -> list:
    """Extract table data from text"""
    tables = []
    
    # Simple table detection based on pipe separators or aligned columns
    lines = text.strip().split('\n')
    current_table = []
    
    for line in lines:
        if '|' in line or '\t' in line:
            # Potential table row
            if '|' in line:
                cells = [cell.strip() for cell in line.split('|')]
                cells = [c for c in cells if c]  # Remove empty cells
            else:
                cells = [cell.strip() for cell in line.split('\t')]
            
            if cells:
                current_table.append(cells)
        elif current_table:
            # End of table
            if len(current_table) > 1:  # At least 2 rows
                tables.append(current_table)
            current_table = []
    
    # Add last table if exists
    if current_table and len(current_table) > 1:
        tables.append(current_table)
    
    return tables


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
