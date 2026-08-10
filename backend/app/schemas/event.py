from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: datetime
    venue: Optional[str] = None
    fee_per_person: float = 0.00
    upi_qr_url: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventRSVPCreate(BaseModel):
    member_name: str
    flat_number: str
    attendees_count: int = 1
    total_amount: float
    payment_proof_url: Optional[str] = None
    utr_number: Optional[str] = None

class EventRSVPResponse(BaseModel):
    id: str
    event_id: str
    user_id: str
    member_name: str
    flat_number: str
    attendees_count: int
    total_amount: float
    payment_proof_url: Optional[str] = None
    utr_number: Optional[str] = None
    status: str
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
    total_collected: float = 0.00
    rsvps: Optional[List[EventRSVPResponse]] = []

    class Config:
        from_attributes = True
