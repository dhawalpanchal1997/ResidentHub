from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: str
    provider_id: str
    user_id: str
    user_name: str
    flat_number: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class VendorCreate(BaseModel):
    category: str  # "Electrician", "Plumber", "Doctor", "Carpenter", "Painter", "Appliance Repair", "Vendor"
    name: str
    phone_number: str
    whatsapp_number: Optional[str] = None
    notes: Optional[str] = None

class VendorResponse(VendorCreate):
    id: str
    society_id: Optional[str] = None
    created_at: datetime
    average_rating: float = 0.0
    total_reviews: int = 0
    reviews: Optional[List[ReviewResponse]] = []

    class Config:
        from_attributes = True
