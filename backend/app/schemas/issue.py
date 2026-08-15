from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class IssueActivityResponse(BaseModel):
    id: str
    issue_id: str
    action: str
    actor_name: str
    actor_role: str
    comment: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class IssueCommentCreate(BaseModel):
    comment: str
    actor_name: Optional[str] = None
    actor_role: Optional[str] = "resident"

class IssueCreate(BaseModel):
    title: str
    description: str
    category: str = "General"
    priority: str = "medium"
    location: str = "Flat Interior"
    preferred_slot: Optional[str] = None
    photo_url: Optional[str] = None
    flat_number: Optional[str] = None
    reported_by: Optional[str] = None

class IssueUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_vendor_id: Optional[str] = None
    assigned_vendor_name: Optional[str] = None
    resolution_notes: Optional[str] = None

class IssueResponse(BaseModel):
    id: str
    ticket_number: str
    society_id: Optional[str] = None
    user_id: Optional[str] = None
    flat_number: str
    reported_by: str
    title: str
    description: str
    category: str = "General"
    priority: str = "medium"
    status: str = "open"
    location: str = "Flat Interior"
    preferred_slot: Optional[str] = None
    photo_url: Optional[str] = None
    assigned_vendor_id: Optional[str] = None
    assigned_vendor_name: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    activities: List[IssueActivityResponse] = []

    model_config = ConfigDict(from_attributes=True)

class IssueCategoryStat(BaseModel):
    category: str
    count: int
    resolved: int
    pct: float

class IssueAnalyticsOverview(BaseModel):
    total_issues: int
    open_issues: int
    in_progress_issues: int
    resolved_issues: int
    resolution_rate: float
    avg_resolution_hours: float
    category_distribution: List[IssueCategoryStat]
    priority_breakdown: List[dict]
    recent_resolved: int

class IssueDuplicateCheckRequest(BaseModel):
    title: str
    description: str
    category: str = "General"
    location: str = "Flat Interior"
    flat_number: Optional[str] = None

class IssueDuplicateCheckResponse(BaseModel):
    is_duplicate: bool
    confidence: str = "none"  # "high" | "medium" | "low" | "none"
    matched_issue_id: Optional[str] = None
    matched_ticket_number: Optional[str] = None
    matched_title: Optional[str] = None
    matched_status: Optional[str] = None
    matched_location: Optional[str] = None
    matched_category: Optional[str] = None
    is_common_facility: bool = False
    reasoning: str
    clarification_question: str
