import logging
from typing import Optional, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

def get_llm():
    """
    Returns an instantiated LangChain ChatModel based on settings:
    - 'ollama': Local offline Ollama server (e.g., llama3.2)
    - 'groq': Free cloud inference via Groq API (e.g., llama-3.3-70b)
    """
    provider = settings.LLM_PROVIDER.lower()
    
    if provider == "groq" and settings.GROQ_API_KEY:
        try:
            from langchain_groq import ChatGroq
            return ChatGroq(
                groq_api_key=settings.GROQ_API_KEY,
                model_name=settings.GROQ_MODEL,
                temperature=0.1
            )
        except Exception as e:
            logger.warning(f"Failed to initialize ChatGroq ({e}), attempting Ollama fallback.")
            
    if provider == "ollama" or provider == "groq":
        try:
            from langchain_ollama import ChatOllama
            return ChatOllama(
                base_url=settings.OLLAMA_BASE_URL,
                model=settings.OLLAMA_MODEL,
                temperature=0.1
            )
        except Exception as e:
            logger.warning(f"Failed to initialize ChatOllama ({e}). Fallback mode active.")
            
    return None
