from fastapi import APIRouter, Request, Depends, HTTPException
from app.services.telegram_bot import telegram_bot
from app.core.config import settings

router = APIRouter(prefix="/telegram", tags=["Telegram Bot"])


@router.post("/webhook")
async def telegram_webhook(request: Request):
    """Webhook endpoint for receiving Telegram updates."""
    if not settings.TELEGRAM_BOT_TOKEN:
        raise HTTPException(status_code=503, detail="Telegram bot not configured")
    
    try:
        update_data = await request.json()
        await telegram_bot.process_update(update_data)
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing update: {str(e)}")


@router.get("/webhook")
async def telegram_webhook_info():
    """Get webhook info."""
    if not settings.TELEGRAM_BOT_TOKEN:
        raise HTTPException(status_code=503, detail="Telegram bot not configured")
    
    return {
        "status": "Telegram bot webhook endpoint",
        "configured": bool(settings.TELEGRAM_BOT_TOKEN),
        "webhook_url": f"{settings.API_V1_STR}/telegram/webhook"
    }
