import re
import io
import csv
import uuid
import logging
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.event import Event, EventRSVP, EventExpense
from app.models.vendor import ServiceProvider
from app.models.user import User
from app.schemas.ledger import ParsedBankTransaction, StatementParseResponse

logger = logging.getLogger(__name__)

# Common Utility & Vendor Mapping Rules for Housing Societies
VENDOR_RULES = [
    (r"(schindler|otis|kone|johnson|lift|elevator)", "Lift Maintenance", "Schindler / Lift Maintenance AMC"),
    (r"(msedcl|bescom|tata power|adani electricity|electricity|power bill|electric)", "Electricity", "Common Area Electricity Bill (MSEDCL)"),
    (r"(apex security|security guard|guard salary|security services|sis india)", "Security", "Monthly Society Security Services"),
    (r"(plumb|leakage|water pump|borewell|sintex|tank cleaning)", "Repairs", "Plumbing & Water Supply Repairs"),
    (r"(garden|gardener|fertilizer|lawn|nursery|housekeeping|sweeping|cleaning supplies)", "Gardening & Cleaning", "Gardening & Housekeeping Supplies"),
    (r"(asian paints|berger|nerolac|painting|whitewash)", "Repairs", "Building Painting / Maintenance"),
    (r"(audit|chartered accountant|ca fee|legal|statutory)", "Others", "Audit & Professional Fees"),
]

def parse_date_flexible(d_str: str) -> Optional[date]:
    """Parses various standard bank statement date formats."""
    if not d_str:
        return None
    d_str = d_str.strip()
    formats = [
        "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%d.%m.%Y",
        "%d-%b-%Y", "%d/%b/%Y", "%d %b %Y", "%d-%B-%Y",
        "%d-%m-%y", "%d/%m/%y", "%Y/%m/%d"
    ]
    for fmt in formats:
        try:
            return datetime.strptime(d_str, fmt).date()
        except ValueError:
            continue
    return None

def extract_utr_or_ref(text: str) -> Optional[str]:
    """Extracts UPI UTR, IMPS/NEFT reference, or transaction numbers."""
    patterns = [
        r"(?:UPI|UTR|REF|TXN|IMPS|NEFT|CHQ|INV)[/:-]?\s*([A-Za-z0-9_-]{6,25})",
        r"(?:UPI-?|UTR-?)([0-9]{10,14})",
        r"([0-9]{10,14})",  # Standard 10-14 digit Indian UPI / Bank RRN
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return None

def clean_amount(val: str) -> Optional[float]:
    """Cleans currency strings like '1,85,000.00', 'Rs 900', '₹450' into float."""
    if not val:
        return None
    cleaned = re.sub(r"[^\d.]", "", val.replace(",", "").strip())
    if cleaned:
        try:
            v = float(cleaned)
            return v if v > 0 else None
        except ValueError:
            return None
    return None

async def parse_and_reconcile_bank_statement(
    statement_text: str,
    db: AsyncSession
) -> StatementParseResponse:
    """
    Parses bank statement text and intelligently matches transactions against
    active Society Events, RSVPs, Event Expenses, and Maintenance dues.
    """
    # 1. Fetch Society Context from DB
    events_res = await db.execute(
        select(Event).options(selectinload(Event.rsvps), selectinload(Event.expenses))
    )
    all_events = events_res.scalars().all()

    vendors_res = await db.execute(select(ServiceProvider))
    all_vendors = vendors_res.scalars().all()

    # Pre-index RSVPs by normalized UTR and by (flat_number, amount)
    rsvps_by_utr: Dict[str, Dict[str, Any]] = {}
    rsvps_by_flat_amount: Dict[str, List[Dict[str, Any]]] = {}

    for ev in all_events:
        for rsvp in (ev.rsvps or []):
            clean_utr = re.sub(r"[^A-Za-z0-9]", "", (rsvp.utr_number or "").upper())
            rsvp_info = {
                "rsvp": rsvp,
                "event": ev,
                "event_id": ev.id,
                "event_title": ev.title,
                "utr": clean_utr,
                "raw_utr": rsvp.utr_number,
                "flat": (rsvp.flat_number or "").strip().upper(),
                "name": (rsvp.member_name or "").strip(),
                "amount": float(rsvp.total_amount),
                "status": rsvp.status,
            }
            if clean_utr:
                rsvps_by_utr[clean_utr] = rsvp_info

            key = f"{rsvp_info['flat'].replace('-', '')}_{int(rsvp_info['amount'])}"
            rsvps_by_flat_amount.setdefault(key, []).append(rsvp_info)

    # Pre-index Event Expenses
    event_expenses_list: List[Dict[str, Any]] = []
    for ev in all_events:
        for exp in (ev.expenses or []):
            event_expenses_list.append({
                "expense": exp,
                "event": ev,
                "event_id": ev.id,
                "event_title": ev.title,
                "vendor": (exp.vendor_name or "").lower(),
                "title": exp.title.lower(),
                "category": exp.category,
                "amount": float(exp.amount),
                "invoice_ref": (exp.invoice_ref or "").lower().replace("-", ""),
            })

    # 2. Parse Rows using CSV / Delimiter / Line Matcher
    raw_tx_records: List[Dict[str, Any]] = []

    # Detect delimiter
    first_few_lines = statement_text.strip().split("\n")[:5]
    has_csv = any("," in l for l in first_few_lines)
    has_tab = any("\t" in l for l in first_few_lines)

    if has_csv or has_tab:
        delim = "\t" if has_tab and not has_csv else ","
        f = io.StringIO(statement_text.strip())
        reader = csv.reader(f, delimiter=delim)
        rows = [row for row in reader if row and any(c.strip() for c in row)]

        if rows:
            # Check for header row
            header_idx = -1
            date_col = -1
            desc_col = -1
            debit_col = -1
            credit_col = -1
            amount_col = -1
            type_col = -1

            for r_idx, row in enumerate(rows[:3]):
                row_lower = [c.lower().strip() for c in row]
                for c_idx, col in enumerate(row_lower):
                    if "date" in col:
                        date_col = c_idx
                        header_idx = r_idx
                    elif any(w in col for w in ["narration", "description", "particulars", "details", "remarks"]):
                        desc_col = c_idx
                    elif any(w in col for w in ["withdrawal", "debit", "dr", "paid"]):
                        debit_col = c_idx
                    elif any(w in col for w in ["deposit", "credit", "cr", "received"]):
                        credit_col = c_idx
                    elif "amount" in col:
                        amount_col = c_idx
                    elif "type" in col:
                        type_col = c_idx

            data_rows = rows[header_idx + 1:] if header_idx != -1 else rows

            for row in data_rows:
                if len(row) < 2:
                    continue
                # Date
                t_date = None
                if date_col != -1 and date_col < len(row):
                    t_date = parse_date_flexible(row[date_col])
                if not t_date:
                    for cell in row[:3]:
                        t_date = parse_date_flexible(cell)
                        if t_date:
                            break
                if not t_date:
                    t_date = date.today()

                # Description
                narration = ""
                if desc_col != -1 and desc_col < len(row):
                    narration = row[desc_col].strip()
                if not narration:
                    # Pick longest string
                    str_cells = [c.strip() for c in row if not clean_amount(c) and not parse_date_flexible(c)]
                    narration = max(str_cells, key=len) if str_cells else " ".join(row)

                # Debit / Credit
                debit_val = clean_amount(row[debit_col]) if (debit_col != -1 and debit_col < len(row)) else None
                credit_val = clean_amount(row[credit_col]) if (credit_col != -1 and credit_col < len(row)) else None
                amt_val = clean_amount(row[amount_col]) if (amount_col != -1 and amount_col < len(row)) else None

                if credit_val:
                    raw_tx_records.append({"date": t_date, "narration": narration, "amount": credit_val, "type": "income"})
                elif debit_val:
                    raw_tx_records.append({"date": t_date, "narration": narration, "amount": debit_val, "type": "expense"})
                elif amt_val:
                    t_type = "expense" if (type_col != -1 and "dr" in row[type_col].lower()) else ("income" if any(w in narration.lower() for w in ["cr", "received", "from"]) else "income")
                    raw_tx_records.append({"date": t_date, "narration": narration, "amount": amt_val, "type": t_type})
                else:
                    # Find any number in row that is not the date
                    for cell in row:
                        val = clean_amount(cell)
                        if val and val > 10 and not parse_date_flexible(cell):
                            lower = narration.lower()
                            is_cr = any(w in lower for w in ["cr", "credit", "deposit", "received", "from"])
                            raw_tx_records.append({"date": t_date, "narration": narration, "amount": val, "type": "income" if is_cr else "expense"})
                            break

    # Fallback to free-text line parsing if CSV produced nothing
    if not raw_tx_records:
        lines = [l.strip() for l in statement_text.split("\n") if l.strip()]
        for line in lines:
            if any(h in line.lower() for h in ["date", "transaction date", "balance", "sl no"]):
                continue
            date_match = re.search(r"(\d{4}[-/\.]\d{1,2}[-/\.]\d{1,2}|\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})", line)
            t_date = parse_date_flexible(date_match.group(1)) if date_match else date.today()

            amounts = re.findall(r"(?:rs\.?|inr|₹)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)", line, re.IGNORECASE)
            valid_amounts = [clean_amount(a) for a in amounts if clean_amount(a) and clean_amount(a) > 10]
            if valid_amounts:
                amt = valid_amounts[-1]
                lower = line.lower()
                is_credit = any(w in lower for w in ["cr", "credit", "deposit", "received", "from", "paid by", "maint"])
                raw_tx_records.append({
                    "date": t_date,
                    "narration": line,
                    "amount": amt,
                    "type": "income" if is_credit else "expense"
                })

    # 3. Match & Reconcile Each Record
    parsed_results: List[ParsedBankTransaction] = []
    total_income = 0.0
    total_expense = 0.0
    rsvps_matched_count = 0

    for idx, tx in enumerate(raw_tx_records):
        narration = tx["narration"]
        narration_lower = narration.lower()
        amt = tx["amount"]
        tx_type = tx["type"]
        t_date = tx["date"]

        utr = extract_utr_or_ref(narration)
        clean_utr = re.sub(r"[^A-Za-z0-9]", "", (utr or "").upper())

        category = "Others"
        description = narration
        matched_event_id = None
        matched_event_title = None
        matched_rsvp_id = None
        matched_entity_info = None
        match_confidence = "none"
        match_type = "general"
        auto_approve_rsvp = False

        # --- A. INCOME / CREDITS ---
        if tx_type == "income":
            total_income += amt

            # Check 1: Match by UTR Number against Event RSVPs
            if clean_utr and clean_utr in rsvps_by_utr:
                m = rsvps_by_utr[clean_utr]
                matched_event_id = m["event_id"]
                matched_event_title = m["event_title"]
                matched_rsvp_id = m["rsvp"].id
                matched_entity_info = f"{m['name']} (Flat {m['flat']}) • {m['rsvp'].attendees_count} attendee(s)"
                category = "Events (RSVP)"
                description = f"{m['event_title']} — RSVP Payment from {m['name']} ({m['flat']})"
                match_confidence = "high"
                match_type = "rsvp"
                auto_approve_rsvp = (m["status"] == "pending")
                rsvps_matched_count += 1

            # Check 2: Match by Flat Number & Amount against Event RSVPs
            if not matched_rsvp_id:
                flat_match = re.search(r"(?:flat\s*no\.?|unit\s*)?([A-Za-z]-?[0-9]{3,4})", narration, re.IGNORECASE)
                found_flat = flat_match.group(1).upper().replace("-", "") if flat_match else None

                for key, rsvp_list in rsvps_by_flat_amount.items():
                    for m in rsvp_list:
                        clean_m_flat = m["flat"].replace("-", "")
                        flat_matches = (found_flat and clean_m_flat == found_flat)
                        name_matches = (m["name"].lower() in narration_lower)
                        amt_matches = abs(m["amount"] - amt) < 1.0

                        if (flat_matches or name_matches) and amt_matches:
                            matched_event_id = m["event_id"]
                            matched_event_title = m["event_title"]
                            matched_rsvp_id = m["rsvp"].id
                            matched_entity_info = f"{m['name']} (Flat {m['flat']}) • {m['rsvp'].attendees_count} attendee(s)"
                            category = "Events (RSVP)"
                            description = f"{m['event_title']} — RSVP Payment from {m['name']} ({m['flat']})"
                            match_confidence = "high" if name_matches else "medium"
                            match_type = "rsvp"
                            auto_approve_rsvp = (m["status"] == "pending")
                            rsvps_matched_count += 1
                            break
                    if matched_rsvp_id:
                        break

            # Check 3: General Maintenance Inflow
            if not matched_rsvp_id:
                if any(w in narration_lower for w in ["maint", "maintenance", "society charges", "monthly dues"]):
                    category = "Maintenance"
                    flat_m = re.search(r"([A-Za-z]-?[0-9]{3,4})", narration)
                    flat_str = f" Flat {flat_m.group(1).upper()}" if flat_m else ""
                    description = f"Monthly Maintenance Collection{flat_str}"
                    match_type = "maintenance"
                    match_confidence = "high"
                elif "interest" in narration_lower or "int.pd" in narration_lower:
                    category = "Others"
                    description = "Bank Savings / FD Interest Credit"
                else:
                    category = "Maintenance" if amt >= 2000 else "Others"
                    description = f"Inflow: {narration[:60]}"

        # --- B. EXPENSES / DEBITS ---
        else:
            total_expense += amt

            # Check 1: Match against Event Expenses by invoice ref or vendor name
            for exp in event_expenses_list:
                ref_match = exp["invoice_ref"] and exp["invoice_ref"] in narration_lower.replace("-", "")
                vendor_match = exp["vendor"] and exp["vendor"] in narration_lower
                amt_match = abs(exp["amount"] - amt) < 1.0

                if (ref_match or (vendor_match and amt_match)):
                    matched_event_id = exp["event_id"]
                    matched_event_title = exp["event_title"]
                    matched_entity_info = f"Event Expense: {exp['title']} ({exp['category']})"
                    category = "Events"
                    description = f"{exp['event_title']} — {exp['title']}"
                    match_confidence = "high"
                    match_type = "event_expense"
                    break

            # Check 2: Match against registered Service Providers
            if not matched_event_id:
                for v in all_vendors:
                    if v.name.lower() in narration_lower:
                        category = v.category if v.category in ["Electrician", "Plumber", "Repairs", "Security"] else "Repairs"
                        description = f"Payment to {v.name} ({v.category})"
                        matched_entity_info = f"Vendor: {v.name} ({v.category})"
                        match_confidence = "high"
                        match_type = "vendor"
                        break

            # Check 3: Match against Common Society Utility Rules
            if not matched_event_id and match_type == "general":
                for pat, cat, desc_label in VENDOR_RULES:
                    if re.search(pat, narration_lower):
                        category = cat
                        description = desc_label
                        match_confidence = "high"
                        match_type = "general"
                        break

            if category == "Others" and match_type == "general":
                description = f"Expense: {narration[:60]}"

        parsed_results.append(ParsedBankTransaction(
            temp_id=f"tx-{idx+1}-{uuid.uuid4().hex[:6]}",
            transaction_date=t_date,
            transaction_type=tx_type,
            amount=round(amt, 2),
            raw_narration=narration,
            utr_number=utr,
            category=category,
            description=description,
            matched_event_id=matched_event_id,
            matched_event_title=matched_event_title,
            matched_rsvp_id=matched_rsvp_id,
            matched_entity_info=matched_entity_info,
            match_confidence=match_confidence,
            match_type=match_type,
            auto_approve_rsvp=auto_approve_rsvp,
            selected=True
        ))

    return StatementParseResponse(
        total_detected=len(parsed_results),
        total_income=round(total_income, 2),
        total_expense=round(total_expense, 2),
        total_rsvps_matched=rsvps_matched_count,
        transactions=parsed_results
    )
