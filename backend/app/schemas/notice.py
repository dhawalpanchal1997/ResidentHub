from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class NoticeCreate(BaseModel):
    title: str
    content: str
    category: Optional[str] = "General"
    priority: Optional[str] = "normal"
    author_name: Optional[str] = "Managing Committee"

class NoticeResponse(BaseModel):
    id: str
    society_id: Optional[str] = None
    title: str
    content: str
    category: str = "General"
    priority: str = "normal"
    author_name: str = "Managing Committee"
    created_by: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
