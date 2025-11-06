"""
EduMath AI - Backend API
Educational Mathematics Assistant for Elementary Students
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from typing import Optional, List
import logging
import os
from pathlib import Path

from app.config import settings
from app.models import ChatRequest, ChatResponse, OCRRequest, CalculateRequest, GraphRequest
from app.services.ocr_service import OCRService
from app.services.llm_service import LLMService
from app.services.math_service import MathService
from app.services.content_filter import ContentFilter
from app.database import init_db, get_db
from app.middleware import RateLimitMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Services instances
ocr_service = OCRService()
llm_service = LLMService()
math_service = MathService()
content_filter = ContentFilter()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    logger.info("Starting EduMath AI Backend...")
    
    # Initialize database
    await init_db()
    
    # Create upload directory
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    
    # Initialize services
    await ocr_service.initialize()
    await llm_service.initialize()
    
    logger.info("EduMath AI Backend started successfully!")
    
    yield
    
    # Cleanup
    logger.info("Shutting down EduMath AI Backend...")
    await ocr_service.cleanup()
    await llm_service.cleanup()


# Create FastAPI app
app = FastAPI(
    title="EduMath AI API",
    description="Educational Mathematics Assistant API for Elementary Students",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limiting
app.add_middleware(RateLimitMiddleware)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "EduMath AI API",
        "version": "1.0.0",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    health_status = {
        "status": "healthy",
        "services": {
            "database": "connected",
            "ocr": ocr_service.is_healthy(),
            "llm": llm_service.is_healthy(),
            "redis": "connected"
        }
    }
    
    # Check if all services are healthy
    all_healthy = all(
        status == "healthy" or status == "connected" or status == True
        for status in health_status["services"].values()
    )
    
    if not all_healthy:
        return JSONResponse(status_code=503, content=health_status)
    
    return health_status


@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    message: str,
    image: Optional[UploadFile] = File(None),
    session_id: Optional[str] = None
):
    """
    Main chat endpoint for student interaction
    
    Args:
        message: Text message from student
        image: Optional image file containing math problems
        session_id: Optional session ID for conversation continuity
    
    Returns:
        AI response with educational guidance
    """
    try:
        # Content filtering
        if not await content_filter.is_appropriate(message):
            return ChatResponse(
                response="Desculpe, não posso ajudar com esse tipo de conteúdo. Vamos focar em matemática! 📚",
                session_id=session_id or "new",
                suggestions=["Que tal resolver uma equação?", "Vamos praticar tabuada?"]
            )
        
        # Process image if provided
        extracted_text = None
        if image:
            if image.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
                raise HTTPException(status_code=400, detail="Formato de imagem não suportado")
            
            # Save and process image
            image_path = await save_upload_file(image)
            extracted_text = await ocr_service.extract_text(image_path)
            
            # Clean up
            os.remove(image_path)
        
        # Combine message with extracted text
        full_prompt = message
        if extracted_text:
            full_prompt = f"Texto da imagem: {extracted_text}\\n\\nMensagem do aluno: {message}"
        
        # Get LLM response
        response = await llm_service.generate_response(
            prompt=full_prompt,
            session_id=session_id,
            context="elementary_math"
        )
        
        return ChatResponse(
            response=response["text"],
            session_id=response["session_id"],
            suggestions=response.get("suggestions", []),
            visualization=response.get("visualization")
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao processar mensagem")


@app.post("/api/ocr")
async def extract_text(image: UploadFile = File(...)):
    """
    Extract text from mathematical images
    
    Args:
        image: Image file containing mathematical content
    
    Returns:
        Extracted text and LaTeX formulas
    """
    try:
        if image.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
            raise HTTPException(status_code=400, detail="Formato de imagem não suportado")
        
        # Save and process image
        image_path = await save_upload_file(image)
        result = await ocr_service.extract_text_detailed(image_path)
        
        # Clean up
        os.remove(image_path)
        
        return result
        
    except Exception as e:
        logger.error(f"Error in OCR endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao processar imagem")


@app.post("/api/calculate")
async def calculate(request: CalculateRequest):
    """
    Perform mathematical calculations
    
    Args:
        request: Calculation request with expression
    
    Returns:
        Calculation result with steps
    """
    try:
        result = await math_service.calculate(
            expression=request.expression,
            show_steps=request.show_steps
        )
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in calculate endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao calcular")


@app.post("/api/graph")
async def generate_graph(request: GraphRequest):
    """
    Generate mathematical graphs
    
    Args:
        request: Graph request with function and parameters
    
    Returns:
        Graph image URL or base64 data
    """
    try:
        result = await math_service.generate_graph(
            function=request.function,
            x_range=request.x_range,
            y_range=request.y_range,
            title=request.title
        )
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in graph endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao gerar gráfico")


@app.get("/api/history/{session_id}")
async def get_history(session_id: str):
    """
    Get conversation history for a session
    
    Args:
        session_id: Session identifier
    
    Returns:
        List of messages in the conversation
    """
    try:
        history = await llm_service.get_history(session_id)
        return {"session_id": session_id, "messages": history}
        
    except Exception as e:
        logger.error(f"Error getting history: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao buscar histórico")


@app.delete("/api/history/{session_id}")
async def clear_history(session_id: str):
    """
    Clear conversation history for a session
    
    Args:
        session_id: Session identifier
    
    Returns:
        Confirmation message
    """
    try:
        await llm_service.clear_history(session_id)
        return {"message": "Histórico limpo com sucesso", "session_id": session_id}
        
    except Exception as e:
        logger.error(f"Error clearing history: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao limpar histórico")


async def save_upload_file(upload_file: UploadFile) -> str:
    """Save uploaded file to disk"""
    file_path = os.path.join(settings.UPLOAD_DIR, upload_file.filename)
    
    with open(file_path, "wb") as buffer:
        content = await upload_file.read()
        buffer.write(content)
    
    return file_path


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development"
    )
