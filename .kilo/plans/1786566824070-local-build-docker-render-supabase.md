# ResidentHub: Local Build, Dockerization & Render Deployment Plan (Supabase Confirmed)

## Project Overview
- **Frontend**: Next.js 14 (App Router, TypeScript, Tailwind CSS) → Deploy to Render Static Site
- **Backend**: FastAPI (Python 3.11+) with SQLite (local) / PostgreSQL (prod) → Deploy to Render Web Service
- **AI Engine**: Dual-tier (Ollama local, Groq production)
- **Database**: SQLite for local dev, **Supabase PostgreSQL + pgvector** for production (confirmed)

---

## Phase 1: Local Development Setup

### 1.1 Prerequisites
- [ ] Node.js 18+
- [ ] Python 3.11+
- [ ] Ollama installed and running (`ollama run llama3.2`)
- [ ] Git

### 1.2 Backend Local Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example ../.env  # Edit .env for local settings
```

### 1.3 Frontend Local Setup
```bash
cd frontend
npm install
# Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 1.4 Run Locally
```bash
# Terminal 1 - Backend
cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend && npm run dev
```

---

## Phase 2: Dockerization (Optional - For Local Testing)

### 2.1 Backend Dockerfile
Create `backend/Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2.2 Frontend Dockerfile
Create `frontend/Dockerfile`:
```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

### 2.3 Docker Compose (Local Development)
Create `docker-compose.yml` at root:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite+aiosqlite:///./residenthub.db
      - LLM_PROVIDER=ollama
      - OLLAMA_BASE_URL=http://host.docker.internal:11434
      - OLLAMA_MODEL=llama3.2
      - ENVIRONMENT=development
      - JWT_SECRET=your-local-secret-key
    volumes:
      - ./backend:/app
    depends_on:
      - ollama

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - backend

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    # Note: Run 'ollama run llama3.2' manually or add to entrypoint

volumes:
  ollama_data:
```

---

## Phase 3: Render Deployment with Supabase

### 3.1 Prepare Next.js for Render Static Site
Update `frontend/next.config.mjs`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',  // Required for Render Static Site
  images: {
    unoptimized: true,  // Required for static export
  },
};

export default nextConfig;
```

**Note**: `output: 'export'` requires:
- No `getServerSideProps` or `getInitialProps` (use client-side fetching)
- No dynamic routes without `generateStaticParams`
- API routes won't work (use backend API instead)

### 3.2 Supabase Setup (Do This First)

#### 3.2.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Organization: Choose or create
3. Project name: `residenthub` (or your preference)
4. Database password: **Save this securely** (needed for connection string)
5. Region: Choose closest to your users (e.g., `ap-south-1` for Mumbai)
6. Wait for project to be ready (~2 minutes)

#### 3.2.2 Enable pgvector Extension
1. In Supabase Dashboard → SQL Editor
2. Run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Verify: `SELECT * FROM pg_extension WHERE extname = 'vector';`

#### 3.2.3 Get Connection String
1. Settings → Database → Connection string → URI
2. Format: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
3. **Replace `[YOUR-PASSWORD]` with your database password**
4. For asyncpg: `postgresql+asyncpg://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`

#### 3.2.4 Configure Supabase Storage (For Receipts/Invoices)
1. Storage → New Bucket → `residenthub-receipts`
2. Public bucket: No (private, use signed URLs)
3. Set RLS policies for authenticated users

#### 3.2.5 Get Supabase Keys
- Settings → API → `anon` `public` key → `SUPABASE_ANON_KEY`
- Settings → API → `service_role` `secret` key → `SUPABASE_SERVICE_KEY` (backend only)

### 3.3 Render Configuration Files

#### 3.3.1 Create `render.yaml` at root (Infrastructure as Code)
```yaml
services:
  # Backend Web Service
  - type: web
    name: residenthub-backend
    runtime: python
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: ENVIRONMENT
        value: production
      - key: LLM_PROVIDER
        value: groq
      - key: GROQ_API_KEY
        sync: false
      - key: GROQ_MODEL
        value: llama-3.3-70b-versatile
      - key: JWT_SECRET
        generateValue: true
      - key: DATABASE_URL
        sync: false  # Set manually in Render Dashboard from Supabase
      - key: SUPABASE_URL
        sync: false  # e.g., https://[PROJECT-REF].supabase.co
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false
      - key: STORAGE_BUCKET
        value: residenthub-receipts
      - key: TELEGRAM_BOT_TOKEN
        sync: false
      - key: TELEGRAM_WEBHOOK_SECRET
        sync: false

  # Frontend Static Site
  - type: web
    name: residenthub-frontend
    runtime: static
    rootDir: frontend
    buildCommand: npm ci && npm run build
    staticPublishPath: ./out
    envVars:
      - key: NEXT_PUBLIC_API_URL
        value: https://residenthub-backend.onrender.com/api/v1

# NO databases section - using Supabase instead
```

### 3.4 Deploy to Render

#### Method 1: render.yaml (Blueprint) — Recommended
```bash
# 1. Push to GitHub
git add .
git commit -m "Add render.yaml for Render + Supabase deployment"
git push origin main

# 2. In Render Dashboard:
#    - New → Blueprint
#    - Connect GitHub repo
#    - Render auto-detects render.yaml
#    - Click "Apply"

# 3. After services created, go to backend service → Environment
#    Add these secret values (not in render.yaml):
#    - DATABASE_URL = postgresql+asyncpg://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
#    - GROQ_API_KEY = your-groq-api-key
#    - SUPABASE_URL = https://[PROJECT-REF].supabase.co
#    - SUPABASE_ANON_KEY = your-anon-key
#    - SUPABASE_SERVICE_KEY = your-service-role-key
#    - TELEGRAM_BOT_TOKEN = (optional)
#    - TELEGRAM_WEBHOOK_SECRET = (optional)
```

#### Method 2: Manual Setup
**Backend Web Service:**
1. New → Web Service → Connect GitHub repo
2. Root Directory: `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add all env vars from section 3.3.1

**Frontend Static Site:**
1. New → Static Site → Connect GitHub repo
2. Root Directory: `frontend`
3. Build Command: `npm ci && npm run build`
4. Publish Directory: `out`
5. Add `NEXT_PUBLIC_API_URL` = `https://residenthub-backend.onrender.com/api/v1`

---

## Phase 4: Production Checklist

### 4.1 Security
- [ ] `JWT_SECRET` auto-generated via `render.yaml`
- [ ] `ENVIRONMENT=production`
- [ ] Configure CORS for specific Render frontend domain (not `*`)
- [ ] Enable HTTPS (automatic on Render)

### 4.2 AI Configuration
- [ ] `LLM_PROVIDER=groq`
- [ ] `GROQ_API_KEY` from Groq Cloud console (as secret in Render)
- [ ] Test AI endpoints work with Groq

### 4.3 Database (Supabase)
- [ ] Supabase project created
- [ ] `pgvector` extension enabled (`CREATE EXTENSION IF NOT EXISTS vector;`)
- [ ] `DATABASE_URL` set in Render backend (asyncpg format)
- [ ] Test `init_db()` creates tables correctly
- [ ] Verify meeting embeddings table works with pgvector
- [ ] Run any pending migrations

### 4.4 File Storage (Supabase Storage)
- [ ] Bucket `residenthub-receipts` created
- [ ] RLS policies configured for authenticated access
- [ ] `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` set in Render
- [ ] Test file upload/download

### 4.5 Telegram Bot (Optional)
- [ ] `TELEGRAM_BOT_TOKEN` from @BotFather
- [ ] Webhook URL: `https://residenthub-backend.onrender.com/api/v1/telegram/webhook`
- [ ] Test bot commands

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                      Render Platform                        │
├─────────────────────────┬───────────────────────────────────┤
│  Static Site (Frontend) │  Web Service (Backend API)        │
│  residenthub-frontend   │  residenthub-backend              │
│  - Next.js export       │  - FastAPI + Uvicorn              │
│  - Served via CDN       │  - Python 3.11                    │
└───────────┬─────────────┴───────────────┬───────────────────┘
            │                             │
            ▼                             ▼
    ┌───────────────┐             ┌───────────────┐
    │   Supabase    │             │   Groq Cloud  │
    │  (PostgreSQL  │             │   (LLM API)   │
    │  + pgvector)  │             │               │
    │  + Storage    │             │               │
    └───────────────┘             └───────────────┘
```

---

## Key Files to Create/Modify

| File | Purpose |
|------|---------|
| `render.yaml` | Render Blueprint (IaC) - no databases section |
| `backend/Dockerfile` | Backend container (local testing) |
| `frontend/Dockerfile` | Frontend container (local testing) |
| `docker-compose.yml` | Local dev with Ollama |
| `frontend/next.config.mjs` | Static export config for Render |
| `backend/.dockerignore` | Exclude venv, __pycache__, .env |
| `frontend/.dockerignore` | Exclude node_modules, .next, .env.local |

---

## Commands Reference

```bash
# Local development (native)
cd backend && uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev

# Local development with Docker
docker-compose up --build

# Deploy via Render Blueprint (after pushing to GitHub)
# Render Dashboard → New → Blueprint → Connect Repo → Apply

# Then add secrets in Render Dashboard:
# DATABASE_URL, GROQ_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
```

---

## Supabase-Specific Connection Details

### Connection String Format
```
# For SQLAlchemy asyncpg (production)
postgresql+asyncpg://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# For direct psql (migrations)
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Required Supabase SQL (Run in SQL Editor)
```sql
-- Enable pgvector for meeting embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- The backend's init_db() will create tables automatically
-- But you can verify with:
-- \dt  (in psql)
-- Or: SELECT * FROM pg_extension WHERE extname = 'vector';
```

### Supabase Storage RLS Policy (For Receipts)
```sql
-- Allow authenticated users to upload/view their own files
CREATE POLICY "Users can upload own receipts" ON storage.objects
FOR INSERT WITH CHECK (auth.uid() = owner);

CREATE POLICY "Users can view own receipts" ON storage.objects
FOR SELECT USING (auth.uid() = owner);
```

---

## Important Notes

1. **Next.js Static Export**: Requires `output: 'export'` and `images: { unoptimized: true }`
   - All API calls must go to backend (no Next.js API routes)
   - Dynamic routes need `generateStaticParams` or client-side rendering

2. **Render Free Tier Limits**:
   - Web Services sleep after 15 min inactivity (cold start ~30s)
   - Static Sites: Unlimited bandwidth

3. **Supabase Free Tier Limits**:
   - Database: 500 MB
   - Storage: 1 GB
   - Bandwidth: 2 GB/month
   - pgvector included ✅

4. **CORS Configuration**: Update backend CORS to allow frontend domain:
   ```python
   # In backend/app/main.py
   allow_origins=["https://residenthub-frontend.onrender.com"]
   ```

5. **Environment Variables**: Set secrets in Render Dashboard (not in render.yaml):
   - `DATABASE_URL` (Supabase asyncpg format)
   - `GROQ_API_KEY`
   - `SUPABASE_URL` (e.g., `https://xyz.supabase.co`)
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `TELEGRAM_BOT_TOKEN` (optional)