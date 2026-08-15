"""
ResidentHub — AI-Powered Bank Statement Reconciliation Engine
Uses LangChain and Groq (llama-3.3-70b-versatile) / Ollama to semantically analyze,
categorize, clean narrations, and link bank transactions to Society Events, RSVPs,
Vendors, and Maintenance Dues.
"""

import json
import logging
import re
from typing import List, Dict, Any, Optional
from langchain_core.messages import SystemMessage, HumanMessage

from app.services.ai_factory import get_llm
from app.core.config import settings

logger = logging.getLogger(__name__)

RECONCILIATION_SYSTEM_PROMPT = """You are the Senior Chartered Accountant & AI Financial Controller for a premium Co-operative Housing Society (CHS).

Your task is to analyze raw bank statement transactions and intelligently reconcile, categorize, and link them against the Society's active records.

### Society Accounting Chart of Accounts / Categories:
- "Maintenance": Resident monthly maintenance, society dues, sinking fund, parking charges.
- "Events (RSVP)": Resident ticket / contributory payments for society festivals and events.
- "Events": Society event expenses, catering, decorators, DJ, stage setups.
- "Electricity": Common area MSEDCL/power utility bills, solar net-metering.
- "Security": Security agency guard salaries, supervisor fees, CCTV maintenance.
- "Lift Maintenance": Schindler / Otis elevator AMC, sensor servicing, lift emergency repairs.
- "Gardening & Cleaning": Housekeeping supplies, garden fertilizers, lawn maintenance.
- "Repairs": Plumbing repairs, water tank cleaning, civil works, painting.
- "Others": Bank interest credits, tax deductions, legal fees, miscellaneous.

### Reconciliation Rules:
1. For INFLOWS (Income / Credits):
   - Match against pending or approved Event RSVPs by matching UPI UTR number, resident name, or flat number + exact amount.
   - If an Event RSVP is clearly matched and currently pending, set "matched_type": "rsvp", "auto_approve_rsvp": true, "confidence": "high".
   - If it mentions maintenance/flat number, categorize as "Maintenance" with clean description: "Monthly Maintenance Collection - Flat [Number]".
   - If bank interest, categorize as "Others" with description: "Bank Savings / Term Deposit Interest Credit".
2. For OUTFLOWS (Expenses / Debits):
   - Match against Event Expenses by vendor name, invoice reference, or event purpose.
   - Match against Registered Society Vendors (e.g. Schindler Elevators, Plumbers, Electricians).
   - Match common utilities (e.g. MSEDCL for Electricity).
3. Clean Narration:
   - Convert cryptic bank text (e.g. "UPI/7728193821/Priya Patel/B-201/Diwali Gala") into professional, auditable accounting descriptions (e.g. "Diwali Grand Gala — RSVP Contribution from Priya Patel (Flat B-201)").
4. Anomaly Detection:
   - Flag unexpected bank charges, suspicious unknown debit transfers, or duplicate payments with "is_anomaly": true and an explanation in "ai_reasoning".

### Output Requirement:
You MUST respond with a pure JSON array containing an object for each transaction in the exact order of the input.
Do NOT wrap with markdown prose other than ```json ... ```.

Schema per transaction:
{
  "index": <integer matching the input transaction index>,
  "clean_description": "<human-readable ledger description>",
  "category": "<one of the standard categories above>",
  "matched_type": "rsvp" | "event_expense" | "vendor" | "maintenance" | "general",
  "matched_event_id": "<event_id or null>",
  "matched_event_title": "<event title or null>",
  "matched_rsvp_id": "<rsvp_id or null>",
  "matched_entity_info": "<e.g. Priya Patel (Flat B-201) • 2 attendees or null>",
  "confidence": "high" | "medium" | "low" | "none",
  "auto_approve_rsvp": <true or false>,
  "ai_reasoning": "<1-2 concise sentences explaining why this match and category were chosen>",
  "is_anomaly": <true or false>
}
"""

async def reconcile_statement_with_llm(
    raw_transactions: List[Dict[str, Any]],
    society_context: Dict[str, Any]
) -> Optional[List[Dict[str, Any]]]:
    """
    Invokes LLM (Groq / Ollama) to reconcile a list of raw bank statement transactions.
    Returns structured list of reconciled items or None if LLM is unavailable.
    """
    if not raw_transactions:
        return []

    try:
        llm = get_llm()
        if not llm:
            logger.warning("[AI Reconciler] No LLM provider available.")
            return None

        # Build prompt payload
        prompt_data = {
            "transactions_to_reconcile": [
                {
                    "index": idx,
                    "date": str(tx.get("date")),
                    "type": tx.get("type"),
                    "amount": tx.get("amount"),
                    "raw_narration": tx.get("narration"),
                    "extracted_utr": tx.get("utr"),
                }
                for idx, tx in enumerate(raw_transactions)
            ],
            "active_society_events": society_context.get("events", []),
            "event_expenses": society_context.get("event_expenses", []),
            "registered_vendors": society_context.get("vendors", []),
            "resident_directory": society_context.get("residents", []),
        }

        user_content = f"Please reconcile the following bank statement transactions against the provided society context:\n\n{json.dumps(prompt_data, indent=2)}"

        messages = [
            SystemMessage(content=RECONCILIATION_SYSTEM_PROMPT),
            HumanMessage(content=user_content),
        ]

        logger.info(f"[AI Reconciler] Sending {len(raw_transactions)} transactions to {settings.LLM_PROVIDER} LLM...")
        response = await llm.ainvoke(messages)
        response_text = response.content.strip()

        # Extract JSON array
        json_match = re.search(r"\[\s*\{.*\}\s*\]", response_text, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group(0))
            logger.info(f"[AI Reconciler] Successfully parsed {len(parsed)} reconciled items from LLM.")
            return parsed
        else:
            logger.warning(f"[AI Reconciler] LLM response did not contain JSON array: {response_text[:200]}")
            return None

    except Exception as e:
        logger.error(f"[AI Reconciler] Error running LLM statement reconciliation: {e}", exc_info=True)
        return None
