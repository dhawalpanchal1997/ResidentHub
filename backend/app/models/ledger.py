import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Text, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.statement import StatementDocument

class LedgerTransaction(Base):
    __tablename__ = "ledger_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    society_id = Column(String(36), ForeignKey("societies.id"), nullable=True)
    transaction_type = Column(String(20), nullable=False)  # "income" | "expense"
    category = Column(String(100), nullable=False)  # "Maintenance", "Electricity", "Security", "Repairs", "Events", "Others"
    amount = Column(Numeric(12, 2), nullable=False)
    transaction_date = Column(Date, default=date.today, nullable=False)
    description = Column(Text, nullable=True)
    receipt_url = Column(Text, nullable=True)
    statement_id = Column(String(36), ForeignKey("statement_documents.id"), nullable=True)
    logged_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    society = relationship("Society", back_populates="ledger_entries")
    statement = relationship("StatementDocument", backref="ledger_transactions")
