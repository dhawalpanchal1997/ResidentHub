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
