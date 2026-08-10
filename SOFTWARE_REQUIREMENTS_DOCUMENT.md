# Software Requirements Document (SRD)
**Project Name:** ResidentHub (Society Community Management & AI Copilot)  
**Version:** 1.0  
**Document Status:** Approved Baseline Draft  
**Target Audience:** Managing Committee, Engineering Team, Product Team  

---

## 1. Executive Summary & Core Concept

### 1.1 Problem Statement
Residential housing societies face operational bottlenecks due to fragmented communication and manual record-keeping:
* **Manual Event Operations:** Managing committee members post event flyers and UPI QR codes on WhatsApp, collect payment screenshots across disparate Google Forms, and manually cross-reference bank statements to compile attendee lists.
* **Lack of Financial Transparency:** Residents lack real-time visibility into society maintenance collections, pending dues, reserve funds, and vendor invoices, leading to trust deficits.
* **Forgotten Meeting Outcomes:** Minutes of Meetings (MoMs) from offline committee meetings are recorded in messy text/audio notes and lost in chat history, causing repeated debates on settled topics.
* **Unvetted Service Providers:** Emergency home service contacts (electricians, plumbers, doctors) are shared ad-hoc without community trust ratings or history.

### 1.2 Solution Overview
**ResidentHub** is an all-in-one, AI-augmented community management platform consisting of a responsive Web Application (Mobile-first) and an interactive Telegram Bot. It centralizes:
1. **Event Hub & RSVP Verification:** Automated RSVP with payment screenshot/UTR submission, a live admin verification queue, and 1-click CSV/Excel attendee list exports.
2. **Transparent Financial Ledger:** View-only expense tracking, invoice attachments, and monthly fund balance reports for residents.
3. **Crowdsourced Vendor Directory:** Searchable local worker directory with member reviews and 1-tap contact actions.
4. **Deterministic Meeting AI (LangGraph + pgvector):** Converts raw meeting transcripts into structured resolutions, budget approvals, and action items, while powering a natural language Q&A assistant for society knowledge.

```
+-----------------------------------------------------------------------------------+
|                                  ResidentHub                                      |
+-----------------------------------------------------------------------------------+
|  [ Web App (Next.js) ]             |             [ Telegram Bot (python-telegram) ] |
|  - Member / Admin Dashboards       |             - Announcements Broadcast          |
|  - Event RSVP & Receipt Upload     |             - Natural Language Q&A             |
|  - Ledger & Invoices View          |             - Instant Contact Lookups          |
|  - Vendor Directory & Reviews      |                                                |
+------------------------------------+----------------------------------------------+
                                      | (REST / Webhooks)
                                      v
+-----------------------------------------------------------------------------------+
|                        FastAPI Backend Application Layer                          |
+-----------------------------------------------------------------------------------+
|  [ Auth & RBAC ]    [ Event Engine ]    [ Ledger Engine ]    [ Vendor Directory ] |
|  [ LangGraph Deterministic Extractor ]  [ RAG Engine (Hybrid Vector + Keyword) ]   |
+-----------------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------------+
|                               PostgreSQL Database                                 |
|          - Relational Entities (Users, Events, RSVP, Ledger, Vendors)             |
|          - pgvector (Meeting Chunks & Semantic Knowledge Embeddings)              |
|          - Object Storage (Cloudflare R2 / S3 for Invoices & Receipts)            |
+-----------------------------------------------------------------------------------+
```

---

## 2. User Personas & Key User Journeys

### 2.1 User Personas
| Persona | Role | Key Motivations & Pain Points |
| :--- | :--- | :--- |
| **Rajesh (Managing Committee / Admin)** | Society Secretary | Wants to stop wasting hours matching bank statements to Google Forms; needs to document meeting decisions clearly and broadcast updates easily. |
| **Priya (Resident Member)** | Flat Owner / Tenant | Wants instant access to trusted local plumbers, complete visibility into where monthly maintenance goes, and easy event registration. |
| **Vikram (General Member)** | Working Professional | Rarely attends offline meetings; wants to ask a bot *"What was decided about the gym renovation?"* and get an accurate answer in seconds. |

---

### 2.2 Key User Journeys

#### Journey A: Event Creation to Reconciliation
1. **Admin** creates an event (*"Diwali Gala 2026"*), sets cost per head (₹500), specifies max capacity, and uploads the society UPI QR code.
2. **Member** views event details on the web app, clicks **RSVP**, specifies 2 attendees (₹1000 total), scans QR code, and uploads the payment screenshot / UTR number.
3. **Admin Dashboard** displays a live verification queue:
   * Admin reviews pending RSVPs, verifies transaction references, and clicks **Approve**.
   * System updates the live attendee counter and generates a 1-click **Excel / CSV Attendee List**.

#### Journey B: Offline Meeting to Deterministic AI Insights & RAG Q&A
1. **Admin** conducts the monthly society meeting and pastes the raw meeting notes/transcript into the Admin AI Portal.
2. **LangGraph Pipeline** processes the transcript deterministically using strict Pydantic schemas:
   * Extracts **Resolutions Passed**, **Budget Approved (with amounts)**, **Action Items (with assignees & deadlines)**, and **General Notes**.
3. Admin reviews the extracted structured data and clicks **Publish**.
4. **Member** accesses the Telegram Bot or Web App and asks: *"Did we approve the elevator AMC contract?"*
5. RAG Engine performs hybrid retrieval over `pgvector` chunks, returning a sourced, hallucination-free response with meeting date reference.

---

## 3. Functional Requirements (Core Features)

### Module 1: Authentication & Access Control (MVP Scope)
* **FR-1.1:** Users can sign up and log in using Email and Password.
* **FR-1.2:** Basic Profile fields: Full Name, Flat/Unit Number, Phone Number, Role (`admin` or `member`).
* **FR-1.3:** Public/Shared view permissions: Any authenticated member can view events, ledger summaries, directory listings, and meeting summaries.
* **FR-1.4:** Admin-only permissions: Creation/editing of events, verification of RSVPs, entry of ledger line-items, and ingestion of meeting transcripts.

### Module 2: Event Hub & RSVP Management
* **FR-2.1 Event Publishing:** Admins can create events with Title, Description, Date & Time, Venue, Fee per Person, and UPI QR Code / Payment details.
* **FR-2.2 RSVP Submission:** Members can register themselves + guests, view calculated total amount, and submit payment proof (image upload + UTR transaction ID).
* **FR-2.3 Admin Reconciliation Board:** Live dashboard table with status filters (`Pending`, `Approved`, `Rejected`), member name, flat number, amount paid, and proof preview.
* **FR-2.4 Export:** 1-click export of verified attendees to CSV/Excel format.

### Module 3: Transparent Financial Ledger
* **FR-3.1 Ledger Entry:** Admins can log transactions with Category (*Maintenance, Gardening, Lift Maintenance, Security, Festive Fund, Repairs*), Type (*Income* vs *Expense*), Amount, Transaction Date, and attached Bill/Receipt image.
* **FR-3.2 Resident Transparency Dashboard:**
  * Summary cards showing: Total Funds Inflow, Total Expenses (current month/year), and Current Balance.
  * Searchable & filterable monthly expense breakdown.
  * In-browser modal to view uploaded vendor invoices and receipts.

### Module 4: Verified Vendor & Worker Directory
* **FR-4.1 Categorized Listings:** Directory grouped by service type (*Electrician, Plumber, Carpenter, Doctor/Emergency, Painter, Appliance Repair, Materials Vendor*).
* **FR-4.2 Contact Card:** Name, business name, phone number (with direct `tel:` and WhatsApp launch links), address/availability hours.
* **FR-4.3 Crowdsourced Ratings & Reviews:** Authenticated members can leave a 1–5 star rating and short text feedback. Directory calculates rolling average score.

### Module 5: Deterministic Meeting AI Engine
* **FR-5.1 Transcript Ingestion:** Text/transcript input interface with meeting metadata (Date, Meeting Type: *AGM, EGM, Committee Monthly*).
* **FR-5.2 Deterministic Extraction:** LangGraph execution graph enforcing zero-hallucination JSON schema extraction:
  * **Resolutions:** Explicit decisions voted on and approved.
  * **Financial Approvals:** Vendor names, approved budget limits, allocation fund.
  * **Action Items:** Task description, assigned member/committee, target completion date.
* **FR-5.3 Human-in-the-Loop Review:** Admin can edit/correct extracted points prior to permanent commit to the database.
* **FR-5.4 Vector Search Indexing:** Processed meeting points are chunked, embedded, and stored in `pgvector` for conversational retrieval.

### Module 6: Telegram Bot Assistant
* **FR-6.1 Announcements:** Automatic broadcast of new events and approved meeting summaries to the Society Telegram Channel/Group.
* **FR-6.2 Natural Language Q&A:** Direct message bot answering resident questions regarding past meeting decisions, rules, and financials.
* **FR-6.3 Instant Contact Retrieval:** Slash command `/contacts <service>` (e.g. `/contacts plumber`) returning top-rated contacts immediately in chat.

---

## 4. Non-Functional Requirements

### 4.1 Performance & Latency
* **NFR-1.1 Web Page Load:** Target First Contentful Paint (FCP) < 1.2s on mobile networks.
* **NFR-1.2 AI Q&A Latency:** End-to-end response time for Telegram/Web conversational queries < 3.0s using streaming.
* **NFR-1.3 File Uploads:** Asynchronous upload of receipts/images (< 5MB per file) directly to cloud storage via presigned URLs.

### 4.2 Security & Data Integrity
* **NFR-2.1 Password Hashing:** Argon2 or bcrypt for credential storage.
* **NFR-2.2 API Authorization:** JWT (JSON Web Tokens) with standard expiration and role validation middleware on all mutating routes.
* **NFR-2.3 AI Output Guardrails:** Pydantic validation on all LLM outputs; fallback to raw text parsing if validation fails, preventing corrupted state writes.

### 4.3 Scalability & Extensibility
* **NFR-3.1 Data Model Readiness:** Every core table includes a `society_id` foreign key from Day 1 to enable seamless multi-tenant migration in Phase 2 without database restructuring.

### 4.4 Zero Maintenance & Infrastructure Cost Guarantee ($0/Month)
* **NFR-4.1 $0 Operational Budget:** The system must run entirely on perpetual free tiers of production-grade modern developer platforms with zero recurring monthly bills for the society.
* **NFR-4.2 Zero Egress & Compute Charges:** Static and media assets are optimized (<5MB) and served via free bandwidth allowances.
* **NFR-4.3 Dual-Tier Pluggable AI Engine:**
  * **Local Dev & Testing:** 100% offline & free via **Ollama** (e.g., `llama3.2`, `llama3.1`, `qwen2.5`) with zero API limits.
  * **Production Deployment:** Free **Groq Cloud API** (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`) delivering sub-second inference at $0.00 cost.
  * **LLM Factory Pattern:** Seamless toggle via `LLM_PROVIDER=ollama` vs `LLM_PROVIDER=groq` in `.env` without modifying business logic.

---

## 5. Recommended Tech Stack & Zero-Cost Architecture ($0/Month)

### 5.1 Free-Tier Deployment & Infrastructure Matrix
| Layer | Tech Choice | Free-Tier Provider & Quota | Monthly Cost |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | Next.js 14+ (App Router), Tailwind CSS | **Vercel / Cloudflare Pages** (Unlimited static bandwidth, 100GB edge) | **$0.00** |
| **Backend REST API** | Python 3.11+, FastAPI, Uvicorn | **Render / Fly.io / Koyeb** (Free web service tier with auto-sleep/wake) | **$0.00** |
| **Database & Vector DB** | PostgreSQL 16 with `pgvector` | **Supabase / Neon** (500MB DB, 50k+ rows, vector indexing included) | **$0.00** |
| **Blob / Receipt Storage**| Supabase Storage / Cloudflare R2 | **Supabase (1GB free) / R2 (10GB free)**, zero egress fees | **$0.00** |
| **AI / LLM Engine (Dev)** | Ollama (`llama3.2` / `llama3.1`) | **Local Workstation** (100% offline, zero latency/token costs) | **$0.00** |
| **AI / LLM Engine (Prod)**| Groq Cloud (`llama-3.3-70b`) | **Groq Free Tier** (14,400 req/day, ultra-fast inference) | **$0.00** |
| **Telegram Bot** | `python-telegram-bot` | **Telegram Bot API** (100% free, unlimited messages) | **$0.00** |
| **Domain & SSL** | Vercel `.vercel.app` + Let's Encrypt | Included free with automatic SSL renewal | **$0.00** |
| **TOTAL ESTIMATED MONTHLY RUNTIME COST** | | | **$0.00 / mo** |

```
+-----------------------------------------------------------------------------------+
|                         ZERO-COST CLOUD ARCHITECTURE                              |
+-----------------------------------------------------------------------------------+
| [ Vercel / Cloudflare Pages ] -> Next.js 14 Web App ($0)                          |
|                                       |                                           |
|                                       v (REST / JSON)                             |
| [ Render / Fly.io Free Tier ] -> FastAPI Backend ($0)                             |
|       |                               |                                           |
|       v                               v                                           |
| [ Supabase / Neon ($0) ]      [ AI Engine Factory ]                               |
| - PostgreSQL 16               ├── Dev/Test: Local Ollama (llama3.2/3.1)           |
| - pgvector Semantic Search    └── Prod: Free Groq Cloud (llama-3.3-70b)           |
| - 1GB Receipt File Storage                                                        |
+-----------------------------------------------------------------------------------+
```

### 5.1 Relational Database Schema (PostgreSQL DDL)

```sql
-- Core Tables
CREATE TABLE societies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    upi_qr_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID REFERENCES societies(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    flat_number VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(20) DEFAULT 'member', -- 'admin' | 'member'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events & RSVP
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID REFERENCES societies(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    venue VARCHAR(255),
    fee_per_person NUMERIC(10, 2) DEFAULT 0.00,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE event_rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    attendees_count INT DEFAULT 1,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_proof_url TEXT,
    utr_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Ledger
CREATE TABLE ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID REFERENCES societies(id),
    transaction_type VARCHAR(20) NOT NULL, -- 'income' | 'expense'
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT,
    receipt_url TEXT,
    logged_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendors & Workers Directory
CREATE TABLE service_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID REFERENCES societies(id),
    category VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE provider_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meeting Minutes & Vector Embeddings
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID REFERENCES societies(id),
    meeting_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    raw_transcript TEXT,
    structured_summary JSONB, -- Pydantic-validated resolutions & budget items
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE meeting_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    chunk_content TEXT NOT NULL,
    embedding vector(1536), -- pgvector format
    metadata JSONB
);
```

---

## 6. Implementation Roadmap

```
+--------------------------------------------------------------------------------+
| PHASE 1: MVP FOUNDATION (Weeks 1-3)                                            |
| * FastAPI + PostgreSQL setup with database migrations                          |
| * Auth system (Email/Password + basic role flag)                               |
| * Event Management (Create, RSVP with Receipt/UTR, Admin Verification, CSV)   |
| * Financial Ledger (Income/Expense tracker, Receipt preview, Balance summary) |
| * Vendor Directory (List, Add, Rate 1-5 stars)                                 |
+--------------------------------------------------------------------------------+
                                       |
                                       v
+--------------------------------------------------------------------------------+
| PHASE 2: AI & TELEGRAM INTEGRATION (Weeks 4-5)                                 |
| * LangGraph deterministic meeting extraction pipeline                          |
| * RAG system with pgvector for meeting minutes & rules Q&A                     |
| * Telegram Bot (Announcements broadcast, /contacts search, Natural Q&A)        |
+--------------------------------------------------------------------------------+
                                       |
                                       v
+--------------------------------------------------------------------------------+
| PHASE 3: ADVANCED CAPABILITIES & MULTI-TENANCY (Post-Launch)                   |
| * Direct Payment Gateway integration (Automated UPI instant reconciliation)    |
| * Audio upload & Whisper speech-to-text meeting transcription                  |
| * Resident Issue & Ticket Management workflow                                  |
| * Multi-Society SaaS onboarding & billing                                      |
+--------------------------------------------------------------------------------+
```
