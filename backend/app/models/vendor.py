import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class ServiceProvider(Base):
    __tablename__ = "service_providers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    society_id = Column(String(36), ForeignKey("societies.id"), nullable=True)
    category = Column(String(100), nullable=False)  # "Electrician", "Plumber", "Doctor", "Carpenter", "Painter", "Appliance Repair", "Vendor"
    name = Column(String(255), nullable=False)
    phone_number = Column(String(50), nullable=False)
    whatsapp_number = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    society = relationship("Society", back_populates="service_providers")
    reviews = relationship("ProviderReview", back_populates="provider", cascade="all, delete-orphan")

class ProviderReview(Base):
    __tablename__ = "provider_reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    provider_id = Column(String(36), ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    user_name = Column(String(255), nullable=False)
    flat_number = Column(String(50), nullable=False)
    rating = Column(Integer, nullable=False)  # 1 to 5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    provider = relationship("ServiceProvider", back_populates="reviews")
    user = relationship("User", back_populates="reviews")
