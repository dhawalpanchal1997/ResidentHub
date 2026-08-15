# 🏢 ResidentHub — Runwal Gardens (Tower 24)

> **Modern Co-Operative Housing Society Governance, Event Management & AI Resident Concierge Platform**  
> Specially tailored for the **96 Resident Families of Tower 24, Runwal Gardens, Dombivli (East), Maharashtra**.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-336791.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)

---

## 🌟 Overview

**ResidentHub** unites accounting transparency, festival event management, AI maintenance triage, and verified local vendor discovery into an intuitive, high-performance web experience. Designed with a **Liquid Glassmorphism UI** and support for both **Light and Dark Modes**, it guarantees **$0/Month Zero-Cost Infrastructure** using free developer tiers and local/cloud LLMs.

---

## 🚀 Key Feature Modules

### 1. 🪔 Protected Platform & Guest Welcome Portal
- **Zero Data Exposure**: Financial ledgers, resident passes, maintenance tickets, and internal circulars are strictly protected behind authentication.
- **Dynamic Rotating Community Quotes**: Auto-rotates inspiring quotes on community harmony, transparent governance, and mutual support every 6 seconds.
- **1-Click Instant Demo Profiles**: Explore immediately as **`👑 Society Chairman (Admin)`** (*Shri Dhawal Panchal • Flat B-201*) or **`🏡 Resident Member`** (*Anil Sharma • Flat B-201*).

### 2. 🤖 AI Resident Concierge & Helpdesk (`/issues`)
- **Global Floating Action Widget**: Fixed in the bottom-right corner across all authenticated pages for instant 1-click issue reporting.
- **Slide-in Right Drawer (`IssueIntakeBotDrawer`)**: Conversational step-by-step interview collecting Category, Location, Priority, Description, and Preferred Inspection Slot.
- **Smart Duplicate Issue Detection**: Scans active open/in-progress tickets in real time. If a match exists (e.g. *Passenger Lift door sensor*), the bot alerts the resident and provides a 1-click redirect to track the existing ticket.
- **Helpdesk Ticket Hub**: Filter by *My Reported Issues* vs *All Society Issues*, track real-time activity timelines, discussion comments, and technician dispatches.
- **Role-Based Permissions**: Admins manage status and vendor assignments; residents view clear read-only status and technician cards.

### 3. 📢 Multi-Source Live Notice & Society Pulse Ticker
- **Live Radar Banner**: Integrated at the top of the dashboard, auto-rotating across:
  - 📢 **Official Notices** from the Society Notice Board
  - 🛠️ **Active Issues Raised** (with 1-click jump to Helpdesk)
  - 🎉 **Upcoming Events & Utsavs** (with 1-click jump to EventHub)
- **Manual Navigation**: Interactive `⟨` `⟩` arrow controls and index counter (`1/8`, `2/8`) to browse updates at any time.

### 4. 👥 Society Committee Hall of Honor
- **Visual Portrait Cards**: Clean portrait frames with member name, designation, Flat number pill, and elected badge.
- **Full Admin CRUD**: Add, edit, or remove committee records with role, custom photo URL presets, and display order.
- **Resident Applauds**: Interactive 1-click applause counter celebrating voluntary committee leaders.

### 5. 🎟️ EventHub & Multi-Tier Family RSVPs (`/events`)
- **Tiered Headcount Booking**: Separate pricing and headcounts for Adults, Children, and Senior Citizens.
- **Instant Digital QR Pass Generator**: View and download printable QR code entry passes for gate verification.
- **Financial Transparency**: Live tracking of event ticket collections vs vendor expenses (Catering, DJ, Decor) with net balance calculation.

### 6. 💰 Financial Ledger & AI Statement Parser (`/ledger`)
- **Live Reserve Fund Balance**: Real-time society balance with monthly inflows and expense breakdowns.
- **AI Bank Statement Parser**: Paste raw bank/UPI CSV narrations; auto-reconciles UTRs, categorizes utility bills, and approves matching event RSVPs.
- **Audit-Ready Records**: Filter transactions by category (`Maintenance`, `Electricity`, `Security`, `Lift AMC`, `Repairs`).

### 7. 🛡️ Verified Local Vendor Directory (`/vendors`)
- **Categorized Directory**: Responsive flex-wrapped filter chips:
  - 🛡️ **Security / Guards** (24x7 gate security, night patrol)
  - ✨ **Maid / Housekeeping** (Domestic cooks, deep cleaning)
  - ⚡ **Electrician**
  - 🔧 **Plumber**
  - 🩺 **Doctor / Emergency**
  - 🔨 **Carpenter & Painter**
  - 🏢 **Appliance Repair & Lift AMC**
- **1-Tap Contact**: Direct phone calls and pre-filled WhatsApp chat triggers.
- **Resident Reviews**: Star ratings and feedback verified by resident flat numbers.

### 8. 📊 Society Analytics & SLA Resolution Hub (`/analytics`)
- **Interactive Visual Tabs**: *Overview*, *Financials*, *Event Attendance*, *Community Engagement*, and *Helpdesk SLA & Issues*.
- **Resolution SLA Benchmark**: Live turnaround metrics, maintenance category volume distribution, and vendor response benchmarks.

---

## 🛠️ Architecture & Tech Stack

```
                                  ┌────────────────────────┐
                                  │      Browser Client    │
                                  │  (Next.js 14 + React)  │
                                  └───────────┬────────────┘
                                              │ REST API / JSON
                                              ▼
                                  ┌────────────────────────┐
                                  │   FastAPI Backend      │
                                  │ (Python 3.11+ / Async) │
                                  └─────┬────────────┬─────┘
                                        │            │
                   ┌────────────────────┴──┐      ┌──┴───────────────────┐
                   ▼                       ▼      ▼                      ▼
            ┌──────────────┐      ┌─────────────┐┌────────────────────────┐
            │ PostgreSQL 16│      │  pgvector   ││  Ollama / Groq Cloud   │
            │ (SQLAlchemy) │      │ (Embeddings)││ (RAG & Statement AI)  │
            └──────────────┘      └─────────────┘└────────────────────────┘
```

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons | Liquid Glass UI, Server & Client Components |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy Async, Pydantic v2 | High-throughput Async REST API |
| **Database** | PostgreSQL 16 + `pgvector` | Relational tables, transaction ledgers, vector search |
| **AI Engine** | Ollama (`llama3.2`) / Groq Cloud (`llama-3.3-70b`) | RAG search, Statement parsing, Meeting extraction |
| **Bot Service**| `python-telegram-bot` | Telegram community broadcasts & automated Q&A |

---

## 📁 Repository Structure

```
CHS/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST API endpoints (auth, events, ledger, issues, notices, vendors, analytics)
│   │   ├── core/            # Config, database session, security & JWT
│   │   ├── models/          # SQLAlchemy async ORM models (User, Issue, Event, Ledger, Vendor, Notice, Committee)
│   │   ├── schemas/         # Pydantic v2 validation models
│   │   ├── services/        # AI Statement Parser, Meeting Extractor, Telegram Bot, RAG Service
│   │   └── main.py          # FastAPI application entrypoint
│   ├── tests/               # Pytest test suite
│   ├── alembic/             # Database migrations
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages (/, /events, /ledger, /vendors, /analytics, /issues)
│   │   ├── components/      # AppShell, WelcomeGuestLanding, IssueIntakeBotDrawer, HousingHeroVisual, etc.
│   │   └── lib/             # API client & Auth context
│   ├── public/              # Static society backdrops & assets
│   ├── package.json         # Node dependencies
│   └── tailwind.config.js   # Tailwind design tokens & themes
├── docker-compose.yml       # Containerized setup
└── README.md                # Project documentation
```

---

## ⚡ Quickstart & Local Setup

### 1. Prerequisites
- [Node.js 18+](https://nodejs.org/)
- [Python 3.11+](https://www.python.org/)
- [PostgreSQL](https://www.postgresql.org/) (or SQLite local fallback)

---

### 2. Backend Setup

```bash
# 1. Navigate to backend and create virtual environment
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp ../.env.example .env

# 4. Run database migrations / seed
python seed.py

# 5. Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at [http://localhost:8000](http://localhost:8000) (Interactive Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)).

---

### 3. Frontend Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install npm packages
npm install

# 3. Start Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 4. Running Test Suites

```bash
# Run backend pytest suite
cd backend
source .venv/bin/activate
PYTHONPATH=. pytest tests/

# Run frontend build validation
cd frontend
npm run build
```

---

## 👑 Demo Accounts

| Role | Email | Password | Flat Number | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Society Chairman (Admin)** | `admin@residenthub.local` | `admin123` | **Flat A-402 (Owner)** | Full CRUD, Notice Broadcast, Vendor Dispatch, Ledger Sync |
| **Resident Member** | `member@residenthub.local` | `member123` | **Flat B-201 (Renter)** | RSVP Booking, Ticket Logging, Vendor Reviews, Ledger View |

*(1-Click Demo Profile buttons are available directly on the login modal and welcome portal)*

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
