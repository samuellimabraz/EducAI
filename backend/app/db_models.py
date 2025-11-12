"""SQLAlchemy database models for persistent storage"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Session(Base):
    """Chat session model"""
    
    __tablename__ = "sessions"
    
    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(200), default="New Chat")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to messages
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")


class Message(Base):
    """Chat message model"""
    
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String(100), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    has_image = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to session
    session = relationship("Session", back_populates="messages")

