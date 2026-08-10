# 🏢 ResidentHub — Runwal Gardens (Tower 24)

**ResidentHub** is the community management platform and deterministic AI copilot designed specifically for **Tower 24, Runwal Gardens, Dombivli (East)**. It streamlines event management & UPI payment verification, provides 100% financial transparency with a view-only society ledger, hosts vetted Dombivli local worker contacts, and features a deterministic meeting minutes AI extraction engine with conversational RAG Q&A (via Web & Telegram).

Designed with a **$0/Month Zero-Cost Infrastructure Guarantee** using free tiers of modern developer platforms and open-source models.

---

## 🚀 Key Features

* **📅 Event Hub & Verification Dashboard:** 
  * Admin publishes events with a per-head fee & society UPI QR code.
  * Residents RSVP and upload payment proof/UTR numbers.
  * Live Admin verification queue + 1-click Excel/CSV attendee list export.
* **💰 Transparent Financial Ledger:**
  * View-only income & expense breakdowns for residents.
  * Admin receipt/invoice logging with image attachments.
* **🛠️ Vetted Service Provider Directory:**
  * Searchable electrician, plumber, doctor, and vendor cards with 1-tap call/WhatsApp links.
  * Crowdsourced 1–5 star community ratings.
* **🤖 Deterministic Meeting AI (LangGraph):**
  * Parses raw meeting transcripts to extract structured resolutions, budget approvals, and action items with zero hallucination.
  * Indexes minutes in `pgvector` for conversational resident Q&A.
* **📱 Telegram Bot:**
  * Broadcasts society notices & events.
  * Handles resident natural language queries on past decisions and contact lookups.

---

## 🛠️ Tech Stack & Dual-Tier AI

| Component | Technology | Local Dev ($0) | Production ($0) |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js 14+ (App Router, Tailwind CSS) | `localhost:3000` | Vercel Free Tier |
| **Backend** | Python 3.11+ / FastAPI | `localhost:8000` | Render / Fly.io Free |
| **Database** | PostgreSQL 16 + `pgvector` | Local Docker / Supabase | Supabase Free Tier |
| **AI Engine** | LangChain / LangGraph | **Ollama (`llama3.2`)** | **Groq Cloud (`llama-3.3-70b`)** |
| **Storage** | Object Storage (Receipts/Bills) | Local / Supabase Storage | Supabase Storage (1GB free) |
| **Bot** | `python-telegram-bot` | Telegram Bot API | Telegram Bot Webhook |

---

## ⚡ Quickstart (Local Development with Ollama)

### 1. Prerequisites
* [Node.js 18+](https://nodejs.org/)
* [Python 3.11+](https://www.python.org/)
* [Ollama](https://ollama.com/) running locally:
  ```bash
  ollama run llama3.2
  ```

### 2. Environment Setup
```bash
cp .env.example .env
```

### 3. Documentation
See the full architectural and product specifications in:
* **[SOFTWARE_REQUIREMENTS_DOCUMENT.md](SOFTWARE_REQUIREMENTS_DOCUMENT.md)**
