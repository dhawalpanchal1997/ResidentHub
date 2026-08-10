from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class ResolutionItem(BaseModel):
    id: str = Field(description="Sequential ID, e.g., RES-01")
    title: str = Field(description="Short title of the resolution")
    description: str = Field(description="Detailed resolution decision passed by the committee/members")
    status: str = Field(default="Approved", description="Status: Approved, Rejected, Deferred")
    vote_summary: Optional[str] = Field(default="Unanimously Passed", description="Vote consensus or tally")

class BudgetApprovalItem(BaseModel):
    id: str = Field(description="Sequential ID, e.g., BUD-01")
    expense_category: str = Field(description="Category, e.g., Lift AMC, Painting, Security Cameras")
    vendor_or_contractor: Optional[str] = Field(default="TBD", description="Proposed vendor or contractor name")
    approved_amount: float = Field(description="Approved monetary budget limit in INR / Currency")
    notes: Optional[str] = Field(default=None, description="Payment schedule or condition")

class ActionItem(BaseModel):
    id: str = Field(description="Sequential ID, e.g., ACT-01")
    task: str = Field(description="Clear task description")
    assigned_to: str = Field(description="Name or role of the owner responsible")
    target_date: Optional[str] = Field(default="Next Committee Meeting", description="Target completion deadline")
    priority: str = Field(default="Medium", description="High, Medium, Low")

class MeetingStructuredSummary(BaseModel):
    meeting_title: str
    meeting_date: str
    meeting_type: str
    executive_summary: str = Field(description="2-3 sentence overview of major outcomes")
    resolutions: List[ResolutionItem] = Field(default_factory=list)
    budget_approvals: List[BudgetApprovalItem] = Field(default_factory=list)
    action_items: List[ActionItem] = Field(default_factory=list)
    general_notes: List[str] = Field(default_factory=list)

class MeetingCreate(BaseModel):
    title: str
    meeting_date: date
    meeting_type: str = "Monthly Committee"
    raw_transcript: str

class MeetingPublishUpdate(BaseModel):
    structured_summary: MeetingStructuredSummary

class MeetingResponse(BaseModel):
    id: str
    society_id: Optional[str] = None
    title: str
    meeting_date: date
    meeting_type: str
    raw_transcript: str
    structured_summary: Optional[MeetingStructuredSummary] = None
    is_published: str
    created_at: datetime

    class Config:
        from_attributes = True

class MeetingQAQuery(BaseModel):
    query: str
    meeting_id: Optional[str] = None  # None searches all society meetings

class MeetingQAResponse(BaseModel):
    query: str
    answer: str
    sources: List[dict] = []
