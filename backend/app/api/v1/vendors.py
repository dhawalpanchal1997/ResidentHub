from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.models.user import User
from app.models.vendor import ServiceProvider, ProviderReview
from app.schemas.vendor import VendorCreate, VendorResponse, ReviewCreate, ReviewResponse

router = APIRouter(prefix="/vendors", tags=["Vendor & Worker Directory"])

from sqlalchemy import or_

@router.get("/", response_model=List[VendorResponse])
async def list_vendors(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by name or note"),
    db: AsyncSession = Depends(get_db)
):
    query = select(ServiceProvider).options(selectinload(ServiceProvider.reviews))
    if category and category.strip() and category.lower() != "all":
        # Support compound filter terms like "Security / Guards" matching "Security"
        terms = [t.strip() for t in category.split("/") if t.strip()]
        conds = [ServiceProvider.category.ilike(f"%{t}%") for t in terms]
        query = query.where(or_(*conds))
    
    result = await db.execute(query)
    providers = result.scalars().all()

    response_list = []
    for p in providers:
        if search:
            s_lower = search.lower()
            if s_lower not in p.name.lower() and s_lower not in (p.notes or "").lower():
                continue

        reviews = p.reviews or []
        avg_rating = sum(r.rating for r in reviews) / len(reviews) if reviews else 0.0

        p_dict = {
            "id": p.id,
            "society_id": p.society_id,
            "category": p.category,
            "name": p.name,
            "phone_number": p.phone_number,
            "whatsapp_number": p.whatsapp_number,
            "notes": p.notes,
            "created_at": p.created_at,
            "average_rating": round(avg_rating, 1),
            "total_reviews": len(reviews),
            "reviews": [ReviewResponse.model_validate(r) for r in reviews]
        }
        response_list.append(VendorResponse(**p_dict))
    
    # Sort by rating desc
    response_list.sort(key=lambda x: x.average_rating, reverse=True)
    return response_list

@router.post("/", response_model=VendorResponse)
async def create_vendor(
    vendor_in: VendorCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_provider = ServiceProvider(
        category=vendor_in.category,
        name=vendor_in.name,
        phone_number=vendor_in.phone_number,
        whatsapp_number=vendor_in.whatsapp_number,
        notes=vendor_in.notes
    )
    db.add(new_provider)
    await db.commit()
    await db.refresh(new_provider)

    return VendorResponse(
        id=new_provider.id,
        category=new_provider.category,
        name=new_provider.name,
        phone_number=new_provider.phone_number,
        whatsapp_number=new_provider.whatsapp_number,
        notes=new_provider.notes,
        created_at=new_provider.created_at,
        average_rating=0.0,
        total_reviews=0,
        reviews=[]
    )

@router.delete("/{provider_id}")
async def delete_vendor(
    provider_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ServiceProvider).where(ServiceProvider.id == provider_id))
    provider = result.scalars().first()
    if not provider:
        raise HTTPException(status_code=404, detail="Service provider not found")
    
    await db.delete(provider)
    await db.commit()
    return {"detail": "Vendor deleted successfully"}

@router.post("/{provider_id}/reviews", response_model=ReviewResponse)
async def add_vendor_review(
    provider_id: str,
    review_in: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ServiceProvider).where(ServiceProvider.id == provider_id))
    provider = result.scalars().first()
    if not provider:
        raise HTTPException(status_code=404, detail="Service provider not found")

    new_review = ProviderReview(
        provider_id=provider_id,
        user_id=current_user.id,
        user_name=current_user.full_name,
        flat_number=current_user.flat_number,
        rating=review_in.rating,
        comment=review_in.comment
    )
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)
    return ReviewResponse.model_validate(new_review)
