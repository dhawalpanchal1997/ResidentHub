from datetime import date, datetime
from typing import Optional, List, Dict
from pydantic import BaseModel

class LedgerCreate(BaseModel):
    transaction_type: str  # "income" | "expense"
    category: str  # "Maintenance", "Electricity", "Security", "Repairs", "Events", "Others"
    amount: float
    transaction_date: date
    description: Optional[str] = None
    receipt_url: Optional[str] = None

class LedgerResponse(LedgerCreate):
    id: str
    society_id: Optional[str] = None
    logged_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class LedgerSummary(BaseModel):
    total_income: float
    total_expense: float
    current_balance: float
    monthly_breakdown: List[Dict[str, float | str]]
    category_breakdown: List[Dict[str, float | str]]

# ── AI Bank Statement Reconciliation Schemas ──────────────────

class ParsedBankTransaction(BaseModel):
    temp_id: str
    transaction_date: date
    transaction_type: str  # "income" | "expense"
    amount: float
    raw_narration: str
    utr_number: Optional[str] = None
    category: str
    description: str
    matched_event_id: Optional[str] = None
    matched_event_title: Optional[str] = None
    matched_rsvp_id: Optional[str] = None
    matched_entity_info: Optional[str] = None
    match_confidence: str = "none"  # "high" | "medium" | "low" | "none"
    match_type: Optional[str] = None  # "rsvp" | "event_expense" | "vendor" | "maintenance" | "general"
    auto_approve_rsvp: bool = False
    selected: bool = True

class StatementParseRequest(BaseModel):
    statement_text: str

class StatementParseResponse(BaseModel):
    total_detected: int
    total_income: float
    total_expense: float
    total_rsvps_matched: int
    transactions: List[ParsedBankTransaction]

class StatementCommitTransaction(BaseModel):
    transaction_date: date
    transaction_type: str
    amount: float
    category: str
    description: str
    utr_number: Optional[str] = None
    matched_rsvp_id: Optional[str] = None
    matched_event_id: Optional[str] = None
    auto_approve_rsvp: bool = False

class StatementCommitRequest(BaseModel):
    transactions: List[StatementCommitTransaction]

class StatementCommitResponse(BaseModel):
    ledger_entries_created: int
    rsvps_approved: int
    total_income_added: float
    total_expense_added: float
    detail: str
