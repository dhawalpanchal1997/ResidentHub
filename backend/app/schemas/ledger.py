from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

class LedgerCreate(BaseModel):
    transaction_type: str  # "income" | "expense"
    category: str  # "Maintenance", "Electricity", "Security", "Repairs", "Events", "Others"
    amount: float
    transaction_date: date
    description: Optional[str] = None
    receipt_url: Optional[str] = None
    statement_id: Optional[str] = None

class LedgerResponse(LedgerCreate):
    id: str
    society_id: Optional[str] = None
    statement_id: Optional[str] = None
    logged_by: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LedgerSummary(BaseModel):
    total_income: float
    total_expense: float
    current_balance: float
    monthly_breakdown: List[Dict[str, Any]]
    category_breakdown: List[Dict[str, Any]]

# ── Statement Document Schemas ─────────────────────────────────

class StatementDocumentResponse(BaseModel):
    id: str
    society_id: Optional[str] = None
    filename: str
    file_type: str
    file_size: int
    uploaded_by: Optional[str] = None
    uploader_name: Optional[str] = None
    status: str
    total_transactions_count: int
    total_income_amount: float
    total_expense_amount: float
    created_at: datetime
    committed_at: Optional[datetime] = None
    raw_content: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class StatementDocumentListResponse(BaseModel):
    total: int
    statements: List[StatementDocumentResponse]

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
    ai_reasoning: Optional[str] = None
    is_anomaly: bool = False
    selected: bool = True

class StatementParseRequest(BaseModel):
    statement_text: str
    filename: Optional[str] = "Pasted_Statement.txt"

class StatementParseResponse(BaseModel):
    statement_id: Optional[str] = None
    filename: Optional[str] = None
    total_detected: int
    total_income: float
    total_expense: float
    total_rsvps_matched: int
    ai_provider: Optional[str] = None
    model_used: Optional[str] = None
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
    statement_id: Optional[str] = None
    transactions: List[StatementCommitTransaction]

class StatementCommitResponse(BaseModel):
    statement_id: Optional[str] = None
    ledger_entries_created: int
    rsvps_approved: int
    total_income_added: float
    total_expense_added: float
    detail: str
