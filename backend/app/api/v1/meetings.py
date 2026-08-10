from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.models.user import User
from app.models.meeting import Meeting, MeetingChunk
from app.schemas.meeting import (
    MeetingCreate,
    MeetingResponse,
    MeetingStructuredSummary,
    MeetingPublishUpdate,
    MeetingQAQuery,
    MeetingQAResponse
)
from app.services.meeting_extractor import extract_meeting_summary
from app.services.rag_service import answer_society_query

router = APIRouter(prefix="/meetings", tags=["Meeting AI & Q&A"])

@router.get("/", response_model=List[MeetingResponse])
async def list_meetings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Meeting).order_by(Meeting.meeting_date.desc()))
    meetings = result.scalars().all()
    
    out = []
    for m in meetings:
        summary_obj = None
        if m.structured_summary:
            try:
                summary_obj = MeetingStructuredSummary.model_validate(m.structured_summary)
            except Exception:
                summary_obj = None
        out.append(MeetingResponse(
            id=m.id,
            society_id=m.society_id,
            title=m.title,
            meeting_date=m.meeting_date,
            meeting_type=m.meeting_type,
            raw_transcript=m.raw_transcript,
            structured_summary=summary_obj,
            is_published=m.is_published,
            created_at=m.created_at
        ))
    return out

@router.post("/process-transcript", response_model=MeetingResponse)
async def process_meeting_transcript(
    meeting_in: MeetingCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Ingests raw meeting minutes/transcript, runs deterministic LangGraph/Pydantic extraction,
    and saves as a 'draft' meeting ready for admin review before publishing.
    """
    structured_summary = await extract_meeting_summary(
        title=meeting_in.title,
        meeting_date=str(meeting_in.meeting_date),
        meeting_type=meeting_in.meeting_type,
        transcript=meeting_in.raw_transcript
    )

    new_meeting = Meeting(
        title=meeting_in.title,
        meeting_date=meeting_in.meeting_date,
        meeting_type=meeting_in.meeting_type,
        raw_transcript=meeting_in.raw_transcript,
        structured_summary=structured_summary.model_dump(),
        is_published="draft",
        created_by=current_user.id
    )
    db.add(new_meeting)
    await db.commit()
    await db.refresh(new_meeting)

    return MeetingResponse(
        id=new_meeting.id,
        title=new_meeting.title,
        meeting_date=new_meeting.meeting_date,
        meeting_type=new_meeting.meeting_type,
        raw_transcript=new_meeting.raw_transcript,
        structured_summary=structured_summary,
        is_published=new_meeting.is_published,
        created_at=new_meeting.created_at
    )

@router.patch("/{meeting_id}/publish", response_model=MeetingResponse)
async def publish_meeting(
    meeting_id: str,
    update_in: MeetingPublishUpdate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Meeting).where(Meeting.id == meeting_id))
    meeting = result.scalars().first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting record not found")

    meeting.structured_summary = update_in.structured_summary.model_dump()
    meeting.is_published = "published"
    await db.commit()
    await db.refresh(meeting)

    return MeetingResponse(
        id=meeting.id,
        title=meeting.title,
        meeting_date=meeting.meeting_date,
        meeting_type=meeting.meeting_type,
        raw_transcript=meeting.raw_transcript,
        structured_summary=update_in.structured_summary,
        is_published=meeting.is_published,
        created_at=meeting.created_at
    )

@router.post("/ask-ai", response_model=MeetingQAResponse)
async def ask_society_ai(
    query_in: MeetingQAQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Conversational RAG Q&A across published meeting decisions, budgets, and action items.
    """
    answer_dict = await answer_society_query(
        query=query_in.query,
        db=db,
        meeting_id=query_in.meeting_id
    )
    return MeetingQAResponse(**answer_dict)
