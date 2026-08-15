import random
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.models.user import User
from app.models.issue import Issue, IssueActivity
from app.schemas.issue import (
    IssueCreate,
    IssueUpdate,
    IssueResponse,
    IssueCommentCreate,
    IssueActivityResponse,
    IssueAnalyticsOverview,
    IssueCategoryStat,
    IssueDuplicateCheckRequest,
    IssueDuplicateCheckResponse,
)
from app.services.issue_dedup import verify_issue_duplicate_with_llm

router = APIRouter(prefix="/issues", tags=["Society Issues & Helpdesk"])

INITIAL_ISSUES = [
    {
        "ticket_number": "ISSUE-T24-1042",
        "flat_number": "B-201",
        "reported_by": "Anil Sharma",
        "title": "Low water pressure in master bathroom line",
        "description": "The water flow from the main supply inlet in the master bathroom shower has been inconsistent since yesterday evening.",
        "category": "Plumbing",
        "priority": "medium",
        "status": "in_progress",
        "location": "Flat B-201 Master Bath",
        "preferred_slot": "Today 5:00 PM - 7:00 PM",
        "assigned_vendor_name": "Apex Plumbing Services",
        "created_at": datetime.utcnow() - timedelta(hours=4),
        "activities": [
            {
                "action": "created",
                "actor_name": "Anil Sharma",
                "actor_role": "resident",
                "comment": "Issue logged via AI Resident Concierge Bot",
                "created_at": datetime.utcnow() - timedelta(hours=4),
            },
            {
                "action": "assigned",
                "actor_name": "Managing Committee",
                "actor_role": "admin",
                "comment": "Assigned to Apex Plumbing Services. Technician arriving during resident preferred slot.",
                "created_at": datetime.utcnow() - timedelta(hours=2),
            },
        ],
    },
    {
        "ticket_number": "ISSUE-T24-1039",
        "flat_number": "Common Area",
        "reported_by": "Priya Patel (A-102)",
        "title": "Passenger Lift A door sensor calibration",
        "description": "Lift A door reopening repeatedly on Floor 7 before closing smoothly.",
        "category": "Elevator",
        "priority": "high",
        "status": "resolved",
        "location": "Tower 24 Passenger Lift A",
        "preferred_slot": "Immediate / Emergency",
        "assigned_vendor_name": "Schindler Elevators AMC Team",
        "resolution_notes": "Door optical beam sensor aligned and tested across all 18 floors. Operating smoothly.",
        "resolved_at": datetime.utcnow() - timedelta(hours=6),
        "created_at": datetime.utcnow() - timedelta(hours=14),
        "activities": [
            {
                "action": "created",
                "actor_name": "Priya Patel",
                "actor_role": "resident",
                "comment": "Reported optical sensor delay on Floor 7",
                "created_at": datetime.utcnow() - timedelta(hours=14),
            },
            {
                "action": "status_changed",
                "actor_name": "Estate Safety Team",
                "actor_role": "admin",
                "comment": "Dispatched Schindler AMC emergency maintenance crew",
                "created_at": datetime.utcnow() - timedelta(hours=10),
            },
            {
                "action": "resolved",
                "actor_name": "Schindler Elevators AMC Team",
                "actor_role": "vendor",
                "comment": "Sensor realignment complete. Tested 20 cycles with zero anomalies.",
                "created_at": datetime.utcnow() - timedelta(hours=6),
            },
        ],
    },
    {
        "ticket_number": "ISSUE-T24-1044",
        "flat_number": "C-404",
        "reported_by": "Vikram Malhotra",
        "title": "Corridor light fixture flickering outside Flat C-404",
        "description": "The ceiling recessed LED panel in the 4th floor west wing corridor is flickering intermittently.",
        "category": "Electrical",
        "priority": "low",
        "status": "open",
        "location": "4th Floor West Wing Corridor",
        "preferred_slot": "Tomorrow Morning",
        "created_at": datetime.utcnow() - timedelta(hours=1),
        "activities": [
            {
                "action": "created",
                "actor_name": "Vikram Malhotra",
                "actor_role": "resident",
                "comment": "Ticket created via AI Issue Assistant",
                "created_at": datetime.utcnow() - timedelta(hours=1),
            }
        ],
    },
    {
        "ticket_number": "ISSUE-T24-1031",
        "flat_number": "Clubhouse",
        "reported_by": "Rajesh Kulkarni",
        "title": "Gymnasium AC thermostat calibration",
        "description": "AC unit 2 in the fitness center cooling was sub-optimal during peak morning workout hours.",
        "category": "Common Area",
        "priority": "medium",
        "status": "resolved",
        "location": "Ground Floor Clubhouse Gym",
        "assigned_vendor_name": "CoolBreeze HVAC Services",
        "resolution_notes": "Filters washed, refrigerant pressure topped up, and thermostat recalibrated to 23°C.",
        "resolved_at": datetime.utcnow() - timedelta(days=1),
        "created_at": datetime.utcnow() - timedelta(days=2),
        "activities": [
            {
                "action": "created",
                "actor_name": "Rajesh Kulkarni",
                "actor_role": "resident",
                "comment": "Issue logged for Gym AC Unit 2",
                "created_at": datetime.utcnow() - timedelta(days=2),
            },
            {
                "action": "resolved",
                "actor_name": "Managing Committee",
                "actor_role": "admin",
                "comment": "Servicing completed by CoolBreeze HVAC. Cooling verified by security staff.",
                "created_at": datetime.utcnow() - timedelta(days=1),
            },
        ],
    },
]

async def _ensure_seed_issues(db: AsyncSession):
    result = await db.execute(select(Issue).options(selectinload(Issue.activities)))
    issues = result.scalars().all()
    if not issues:
        for item in INITIAL_ISSUES:
            issue_obj = Issue(
                ticket_number=item["ticket_number"],
                flat_number=item["flat_number"],
                reported_by=item["reported_by"],
                title=item["title"],
                description=item["description"],
                category=item["category"],
                priority=item["priority"],
                status=item["status"],
                location=item["location"],
                preferred_slot=item.get("preferred_slot"),
                assigned_vendor_name=item.get("assigned_vendor_name"),
                resolution_notes=item.get("resolution_notes"),
                resolved_at=item.get("resolved_at"),
                created_at=item["created_at"],
                updated_at=item["created_at"],
            )
            db.add(issue_obj)
            await db.flush()

            for act in item.get("activities", []):
                act_obj = IssueActivity(
                    issue_id=issue_obj.id,
                    action=act["action"],
                    actor_name=act["actor_name"],
                    actor_role=act["actor_role"],
                    comment=act["comment"],
                    created_at=act["created_at"],
                )
                db.add(act_obj)

        await db.commit()

@router.get("/", response_model=List[IssueResponse])
async def get_issues(
    flat_number: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    await _ensure_seed_issues(db)

    query = select(Issue).options(selectinload(Issue.activities)).order_by(Issue.created_at.desc())

    if status and status != "all":
        query = query.where(Issue.status == status)
    if category and category != "all":
        query = query.where(Issue.category == category)
    if priority and priority != "all":
        query = query.where(Issue.priority == priority)
    if flat_number and flat_number.strip():
        query = query.where(Issue.flat_number.ilike(f"%{flat_number.strip()}%"))

    result = await db.execute(query)
    issues = result.scalars().all()

    if search and search.strip():
        s = search.strip().lower()
        issues = [
            i for i in issues
            if s in i.title.lower() or s in i.description.lower() or s in i.ticket_number.lower() or s in i.flat_number.lower()
        ]

    return [IssueResponse.model_validate(i) for i in issues]

@router.post("/verify-duplicate", response_model=IssueDuplicateCheckResponse)
async def verify_duplicate_issue(
    payload: IssueDuplicateCheckRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await _ensure_seed_issues(db)
    
    # Query active open or in_progress tickets in society
    result = await db.execute(
        select(Issue)
        .where(Issue.status.in_(["open", "in_progress"]))
        .options(selectinload(Issue.activities))
    )
    active_issues = result.scalars().all()
    
    active_dicts = [
        {
            "id": i.id,
            "ticket_number": i.ticket_number,
            "title": i.title,
            "description": i.description,
            "category": i.category,
            "location": i.location,
            "flat_number": i.flat_number,
            "status": i.status
        }
        for i in active_issues
    ]
    
    res = await verify_issue_duplicate_with_llm(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        location=payload.location,
        flat_number=payload.flat_number or current_user.flat_number,
        active_issues=active_dicts
    )
    
    return IssueDuplicateCheckResponse(**res)

@router.get("/analytics/overview", response_model=IssueAnalyticsOverview)
async def get_issue_analytics(db: AsyncSession = Depends(get_db)):
    await _ensure_seed_issues(db)
    result = await db.execute(select(Issue).options(selectinload(Issue.activities)))
    issues = result.scalars().all()

    total = len(issues)
    open_count = sum(1 for i in issues if i.status == "open")
    in_progress = sum(1 for i in issues if i.status in ("in_progress", "assigned"))
    resolved_count = sum(1 for i in issues if i.status in ("resolved", "closed"))
    resolution_rate = round((resolved_count / total * 100) if total > 0 else 0, 1)

    # Category breakdown
    cat_map = {}
    for i in issues:
        c = i.category or "General"
        if c not in cat_map:
            cat_map[c] = {"count": 0, "resolved": 0}
        cat_map[c]["count"] += 1
        if i.status in ("resolved", "closed"):
            cat_map[c]["resolved"] += 1

    cat_stats = [
        IssueCategoryStat(
            category=k,
            count=v["count"],
            resolved=v["resolved"],
            pct=round((v["count"] / total * 100) if total > 0 else 0, 1)
        )
        for k, v in sorted(cat_map.items(), key=lambda x: x[1]["count"], reverse=True)
    ]

    # Priority breakdown
    pri_map = {}
    for i in issues:
        p = (i.priority or "medium").lower()
        pri_map[p] = pri_map.get(p, 0) + 1

    priority_stats = [
        {"priority": k, "count": v, "pct": round((v / total * 100) if total > 0 else 0, 1)}
        for k, v in pri_map.items()
    ]

    return IssueAnalyticsOverview(
        total_issues=total,
        open_issues=open_count,
        in_progress_issues=in_progress,
        resolved_issues=resolved_count,
        resolution_rate=resolution_rate,
        avg_resolution_hours=4.2,
        category_distribution=cat_stats,
        priority_breakdown=priority_stats,
        recent_resolved=resolved_count,
    )

@router.get("/{issue_id}", response_model=IssueResponse)
async def get_issue_by_id(issue_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Issue).options(selectinload(Issue.activities)).where(Issue.id == issue_id))
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue ticket not found")
    return IssueResponse.model_validate(issue)

@router.post("/", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
async def create_issue(
    issue_in: IssueCreate,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    ticket_num = f"ISSUE-T24-{random.randint(1000, 9999)}"
    flat_no = issue_in.flat_number or (current_user.flat_number if current_user else "B-201")
    rep_by = issue_in.reported_by or (current_user.full_name if current_user else "Resident Member")

    new_issue = Issue(
        ticket_number=ticket_num,
        society_id=current_user.society_id if current_user else None,
        user_id=current_user.id if current_user else None,
        flat_number=flat_no,
        reported_by=rep_by,
        title=issue_in.title,
        description=issue_in.description,
        category=issue_in.category or "General",
        priority=issue_in.priority or "medium",
        status="open",
        location=issue_in.location or "Flat Interior",
        preferred_slot=issue_in.preferred_slot,
        photo_url=issue_in.photo_url,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(new_issue)
    await db.flush()

    # Initial Activity Log
    init_activity = IssueActivity(
        issue_id=new_issue.id,
        action="created",
        actor_name=rep_by,
        actor_role="resident",
        comment=f"Ticket {ticket_num} registered via AI Resident Intake Assistant for {flat_no}.",
        created_at=datetime.utcnow(),
    )
    db.add(init_activity)
    await db.commit()

    # Reload with activities
    result = await db.execute(select(Issue).options(selectinload(Issue.activities)).where(Issue.id == new_issue.id))
    return IssueResponse.model_validate(result.scalar_one())

@router.put("/{issue_id}", response_model=IssueResponse)
async def update_issue(
    issue_id: str,
    issue_update: IssueUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Issue).options(selectinload(Issue.activities)).where(Issue.id == issue_id))
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue ticket not found")

    old_status = issue.status
    if issue_update.status:
        issue.status = issue_update.status
        if issue_update.status in ("resolved", "closed") and not issue.resolved_at:
            issue.resolved_at = datetime.utcnow()

    if issue_update.priority:
        issue.priority = issue_update.priority
    if issue_update.assigned_vendor_id is not None:
        issue.assigned_vendor_id = issue_update.assigned_vendor_id
    if issue_update.assigned_vendor_name is not None:
        issue.assigned_vendor_name = issue_update.assigned_vendor_name
    if issue_update.resolution_notes is not None:
        issue.resolution_notes = issue_update.resolution_notes

    issue.updated_at = datetime.utcnow()

    # Activity log for change
    action_type = "status_changed"
    comment_text = f"Status updated to '{issue.status.upper()}' by Admin."
    if issue_update.assigned_vendor_name:
        action_type = "assigned"
        comment_text = f"Assigned to {issue_update.assigned_vendor_name} by {current_admin.full_name}."
    elif issue_update.status == "resolved":
        action_type = "resolved"
        comment_text = f"Issue marked resolved. Notes: {issue_update.resolution_notes or 'All inspection criteria satisfied.'}"

    act = IssueActivity(
        issue_id=issue.id,
        action=action_type,
        actor_name=current_admin.full_name or "Managing Committee Admin",
        actor_role="admin",
        comment=comment_text,
        created_at=datetime.utcnow(),
    )
    db.add(act)
    await db.commit()

    result = await db.execute(select(Issue).options(selectinload(Issue.activities)).where(Issue.id == issue_id))
    return IssueResponse.model_validate(result.scalar_one())

@router.post("/{issue_id}/comments", response_model=IssueActivityResponse)
async def add_issue_comment(
    issue_id: str,
    comment_in: IssueCommentCreate,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Issue).where(Issue.id == issue_id))
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue ticket not found")

    author_name = comment_in.actor_name or (current_user.full_name if current_user else "Resident Member")
    author_role = comment_in.actor_role or ("admin" if current_user and current_user.role == "admin" else "resident")

    act = IssueActivity(
        issue_id=issue.id,
        action="commented",
        actor_name=author_name,
        actor_role=author_role,
        comment=comment_in.comment.strip(),
        created_at=datetime.utcnow(),
    )
    db.add(act)
    await db.commit()
    await db.refresh(act)
    return IssueActivityResponse.model_validate(act)

@router.delete("/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_issue(
    issue_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Issue).where(Issue.id == issue_id))
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue ticket not found")

    await db.delete(issue)
    await db.commit()
    return None
