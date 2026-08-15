import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base

class Issue(Base):
    __tablename__ = "issues"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_number = Column(String(50), nullable=False, unique=True)
    society_id = Column(String(36), ForeignKey("societies.id"), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    flat_number = Column(String(50), nullable=False)
    reported_by = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), default="General")  # "Plumbing", "Electrical", "Elevator", "Security", "Common Area", "Cleanliness", "Noise"
    priority = Column(String(50), default="medium")     # "low", "medium", "high", "emergency"
    status = Column(String(50), default="open")         # "open", "assigned", "in_progress", "resolved", "closed"
    location = Column(String(255), default="Flat Interior")
    preferred_slot = Column(String(255), nullable=True)
    photo_url = Column(String(500), nullable=True)
    assigned_vendor_id = Column(String(36), ForeignKey("service_providers.id"), nullable=True)
    assigned_vendor_name = Column(String(255), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    society = relationship("Society", backref="issues")
    user = relationship("User", backref="reported_issues")
    assigned_vendor = relationship("ServiceProvider", backref="assigned_issues")
    activities = relationship("IssueActivity", back_populates="issue", cascade="all, delete-orphan", order_by="IssueActivity.created_at.asc()")

class IssueActivity(Base):
    __tablename__ = "issue_activities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    issue_id = Column(String(36), ForeignKey("issues.id"), nullable=False)
    action = Column(String(100), default="commented")  # "created", "status_changed", "assigned", "commented", "resolved"
    actor_name = Column(String(255), nullable=False)
    actor_role = Column(String(50), default="resident")  # "resident", "admin", "vendor", "system"
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    issue = relationship("Issue", back_populates="activities")
