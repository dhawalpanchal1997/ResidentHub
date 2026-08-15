import io
import csv
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.models.user import User
from app.models.event import Event, EventRSVP, EventExpense
from app.schemas.event import (
    EventCreate, EventUpdate, EventResponse, EventRSVPCreate, EventRSVPResponse,
    EventExpenseCreate, EventExpenseResponse,
)

router = APIRouter(prefix="/events", tags=["Events & RSVPs"])


class RSVPStatusUpdate(BaseModel):
    status: str  # "approved" | "rejected" | "pending"


def _build_event_response(ev: Event) -> EventResponse:
    rsvps = ev.rsvps or []
    expenses = ev.expenses or []
    approved_rsvps = [r for r in rsvps if r.status == "approved"]
    
    total_collected = sum(float(r.total_amount) for r in approved_rsvps)
    total_expenses = sum(float(exp.amount) for exp in expenses)
    net_balance = total_collected - total_expenses

    total_adults = sum(r.adults_count for r in approved_rsvps)
    total_children = sum(r.children_count for r in approved_rsvps)
    total_seniors = sum(r.seniors_count for r in approved_rsvps)
    total_attendees = sum(r.attendees_count for r in approved_rsvps)

    return EventResponse(
        id=ev.id,
        society_id=ev.society_id,
        title=ev.title,
        description=ev.description,
        event_date=ev.event_date,
        venue=ev.venue,
        fee_per_person=float(ev.fee_per_person or 0),
        fee_adult=float(ev.fee_adult or 0),
        fee_child=float(ev.fee_child or 0),
        fee_senior=float(ev.fee_senior or 0),
        upi_qr_url=ev.upi_qr_url,
        created_by=ev.created_by,
        created_at=ev.created_at,
        rsvps_count=len(rsvps),
        total_attendees=total_attendees,
        total_adults=total_adults,
        total_children=total_children,
        total_seniors=total_seniors,
        total_collected=total_collected,
        total_expenses=total_expenses,
        net_balance=net_balance,
        rsvps=[EventRSVPResponse.model_validate(r) for r in rsvps],
        expenses=[EventExpenseResponse.model_validate(exp) for exp in expenses],
    )


@router.get("/", response_model=List[EventResponse])
async def list_events(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Event)
        .options(selectinload(Event.rsvps), selectinload(Event.expenses))
        .order_by(Event.event_date.desc())
    )
    events = result.scalars().all()
    return [_build_event_response(ev) for ev in events]


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(event_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Event)
        .options(selectinload(Event.rsvps), selectinload(Event.expenses))
        .where(Event.id == event_id)
    )
    ev = result.scalars().first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    return _build_event_response(ev)


@router.post("/", response_model=EventResponse)
async def create_event(
    event_in: EventCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    # Ensure event_date is timezone-naive for PostgreSQL timestamp without time zone
    event_dt = event_in.event_date
    if event_dt.tzinfo is not None:
        event_dt = event_dt.replace(tzinfo=None)

    # Sync base fee if adult fee provided
    base_fee = event_in.fee_adult if event_in.fee_adult > 0 else event_in.fee_per_person
    adult_fee = event_in.fee_adult if event_in.fee_adult > 0 else base_fee

    new_event = Event(
        society_id=current_user.society_id,
        title=event_in.title,
        description=event_in.description,
        event_date=event_dt,
        venue=event_in.venue,
        fee_per_person=base_fee,
        fee_adult=adult_fee,
        fee_child=event_in.fee_child,
        fee_senior=event_in.fee_senior,
        upi_qr_url=event_in.upi_qr_url,
        created_by=current_user.id
    )
    db.add(new_event)
    await db.commit()
    await db.refresh(new_event)
    
    return EventResponse(
        id=new_event.id,
        society_id=new_event.society_id,
        title=new_event.title,
        description=new_event.description,
        event_date=new_event.event_date,
        venue=new_event.venue,
        fee_per_person=float(new_event.fee_per_person or 0),
        fee_adult=float(new_event.fee_adult or 0),
        fee_child=float(new_event.fee_child or 0),
        fee_senior=float(new_event.fee_senior or 0),
        upi_qr_url=new_event.upi_qr_url,
        created_by=new_event.created_by,
        created_at=new_event.created_at,
        rsvps_count=0,
        total_attendees=0,
        total_adults=0,
        total_children=0,
        total_seniors=0,
        total_collected=0.0,
        total_expenses=0.0,
        net_balance=0.0,
        rsvps=[],
        expenses=[],
    )


@router.patch("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    event_update: EventUpdate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Event)
        .options(selectinload(Event.rsvps), selectinload(Event.expenses))
        .where(Event.id == event_id)
    )
    event = result.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Disallow editing past events
    if event.event_date < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Cannot edit an event that has already passed.")

    update_dict = event_update.model_dump(exclude_unset=True)

    if "event_date" in update_dict and update_dict["event_date"] is not None:
        dt = update_dict["event_date"]
        if dt.tzinfo is not None:
            update_dict["event_date"] = dt.replace(tzinfo=None)

    if "fee_adult" in update_dict and update_dict["fee_adult"] is not None:
        update_dict["fee_per_person"] = update_dict["fee_adult"]

    for key, value in update_dict.items():
        setattr(event, key, value)

    await db.commit()
    await db.refresh(event)
    return _build_event_response(event)


@router.delete("/{event_id}")
async def delete_event(
    event_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    await db.delete(event)
    await db.commit()
    return {"detail": "Event deleted successfully"}


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

    # Disallow RSVP for past events
    if event.event_date < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Cannot submit RSVP for an event that has already passed.")

    # Check if user already RSVP'd
    existing_rsvp = await db.execute(
        select(EventRSVP).where(EventRSVP.event_id == event_id, EventRSVP.user_id == current_user.id)
    )
    if existing_rsvp.scalars().first():
        raise HTTPException(status_code=400, detail="You have already submitted an RSVP for this event.")

    # Enforce mandatory UPI UTR / Transaction Reference for paid RSVPs
    if float(rsvp_in.total_amount or 0) > 0 and (not rsvp_in.utr_number or not rsvp_in.utr_number.strip()):
        raise HTTPException(
            status_code=400,
            detail="UPI UTR / Transaction Reference Number is mandatory to verify your payment."
        )

    adults = max(0, rsvp_in.adults_count)
    children = max(0, rsvp_in.children_count)
    seniors = max(0, rsvp_in.seniors_count)
    total_count = adults + children + seniors
    if total_count <= 0:
        total_count = rsvp_in.attendees_count or 1
        adults = total_count

    new_rsvp = EventRSVP(
        event_id=event_id,
        user_id=current_user.id,
        member_name=rsvp_in.member_name or current_user.full_name,
        flat_number=rsvp_in.flat_number or current_user.flat_number,
        adults_count=adults,
        children_count=children,
        seniors_count=seniors,
        attendees_count=total_count,
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
    body: RSVPStatusUpdate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(EventRSVP).where(EventRSVP.id == rsvp_id))
    rsvp = result.scalars().first()
    if not rsvp:
        raise HTTPException(status_code=404, detail="RSVP not found")

    if body.status not in ["approved", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid status value. Must be 'approved', 'rejected', or 'pending'.")

    rsvp.status = body.status
    await db.commit()
    await db.refresh(rsvp)
    return EventRSVPResponse.model_validate(rsvp)


# ── Event Expense Management ──────────────────────────────────

@router.get("/{event_id}/expenses", response_model=List[EventExpenseResponse])
async def list_event_expenses(
    event_id: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(EventExpense)
        .where(EventExpense.event_id == event_id)
        .order_by(EventExpense.expense_date.desc())
    )
    expenses = result.scalars().all()
    return [EventExpenseResponse.model_validate(exp) for exp in expenses]


@router.post("/{event_id}/expenses", response_model=EventExpenseResponse)
async def create_event_expense(
    event_id: str,
    expense_in: EventExpenseCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    new_expense = EventExpense(
        event_id=event_id,
        category=expense_in.category,
        title=expense_in.title,
        vendor_name=expense_in.vendor_name,
        amount=expense_in.amount,
        invoice_ref=expense_in.invoice_ref,
        expense_date=expense_in.expense_date or date.today(),
        logged_by=current_user.id
    )
    db.add(new_expense)
    await db.commit()
    await db.refresh(new_expense)
    return EventExpenseResponse.model_validate(new_expense)


@router.delete("/expenses/{expense_id}")
async def delete_event_expense(
    expense_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(EventExpense).where(EventExpense.id == expense_id))
    expense = result.scalars().first()
    if not expense:
        raise HTTPException(status_code=404, detail="Event expense not found")

    await db.delete(expense)
    await db.commit()
    return {"detail": "Event expense deleted successfully"}


# ── CSV Exports ───────────────────────────────────────────────

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
    writer.writerow([
        "Member Name", "Flat Number",
        "Adults", "Children", "Seniors", "Total Attendees",
        "Amount (INR)", "UTR / Reference", "Status", "Submission Time"
    ])

    for r in event.rsvps:
        writer.writerow([
            r.member_name,
            r.flat_number,
            r.adults_count,
            r.children_count,
            r.seniors_count,
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
