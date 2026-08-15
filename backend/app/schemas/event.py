from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: datetime
    venue: Optional[str] = None
    
    # Tiered Pricing
    fee_per_person: float = 0.00  # Default / Base fee
    fee_adult: float = 0.00
    fee_child: float = 0.00
    fee_senior: float = 0.00
    
    upi_qr_url: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    venue: Optional[str] = None
    fee_per_person: Optional[float] = None
    fee_adult: Optional[float] = None
    fee_child: Optional[float] = None
    fee_senior: Optional[float] = None
    upi_qr_url: Optional[str] = None

class EventRSVPCreate(BaseModel):
    member_name: str
    flat_number: str
    adults_count: int = 1
    children_count: int = 0
    seniors_count: int = 0
    attendees_count: Optional[int] = None
    total_amount: float
    payment_proof_url: Optional[str] = None
    utr_number: Optional[str] = None

class EventRSVPResponse(BaseModel):
    id: str
    event_id: str
    user_id: str
    member_name: str
    flat_number: str
    adults_count: int = 1
    children_count: int = 0
    seniors_count: int = 0
    attendees_count: int
    total_amount: float
    payment_proof_url: Optional[str] = None
    utr_number: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class EventExpenseCreate(BaseModel):
    category: str  # "Catering & Food", "Decorations & Stage", "DJ & Sound", "Prizes & Gifts", "Cleaning & Housekeeping", "Misc / Supplies"
    title: str
    vendor_name: Optional[str] = None
    amount: float
    invoice_ref: Optional[str] = None
    expense_date: Optional[date] = None

class EventExpenseResponse(BaseModel):
    id: str
    event_id: str
    category: str
    title: str
    vendor_name: Optional[str] = None
    amount: float
    invoice_ref: Optional[str] = None
    expense_date: date
    logged_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class EventResponse(EventBase):
    id: str
    society_id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    rsvps_count: int = 0
    total_attendees: int = 0
    total_adults: int = 0
    total_children: int = 0
    total_seniors: int = 0
    total_collected: float = 0.00
    total_expenses: float = 0.00
    net_balance: float = 0.00
    rsvps: Optional[List[EventRSVPResponse]] = []
    expenses: Optional[List[EventExpenseResponse]] = []

    class Config:
        from_attributes = True
