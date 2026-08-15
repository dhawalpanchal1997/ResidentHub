from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.models.user import User
from app.models.committee import CommitteeMember
from app.schemas.committee import (
    CommitteeMemberCreate,
    CommitteeMemberUpdate,
    CommitteeMemberResponse,
)

router = APIRouter(prefix="/committee", tags=["Society Committee & Honor"])

INITIAL_COMMITTEE = [
    {
        "name": "Shri Dhawal Panchal",
        "role": "Society Chairman",
        "flat_number": "B-201",
        "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces&auto=format&q=80",
        "badge": "Founding Trustee",
        "applaud_count": 154,
        "display_order": 1,
    },
    {
        "name": "Smt. Priya Sharma",
        "role": "Hon. Secretary",
        "flat_number": "A-102",
        "photo_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=faces&auto=format&q=80",
        "badge": "Cultural Lead",
        "applaud_count": 138,
        "display_order": 2,
    },
    {
        "name": "CA Rajesh Kulkarni",
        "role": "Hon. Treasurer",
        "flat_number": "C-404",
        "photo_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces&auto=format&q=80",
        "badge": "Fiscal Auditor",
        "applaud_count": 122,
        "display_order": 3,
    },
    {
        "name": "Col. Vikram Malhotra (Retd.)",
        "role": "Estate & Safety Convener",
        "flat_number": "B-302",
        "photo_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=faces&auto=format&q=80",
        "badge": "Safety Custodian",
        "applaud_count": 145,
        "display_order": 4,
    },
]

@router.get("/", response_model=List[CommitteeMemberResponse])
async def get_committee_members(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CommitteeMember).order_by(CommitteeMember.display_order.asc(), CommitteeMember.created_at.asc()))
    members = result.scalars().all()

    # Seed if empty
    if not members:
        for item in INITIAL_COMMITTEE:
            member_obj = CommitteeMember(
                name=item["name"],
                role=item["role"],
                flat_number=item["flat_number"],
                photo_url=item["photo_url"],
                badge=item["badge"],
                applaud_count=item["applaud_count"],
                display_order=item["display_order"],
                created_at=datetime.utcnow()
            )
            db.add(member_obj)
        await db.commit()

        result = await db.execute(select(CommitteeMember).order_by(CommitteeMember.display_order.asc(), CommitteeMember.created_at.asc()))
        members = result.scalars().all()

    return [CommitteeMemberResponse.model_validate(m) for m in members]

@router.post("/", response_model=CommitteeMemberResponse, status_code=status.HTTP_201_CREATED)
async def create_committee_member(
    member_in: CommitteeMemberCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    new_member = CommitteeMember(
        society_id=current_admin.society_id,
        name=member_in.name,
        role=member_in.role,
        flat_number=member_in.flat_number,
        photo_url=member_in.photo_url or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces&auto=format&q=80",
        badge=member_in.badge or "Committee Member",
        display_order=member_in.display_order or 0,
        applaud_count=10,
        created_at=datetime.utcnow()
    )
    db.add(new_member)
    await db.commit()
    await db.refresh(new_member)
    return CommitteeMemberResponse.model_validate(new_member)

@router.put("/{member_id}", response_model=CommitteeMemberResponse)
async def update_committee_member(
    member_id: str,
    member_in: CommitteeMemberUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(CommitteeMember).where(CommitteeMember.id == member_id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Committee member not found")

    if member_in.name is not None:
        member.name = member_in.name
    if member_in.role is not None:
        member.role = member_in.role
    if member_in.flat_number is not None:
        member.flat_number = member_in.flat_number
    if member_in.photo_url is not None:
        member.photo_url = member_in.photo_url
    if member_in.badge is not None:
        member.badge = member_in.badge
    if member_in.display_order is not None:
        member.display_order = member_in.display_order

    await db.commit()
    await db.refresh(member)
    return CommitteeMemberResponse.model_validate(member)

@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_committee_member(
    member_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(CommitteeMember).where(CommitteeMember.id == member_id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Committee member not found")

    await db.delete(member)
    await db.commit()
    return None

@router.post("/{member_id}/applaud")
async def applaud_committee_member(
    member_id: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(CommitteeMember).where(CommitteeMember.id == member_id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Committee member not found")

    member.applaud_count = (member.applaud_count or 0) + 1
    await db.commit()
    return {"id": member.id, "applaud_count": member.applaud_count}
