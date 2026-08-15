import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class StatementDocument(Base):
    __tablename__ = "statement_documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    society_id = Column(String(36), ForeignKey("societies.id"), nullable=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), default="text/csv")
    raw_content = Column(Text, nullable=False)
    file_size = Column(Integer, default=0)
    uploaded_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    status = Column(String(50), default="parsed")  # "parsed" | "committed" | "archived"
    total_transactions_count = Column(Integer, default=0)
    total_income_amount = Column(Float, default=0.0)
    total_expense_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    committed_at = Column(DateTime, nullable=True)

    # Relationships
    society = relationship("Society", backref="statement_documents")
    uploader = relationship("User", backref="uploaded_statements")
