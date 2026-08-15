import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Notice(Base):
    __tablename__ = "notices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    society_id = Column(String(36), ForeignKey("societies.id"), nullable=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(100), default="General")  # "General", "Maintenance", "Security", "Festival", "Emergency", "Financial"
    priority = Column(String(50), default="normal")    # "normal", "high", "urgent"
    author_name = Column(String(255), default="Managing Committee")
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    society = relationship("Society", backref="notices")
    user = relationship("User", backref="created_notices")
