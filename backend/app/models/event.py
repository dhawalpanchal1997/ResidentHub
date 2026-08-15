import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Text, Numeric, Integer, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    society_id = Column(String(36), ForeignKey("societies.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    event_date = Column(DateTime, nullable=False)
    venue = Column(String(255), nullable=True)
    
    # Tiered Pricing (Adult, Child, Senior)
    fee_per_person = Column(Numeric(10, 2), default=0.00)  # General / Base fee
    fee_adult = Column(Numeric(10, 2), default=0.00)
    fee_child = Column(Numeric(10, 2), default=0.00)
    fee_senior = Column(Numeric(10, 2), default=0.00)
    
    upi_qr_url = Column(Text, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    society = relationship("Society", back_populates="events")
    rsvps = relationship("EventRSVP", back_populates="event", cascade="all, delete-orphan")
    expenses = relationship("EventExpense", back_populates="event", cascade="all, delete-orphan")

class EventRSVP(Base):
    __tablename__ = "event_rsvps"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    member_name = Column(String(255), nullable=False)
    flat_number = Column(String(50), nullable=False)
    
    # Attendee Demographic Breakdown
    adults_count = Column(Integer, default=1)
    children_count = Column(Integer, default=0)
    seniors_count = Column(Integer, default=0)
    attendees_count = Column(Integer, default=1)  # Total = adults + children + seniors
    
    total_amount = Column(Numeric(10, 2), default=0.00)
    payment_proof_url = Column(Text, nullable=True)
    utr_number = Column(String(100), nullable=True)
    status = Column(String(20), default="pending")  # "pending", "approved", "rejected"
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    event = relationship("Event", back_populates="rsvps")
    user = relationship("User", back_populates="rsvps")


class EventExpense(Base):
    __tablename__ = "event_expenses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False)  # "Catering & Food", "Decorations & Stage", "DJ & Sound", "Prizes & Gifts", "Cleaning & Housekeeping", "Misc / Supplies"
    title = Column(String(255), nullable=False)
    vendor_name = Column(String(255), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    invoice_ref = Column(String(100), nullable=True)
    expense_date = Column(Date, default=date.today, nullable=False)
    logged_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    event = relationship("Event", back_populates="expenses")
