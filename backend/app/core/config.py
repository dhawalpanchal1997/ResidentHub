import os
from typing import Literal, Optional
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    model_config = {"env_file": [".env", "../.env", "backend/.env"], "extra": "allow"}
    
    PROJECT_NAME: str = "ResidentHub"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    ENVIRONMENT: Literal["development", "production", "testing"] = "development"
    JWT_SECRET: str = "residenthub-super-secret-jwt-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database: PostgreSQL + pgvector
    DATABASE_URL: str = "postgresql+asyncpg://residenthub:residenthub@localhost:5432/residenthub"
    
    # AI Engine Settings (Module 5 — V2)
    LLM_PROVIDER: Literal["ollama", "groq", "mock"] = "ollama"
    
    # Ollama settings (Local Dev)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"
    
    # Groq settings (Production)
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    
    # Storage & Telegram
    STORAGE_BUCKET: str = "residenthub-receipts"
    TELEGRAM_BOT_TOKEN: Optional[str] = None

settings = Settings()