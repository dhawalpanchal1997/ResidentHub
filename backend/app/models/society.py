import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Society(Base):
    __tablename__ = "societies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    upi_qr_image_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="society")
    events = relationship("Event", back_populates="society")
    ledger_entries = relationship("LedgerTransaction", back_populates="society")
    service_providers = relationship("ServiceProvider", back_populates="society")
    meetings = relationship("Meeting", back_populates="society")
