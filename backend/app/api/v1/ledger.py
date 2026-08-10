from typing import List, Dict
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.models.user import User
from app.models.ledger import LedgerTransaction
from app.schemas.ledger import LedgerCreate, LedgerResponse, LedgerSummary

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
