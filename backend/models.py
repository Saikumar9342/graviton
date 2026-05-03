from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, JSON, Integer
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime

class Chat(Base):
    __tablename__ = "chats"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    chat_id = Column(String, ForeignKey("chats.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False) # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    model = Column(String, nullable=True) # The model that generated this (or user message model context)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Token usage tracking
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    total_tokens = Column(Integer, nullable=True)
    latency_ms = Column(Integer, nullable=True) # Time taken to generate the response

    chat = relationship("Chat", back_populates="messages")


class AppSettings(Base):
    __tablename__ = "app_settings"

    id = Column(String, primary_key=True, default="default")
    data = Column(JSON, nullable=False, default=dict)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RegisteredModel(Base):
    __tablename__ = "registered_models"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ollama_name = Column(String, nullable=False, unique=True)  # model identifier sent to the API
    display_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    provider = Column(String, default='ollama', nullable=False)  # 'ollama' | 'openai-compat'
    api_base_url = Column(String, nullable=True)                 # for openai-compat providers
    api_key = Column(String, nullable=True)                      # stored server-side only
    created_at = Column(DateTime, default=datetime.utcnow)
