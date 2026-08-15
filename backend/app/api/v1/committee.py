from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.models.user import User
from app.models.committee import CommitteeMember
from app.schemas.committee import (
    CommitteeMemberCreate,
    CommitteeMemberUpdate,
    CommitteeMemberResponse,
    AssignCommitteeMemberRequest,
)

router = APIRouter(prefix="/committee", tags=["Society Committee & Honor"])

@router.get("/", response_model=List[CommitteeMemberResponse])
async def get_committee_members(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CommitteeMember)
        .options(selectinload(CommitteeMember.user))
        .order_by(CommitteeMember.display_order.asc(), CommitteeMember.created_at.asc())
    )
    members = result.scalars().all()
    return [_build_committee_response(m) for m in members]

def _build_committee_response(member: CommitteeMember) -> CommitteeMemberResponse:
    response = CommitteeMemberResponse.model_validate(member)
    if member.user:
        response.user_id = member.user.id
        response.linked_user_email = member.user.email
        response.linked_user_name = member.user.full_name
    return response

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
    return _build_committee_response(new_member)

@router.put("/{member_id}", response_model=CommitteeMemberResponse)
async def update_committee_member(
    member_id: str,
    member_in: CommitteeMemberUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CommitteeMember)
        .options(selectinload(CommitteeMember.user))
        .where(CommitteeMember.id == member_id)
    )
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
    return _build_committee_response(member)

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

@router.post("/{member_id}/assign-user", response_model=CommitteeMemberResponse)
async def assign_user_to_committee_member(
    member_id: str,
    assign_in: AssignCommitteeMemberRequest,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    # Fetch the committee member
    result = await db.execute(
        select(CommitteeMember)
        .options(selectinload(CommitteeMember.user))
        .where(CommitteeMember.id == member_id)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Committee member not found")

    # Fetch the user to link
    result = await db.execute(select(User).where(User.id == assign_in.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user is already linked to another committee member in the same society
    result = await db.execute(
        select(CommitteeMember).where(
            CommitteeMember.user_id == assign_in.user_id,
            CommitteeMember.id != member_id,
            CommitteeMember.society_id == current_admin.society_id
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"User is already linked to committee member '{existing.name}'"
        )

    # Link the user
    member.user_id = assign_in.user_id
    
    # Elevate user role to admin
    user.role = "admin"
    
    await db.commit()
    await db.refresh(member)
    await db.refresh(user)
    
    return _build_committee_response(member)

@router.delete("/{member_id}/unlink-user", response_model=CommitteeMemberResponse)
async def unlink_user_from_committee_member(
    member_id: str,
    revert_role: bool = True,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    # Fetch the committee member
    result = await db.execute(
        select(CommitteeMember)
        .options(selectinload(CommitteeMember.user))
        .where(CommitteeMember.id == member_id)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Committee member not found")

    if not member.user_id:
        raise HTTPException(status_code=400, detail="No user linked to this committee member")

    # Store user reference before unlinking
    user = member.user
    
    # Unlink the user
    member.user_id = None
    
    # Optionally revert user role back to member
    if revert_role and user:
        user.role = "member"
    
    await db.commit()
    await db.refresh(member)
    
    return _build_committee_response(member)

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
