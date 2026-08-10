import io
import csv
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.models.user import User
from app.models.event import Event, EventRSVP
from app.schemas.event import EventCreate, EventResponse, EventRSVPCreate, EventRSVPResponse

router = APIRouter(prefix="/events", tags=["Events & RSVPs"])

@router.get("/", response_model=List[EventResponse])
async def list_events(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Event)
        .options(selectinload(Event.rsvps))
        .order_by(Event.event_date.desc())
    )
    events = result.scalars().all()
    
    response_list = []
    for ev in events:
        ev_dict = {
            "id": ev.id,
            "society_id": ev.society_id,
            "title": ev.title,
            "description": ev.description,
            "event_date": ev.event_date,
            "venue": ev.venue,
            "fee_per_person": float(ev.fee_per_person or 0),
            "upi_qr_url": ev.upi_qr_url,
            "created_by": ev.created_by,
            "created_at": ev.created_at,
            "rsvps_count": len(ev.rsvps),
            "total_attendees": sum(r.attendees_count for r in ev.rsvps if r.status == "approved"),
            "total_collected": sum(float(r.total_amount) for r in ev.rsvps if r.status == "approved"),
            "rsvps": [EventRSVPResponse.model_validate(r) for r in ev.rsvps]
        }
        response_list.append(EventResponse(**ev_dict))
    return response_list

@router.post("/", response_model=EventResponse)
async def create_event(
    event_in: EventCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    new_event = Event(
        title=event_in.title,
        description=event_in.description,
        event_date=event_in.event_date,
        venue=event_in.venue,
        fee_per_person=event_in.fee_per_person,
        upi_qr_url=event_in.upi_qr_url,
        created_by=current_user.id
    )
    db.add(new_event)
    await db.commit()
    await db.refresh(new_event)
    
    return EventResponse(
        id=new_event.id,
        title=new_event.title,
        description=new_event.description,
        event_date=new_event.event_date,
        venue=new_event.venue,
        fee_per_person=float(new_event.fee_per_person or 0),
        upi_qr_url=new_event.upi_qr_url,
        created_by=new_event.created_by,
        created_at=new_event.created_at,
        rsvps_count=0,
        total_attendees=0,
        total_collected=0.0,
        rsvps=[]
    )

@router.post("/{event_id}/rsvp", response_model=EventRSVPResponse)
async def submit_rsvp(
    event_id: str,
    rsvp_in: EventRSVPCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user already RSVP'd
    existing_rsvp = await db.execute(
        select(EventRSVP).where(EventRSVP.event_id == event_id, EventRSVP.user_id == current_user.id)
    )
    if existing_rsvp.scalars().first():
        raise HTTPException(status_code=400, detail="You have already submitted an RSVP for this event.")

    new_rsvp = EventRSVP(
        event_id=event_id,
        user_id=current_user.id,
        member_name=rsvp_in.member_name or current_user.full_name,
        flat_number=rsvp_in.flat_number or current_user.flat_number,
        attendees_count=rsvp_in.attendees_count,
        total_amount=rsvp_in.total_amount,
        payment_proof_url=rsvp_in.payment_proof_url,
        utr_number=rsvp_in.utr_number,
        status="pending"
    )
    db.add(new_rsvp)
    await db.commit()
    await db.refresh(new_rsvp)
    return EventRSVPResponse.model_validate(new_rsvp)

@router.patch("/rsvp/{rsvp_id}/status", response_model=EventRSVPResponse)
async def update_rsvp_status(
    rsvp_id: str,
    status_update: str,  # "approved" or "rejected"
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(EventRSVP).where(EventRSVP.id == rsvp_id))
    rsvp = result.scalars().first()
    if not rsvp:
        raise HTTPException(status_code=404, detail="RSVP not found")

    if status_update not in ["approved", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid status value")

    rsvp.status = status_update
    await db.commit()
    await db.refresh(rsvp)
    return EventRSVPResponse.model_validate(rsvp)

@router.get("/{event_id}/export-csv")
async def export_event_attendees_csv(
    event_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Event).options(selectinload(Event.rsvps)).where(Event.id == event_id)
    )
    event = result.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Member Name", "Flat Number", "Attendees", "Amount (INR)", "UTR / Reference", "Status", "Submission Time"])

    for r in event.rsvps:
        writer.writerow([
            r.member_name,
            r.flat_number,
            r.attendees_count,
            float(r.total_amount),
            r.utr_number or "N/A",
            r.status.upper(),
            r.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=event_{event_id}_attendees.csv"}
    )
