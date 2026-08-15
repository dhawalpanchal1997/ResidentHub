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

@router.get("/", response_model=List[NoticeResponse])
async def get_notices(db: AsyncSession = Depends(get_db)):
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
