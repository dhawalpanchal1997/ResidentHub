import pytest
from datetime import date
from app.services.meeting_extractor import extract_meeting_deterministic_fallback
from app.services.statement_parser import parse_date_flexible, VENDOR_RULES
from app.schemas.issue import IssueCreate, IssueUpdate
from app.schemas.notice import NoticeCreate
from app.schemas.committee import CommitteeMemberCreate

def test_deterministic_meeting_extraction():
    transcript = """
    Society Committee Meeting held on 10 August 2026.
    1. Lift repair contract with Otis approved for Rs 25,000.
    2. Decided to install solar rooftop panels by December 2026.
    3. Action item assigned to Ramesh to collect solar vendor quotes by 30th August.
    4. Building painting fund collection will start from next month.
    """
    
    result = extract_meeting_deterministic_fallback(
        title="Committee Meeting August",
        meeting_date="2026-08-10",
        meeting_type="Monthly Committee",
        transcript=transcript
    )

    assert result.meeting_title == "Committee Meeting August"
    assert len(result.budget_approvals) >= 1
    assert result.budget_approvals[0].approved_amount == 25000.0
    assert len(result.action_items) >= 1
    assert result.action_items[0].assigned_to.lower() == "ramesh"
    assert len(result.resolutions) >= 1

def test_statement_parser_date_helpers():
    d1 = parse_date_flexible("15/08/2026")
    assert d1 == date(2026, 8, 15)

    d2 = parse_date_flexible("2026-08-15")
    assert d2 == date(2026, 8, 15)

    d3 = parse_date_flexible("15-Aug-2026")
    assert d3 == date(2026, 8, 15)

def test_vendor_matching_rules():
    patterns = [r[0] for r in VENDOR_RULES]
    assert len(patterns) >= 5

def test_issue_schema_validation():
    issue = IssueCreate(
        title="Elevator door jammed on 4th floor",
        description="Passenger lift sensor requires realignment",
        category="Elevator",
        priority="high",
        location="Passenger Lift A",
        preferred_slot="Immediate / Emergency",
        flat_number="B-201",
        reported_by="Dhawal Panchal"
    )
    assert issue.priority == "high"
    assert issue.category == "Elevator"

def test_notice_and_committee_schemas():
    notice = NoticeCreate(
        title="Water Tank Chlorination",
        content="Overhead water tank maintenance scheduled for Sunday.",
        category="Maintenance",
        priority="urgent",
        author_name="Estate Committee"
    )
    assert notice.priority == "urgent"

    member = CommitteeMemberCreate(
        name="Rajesh Sharma",
        role="Chairman",
        flat_number="A-402",
        photo_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
        badge_label="Elected Committee",
        display_order=1
    )
    assert member.role == "Chairman"

def test_duplicate_issue_verification():
    from app.services.issue_dedup import deterministic_duplicate_check, is_common_facility

    assert is_common_facility("Passenger Lift A", "Lift making sound", "Door jammed") == True
    assert is_common_facility("Flat B-201 Interior", "Geyser switch broken", "Bathroom socket") == False

    active_issues = [
        {
            "id": "test-lift-1",
            "ticket_number": "TKT-24-001",
            "title": "Passenger Lift A door sensor jammed on 4th floor",
            "description": "Schindler lift door is stuck open on the fourth floor and making clicking noise.",
            "category": "Elevator",
            "location": "Passenger Lift A (4th Floor)",
            "flat_number": "B-201",
            "status": "open"
        },
        {
            "id": "test-flat-2",
            "ticket_number": "TKT-24-002",
            "title": "Kitchen sink leakage",
            "description": "Water leaking from pipe under the sink in kitchen.",
            "category": "Plumbing",
            "location": "Flat A-402 Kitchen",
            "flat_number": "A-402",
            "status": "open"
        }
    ]

    # Case 1: Same common facility breakdown reported by another resident
    res1 = deterministic_duplicate_check(
        new_title="Lift door not closing properly",
        new_description="Passenger lift A is stuck with door open on 4th floor",
        new_category="Elevator",
        new_location="Passenger Lift A",
        new_flat="C-702",
        active_issues=active_issues
    )
    assert res1["is_duplicate"] == True
    assert res1["matched_ticket_number"] == "TKT-24-001"
    assert res1["is_common_facility"] == True
    assert "clarification_question" in res1

    # Case 2: Separate private flat with plumbing issue should NOT be duplicate of Flat A-402
    res2 = deterministic_duplicate_check(
        new_title="Kitchen sink leakage",
        new_description="Water leaking from pipe under kitchen sink",
        new_category="Plumbing",
        new_location="Flat B-501 Kitchen",
        new_flat="B-501",
        active_issues=active_issues
    )
    assert res2["is_duplicate"] == False
