"""
ResidentHub — Comprehensive Database Seed Script
Populates PostgreSQL (Docker) with realistic demo data for all modules:
- Society & Users (Admin, Members)
- Events, RSVPs & Expenses
- Financial Ledger (Income & Expenses)
- Vendor & Worker Directory + Reviews
- Society Notices & Broadcasts
- Managing Committee Directory
- Helpdesk Issues, Timeline Activities & SLA Tracking
"""

import asyncio
import uuid
from datetime import datetime, date, timedelta
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
from app.models.notice import Notice
from app.models.committee import CommitteeMember
from app.models.issue import Issue, IssueActivity

def uid():
    return str(uuid.uuid4())

async def seed():
    print("🏗️  ResidentHub — Seeding PostgreSQL Database in Docker...")

    # Drop and recreate all tables cleanly in PostgreSQL
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ PostgreSQL tables created.")

    async with AsyncSessionLocal() as db:
        # 1. SOCIETY
        society_id = uid()
        society = Society(
            id=society_id,
            name="Runwal Gardens — Tower 24",
            address="Tower 24, Runwal Gardens, Manpada Road, Dombivli (East) — 421201",
            upi_qr_image_url="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=runwal.t24@upi&pn=RunwalGardensT24"
        )
        db.add(society)
        await db.flush()

        # 2. USERS
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
            residency_type="Owner",
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
            residency_type="Owner",
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
            residency_type="Renter",
            role="member"
        )
        db.add_all([admin, member, member2])
        await db.flush()

        # 3. EVENTS & RSVPs
        ev1_id, ev2_id, ev3_id = uid(), uid(), uid()

        event1 = Event(
            id=ev1_id,
            society_id=society_id,
            title="Diwali Grand Celebration & Dinner",
            description="Annual society gathering with cultural performances, fireworks display, and catered buffet dinner for all families.",
            event_date=datetime(2026, 11, 8, 18, 30),
            venue="Society Clubhouse & Main Lawn",
            fee_per_person=450.0,
            fee_adult=450.0,
            fee_child=200.0,
            fee_senior=300.0,
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
            fee_per_person=0.0,
            fee_adult=0.0,
            fee_child=0.0,
            fee_senior=0.0,
            created_by=admin_id
        )
        event3 = Event(
            id=ev3_id,
            society_id=society_id,
            title="Independence Day Flag Hoisting & Breakfast",
            description="Morning flag hoisting ceremony followed by complimentary breakfast and patriotic songs for children.",
            event_date=datetime(2026, 8, 15, 7, 30),
            venue="Society Main Entrance & Amphitheatre",
            fee_per_person=0.0,
            fee_adult=0.0,
            fee_child=0.0,
            fee_senior=0.0,
            created_by=admin_id
        )
        db.add_all([event1, event2, event3])
        await db.flush()

        # RSVPs
        rsvp1 = EventRSVP(
            id=uid(), event_id=ev1_id, user_id=member2_id,
            member_name="Amit Deshmukh", flat_number="A-102",
            adults_count=2, children_count=1, seniors_count=1,
            attendees_count=4, total_amount=1400.0,
            utr_number="UPI-9834710293", status="approved"
        )
        rsvp2 = EventRSVP(
            id=uid(), event_id=ev1_id, user_id=member_id,
            member_name="Priya Patel", flat_number="B-201",
            adults_count=2, children_count=0, seniors_count=0,
            attendees_count=2, total_amount=900.0,
            utr_number="UPI-7728193821", status="approved"
        )
        rsvp3 = EventRSVP(
            id=uid(), event_id=ev2_id, user_id=member_id,
            member_name="Priya Patel", flat_number="B-201",
            adults_count=1, children_count=0, seniors_count=0,
            attendees_count=1, total_amount=0.0, status="approved"
        )
        db.add_all([rsvp1, rsvp2, rsvp3])

        # Event Expenses
        exp1 = EventExpense(
            id=uid(), event_id=ev1_id,
            category="Catering & Food",
            title="Catered buffet dinner advance (Royal Caterers)",
            vendor_name="Royal Caterers Dombivli",
            amount=15000.0,
            invoice_ref="INV-CAT-9921",
            expense_date=date(2026, 10, 20),
            logged_by=admin_id
        )
        exp2 = EventExpense(
            id=uid(), event_id=ev1_id,
            category="Decorations & Stage",
            title="Podium & Clubhouse fairy lighting + floral setup",
            vendor_name="Shree Ganesh Decorators",
            amount=6500.0,
            invoice_ref="INV-DEC-4819",
            expense_date=date(2026, 10, 22),
            logged_by=admin_id
        )
        db.add_all([exp1, exp2])
        await db.flush()

        # 4. LEDGER TRANSACTIONS
        today = date.today()
        ledger_entries = [
            LedgerTransaction(
                id=uid(), society_id=society_id,
                transaction_type="income", category="Maintenance",
                amount=185000.0, transaction_date=today.replace(day=1),
                description="August Monthly Maintenance collection (42/48 flats cleared)",
                logged_by=admin_id
            ),
            LedgerTransaction(
                id=uid(), society_id=society_id,
                transaction_type="expense", category="Security",
                amount=45000.0, transaction_date=today.replace(day=3),
                description="Apex Security Agency monthly guard salary & supervisor fee",
                receipt_url="INV-SEC-AUG26.pdf",
                logged_by=admin_id
            ),
            LedgerTransaction(
                id=uid(), society_id=society_id,
                transaction_type="expense", category="Electricity",
                amount=28400.0, transaction_date=today.replace(day=4),
                description="Common Area & Water Pump Electricity Bill (MSEDCL)",
                receipt_url="MSEDCL-AUG26.pdf",
                logged_by=admin_id
            ),
            LedgerTransaction(
                id=uid(), society_id=society_id,
                transaction_type="expense", category="Elevator AMC",
                amount=18000.0, transaction_date=today.replace(day=5),
                description="Schindler Quarterly AMC & sensor overhaul",
                receipt_url="SCH-AMC-Q3.pdf",
                logged_by=admin_id
            ),
            LedgerTransaction(
                id=uid(), society_id=society_id,
                transaction_type="expense", category="Gardening & Cleaning",
                amount=12500.0, transaction_date=today.replace(day=6),
                description="Garden fertilizer, lawn trimming, and housekeeping supplies",
                logged_by=admin_id
            ),
            LedgerTransaction(
                id=uid(), society_id=society_id,
                transaction_type="income", category="Event Collection",
                amount=45000.0, transaction_date=today.replace(day=7),
                description="Ganesh Chaturthi Mahotsav 2026 Resident Contributory Fund",
                logged_by=admin_id
            ),
            LedgerTransaction(
                id=uid(), society_id=society_id,
                transaction_type="income", category="Maintenance",
                amount=175000.0, transaction_date=(today.replace(day=1) - timedelta(days=30)),
                description="July Monthly Maintenance collection (40/48 flats cleared)",
                logged_by=admin_id
            ),
            LedgerTransaction(
                id=uid(), society_id=society_id,
                transaction_type="expense", category="Security",
                amount=45000.0, transaction_date=(today.replace(day=3) - timedelta(days=30)),
                description="Apex Security Agency July salary",
                logged_by=admin_id
            ),
        ]
        db.add_all(ledger_entries)
        await db.flush()

        # 5. VENDORS & REVIEWS
        v1_id, v2_id, v3_id, v4_id, v5_id, v6_id = uid(), uid(), uid(), uid(), uid(), uid()

        vendors = [
            ServiceProvider(
                id=v1_id, society_id=society_id,
                category="Electrician",
                name="Suresh Kumar",
                phone_number="+91 98201 11223",
                whatsapp_number="+91 98201 11223",
                notes="Expert with MCB trip issues, inverter wiring, and fan repairs. Lives 5 mins away."
            ),
            ServiceProvider(
                id=v2_id, society_id=society_id,
                category="Plumber",
                name="Raju Kaka",
                phone_number="+91 98765 43210",
                whatsapp_number="+91 98765 43210",
                notes="Specializes in bathroom leakage, tap replacements, and overhead tank pipeline checks."
            ),
            ServiceProvider(
                id=v3_id, society_id=society_id,
                category="Security",
                name="Ramesh Singh",
                phone_number="+91 98190 55443",
                whatsapp_number="+91 98190 55443",
                notes="Head Gate Supervisor & Night Shift In-charge. First responder for vehicle parking issues."
            ),
            ServiceProvider(
                id=v4_id, society_id=society_id,
                category="Maid",
                name="Sunita Bai",
                phone_number="+91 97654 32109",
                whatsapp_number="+91 97654 32109",
                notes="Full-day cooking & housekeeping. Verified background check with local police station."
            ),
            ServiceProvider(
                id=v5_id, society_id=society_id,
                category="Elevator",
                name="Schindler Elevators AMC Team",
                phone_number="+91 1800 200 4567",
                whatsapp_number="+91 99887 76655",
                notes="Annual maintenance contract service engineer team. Available 24x7 for entrapment emergencies."
            ),
            ServiceProvider(
                id=v6_id, society_id=society_id,
                category="AC Repair",
                name="CoolBreeze HVAC Services",
                phone_number="+91 98334 99887",
                whatsapp_number="+91 98334 99887",
                notes="Daikin & Voltas certified technician for gas refilling, coil cleaning, and compressor repair."
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
                id=uid(), provider_id=v2_id, user_id=admin_id,
                user_name="Rajesh Sharma", flat_number="A-402",
                rating=5, comment="Good work fixing kitchen sink blockage. Came within 30 mins of calling."
            ),
            ProviderReview(
                id=uid(), provider_id=v4_id, user_id=member_id,
                user_name="Priya Patel", flat_number="B-201",
                rating=5, comment="Sunita Bai is punctual, very hygienic, and polite. Highly recommended."
            ),
        ]
        db.add_all(reviews)
        await db.flush()

        # 6. NOTICES
        notices = [
            Notice(
                id=uid(), society_id=society_id,
                title="Overhead Water Tank Deep Cleaning Schedule",
                content="Annual deep cleaning and chlorination of both overhead domestic and fire tanks will be carried out this Sunday from 9 AM to 2 PM. Water supply will be suspended during this window.",
                category="Maintenance", priority="urgent", author_name="Managing Committee", created_by=admin_id
            ),
            Notice(
                id=uid(), society_id=society_id,
                title="Independence Day Flag Hoisting Ceremony & Breakfast",
                content="All residents and families are warmly invited to join the 80th Independence Day Flag Hoisting at 8:00 AM on the podium, followed by cultural songs by society children and south Indian breakfast.",
                category="Festival", priority="high", author_name="Cultural Committee", created_by=admin_id
            ),
            Notice(
                id=uid(), society_id=society_id,
                title="Rooftop Solar Net-Metering Commissioned",
                content="We are pleased to announce that the 45kW rooftop solar panels have been successfully synchronized with the MSEDCL grid. Estimated 35% reduction in monthly common utility bills.",
                category="Financial", priority="normal", author_name="Estate Committee", created_by=admin_id
            ),
            Notice(
                id=uid(), society_id=society_id,
                title="Strict Speed Limit (15 km/h) in Basement B1 & B2",
                content="Please drive within 15 km/h inside the basement parking driveway. CCTV speed radar alerts will be logged with security for repeated violations.",
                category="Security", priority="normal", author_name="Security In-charge", created_by=admin_id
            ),
        ]
        db.add_all(notices)
        await db.flush()

        # 7. COMMITTEE MEMBERS
        committee = [
            CommitteeMember(
                id=uid(), society_id=society_id,
                name="Rajesh Sharma", role="Chairman & Governance",
                flat_number="A-402", photo_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
                badge="Founding Trustee", applaud_count=142, display_order=1
            ),
            CommitteeMember(
                id=uid(), society_id=society_id,
                name="Priya Patel", role="Hon. Secretary & Operations",
                flat_number="B-201", photo_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                badge="Operations Lead", applaud_count=189, display_order=2
            ),
            CommitteeMember(
                id=uid(), society_id=society_id,
                name="Anil Kulkarni", role="Hon. Treasurer & Accounts",
                flat_number="C-304", photo_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
                badge="Finance Chair", applaud_count=98, display_order=3
            ),
            CommitteeMember(
                id=uid(), society_id=society_id,
                name="Dr. Sandeep Deshmukh", role="Estate & Safety Committee",
                flat_number="A-102", photo_url="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
                badge="Safety Steward", applaud_count=76, display_order=4
            ),
        ]
        db.add_all(committee)
        await db.flush()

        # 8. ISSUES (Active Open, In Progress, Resolved for AI Duplicate engine)
        iss1_id, iss2_id, iss3_id, iss4_id = uid(), uid(), uid(), uid()

        issues = [
            Issue(
                id=iss1_id,
                society_id=society_id,
                ticket_number="ISSUE-T24-1039",
                flat_number="Common Area",
                reported_by="Priya Patel (B-201)",
                title="Passenger Lift A door sensor jammed",
                description="Lift A door is stuck open on 4th floor and making a clicking noise when trying to close.",
                category="Elevator",
                priority="high",
                status="open",
                location="Passenger Lift A",
                preferred_slot="Immediate / Emergency",
                assigned_vendor_name="Schindler Elevators AMC Team",
                created_at=datetime.utcnow() - timedelta(hours=2)
            ),
            Issue(
                id=iss2_id,
                society_id=society_id,
                ticket_number="ISSUE-T24-1042",
                flat_number="B-201",
                reported_by="Anil Sharma",
                title="Low water pressure in master bathroom line",
                description="The water flow from the main supply inlet in the master bathroom shower has been inconsistent since yesterday evening.",
                category="Plumbing",
                priority="medium",
                status="in_progress",
                location="Flat B-201 Master Bath",
                preferred_slot="Today 5:00 PM - 7:00 PM",
                assigned_vendor_name="Raju Kaka",
                created_at=datetime.utcnow() - timedelta(hours=4)
            ),
            Issue(
                id=iss3_id,
                society_id=society_id,
                ticket_number="ISSUE-T24-1044",
                flat_number="C-404",
                reported_by="Vikram Malhotra",
                title="Corridor light fixture flickering outside Flat C-404",
                description="The ceiling recessed LED panel in the 4th floor west wing corridor is flickering intermittently.",
                category="Electrical",
                priority="low",
                status="open",
                location="4th Floor West Wing Corridor",
                preferred_slot="Tomorrow Morning",
                assigned_vendor_name="Suresh Kumar",
                created_at=datetime.utcnow() - timedelta(hours=1)
            ),
            Issue(
                id=iss4_id,
                society_id=society_id,
                ticket_number="ISSUE-T24-1031",
                flat_number="Common Area",
                reported_by="Rajesh Kulkarni",
                title="Gymnasium AC thermostat calibration",
                description="AC Unit 2 in the ground floor gym was blowing warm air.",
                category="Common Area",
                priority="low",
                status="resolved",
                location="Ground Floor Clubhouse Gym",
                assigned_vendor_name="CoolBreeze HVAC Services",
                resolution_notes="Filters washed, refrigerant pressure topped up, and thermostat recalibrated to 23°C.",
                resolved_at=datetime.utcnow() - timedelta(days=1),
                created_at=datetime.utcnow() - timedelta(days=2)
            ),
        ]
        db.add_all(issues)
        await db.flush()

        activities = [
            IssueActivity(
                issue_id=iss1_id,
                action="created",
                actor_name="Priya Patel",
                actor_role="resident",
                comment="Reported optical sensor door jam on 4th floor via AI Bot",
                created_at=datetime.utcnow() - timedelta(hours=2)
            ),
            IssueActivity(
                issue_id=iss1_id,
                action="assigned",
                actor_name="Managing Committee",
                actor_role="admin",
                comment="Dispatched Schindler Elevators AMC emergency technician crew",
                created_at=datetime.utcnow() - timedelta(hours=1)
            ),
            IssueActivity(
                issue_id=iss2_id,
                action="created",
                actor_name="Anil Sharma",
                actor_role="resident",
                comment="Reported shower inlet pressure fluctuation",
                created_at=datetime.utcnow() - timedelta(hours=4)
            ),
            IssueActivity(
                issue_id=iss2_id,
                action="assigned",
                actor_name="Managing Committee",
                actor_role="admin",
                comment="Assigned to Raju Kaka. Technician arriving during resident slot.",
                created_at=datetime.utcnow() - timedelta(hours=3)
            ),
        ]
        db.add_all(activities)

        await db.commit()
        print("\n🎉 PostgreSQL Seed complete!")
        print("   Admin login:  admin@residenthub.local / admin123  (Flat A-402)")
        print("   Member login: member@residenthub.local / member123 (Flat B-201)")

if __name__ == "__main__":
    asyncio.run(seed())
