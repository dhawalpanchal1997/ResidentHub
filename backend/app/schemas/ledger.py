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
