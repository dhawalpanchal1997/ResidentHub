import logging
from typing import Optional
from telegram import Update, Bot
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters
from app.core.config import settings
from app.services.rag_service import answer_society_query
from app.core.database import AsyncSessionLocal
from app.models.vendor import ServiceProvider as Vendor
from app.models.event import Event
from app.models.meeting import Meeting
from sqlalchemy.future import select
from sqlalchemy import func
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class TelegramBotService:
    def __init__(self):
        self.bot_token = settings.TELEGRAM_BOT_TOKEN
        self.application: Optional[Application] = None
        self.bot: Optional[Bot] = None
    
    async def initialize(self):
        """Initialize the Telegram bot application."""
        if not self.bot_token:
            logger.warning("TELEGRAM_BOT_TOKEN not set. Telegram bot will not start.")
            return
        
        self.application = Application.builder().token(self.bot_token).build()
        self.bot = self.application.bot
        
        # Add command handlers
        self.application.add_handler(CommandHandler("start", self.start_command))
        self.application.add_handler(CommandHandler("contacts", self.contacts_command))
        self.application.add_handler(CommandHandler("ask", self.ask_command))
        self.application.add_handler(CommandHandler("help", self.help_command))
        
        # Add message handler for general questions
        self.application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))
        
        # Initialize the application
        await self.application.initialize()
        logger.info("Telegram bot initialized successfully")
    
    async def start_webhook(self, webhook_url: str):
        """Start the webhook for receiving updates."""
        if not self.application:
            await self.initialize()
        
        if self.application:
            await self.application.bot.set_webhook(webhook_url)
            logger.info(f"Webhook set to {webhook_url}")
    
    async def stop_webhook(self):
        """Stop the webhook."""
        if self.application and self.application.bot:
            await self.application.bot.delete_webhook()
            logger.info("Webhook deleted")
    
    async def process_update(self, update_data: dict):
        """Process an incoming update from Telegram."""
        if not self.application:
            await self.initialize()
        
        if self.application:
            update = Update.de_json(update_data, self.application.bot)
            await self.application.process_update(update)
    
    # Command Handlers
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command."""
        welcome_message = (
            "🏠 Welcome to ResidentHub Bot!\n\n"
            "I'm your society management assistant. Here's what I can help you with:\n\n"
            "📋 **Commands:**\n"
            "/start - Show this welcome message\n"
            "/contacts <service> - Find verified vendors (e.g., /contacts plumber)\n"
            "/ask <question> - Ask questions about society meetings, events, finances\n"
            "/help - Show detailed help\n\n"
            "💡 **Examples:**\n"
            "• /contacts electrician\n"
            "• /ask What was decided in the last meeting about parking?\n"
            "• /ask How much was spent on maintenance last month?\n\n"
            "I'm here to help! 🤖"
        )
        await update.message.reply_text(welcome_message)
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /help command."""
        help_message = (
            "📖 **ResidentHub Bot - Detailed Help**\n\n"
            "**Vendor Directory:**\n"
            "/contacts <service_type> - Search verified vendors by category\n"
            "Examples: /contacts plumber, /contacts electrician, /contacts doctor\n\n"
            "**AI Q&A (Meeting & Society Knowledge):**\n"
            "/ask <question> - Ask natural language questions about:\n"
            "  • Meeting decisions & resolutions\n"
            "  • Budget approvals & expenses\n"
            "  • Action items & follow-ups\n"
            "  • Event details & RSVPs\n"
            "  • Financial summaries\n\n"
            "**General:**\n"
            "/start - Welcome message & quick reference\n"
            "/help - This detailed help message\n\n"
            "💡 **Tips:**\n"
            "• Be specific in your questions for better answers\n"
            "• I search through published meeting transcripts\n"
            "• Vendor ratings are crowdsourced from residents\n"
            "• All responses cite sources when available"
        )
        await update.message.reply_text(help_message)
    
    async def contacts_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /contacts <service> command."""
        if not context.args:
            await update.message.reply_text(
                "Please specify a service type.\n"
                "Example: /contacts plumber\n"
                "Available categories: electrician, plumber, doctor, carpenter, cleaner, "
                "pest control, appliance repair, security, tutor, driver, other"
            )
            return
        
        service_type = " ".join(context.args).lower().strip()
        
        async with AsyncSessionLocal() as session:
            # Search vendors by category (case-insensitive)
            result = await session.execute(
                select(Vendor).where(
                    Vendor.category.ilike(f"%{service_type}%")
                ).order_by(Vendor.avg_rating.desc().nullslast(), Vendor.review_count.desc())
            )
            vendors = result.scalars().all()
        
        if not vendors:
            await update.message.reply_text(
                f"No verified vendors found for '{service_type}'.\n"
                "Try a different category or contact admin to add vendors."
            )
            return
        
        message = f"🔧 **Verified {service_type.title()} Vendors:**\n\n"
        for i, vendor in enumerate(vendors[:10], 1):  # Limit to top 10
            rating_str = f"⭐ {vendor.avg_rating:.1f} ({vendor.review_count} reviews)" if vendor.avg_rating else "⭐ No ratings yet"
            message += (
                f"{i}. **{vendor.name}**\n"
                f"   📞 {vendor.phone_number}"
            )
            if vendor.whatsapp_number:
                message += f" | 💬 {vendor.whatsapp_number}"
            message += f"\n   📍 {vendor.notes or 'Address not provided'}\n"
            message += f"   {rating_str}\n\n"
        
        if len(vendors) > 10:
            message += f"... and {len(vendors) - 10} more vendors. Be more specific to narrow results."
        
        await update.message.reply_text(message, parse_mode="Markdown")
    
    async def ask_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /ask <question> command."""
        if not context.args:
            await update.message.reply_text(
                "Please ask a question.\n"
                "Example: /ask What was the budget approved for generator maintenance?"
            )
            return
        
        question = " ".join(context.args)
        await self.answer_question(update, question)
    
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle general text messages as questions."""
        text = update.message.text.strip()
        if text and not text.startswith("/"):
            await self.answer_question(update, text)
    
    async def answer_question(self, update: Update, question: str):
        """Process question through RAG service and send response."""
        # Send typing indicator
        await update.message.chat.send_action("typing")
        
        try:
            # Use existing RAG service with database session
            async with AsyncSessionLocal() as db:
                result = await answer_society_query(question, db)
            
            answer = result.get("answer", "I couldn't find an answer to that question.")
            sources = result.get("sources", [])
            
            # Format response
            response = f"🤖 **Answer:**\n{answer}\n\n"
            
            if sources:
                response += "📚 **Sources:**\n"
                for source in sources[:3]:  # Limit to top 3 sources
                    if isinstance(source, dict):
                        response += f"• {source.get('title', 'Unknown')} ({source.get('date', 'Unknown date')})\n"
                    else:
                        response += f"• {source}\n"
                response += "\n"
            
            await update.message.reply_text(response, parse_mode="Markdown")
            
        except Exception as e:
            logger.error(f"Error answering question: {e}")
            await update.message.reply_text(
                "Sorry, I encountered an error while processing your question. "
                "Please try again later or contact admin."
            )
    
    # Broadcast Functions
    async def broadcast_message(self, message: str, parse_mode: str = "Markdown"):
        """Broadcast a message to all subscribed chats.
        
        Note: In a real implementation, you'd store chat_ids in the database.
        For now, this is a placeholder that logs the message.
        """
        logger.info(f"Broadcast message: {message}")
        # TODO: Implement chat subscription storage and actual broadcasting
        # This would require a ChatSubscriber model and database integration
        pass
    
    async def broadcast_event_announcement(self, event: Event):
        """Broadcast event announcement to all residents."""
        message = (
            f"📢 **New Event Announcement!**\n\n"
            f"🎉 **{event.title}**\n"
            f"📅 {event.event_date.strftime('%A, %B %d, %Y at %I:%M %p')}\n"
            f"📍 {event.venue}\n"
            f"💰 Fee: ₹{float(event.fee_per_person or 0)}\n\n"
            f"{event.description or ''}\n\n"
            f"Use the ResidentHub app to RSVP!"
        )
        await self.broadcast_message(message)
    
    async def broadcast_meeting_summary(self, meeting: Meeting):
        """Broadcast meeting summary after publication."""
        if not meeting.structured_summary:
            return
        
        message = (
            f"📝 **Meeting Summary Published**\n\n"
            f"📅 **{meeting.title}** ({meeting.meeting_date.strftime('%B %d, %Y')})\n\n"
            f"View full details in the ResidentHub app."
        )
        await self.broadcast_message(message)


# Global instance
telegram_bot = TelegramBotService()
