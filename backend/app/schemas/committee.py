from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class CommitteeMemberCreate(BaseModel):
    name: str
    role: str
    flat_number: str
    photo_url: Optional[str] = None
    badge: Optional[str] = "Committee Member"
    display_order: Optional[int] = 0

class CommitteeMemberUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    flat_number: Optional[str] = None
    photo_url: Optional[str] = None
    badge: Optional[str] = None
    display_order: Optional[int] = None

class AssignCommitteeMemberRequest(BaseModel):
    user_id: str

class CommitteeMemberResponse(BaseModel):
    id: str
    society_id: Optional[str] = None
    user_id: Optional[str] = None
    linked_user_email: Optional[str] = None
    linked_user_name: Optional[str] = None
    name: str
    role: str
    flat_number: str
    photo_url: Optional[str] = None
    badge: str = "Committee Member"
    applaud_count: int = 0
    display_order: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
