import pytest
from app.services.meeting_extractor import extract_meeting_deterministic_fallback

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
