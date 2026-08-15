"""
ResidentHub V1 — Database Seed Script
Seeds PostgreSQL with realistic demo data for all V1 modules.
Idempotent: safe to re-run (clears and re-inserts).

Usage:
    cd backend
    python seed.py
"""

import asyncio
import uuid
from datetime import datetime, date, timedelta

# Setup path for imports
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, AsyncSessionLocal, Base
from app.core.security import get_password_hash
from app.models.society import Society
from app.models.user import User
from app.models.event import Event, EventRSVP, EventExpense
from app.models.ledger import LedgerTransaction
from app.models.vendor import ServiceProvider, ProviderReview


def uid():
    return str(uuid.uuid4())


async def seed():
    print("🏗️  ResidentHub V1 — Seeding Database...")
    
    # Drop and recreate all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tables created.")

    async with AsyncSessionLocal() as db:
        # ─────────────────────────────────────────────────
        # 1. SOCIETY
        # ─────────────────────────────────────────────────
        society_id = uid()
        society = Society(
            id=society_id,
            name="Runwal Gardens — Tower 24",
            address="Tower 24, Runwal Gardens, Manpada Road, Dombivli (East) — 421201",
            upi_qr_image_url="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=runwal.t24@upi&pn=RunwalGardensT24"
        )
        db.add(society)
        await db.flush()
        print("✅ Society created: Runwal Gardens Tower 24")

        # ─────────────────────────────────────────────────
        # 2. USERS (admin + member)
        # ─────────────────────────────────────────────────
        admin_id = uid()
        member_id = uid()
        member2_id = uid()

        admin = User(
            id=admin_id,
            society_id=society_id,
            email="admin@residenthub.local",
            hashed_password=get_password_hash("admin123"),
            full_name="Rajesh Sharma (Secretary)",
            flat_number="A-402",
            phone_number="+91 98765 43210",
            role="admin"
        )
        member = User(
            id=member_id,
            society_id=society_id,
            email="member@residenthub.local",
            hashed_password=get_password_hash("member123"),
            full_name="Priya Patel",
            flat_number="B-201",
            phone_number="+91 98111 22334",
            role="member"
        )
        member2 = User(
            id=member2_id,
            society_id=society_id,
            email="amit@residenthub.local",
            hashed_password=get_password_hash("member123"),
            full_name="Amit Deshmukh",
            flat_number="A-102",
            phone_number="+91 99887 76655",
            role="member"
        )
        db.add_all([admin, member, member2])
        await db.flush()
        print("✅ Users created: admin + 2 members")

        # ─────────────────────────────────────────────────
        # 3. EVENTS + RSVPs
        # ─────────────────────────────────────────────────
        ev1_id = uid()
        ev2_id = uid()
        ev3_id = uid()

        event1 = Event(
            id=ev1_id,
            society_id=society_id,
            title="Diwali Grand Celebration & Dinner",
            description="Annual society gathering with cultural performances, fireworks display, and catered buffet dinner for all families.",
            event_date=datetime(2026, 11, 8, 18, 30),
            venue="Society Clubhouse & Main Lawn",
            fee_per_person=450,
            fee_adult=450,
            fee_child=200,
            fee_senior=300,
            upi_qr_url="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=runwal.t24@upi&pn=RunwalGardensT24&am=450",
            created_by=admin_id
        )
        event2 = Event(
            id=ev2_id,
            society_id=society_id,
            title="Annual General Body Meeting (AGM 2026)",
            description="Mandatory annual meeting to review audited financials, pass new security resolutions, and elect committee members.",
            event_date=datetime(2026, 9, 15, 10, 0),
            venue="Society Meeting Hall (1st Floor)",
            fee_per_person=0,
            fee_adult=0,
            fee_child=0,
            fee_senior=0,
            created_by=admin_id
        )
        event3 = Event(
            id=ev3_id,
            society_id=society_id,
            title="Independence Day Flag Hoisting & Breakfast",
            description="Morning flag hoisting ceremony followed by complimentary breakfast and patriotic songs for children.",
            event_date=datetime(2026, 8, 15, 7, 30),
            venue="Society Main Entrance & Amphitheatre",
            fee_per_person=0,
            fee_adult=0,
            fee_child=0,
            fee_senior=0,
            created_by=admin_id
        )
        db.add_all([event1, event2, event3])
        await db.flush()

        # RSVPs for Diwali event
        rsvp1 = EventRSVP(
            id=uid(), event_id=ev1_id, user_id=member2_id,
            member_name="Amit Deshmukh", flat_number="A-102",
            adults_count=2, children_count=1, seniors_count=1,
            attendees_count=4, total_amount=1400,
            utr_number="UPI-9834710293", status="approved"
        )
        rsvp2 = EventRSVP(
            id=uid(), event_id=ev1_id, user_id=member_id,
            member_name="Priya Patel", flat_number="B-201",
            adults_count=2, children_count=0, seniors_count=0,
            attendees_count=2, total_amount=900,
            utr_number="UPI-7728193821", status="pending"
        )
        # RSVP for AGM
        rsvp3 = EventRSVP(
            id=uid(), event_id=ev2_id, user_id=member_id,
            member_name="Priya Patel", flat_number="B-201",
            adults_count=1, children_count=0, seniors_count=0,
            attendees_count=1, total_amount=0,
            status="approved"
        )
        rsvp4 = EventRSVP(
            id=uid(), event_id=ev2_id, user_id=member2_id,
            member_name="Amit Deshmukh", flat_number="A-102",
            adults_count=1, children_count=0, seniors_count=0,
            attendees_count=1, total_amount=0,
            status="approved"
        )
        db.add_all([rsvp1, rsvp2, rsvp3, rsvp4])
        await db.flush()

        # Event Expenses
        exp1 = EventExpense(
            id=uid(), event_id=ev1_id,
            category="Catering & Food",
            title="Catered buffet dinner advance (Royal Caterers)",
            vendor_name="Royal Caterers Dombivli",
            amount=15000,
            invoice_ref="INV-CAT-9921",
            expense_date=date(2026, 10, 20),
            logged_by=admin_id
        )
        exp2 = EventExpense(
            id=uid(), event_id=ev1_id,
            category="Decorations & Stage",
            title="Podium & Clubhouse fairy lighting + floral setup",
            vendor_name="Shree Ganesh Decorators",
            amount=6500,
            invoice_ref="INV-DEC-4819",
            expense_date=date(2026, 10, 22),
            logged_by=admin_id
        )
        exp3 = EventExpense(
            id=uid(), event_id=ev1_id,
            category="DJ & Sound",
            title="Sound system & wireless microphones rental",
            vendor_name="Bassline Audio Systems",
            amount=4000,
            invoice_ref="INV-SND-1022",
            expense_date=date(2026, 10, 24),
            logged_by=admin_id
        )
        exp4 = EventExpense(
            id=uid(), event_id=ev3_id,
            category="Catering & Food",
            title="Jalebi, Poha & Tea for 120 residents",
            vendor_name="Kalyan Sweets & Snacks",
            amount=4500,
            invoice_ref="INV-KAL-8371",
            expense_date=date(2026, 8, 14),
            logged_by=admin_id
        )
        db.add_all([exp1, exp2, exp3, exp4])
        await db.flush()
        print("✅ Events created: 3 events + 4 RSVPs + 4 Event Expenses")

        # ─────────────────────────────────────────────────
        # 4. LEDGER TRANSACTIONS
        # ─────────────────────────────────────────────────
        today = date.today()
        ledger_entries = [
            LedgerTransaction(
                id=uid(), society_id=society_id,
                transaction_type="income", category="Maintenance",
                amount=185000, transaction_date=today.replace(day=1),
                description="August Monthly Maintenance collection (42/48 flats cleared)",
                logged_by=admin_id
            ),
            LedgerTransaction(
                id=uid(), society_id=society_id,
                transaction_type="expense", category="Security",
                amount=45000, transaction_date=today.replace(day=3),
                description="Apex Security Agency monthly guard salary & supervisor fee",
                receipt_url="INV-SEC-AUG26.pdf",
                logged_by=admin_id
            ),
            LedgerTransaction(
                id=uid(), society_id=society_id,
                transaction_type="expense", category="Electricity",
                amount=28400, transaction_date=today.replace(day=4),
                description="Common Area & Water Pump Electricity Bill (MSEDCL)",
                receipt_url="MSEDCL-AUG26.pdf",
                logged_by=admin_id
            ),
            LedgerTransaction(
                id=uid(), society_id=society_id,
                transaction_type="expense", category="Lift Maintenance",
                amount=18000, transaction_date=today.replace(day=5),
                description="Schindler Quarterly AMC & sensor overhaul",
                receipt_url="SCH-AMC-Q3.pdf",
                logged_by=admin_id
            ),
            LedgerTransaction(
                id=uid(), society_id=society_id,
                transaction_type="expense", category="Gardening & Cleaning",
                amount=12500, transaction_date=today.replace(day=6),
                description="Garden fertilizer, lawn trimming, and housekeeping supplies",
                logged_by=admin_id
            ),
            LedgerTransaction(
                id=uid(), society_id=society_id,
                transaction_type="expense", category="Repairs",
                amount=8500, transaction_date=today.replace(day=7),
                description="Water tank float valve replacement + plumbing labor",
                logged_by=admin_id
            ),
            LedgerTransaction(
                id=uid(), society_id=society_id,
                transaction_type="income", category="Maintenance",
                amount=175000, transaction_date=(today.replace(day=1) - timedelta(days=30)),
                description="July Monthly Maintenance collection (40/48 flats cleared)",
                logged_by=admin_id
            ),
            LedgerTransaction(
                id=uid(), society_id=society_id,
                transaction_type="expense", category="Security",
                amount=45000, transaction_date=(today.replace(day=3) - timedelta(days=30)),
                description="Apex Security Agency July salary",
                logged_by=admin_id
            ),
            LedgerTransaction(
                id=uid(), society_id=society_id,
                transaction_type="expense", category="Electricity",
                amount=26800, transaction_date=(today.replace(day=5) - timedelta(days=30)),
                description="July Common Area Electricity Bill",
                logged_by=admin_id
            ),
            LedgerTransaction(
                id=uid(), society_id=society_id,
                transaction_type="expense", category="Events",
                amount=15000, transaction_date=(today.replace(day=15) - timedelta(days=30)),
                description="Independence Day celebrations advance payment",
                logged_by=admin_id
            ),
        ]
        db.add_all(ledger_entries)
        await db.flush()
        print("✅ Ledger entries created: 10 transactions (2 months)")

        # ─────────────────────────────────────────────────
        # 5. VENDORS + REVIEWS
        # ─────────────────────────────────────────────────
        v1_id, v2_id, v3_id, v4_id, v5_id = uid(), uid(), uid(), uid(), uid()

        vendors = [
            ServiceProvider(
                id=v1_id, society_id=society_id,
                category="Electrician",
                name="Ramesh Sharma",
                phone_number="+919820123456",
                whatsapp_number="+919820123456",
                notes="Expert with MCB trip issues, inverter wiring, and fan repairs. Lives 5 mins away."
            ),
            ServiceProvider(
                id=v2_id, society_id=society_id,
                category="Plumber",
                name="Mohan Kumar",
                phone_number="+919833445566",
                whatsapp_number="+919833445566",
                notes="Specializes in bathroom leakage, tap replacements, and overhead tank pipeline checks."
            ),
            ServiceProvider(
                id=v3_id, society_id=society_id,
                category="Doctor / Emergency",
                name="Dr. Sandeep Kulkarni (MD General)",
                phone_number="+919811223344",
                notes="Clinic at Society Commercial Complex (Shop 4). Available 8 AM - 1 PM & 6 PM - 10 PM. Emergency home visits for seniors."
            ),
            ServiceProvider(
                id=v4_id, society_id=society_id,
                category="Appliance Repair",
                name="Vijay AC & Refrigerator Works",
                phone_number="+919877889900",
                whatsapp_number="+919877889900",
                notes="Gas refilling, compressor repairs, washing machine PCB diagnosis."
            ),
            ServiceProvider(
                id=v5_id, society_id=society_id,
                category="Carpenter",
                name="Suresh Woodworks",
                phone_number="+919866554433",
                whatsapp_number="+919866554433",
                notes="Modular kitchen fitting, door hinge replacements, custom shelving."
            ),
        ]
        db.add_all(vendors)
        await db.flush()

        reviews = [
            ProviderReview(
                id=uid(), provider_id=v1_id, user_id=member2_id,
                user_name="Amit Deshmukh", flat_number="A-102",
                rating=5, comment="Fixed my master bedroom switchboard in 15 mins. Very honest charges."
            ),
            ProviderReview(
                id=uid(), provider_id=v1_id, user_id=member_id,
                user_name="Priya Patel", flat_number="B-201",
                rating=5, comment="Replaced main inverter fuse promptly on a Sunday."
            ),
            ProviderReview(
                id=uid(), provider_id=v2_id, user_id=admin_id,
                user_name="Rajesh Sharma", flat_number="A-402",
                rating=4, comment="Good work fixing kitchen sink blockage. Came within 30 mins of calling."
            ),
            ProviderReview(
                id=uid(), provider_id=v2_id, user_id=member_id,
                user_name="Priya Patel", flat_number="B-201",
                rating=5, comment="Fixed bathroom leakage that 2 other plumbers couldn't. Highly recommended."
            ),
            ProviderReview(
                id=uid(), provider_id=v3_id, user_id=member_id,
                user_name="Priya Patel", flat_number="B-201",
                rating=5, comment="Extremely caring doctor. Attended my mother immediately during high fever."
            ),
            ProviderReview(
                id=uid(), provider_id=v3_id, user_id=member2_id,
                user_name="Amit Deshmukh", flat_number="A-102",
                rating=5, comment="Best general physician in Dombivli area. Always available for emergencies."
            ),
            ProviderReview(
                id=uid(), provider_id=v4_id, user_id=member2_id,
                user_name="Amit Deshmukh", flat_number="A-102",
                rating=4, comment="AC gas refilling done well. Reasonable pricing."
            ),
            ProviderReview(
                id=uid(), provider_id=v5_id, user_id=admin_id,
                user_name="Rajesh Sharma", flat_number="A-402",
                rating=4, comment="Built custom shoe rack for lobby. Clean work, fair price."
            ),
        ]
        db.add_all(reviews)
        print("✅ Vendors created: 5 vendors + 8 reviews")

        await db.commit()
        print("\n🎉 Seed complete! Database is ready.")
        print("   Admin login:  admin@residenthub.local / admin123")
        print("   Member login: member@residenthub.local / member123")
        print("   Member login: amit@residenthub.local / member123")


if __name__ == "__main__":
    asyncio.run(seed())
