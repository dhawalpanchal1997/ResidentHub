from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import uuid

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
from app.services.ai_factory import get_llm
from langchain_ollama import OllamaEmbeddings
from langchain_groq import ChatGroq

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

    # Create meeting chunks with embeddings for RAG
    await create_meeting_chunks(meeting, db)

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


async def create_meeting_chunks(meeting: Meeting, db: AsyncSession):
    """
    Create meeting chunks with embeddings for vector search RAG.
    Chunks are created from structured summary items and raw transcript.
    """
    from app.core.config import settings
    
    chunks = []
    
    # Create chunks from structured summary
    if meeting.structured_summary:
        summary = meeting.structured_summary
        
        # Resolution chunks
        for res in summary.get("resolutions", []):
            content = f"Resolution: {res.get('title', '')}\n{res.get('description', '')}"
            chunks.append({
                "chunk_index": f"RES-{res.get('id', '')}",
                "category": "resolution",
                "content": content,
                "metadata": {"resolution_id": res.get('id'), "status": res.get('status')}
            })
        
        # Budget approval chunks
        for bud in summary.get("budget_approvals", []):
            content = f"Budget Approval: {bud.get('expense_category', '')}\nVendor: {bud.get('vendor_or_contractor', '')}\nAmount: ₹{bud.get('approved_amount', 0)}\nNotes: {bud.get('notes', '')}"
            chunks.append({
                "chunk_index": f"BUD-{bud.get('id', '')}",
                "category": "budget",
                "content": content,
                "metadata": {"budget_id": bud.get('id'), "amount": bud.get('approved_amount')}
            })
        
        # Action item chunks
        for act in summary.get("action_items", []):
            content = f"Action Item: {act.get('task', '')}\nAssigned to: {act.get('assigned_to', '')}\nTarget Date: {act.get('target_date', '')}\nPriority: {act.get('priority', '')}"
            chunks.append({
                "chunk_index": f"ACT-{act.get('id', '')}",
                "category": "action_item",
                "content": content,
                "metadata": {"action_id": act.get('id'), "assigned_to": act.get('assigned_to')}
            })
    
    # Also chunk the raw transcript for semantic search
    raw_chunks = meeting.raw_transcript.split("\n\n")
    for i, chunk in enumerate(raw_chunks):
        if len(chunk.strip()) > 50:
            chunks.append({
                "chunk_index": f"RAW-{i:03d}",
                "category": "discussion",
                "content": chunk.strip()[:1000],  # Limit chunk size
                "metadata": {"chunk_index": i}
            })
    
    if not chunks:
        return
    
    # Generate embeddings
    embeddings = []
    try:
        if settings.LLM_PROVIDER == "groq" and settings.GROQ_API_KEY:
            # Use Ollama embeddings as Groq doesn't provide embeddings
            embeddings_model = OllamaEmbeddings(
                base_url=settings.OLLAMA_BASE_URL,
                model="nomic-embed-text:latest"
            )
        else:
            embeddings_model = OllamaEmbeddings(
                base_url=settings.OLLAMA_BASE_URL,
                model=settings.OLLAMA_MODEL.replace("gemma", "nomic-embed-text")
            )
        
        texts = [c["content"] for c in chunks]
        embeddings = await embeddings_model.aembed_documents(texts)
    except Exception as e:
        print(f"Warning: Could not generate embeddings: {e}")
        embeddings = [None] * len(chunks)
    
    # Save chunks to database
    for i, chunk_data in enumerate(chunks):
        embedding = embeddings[i] if i < len(embeddings) else None
        meeting_chunk = MeetingChunk(
            id=str(uuid.uuid4()),
            meeting_id=meeting.id,
            chunk_index=chunk_data["chunk_index"],
            category=chunk_data["category"],
            content=chunk_data["content"],
            embedding=embedding,
            metadata=chunk_data["metadata"]
        )
        db.add(meeting_chunk)
    
    await db.commit()
