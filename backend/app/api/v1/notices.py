from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.models.user import User
from app.models.notice import Notice
from app.schemas.notice import NoticeCreate, NoticeResponse

router = APIRouter(prefix="/notices", tags=["Society Notice Board"])

INITIAL_NOTICES = [
    {
        "title": "Quarterly Schindler Lift AMC & Inspection Complete",
        "content": "Quarterly preventive maintenance and safety sensor testing for Tower 24 Passenger Lifts A & B was conducted successfully. Next inspection scheduled in November 2026.",
        "category": "Maintenance",
        "priority": "normal",
        "author_name": "Estate & Maintenance Committee",
    },
    {
        "title": "Overhead Water Tank Cleaning & Chlorination",
        "content": "Semi-annual overhead & underground water tank sanitization scheduled for this Sunday between 10:00 AM and 2:00 PM. Please store adequate water for morning requirements.",
        "category": "Maintenance",
        "priority": "high",
        "author_name": "Managing Committee",
    },
    {
        "title": "Independence Day Celebration & Flag Hoisting Schedule",
        "content": "All residents and their families are cordially invited to celebrate the 76th Independence Day at the Society Clubhouse ground. Flag hoisting begins promptly at 9:00 AM followed by cultural events and refreshments.",
        "category": "Festival",
        "priority": "normal",
        "author_name": "Cultural Committee",
    },
    {
        "title": "Rooftop Solar Meter Grid Synchronization Verification",
        "content": "Common area rooftop solar net-metering grid sync verification complete. Estimated monthly electricity savings: ~₹18,500.",
        "category": "Financial",
        "priority": "normal",
        "author_name": "Managing Committee",
    },
]

@router.get("/", response_model=List[NoticeResponse])
async def get_notices(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Notice).order_by(Notice.created_at.desc()))
    notices = result.scalars().all()

    # If database has no notices yet, seed initial notices
    if not notices:
        for item in INITIAL_NOTICES:
            notice_obj = Notice(
                title=item["title"],
                content=item["content"],
                category=item["category"],
                priority=item["priority"],
                author_name=item["author_name"],
                created_at=datetime.utcnow()
            )
            db.add(notice_obj)
        await db.commit()
        
        result = await db.execute(select(Notice).order_by(Notice.created_at.desc()))
        notices = result.scalars().all()

    return [NoticeResponse.model_validate(n) for n in notices]

@router.post("/", response_model=NoticeResponse, status_code=status.HTTP_201_CREATED)
async def create_notice(
    notice_in: NoticeCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    new_notice = Notice(
        society_id=current_admin.society_id,
        title=notice_in.title,
        content=notice_in.content,
        category=notice_in.category or "General",
        priority=notice_in.priority or "normal",
        author_name=notice_in.author_name or (f"{current_admin.full_name} (Admin)" if current_admin.full_name else "Managing Committee"),
        created_by=current_admin.id,
        created_at=datetime.utcnow()
    )
    db.add(new_notice)
    await db.commit()
    await db.refresh(new_notice)
    return NoticeResponse.model_validate(new_notice)

@router.delete("/{notice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notice(
    notice_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Notice).where(Notice.id == notice_id))
    notice = result.scalar_one_or_none()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")

    await db.delete(notice)
    await db.commit()
    return None
