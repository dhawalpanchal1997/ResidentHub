import json
import logging
import re
from typing import Optional, List, Dict, Any
from app.services.ai_factory import get_llm

logger = logging.getLogger(__name__)

COMMON_FACILITY_KEYWORDS = [
    "lift", "elevator", "schindler", "otis", "water tank", "chlorination",
    "motor", "pump", "cctv", "camera", "lobby", "gate", "main gate",
    "security desk", "gym", "clubhouse", "generator", "dg set",
    "swimming pool", "garden", "parking", "solar", "solar panel",
    "corridor", "staircase", "terrace", "drainage", "sewage", "street light"
]

def is_common_facility(location: str, title: str, description: str) -> bool:
    text = f"{location} {title} {description}".lower()
    return any(kw in text for kw in COMMON_FACILITY_KEYWORDS)

def deterministic_duplicate_check(
    new_title: str,
    new_description: str,
    new_category: str,
    new_location: str,
    new_flat: str,
    active_issues: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Deterministic rule-based semantic matcher when LLM is unavailable or for instant verification.
    """
    new_is_common = is_common_facility(new_location, new_title, new_description)
    new_tokens = set(re.findall(r'\w{3,}', f"{new_title} {new_description} {new_location}".lower()))

    best_match = None
    highest_score = 0.0

    for issue in active_issues:
        # Only compare against open or in_progress issues
        if issue.get("status") not in ["open", "in_progress"]:
            continue

        issue_flat = issue.get("flat_number", "")
        issue_loc = issue.get("location", "")
        issue_title = issue.get("title", "")
        issue_desc = issue.get("description", "")
        issue_cat = issue.get("category", "")
        issue_is_common = is_common_facility(issue_loc, issue_title, issue_desc)

        # Token overlap calculation
        existing_tokens = set(re.findall(r'\w{3,}', f"{issue_title} {issue_desc} {issue_loc}".lower()))
        intersection = new_tokens.intersection(existing_tokens)
        if not intersection:
            continue

        jaccard = len(intersection) / max(len(new_tokens.union(existing_tokens)), 1)
        score = jaccard

        # Boost score if both refer to the same common facility
        if new_is_common and issue_is_common:
            # Check specific keyword overlap (e.g. both contain "lift")
            common_overlap = [kw for kw in COMMON_FACILITY_KEYWORDS if kw in f"{new_title} {new_description} {new_location}".lower() and kw in f"{issue_title} {issue_desc} {issue_loc}".lower()]
            if common_overlap:
                score += 0.45
            if new_category.lower() == issue_cat.lower():
                score += 0.2
        elif not new_is_common and not issue_is_common:
            # Private flat issues: only duplicate if raised for the exact same flat number
            if new_flat and issue_flat and new_flat.strip().lower() == issue_flat.strip().lower():
                score += 0.35
            else:
                # Different private flats are not duplicates
                score = 0.0

        if score > highest_score:
            highest_score = score
            best_match = issue

    if best_match and highest_score >= 0.35:
        confidence = "high" if highest_score >= 0.55 else "medium"
        is_common = is_common_facility(best_match.get("location", ""), best_match.get("title", ""), best_match.get("description", ""))
        facility_label = "society common facility" if is_common else f"Flat {best_match.get('flat_number')}"

        return {
            "is_duplicate": True,
            "confidence": confidence,
            "matched_issue_id": best_match.get("id"),
            "matched_ticket_number": best_match.get("ticket_number"),
            "matched_title": best_match.get("title"),
            "matched_status": best_match.get("status"),
            "matched_location": best_match.get("location"),
            "matched_category": best_match.get("category"),
            "is_common_facility": is_common,
            "reasoning": f"Found an active open ticket (#{best_match.get('ticket_number')}: '{best_match.get('title')}') regarding {facility_label} with similar maintenance symptoms.",
            "clarification_question": f"An open ticket (#{best_match.get('ticket_number')}: '{best_match.get('title')}') is already active for {facility_label}. Are you referring to this existing issue, or is your report for a separate problem?"
        }

    return {
        "is_duplicate": False,
        "confidence": "none",
        "matched_issue_id": None,
        "matched_ticket_number": None,
        "matched_title": None,
        "matched_status": None,
        "matched_location": None,
        "matched_category": None,
        "is_common_facility": new_is_common,
        "reasoning": "No matching open/in-progress tickets found for this facility or flat.",
        "clarification_question": ""
    }

async def verify_issue_duplicate_with_llm(
    title: str,
    description: str,
    category: str,
    location: str,
    flat_number: str,
    active_issues: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Evaluates new issue against active open/in-progress tickets using LangChain LLM with fallback.
    """
    if not active_issues:
        return {
            "is_duplicate": False,
            "confidence": "none",
            "matched_issue_id": None,
            "matched_ticket_number": None,
            "matched_title": None,
            "matched_status": None,
            "matched_location": None,
            "matched_category": None,
            "is_common_facility": is_common_facility(location, title, description),
            "reasoning": "No other active tickets exist in the society.",
            "clarification_question": ""
        }

    llm = get_llm()
    if not llm:
        return deterministic_duplicate_check(title, description, category, location, flat_number, active_issues)

    # Format candidate active tickets for the LLM prompt
    candidates = []
    for issue in active_issues:
        if issue.get("status") in ["open", "in_progress"]:
            candidates.append({
                "id": issue.get("id"),
                "ticket_number": issue.get("ticket_number"),
                "title": issue.get("title"),
                "description": issue.get("description"),
                "category": issue.get("category"),
                "location": issue.get("location"),
                "flat_number": issue.get("flat_number"),
                "status": issue.get("status")
            })

    if not candidates:
        return {
            "is_duplicate": False,
            "confidence": "none",
            "matched_issue_id": None,
            "matched_ticket_number": None,
            "matched_title": None,
            "matched_status": None,
            "matched_location": None,
            "matched_category": None,
            "is_common_facility": is_common_facility(location, title, description),
            "reasoning": "All society tickets are resolved.",
            "clarification_question": ""
        }

    prompt = f"""
You are the AI ResidentBot Concierge for Tower 24 Housing Society.
A resident is reporting a maintenance issue. Your job is to verify if this is an identical or duplicate report of an existing active ticket.

NEW ISSUE REPORTED:
- Title: {title}
- Description: {description}
- Category: {category}
- Location: {location}
- Flat Number: {flat_number}

EXISTING ACTIVE TICKETS IN SOCIETY:
{json.dumps(candidates, indent=2)}

RULES FOR DEDUPLICATION:
1. COMMON FACILITIES vs PRIVATE FLATS:
   - If the issue is for a Common Facility (e.g. Passenger Lift, Lobby Lights, Water Tank, CCTV, Gate, Generator), multiple residents might report the same breakdown. If the symptoms/location match, it IS a duplicate.
   - If the issue is inside a Private Flat (e.g. Flat A-402 Kitchen tap), it is ONLY a duplicate if raised for the SAME flat. Two different flats having separate plumbing issues are NOT duplicates.
2. STATUS:
   - Only compare against Open or In-Progress tickets.
3. OUTPUT FORMAT:
   Return ONLY a valid JSON object with the following schema:
   {{
     "is_duplicate": true/false,
     "confidence": "high" | "medium" | "low" | "none",
     "matched_issue_id": "UUID of matched ticket or null",
     "matched_ticket_number": "TKT-XX-XXX or null",
     "matched_title": "Title of matched ticket or null",
     "matched_status": "open" | "in_progress" | null,
     "matched_location": "location of matched ticket or null",
     "matched_category": "category of matched ticket or null",
     "is_common_facility": true/false,
     "reasoning": "Clear explanation in 1-2 sentences",
     "clarification_question": "A polite, friendly question asking the resident if they are referring to this existing active ticket or if it is a separate issue."
   }}
"""

    try:
        from langchain_core.messages import SystemMessage, HumanMessage
        messages = [
            SystemMessage(content="You are a deterministic housing society duplicate issue verification engine. Respond only with JSON."),
            HumanMessage(content=prompt)
        ]
        response = await llm.ainvoke(messages)
        content = response.content.strip()

        # Clean markdown wrappers if any
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        
        parsed = json.loads(content.strip())
        return parsed
    except Exception as e:
        logger.warning(f"LLM duplicate check encountered error ({e}). Using deterministic fallback.")
        return deterministic_duplicate_check(title, description, category, location, flat_number, active_issues)
