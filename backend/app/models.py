"""Pydantic models for API requests and responses"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime


class ChatRequest(BaseModel):
    """Chat request model"""

    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = Field(None, pattern="^[a-zA-Z0-9-]+$")

    @field_validator("message")
    def validate_message(cls, v):
        if not v.strip():
            raise ValueError("Message cannot be empty")
        return v.strip()


class ChatResponse(BaseModel):
    """Chat response model"""

    response: str
    session_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    suggestions: Optional[List[str]] = None
    visualization: Optional[Dict[str, Any]] = None


class OCRRequest(BaseModel):
    """OCR request model"""

    image_base64: Optional[str] = None
    image_url: Optional[str] = None


class OCRResponse(BaseModel):
    """OCR response model"""

    text: str
    latex: Optional[List[str]] = None
    confidence: float
    bounding_boxes: Optional[List[Dict[str, Any]]] = None


class CalculateRequest(BaseModel):
    """Calculate request model"""

    expression: str = Field(..., min_length=1, max_length=500)
    show_steps: bool = True

    @field_validator("expression")
    def validate_expression(cls, v):
        # Basic validation for mathematical expressions
        allowed_chars = "0123456789+-*/().,^√ xXyYzZ="
        if not all(c in allowed_chars or c.isspace() for c in v):
            raise ValueError("Expression contains invalid characters")
        return v.strip()


class CalculateResponse(BaseModel):
    """Calculate response model"""

    result: str
    expression: str
    steps: Optional[List[Dict[str, str]]] = None
    explanation: Optional[str] = None


class GraphRequest(BaseModel):
    """Graph generation request model"""

    function: str = Field(..., min_length=1, max_length=200)
    x_range: List[float] = Field(default=[-10, 10])
    y_range: Optional[List[float]] = None
    title: Optional[str] = None

    @field_validator("x_range")
    def validate_x_range(cls, v):
        if len(v) != 2 or v[0] >= v[1]:
            raise ValueError("Invalid x_range")
        return v

    @field_validator("y_range")
    def validate_y_range(cls, v):
        if v and (len(v) != 2 or v[0] >= v[1]):
            raise ValueError("Invalid y_range")
        return v


class GraphResponse(BaseModel):
    """Graph response model"""

    image_url: Optional[str] = None
    image_base64: str
    function: str
    description: Optional[str] = None


class HistoryMessage(BaseModel):
    """History message model"""

    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime
    has_image: bool = False


class SessionHistory(BaseModel):
    """Session history model"""

    session_id: str
    messages: List[HistoryMessage]
    created_at: datetime
    updated_at: datetime


class ErrorResponse(BaseModel):
    """Error response model"""

    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
