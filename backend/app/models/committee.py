import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class CommitteeMember(Base):
    __tablename__ = "committee_members"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    society_id = Column(String(36), ForeignKey("societies.id"), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    name = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)  # e.g. "Chairman & Governance", "Hon. Secretary", "Hon. Treasurer"
    flat_number = Column(String(50), nullable=False)  # e.g. "B-201"
    photo_url = Column(String(500), nullable=True)
    badge = Column(String(100), default="Committee Member")  # e.g. "Founding Trustee", "Cultural Lead"
    applaud_count = Column(Integer, default=50)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    society = relationship("Society", backref="committee_members")
    user = relationship("User", backref="committee_role")
