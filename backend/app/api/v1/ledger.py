from typing import List, Dict, Optional
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.models.user import User
from app.models.ledger import LedgerTransaction
from app.models.event import Event, EventRSVP, EventExpense
from app.schemas.ledger import (
    LedgerCreate, LedgerResponse, LedgerSummary,
    StatementParseRequest, StatementParseResponse,
    StatementCommitRequest, StatementCommitResponse,
)
from app.services.statement_parser import parse_and_reconcile_bank_statement

router = APIRouter(prefix="/ledger", tags=["Financial Ledger"])

@router.get("/", response_model=List[LedgerResponse])
async def list_ledger_transactions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LedgerTransaction).order_by(LedgerTransaction.transaction_date.desc()))
    items = result.scalars().all()
    return [LedgerResponse.model_validate(t) for t in items]

@router.post("/", response_model=LedgerResponse)
async def create_ledger_entry(
    entry_in: LedgerCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    new_entry = LedgerTransaction(
        society_id=current_user.society_id,
        transaction_type=entry_in.transaction_type,
        category=entry_in.category,
        amount=entry_in.amount,
        transaction_date=entry_in.transaction_date,
        description=entry_in.description,
        receipt_url=entry_in.receipt_url,
        logged_by=current_user.id
    )
    db.add(new_entry)
    await db.commit()
    await db.refresh(new_entry)
    return LedgerResponse.model_validate(new_entry)

@router.delete("/{entry_id}")
async def delete_ledger_entry(
    entry_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(LedgerTransaction).where(LedgerTransaction.id == entry_id))
    entry = result.scalars().first()
    if not entry:
        raise HTTPException(status_code=404, detail="Ledger entry not found")
    
    await db.delete(entry)
    await db.commit()
    return {"detail": "Ledger entry deleted successfully"}

@router.get("/summary", response_model=LedgerSummary)
async def get_ledger_summary(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LedgerTransaction).order_by(LedgerTransaction.transaction_date.asc()))
    items = result.scalars().all()

    total_income = 0.0
    total_expense = 0.0
    category_map = defaultdict(float)
    monthly_map = defaultdict(lambda: {"income": 0.0, "expense": 0.0})

    for item in items:
        amt = float(item.amount)
        m_key = item.transaction_date.strftime("%b %Y")
        
        if item.transaction_type == "income":
            total_income += amt
            monthly_map[m_key]["income"] += amt
        else:
            total_expense += amt
            monthly_map[m_key]["expense"] += amt
            category_map[item.category] += amt

    current_balance = total_income - total_expense

    monthly_breakdown = [
        {"month": k, "income": v["income"], "expense": v["expense"], "net": v["income"] - v["expense"]}
        for k, v in monthly_map.items()
    ]

    category_breakdown = [
        {"category": k, "amount": v}
        for k, v in category_map.items()
    ]

    return LedgerSummary(
        total_income=total_income,
        total_expense=total_expense,
        current_balance=current_balance,
        monthly_breakdown=monthly_breakdown,
        category_breakdown=category_breakdown
    )

# ── AI Bank Statement Parsing & Reconciliation ─────────────────

@router.post("/parse-statement", response_model=StatementParseResponse)
async def parse_statement(
    req: StatementParseRequest,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Parses bank statement text and reconciles transactions against
    Event RSVPs, Event Expenses, and Maintenance categories.
    """
    if not req.statement_text or not req.statement_text.strip():
        raise HTTPException(status_code=400, detail="Statement text cannot be empty")

    return await parse_and_reconcile_bank_statement(req.statement_text, db)


@router.post("/parse-statement-file", response_model=StatementParseResponse)
async def parse_statement_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Accepts an uploaded bank statement file (.csv, .txt, .tsv) and runs AI reconciliation.
    """
    content_bytes = await file.read()
    try:
        text_content = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        text_content = content_bytes.decode("latin-1", errors="ignore")

    return await parse_and_reconcile_bank_statement(text_content, db)


@router.post("/commit-statement", response_model=StatementCommitResponse)
async def commit_statement_transactions(
    req: StatementCommitRequest,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Commits approved bank statement transactions to the ledger and
    auto-approves linked Event RSVPs.
    """
    if not req.transactions:
        raise HTTPException(status_code=400, detail="No transactions provided to commit")

    entries_created = 0
    rsvps_approved = 0
    total_income = 0.0
    total_expense = 0.0

    for tx in req.transactions:
        # 1. Create Ledger Transaction
        new_entry = LedgerTransaction(
            society_id=current_user.society_id,
            transaction_type=tx.transaction_type,
            category=tx.category,
            amount=tx.amount,
            transaction_date=tx.transaction_date,
            description=tx.description,
            receipt_url=tx.utr_number,
            logged_by=current_user.id
        )
        db.add(new_entry)
        entries_created += 1

        if tx.transaction_type == "income":
            total_income += tx.amount
        else:
            total_expense += tx.amount

        # 2. Auto-approve linked RSVP if matched
        if tx.matched_rsvp_id and tx.auto_approve_rsvp:
            rsvp_res = await db.execute(select(EventRSVP).where(EventRSVP.id == tx.matched_rsvp_id))
            rsvp = rsvp_res.scalars().first()
            if rsvp:
                rsvp.status = "approved"
                if tx.utr_number and not rsvp.utr_number:
                    rsvp.utr_number = tx.utr_number
                rsvps_approved += 1

        # 3. If matched with an event expense and it's a new line item, sync to EventExpense
        if tx.matched_event_id and tx.transaction_type == "expense":
            # Check if matching event expense exists
            exp_res = await db.execute(
                select(EventExpense).where(
                    EventExpense.event_id == tx.matched_event_id,
                    EventExpense.amount == tx.amount
                )
            )
            if not exp_res.scalars().first():
                new_exp = EventExpense(
                    event_id=tx.matched_event_id,
                    category=tx.category if tx.category in ["Catering & Food", "Decorations & Stage", "DJ & Sound", "Prizes & Gifts", "Cleaning & Housekeeping", "Misc / Supplies"] else "Misc / Supplies",
                    title=tx.description,
                    amount=tx.amount,
                    invoice_ref=tx.utr_number,
                    expense_date=tx.transaction_date,
                    logged_by=current_user.id
                )
                db.add(new_exp)

    await db.commit()

    return StatementCommitResponse(
        ledger_entries_created=entries_created,
        rsvps_approved=rsvps_approved,
        total_income_added=round(total_income, 2),
        total_expense_added=round(total_expense, 2),
        detail=f"Successfully committed {entries_created} transactions to ledger and verified {rsvps_approved} event RSVPs."
    )
