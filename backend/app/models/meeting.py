import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Text, Date, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

try:
    from pgvector.sqlalchemy import Vector
    HAS_PGVECTOR = True
except ImportError:
    HAS_PGVECTOR = False


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    society_id = Column(String(36), ForeignKey("societies.id"), nullable=True)
    title = Column(String(255), nullable=False)
    meeting_date = Column(Date, default=date.today, nullable=False)
    meeting_type = Column(String(50), default="Monthly Committee")  # "AGM", "EGM", "Monthly Committee", "General Body"
    raw_transcript = Column(Text, nullable=False)
    structured_summary = Column(JSON, nullable=True)  # Pydantic-validated resolutions, budget approvals, action items
    is_published = Column(String(20), default="draft")  # "draft" | "published"
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    society = relationship("Society", back_populates="meetings")
    chunks = relationship("MeetingChunk", back_populates="meeting", cascade="all, delete-orphan")


class MeetingChunk(Base):
    __tablename__ = "meeting_chunks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    meeting_id = Column(String(36), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(String(50), nullable=True)
    category = Column(String(50), nullable=True)  # "resolution", "budget", "action_item", "discussion"
    content = Column(Text, nullable=False)
    # Embedding column: Vector for PostgreSQL + pgvector, JSON for SQLite
    embedding = Column(Vector(1536) if HAS_PGVECTOR else JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    meeting = relationship("Meeting", back_populates="chunks")
