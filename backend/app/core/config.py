import os
from typing import Literal, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ResidentHub"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    ENVIRONMENT: Literal["development", "production", "testing"] = "development"
    JWT_SECRET: str = "residenthub-super-secret-jwt-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database: Supports Postgres or SQLite fallback for local zero-config
    DATABASE_URL: str = "sqlite+aiosqlite:///./residenthub.db"
    
    # AI Engine Settings
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

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
