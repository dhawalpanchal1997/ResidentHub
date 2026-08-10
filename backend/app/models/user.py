import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    society_id = Column(String(36), ForeignKey("societies.id"), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    flat_number = Column(String(50), nullable=False)
    phone_number = Column(String(20), nullable=True)
    role = Column(String(20), default="member")  # "admin" | "member"
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    society = relationship("Society", back_populates="users")
    rsvps = relationship("EventRSVP", back_populates="user")
    reviews = relationship("ProviderReview", back_populates="user")
