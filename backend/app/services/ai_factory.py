import logging
from typing import Optional, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

def get_llm():
    """
    Returns an instantiated LangChain ChatModel:
    1. If GROQ_API_KEY is present and provider != 'ollama', uses ultra-fast ChatGroq (llama-3.3-70b).
    2. If provider == 'ollama' or Groq fails, uses ChatOllama (local offline model).
    3. Graceful fallback mode if neither is reachable.
    """
    provider = (settings.LLM_PROVIDER or "auto").lower()
    
    if settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip() and provider != "ollama":
        try:
            from langchain_groq import ChatGroq
            return ChatGroq(
                groq_api_key=settings.GROQ_API_KEY.strip(),
                model_name=settings.GROQ_MODEL,
                temperature=0.1
            )
        except Exception as e:
            logger.warning(f"Failed to initialize ChatGroq ({e}), attempting Ollama fallback.")
            
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
