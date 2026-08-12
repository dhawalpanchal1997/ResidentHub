# Technical Implementation Plan: ResidentHub

## Project Overview
ResidentHub is a community management platform for Tower 24, Runwal Gardens, Dombivli (East) with deterministic AI meeting extraction and RAG Q&A capabilities. The system includes a Next.js frontend, FastAPI backend, PostgreSQL database with pgvector, and Telegram bot integration.

**Current State**: Partially implemented MVP with core modules (Auth, Events, Ledger, Vendors, Meetings AI) functional but with gaps in production readiness, testing, and deployment.

---

## Architecture Summary

```
Frontend (Next.js 14 + Tailwind)     Backend (FastAPI + SQLAlchemy)     Infrastructure
├── pages/                            ├── app/
│   ├── overview                      │   ├── api/v1/ (auth, events, 
│   ├── events & RSVP                 │   │     ledger, vendors, meetings)
│   ├── ledger                        │   ├── core/ (config, database, security)
│   ├── vendors                       │   ├── models/ (User, Meeting, Event, 
│   └── meetings AI                   │   │     Ledger, Vendor)
│                                     │   ├── schemas/ (Pydantic validation)
│   lib/api.ts                        │   ├── services/ (ai_factory, 
│                                     │   │     meeting_extractor, rag_service)
└── components/                       └── tests/
```

**Zero-Cost Stack**: Vercel (Frontend), Render/Fly.io (Backend), Supabase/Neon (PostgreSQL + pgvector), Ollama (Local LLM), Groq (Production LLM)

---

## Phase 1: Foundation Hardening (Weeks 1-2)

### 1.1 Database Migration & Schema Alignment
**Priority**: Critical
**Status**: SQLite in use, PostgreSQL schema defined in SRD but not implemented

**Tasks**:
- [ ] Create Alembic migration environment
- [ ] Generate initial migration from current SQLAlchemy models
- [ ] Align models with SRD PostgreSQL schema (add `society_id` FKs, indexes, constraints)
- [ ] Add `pgvector` extension migration for meeting embeddings
- [ ] Create seed data script for development

**Files to Modify**:
- `backend/alembic.ini` (new)
- `backend/app/core/database.py` (add migration support)
- `backend/app/models/*.py` (add missing FKs, indexes per SRD)

### 1.2 Authentication & Security Hardening
**Priority**: Critical
**Status**: Basic JWT auth implemented, demo users created in lifespan

**Tasks**:
- [ ] Replace hardcoded JWT secret with proper secret generation
- [ ] Implement refresh token rotation
- [ ] Add rate limiting on auth endpoints (login/register)
- [ ] Add password strength validation
- [ ] Implement proper CORS configuration (replace `allow_origins=["*"]`)
- [ ] Add request validation middleware

**Files to Modify**:
- `backend/app/core/config.py` (secret generation)
- `backend/app/core/security.py` (refresh tokens, rate limiting)
- `backend/app/api/v1/auth.py` (password validation, rate limits)
- `backend/app/main.py` (CORS config)

### 1.3 Configuration & Environment Management
**Priority**: High
**Status**: Basic `.env` support via pydantic-settings

**Tasks**:
- [ ] Validate all required env vars on startup
- [ ] Add environment-specific configs (dev/staging/prod)
- [ ] Document all environment variables in `.env.example`
- [ ] Add health check endpoint with dependency checks (DB, LLM)

**Files to Modify**:
- `backend/app/core/config.py`
- `backend/.env.example`
- `backend/app/main.py` (add `/health` endpoint)

---

## Phase 2: Feature Completion & API Robustness (Weeks 2-3)

### 2.1 Events Module - Missing Features
**Priority**: High
**Status**: Core CRUD works, missing: capacity limits, waitlist, reminders

**Tasks**:
- [ ] Add `max_capacity` field to Event model and schema
- [ ] Implement waitlist logic when capacity reached
- [ ] Add event reminder notification (email/push - placeholder for Telegram)
- [ ] Add event cancellation flow with refund tracking
- [ ] Implement RSVP deadline enforcement
- [ ] Add pagination to event listing

**Files to Modify**:
- `backend/app/models/event.py`
- `backend/app/schemas/event.py`
- `backend/app/api/v1/events.py`

### 2.2 Ledger Module - Missing Features
**Priority**: High
**Status**: Basic income/expense tracking, missing: categories, reports, budgets

**Tasks**:
- [ ] Define standard expense categories as enum (per SRD)
- [ ] Add monthly/yearly summary endpoints
- [ ] Implement budget vs actual tracking per category
- [ ] Add receipt upload to Supabase Storage / Cloudflare R2
- [ ] Implement recurring transaction templates
- [ ] Add export to Excel/PDF for audit trails

**Files to Modify**:
- `backend/app/models/ledger.py`
- `backend/app/schemas/ledger.py`
- `backend/app/api/v1/ledger.py`
- `backend/app/services/storage.py` (new)

### 2.3 Vendors Module - Missing Features
**Priority**: Medium
**Status**: Directory with reviews works, missing: verification, categories management

**Tasks**:
- [ ] Add vendor verification status (verified/unverified)
- [ ] Implement category management (admin CRUD for categories)
- [ ] Add vendor search with filters (rating, distance, availability)
- [ ] Implement review moderation (admin can hide inappropriate reviews)
- [ ] Add vendor contact via WhatsApp/Call tracking analytics

**Files to Modify**:
- `backend/app/models/vendor.py`
- `backend/app/schemas/vendor.py`
- `backend/app/api/v1/vendors.py`

### 2.4 Meetings AI Module - Critical Gaps
**Priority**: Critical
**Status**: Extraction works with fallback, but pgvector integration missing

**Tasks**:
- [ ] Implement `MeetingChunk` model with pgvector embedding column
- [ ] Add embedding generation pipeline (after meeting publish)
- [ ] Implement hybrid search (vector + keyword) in RAG service
- [ ] Add meeting versioning (amend published minutes)
- [ ] Implement structured summary validation before publish
- [ ] Add meeting search/filter API (by date, type, keyword)

**Files to Modify**:
- `backend/app/models/meeting.py` (add vector column)
- `backend/app/services/rag_service.py` (hybrid search)
- `backend/app/services/meeting_extractor.py` (validation)
- `backend/app/api/v1/meetings.py` (versioning, search)

---

## Phase 3: Frontend Production Readiness (Weeks 3-4)

### 3.1 API Integration & State Management
**Priority**: Critical
**Status**: Frontend uses mock data, no real API integration

**Tasks**:
- [ ] Replace all mock data with API calls to backend
- [ ] Implement React Query / SWR for server state management
- [ ] Add global error handling and toast notifications
- [ ] Implement loading skeletons for all data fetching
- [ ] Add optimistic updates for RSVP, reviews, ledger entries
- [ ] Implement proper TypeScript types from OpenAPI spec

**Files to Modify**:
- `frontend/src/lib/api.ts` (complete rewrite)
- `frontend/src/app/page.tsx` (remove mock data, use hooks)
- `frontend/src/hooks/` (new: useEvents, useLedger, useVendors, useMeetings)
- `frontend/package.json` (add @tanstack/react-query, zod)

### 3.2 Authentication Flow Integration
**Priority**: Critical
**Status**: Mock auth in frontend, real JWT in backend

**Tasks**:
- [ ] Connect login/register modals to backend API
- [ ] Implement JWT token storage (httpOnly cookies preferred)
- [ ] Add automatic token refresh
- [ ] Implement protected routes (admin-only pages)
- [ ] Add role-based UI rendering (admin vs member views)
- [ ] Implement logout with token revocation

**Files to Modify**:
- `frontend/src/lib/auth.ts` (new)
- `frontend/src/app/page.tsx` (auth state from context)
- `frontend/src/components/AuthProvider.tsx` (new)

### 3.3 Meeting AI UI - Admin & Member Views
**Priority**: High
**Status**: Basic transcript processing UI exists in page.tsx

**Tasks**:
- [ ] Create dedicated Meeting AI page/component
- [ ] Admin: Transcript upload with progress indicator
- [ ] Admin: Structured summary review/edit before publish
- [ ] Member: Published meetings list with search
- [ ] Member: Conversational Q&A chat interface
- [ ] Add citation display for AI answers (meeting refs)

**Files to Create**:
- `frontend/src/app/meetings/page.tsx`
- `frontend/src/components/meetings/TranscriptUploader.tsx`
- `frontend/src/components/meetings/SummaryEditor.tsx`
- `frontend/src/components/meetings/QAChat.tsx`

### 3.4 Responsive Design & Accessibility
**Priority**: Medium
**Status**: Tailwind used, but mobile-first audit needed

**Tasks**:
- [ ] Audit all pages for mobile usability (< 640px)
- [ ] Add keyboard navigation support
- [ ] Implement ARIA labels for interactive elements
- [ ] Add focus management for modals
- [ ] Test color contrast ratios (WCAG AA)
- [ ] Add skip-to-content link

---

## Phase 4: Telegram Bot Implementation (Week 4)

### 4.1 Bot Infrastructure
**Priority**: High (per SRD Phase 2)
**Status**: Not implemented

**Tasks**:
- [ ] Create `backend/bot/` module with python-telegram-bot
- [ ] Implement webhook endpoint in FastAPI (`/webhook/telegram`)
- [ ] Set up bot command handlers: `/start`, `/help`, `/contacts`, `/events`
- [ ] Implement announcement broadcast to channel/group
- [ ] Add natural language query handler (reuse RAG service)
- [ ] Implement inline query for quick contact search

**Files to Create**:
- `backend/bot/main.py`
- `backend/bot/handlers.py`
- `backend/bot/keyboards.py`
- `backend/app/api/v1/webhook.py` (new)

### 4.2 Bot-Frontend Feature Parity
**Priority**: Medium

**Tasks**:
- [ ] Sync event announcements between web and bot
- [ ] Ensure meeting Q&A returns consistent answers
- [ ] Add `/ledger` summary command
- [ ] Implement deep links from bot to web app

---

## Phase 5: Testing & Quality Assurance (Week 5)

### 5.1 Backend Testing
**Priority**: High
**Status**: No tests exist

**Tasks**:
- [ ] Set up pytest with async support
- [ ] Unit tests for meeting extractor (deterministic fallback)
- [ ] Unit tests for RAG service (mock LLM)
- [ ] Integration tests for all API endpoints
- [ ] Auth flow tests (login, register, token refresh, RBAC)
- [ ] Database migration tests

**Files to Create**:
- `backend/tests/conftest.py`
- `backend/tests/test_auth.py`
- `backend/tests/test_events.py`
- `backend/tests/test_ledger.py`
- `backend/tests/test_vendors.py`
- `backend/tests/test_meetings.py`
- `backend/tests/test_services.py`

### 5.2 Frontend Testing
**Priority**: Medium

**Tasks**:
- [ ] Set up Vitest + React Testing Library
- [ ] Component tests for critical UI (RSVP flow, Meeting AI)
- [ ] E2E tests with Playwright for key user journeys
- [ ] Visual regression tests for core pages

**Files to Create**:
- `frontend/vitest.config.ts`
- `frontend/src/__tests__/`

### 5.3 AI Quality Evaluation
**Priority**: High (per SRD NFR-2.3)

**Tasks**:
- [ ] Create evaluation dataset of sample meeting transcripts
- [ ] Implement extraction accuracy metrics (precision/recall for resolutions, budgets, actions)
- [ ] Add RAG evaluation (answer relevance, citation accuracy)
- [ ] Set up regression testing for AI outputs

**Files to Create**:
- `backend/eval/meeting_extraction_eval.py`
- `backend/eval/rag_eval.py`
- `backend/eval/test_data/` (sample transcripts with expected outputs)

---

## Phase 6: Deployment & Operations (Week 5-6)

### 6.1 Backend Deployment (Render/Fly.io)
**Priority**: Critical

**Tasks**:
- [ ] Create `Dockerfile` for FastAPI app
- [ ] Configure Render/Fly.io service with:
  - Auto-sleep/wake for free tier
  - PostgreSQL connection pooling
  - Environment variable management
  - Health check endpoint
- [ ] Set up Supabase/Neon PostgreSQL with pgvector
- [ ] Run migrations in production
- [ ] Configure custom domain + SSL

**Files to Create**:
- `backend/Dockerfile`
- `backend/.dockerignore`
- `render.yaml` or `fly.toml`

### 6.2 Frontend Deployment (Vercel/Cloudflare Pages)
**Priority**: Critical

**Tasks**:
- [ ] Configure Next.js for static export or SSR on Vercel
- [ ] Set up environment variables (API URL)
- [ ] Configure build command and output directory
- [ ] Set up preview deployments for PRs
- [ ] Configure custom domain

**Files to Modify**:
- `frontend/next.config.mjs` (output config)
- `frontend/vercel.json` (if needed)

### 6.3 Observability & Monitoring
**Priority**: Medium

**Tasks**:
- [ ] Add structured logging (JSON format)
- [ ] Implement request/response logging middleware
- [ ] Add error tracking (Sentry free tier)
- [ ] Set up uptime monitoring
- [ ] Add database query performance logging
- [ ] Create admin dashboard for system health

**Files to Modify**:
- `backend/app/main.py` (logging middleware)
- `backend/app/core/logging.py` (new)

---

## Phase 7: Advanced Features (Post-Launch)

### 7.1 Payment Gateway Integration
- Direct UPI integration for automated reconciliation
- Webhook handling for payment confirmations

### 7.2 Audio Transcription
- Whisper.cpp integration for meeting audio uploads
- Background job processing with Celery/Redis

### 7.3 Issue/Ticket Management
- Resident complaint tracking
- SLA management for committee responses

### 7.4 Multi-Tenancy
- Society onboarding flow
- Data isolation per society_id
- Billing/subscription management

---

## Risk Assessment & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| pgvector not available on free Supabase | High | Medium | Verify pgvector support; fallback to Neon or local pgvector |
| Groq API rate limits in production | High | Low | Implement caching, fallback to Ollama, request queuing |
| Telegram webhook reliability on free hosting | Medium | High | Use polling mode as fallback; health checks |
| AI hallucination in meeting extraction | High | Medium | Strict Pydantic validation + deterministic fallback (already implemented) |
| Mobile Safari PWA limitations | Medium | Low | Test thoroughly; provide native app alternative later |
| Database migration failures in production | High | Low | Test migrations on staging; backup before deploy |

---

## Dependencies & Prerequisites

### External Services Required
1. **Supabase/Neon Account** - PostgreSQL + pgvector (free tier)
2. **Vercel/Cloudflare Pages Account** - Frontend hosting
3. **Render/Fly.io Account** - Backend hosting
4. **Groq API Key** - Production LLM (free tier)
5. **Telegram Bot Token** - From @BotFather
6. **Ollama** - Local development (llama3.2 model)

### Local Development Prerequisites
- Node.js 18+, Python 3.11+
- Docker (for local PostgreSQL with pgvector)
- Ollama running with `llama3.2` model pulled

---

## Success Criteria (MVP Launch)

- [ ] Residents can register, login, view events, RSVP with payment proof
- [ ] Admins can create events, verify RSVPs, export attendee lists
- [ ] Financial ledger visible to all members with monthly summaries
- [ ] Vendor directory searchable with ratings/reviews
- [ ] Meeting transcripts processed → structured summaries → published
- [ ] Members can ask natural language questions about past meetings
- [ ] Telegram bot broadcasts announcements and answers queries
- [ ] All deployed on free tiers with $0/month operational cost
- [ ] Test coverage > 70% for critical paths
- [ ] Page load < 1.2s FCP on mobile (NFR-1.1)
- [ ] AI Q&A response < 3s end-to-end (NFR-1.2)

---

## File Structure Summary (Target)

```
CHS/
├── backend/
│   ├── alembic/                 # Database migrations
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── webhook.py       # Telegram webhook
│   │   │   └── ...
│   │   ├── bot/                 # Telegram bot module
│   │   ├── core/
│   │   │   ├── logging.py
│   │   │   └── ...
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── storage.py       # File upload abstraction
│   │   │   └── ...
│   │   └── main.py
│   ├── tests/
│   ├── eval/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── meetings/        # Meeting AI pages
│   │   │   └── ...
│   │   ├── components/
│   │   ├── hooks/               # React Query hooks
│   │   ├── lib/
│   │   │   ├── api.ts           # Typed API client
│   │   │   └── auth.ts
│   │   └── providers/
│   ├── public/
│   ├── package.json
│   └── next.config.mjs
├── .github/workflows/           # CI/CD
├── docker-compose.yml           # Local dev stack
└── README.md
```

---

## Next Steps

1. **Immediate**: Set up Alembic migrations and align models with SRD schema
2. **Week 1**: Complete backend API hardening (auth, validation, error handling)
3. **Week 2**: Implement pgvector integration for meeting embeddings + RAG hybrid search
4. **Week 3**: Frontend API integration with React Query + auth flow
5. **Week 4**: Telegram bot + meeting AI UI polish
6. **Week 5**: Testing, deployment, launch

---

*Plan generated from codebase analysis on 2026-08-12. This is a living document - update as implementation progresses.*