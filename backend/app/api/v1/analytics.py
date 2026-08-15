from typing import List, Dict, Any
from collections import defaultdict
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.ledger import LedgerTransaction
from app.models.event import Event, EventRSVP, EventExpense
from app.models.user import User
from app.models.vendor import ServiceProvider, ProviderReview

router = APIRouter(prefix="/analytics", tags=["Society Analytics"])

CATEGORY_COLORS = {
    "Security": "#ea580c",
    "Electricity": "#eab308",
    "Events": "#ec4899",
    "Lift Maintenance": "#3b82f6",
    "Gardening & Cleaning": "#10b981",
    "Repairs": "#8b5cf6",
    "Water Supply": "#06b6d4",
    "Administration": "#64748b",
    "Other": "#78716c",
}

@router.get("/overview")
@router.get("/overview/")
async def get_analytics_overview(db: AsyncSession = Depends(get_db)):
    # 1. Fetch Ledger Transactions
    ledger_res = await db.execute(select(LedgerTransaction).order_by(LedgerTransaction.transaction_date.asc()))
    ledger_items = ledger_res.scalars().all()

    total_income = 0.0
    total_expense = 0.0
    monthly_map = defaultdict(lambda: {"income": 0.0, "expense": 0.0})
    category_map = defaultdict(float)

    for item in ledger_items:
        amt = float(item.amount)
        m_key = item.transaction_date.strftime("%b %Y")
        if item.transaction_type == "income":
            total_income += amt
            monthly_map[m_key]["income"] += amt
        else:
            total_expense += amt
            monthly_map[m_key]["expense"] += amt
            category_map[item.category] += amt

    reserve_fund = total_income - total_expense
    savings_rate = round(((total_income - total_expense) / total_income * 100), 1) if total_income > 0 else 0.0

    monthly_cashflow = [
        {
            "month": k,
            "income": v["income"],
            "expense": v["expense"],
            "net": v["income"] - v["expense"]
        }
        for k, v in monthly_map.items()
    ]

    category_outflow = []
    for cat, amt in sorted(category_map.items(), key=lambda x: x[1], reverse=True):
        pct = round((amt / total_expense * 100), 1) if total_expense > 0 else 0.0
        category_outflow.append({
            "category": cat,
            "amount": amt,
            "percentage": pct,
            "color": CATEGORY_COLORS.get(cat, "#f59e0b")
        })

    # 2. Fetch Events & RSVPs
    event_res = await db.execute(
        select(Event)
        .options(selectinload(Event.rsvps), selectinload(Event.expenses))
        .order_by(Event.event_date.asc())
    )
    events = event_res.scalars().all()

    total_events = len(events)
    total_footfall = 0
    adults_count = 0
    children_count = 0
    seniors_count = 0

    total_event_collection = 0.0
    total_event_expense = 0.0

    approved_rsvps_count = 0
    pending_rsvps_count = 0
    rejected_rsvps_count = 0

    event_performance = []
    participating_flats = set()

    for ev in events:
        rsvps = ev.rsvps or []
        expenses = ev.expenses or []

        ev_approved = [r for r in rsvps if r.status == "approved"]
        ev_pending = [r for r in rsvps if r.status == "pending"]
        ev_rejected = [r for r in rsvps if r.status == "rejected"]

        approved_rsvps_count += len(ev_approved)
        pending_rsvps_count += len(ev_pending)
        rejected_rsvps_count += len(ev_rejected)

        ev_attendees = sum(r.attendees_count for r in ev_approved)
        ev_adults = sum(r.adults_count for r in ev_approved)
        ev_children = sum(r.children_count for r in ev_approved)
        ev_seniors = sum(r.seniors_count for r in ev_approved)

        for r in ev_approved:
            participating_flats.add(r.flat_number.strip().upper())

        total_footfall += ev_attendees
        adults_count += ev_adults
        children_count += ev_children
        seniors_count += ev_seniors

        ev_col = sum(float(r.total_amount) for r in ev_approved)
        ev_exp = sum(float(exp.amount) for exp in expenses)
        ev_net = ev_col - ev_exp

        total_event_collection += ev_col
        total_event_expense += ev_exp

        event_performance.append({
            "id": ev.id,
            "title": ev.title,
            "date": ev.event_date.strftime("%d %b %Y"),
            "venue": ev.venue or "Clubhouse",
            "attendees": ev_attendees,
            "adults": ev_adults,
            "children": ev_children,
            "seniors": ev_seniors,
            "collection": ev_col,
            "expense": ev_exp,
            "net_balance": ev_net,
            "roi_status": "Surplus" if ev_net >= 0 else "Deficit"
        })

    avg_attendance = round(total_footfall / total_events, 1) if total_events > 0 else 0.0

    total_demo = adults_count + children_count + seniors_count
    adults_pct = round(adults_count / total_demo * 100, 1) if total_demo > 0 else 0.0
    children_pct = round(children_count / total_demo * 100, 1) if total_demo > 0 else 0.0
    seniors_pct = round(seniors_count / total_demo * 100, 1) if total_demo > 0 else 0.0

    # 3. Users & Residency Demographics
    user_res = await db.execute(select(User))
    users = user_res.scalars().all()
    total_users = len(users)

    owner_count = sum(1 for u in users if (getattr(u, "residency_type", None) or "Owner").lower() == "owner")
    renter_count = total_users - owner_count
    owner_pct = round(owner_count / total_users * 100, 1) if total_users > 0 else 0.0
    renter_pct = round(renter_count / total_users * 100, 1) if total_users > 0 else 0.0

    community_participation_pct = round(len(participating_flats) / max(total_users, 1) * 100, 1)

    # 4. Verified Service Providers / Vendors Analytics
    vendor_res = await db.execute(select(ServiceProvider).options(selectinload(ServiceProvider.reviews)))
    vendors = vendor_res.scalars().all()
    total_vendors = len(vendors)

    vendor_cat_map = defaultdict(int)
    total_rating_sum = 0.0
    rating_count = 0

    top_vendors = []
    for v in vendors:
        cat = v.category or "General"
        vendor_cat_map[cat] += 1
        reviews = v.reviews or []
        v_rating = sum(r.rating for r in reviews) / len(reviews) if reviews else 4.8
        total_rating_sum += v_rating
        rating_count += 1

        top_vendors.append({
            "id": v.id,
            "name": v.name,
            "category": cat,
            "rating": round(v_rating, 1),
            "phone": v.phone_number,
            "reviews_count": len(reviews)
        })

    avg_vendor_rating = round(total_rating_sum / max(rating_count, 1), 1) if rating_count > 0 else 4.8
    vendor_category_breakdown = [
        {"category": k, "count": v}
        for k, v in sorted(vendor_cat_map.items(), key=lambda x: x[1], reverse=True)
    ]

    # 5. Smart AI / Executive Insights
    insights = []
    if reserve_fund > 100000:
        insights.append({
            "type": "positive",
            "title": "Healthy Society Reserve",
            "desc": f"Society reserve balance is strong at ₹{reserve_fund:,.0f} with a {savings_rate}% savings retention rate."
        })
    
    if children_pct + seniors_pct >= 30:
        insights.append({
            "type": "celebration",
            "title": "Vibrant Multi-Generational Community",
            "desc": f"Children and Senior residents account for {children_pct + seniors_pct}% of total festival attendance."
        })
    
    if category_outflow:
        top_cat = category_outflow[0]
        insights.append({
            "type": "info",
            "title": f"Top Expense Channel: {top_cat['category']}",
            "desc": f"{top_cat['category']} represents {top_cat['percentage']}% (₹{top_cat['amount']:,.0f}) of total maintenance outflow."
        })

    if total_footfall > 0:
        insights.append({
            "type": "engagement",
            "title": f"{total_footfall} Total Resident Celebrations Footfall",
            "desc": f"Across {total_events} community utsavs, average attendance reached {avg_attendance:.0f} members per event."
        })

    return {
        "financials": {
            "total_income": total_income,
            "total_expense": total_expense,
            "reserve_fund": reserve_fund,
            "savings_rate": savings_rate,
            "monthly_cashflow": monthly_cashflow,
            "category_outflow": category_outflow
        },
        "events": {
            "total_events": total_events,
            "total_footfall": total_footfall,
            "avg_attendance": avg_attendance,
            "total_collection": total_event_collection,
            "total_expense": total_event_expense,
            "net_pnl": total_event_collection - total_event_expense,
            "demographics": {
                "adults_count": adults_count,
                "adults_pct": adults_pct,
                "children_count": children_count,
                "children_pct": children_pct,
                "seniors_count": seniors_count,
                "seniors_pct": seniors_pct
            },
            "rsvp_funnel": {
                "approved": approved_rsvps_count,
                "pending": pending_rsvps_count,
                "rejected": rejected_rsvps_count,
                "total": approved_rsvps_count + pending_rsvps_count + rejected_rsvps_count
            },
            "performance": event_performance
        },
        "community": {
            "total_residents": total_users,
            "owners": owner_count,
            "owners_pct": owner_pct,
            "renters": renter_count,
            "renters_pct": renter_pct,
            "participating_flats": len(participating_flats),
            "participation_rate": community_participation_pct
        },
        "vendors": {
            "total_vendors": total_vendors,
            "avg_rating": avg_vendor_rating,
            "categories": vendor_category_breakdown,
            "top_vendors": sorted(top_vendors, key=lambda x: x["rating"], reverse=True)[:5]
        },
        "insights": insights
    }
