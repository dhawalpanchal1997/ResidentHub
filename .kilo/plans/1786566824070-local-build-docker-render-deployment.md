# ResidentHub: Local Build, Dockerization & Render Deployment Plan

## Project Overview
- **Frontend**: Next.js 14 (App Router, TypeScript, Tailwind CSS) → Deploy to Render Static Site
- **Backend**: FastAPI (Python 3.11+) with SQLite (local) / PostgreSQL (prod) → Deploy to Render Web Service
- **AI Engine**: Dual-tier (Ollama local, Groq production)
- **Database**: SQLite for local dev, PostgreSQL + pgvector for production (Render PostgreSQL or Supabase/Neon)

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

### 2.4 Production Docker Compose (For Testing)
Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/residenthub
      - LLM_PROVIDER=groq
      - GROQ_API_KEY=${GROQ_API_KEY}
      - GROQ_MODEL=llama-3.3-70b-versatile
      - ENVIRONMENT=production
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db

  db:
    image: pgvector/pgvector:pg16
    environment:
      - POSTGRES_DB=residenthub
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

---

## Phase 3: Render Deployment (Both Frontend & Backend)

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

### 3.2 Render Configuration Files

#### 3.2.1 Create `render.yaml` at root (Infrastructure as Code)
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
        fromDatabase:
          name: residenthub-db
          property: connectionString
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_ANON_KEY
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

databases:
  - name: residenthub-db
    databaseName: residenthub
    user: residenthub
    plan: free
    # Note: Render's free PostgreSQL doesn't include pgvector
    # For pgvector, use Supabase/Neon instead (see 3.3)
```

### 3.3 Database Options for Production

#### Option A: Render PostgreSQL (Free, No pgvector)
- Included in `render.yaml` above
- **Limitation**: No pgvector extension for meeting embeddings
- Use for: Basic CRUD operations only

#### Option B: Supabase (Free, Includes pgvector) — Recommended
1. Create project at [supabase.com](https://supabase.com)
2. Enable `pgvector` extension in SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Get connection string from Settings → Database
4. In Render backend service, set `DATABASE_URL` to Supabase connection string
5. Remove `databases` section from `render.yaml`

#### Option C: Neon (Free, Includes pgvector)
1. Create project at [neon.tech](https://neon.tech)
2. Get connection string
3. Set as `DATABASE_URL` in Render backend env vars

### 3.4 Deploy to Render

#### Method 1: render.yaml (Infrastructure as Code)
```bash
# 1. Push to GitHub
git add .
git commit -m "Add render.yaml for deployment"
git push origin main

# 2. In Render Dashboard:
#    - New → Blueprint
#    - Connect GitHub repo
#    - Render auto-detects render.yaml
#    - Add secret values (GROQ_API_KEY, etc.)
#    - Apply
```

#### Method 2: Manual Setup (If Blueprint fails)
**Backend Web Service:**
1. New → Web Service → Connect GitHub repo
2. Root Directory: `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add all env vars from section 3.2.1

**Frontend Static Site:**
1. New → Static Site → Connect GitHub repo
2. Root Directory: `frontend`
3. Build Command: `npm ci && npm run build`
4. Publish Directory: `out`
5. Add `NEXT_PUBLIC_API_URL` = `https://your-backend-name.onrender.com/api/v1`

---

## Phase 4: Production Checklist

### 4.1 Security
- [ ] Generate strong `JWT_SECRET` (auto-generated via `render.yaml`)
- [ ] Set `ENVIRONMENT=production`
- [ ] Configure CORS for specific Render frontend domain (not `*`)
- [ ] Enable HTTPS (automatic on Render)

### 4.2 AI Configuration
- [ ] Set `LLM_PROVIDER=groq`
- [ ] Add `GROQ_API_KEY` from Groq Cloud console (as secret in Render)
- [ ] Test AI endpoints work with Groq

### 4.3 Database
- [ ] Verify PostgreSQL connection works
- [ ] Test `init_db()` creates tables correctly
- [ ] **If using pgvector**: Verify Supabase/Neon with `CREATE EXTENSION vector;`
- [ ] Verify meeting embeddings table works with pgvector

### 4.4 File Storage
- [ ] Configure Supabase Storage or Cloudflare R2
- [ ] Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `STORAGE_BUCKET`
- [ ] Test file upload/download

### 4.5 Telegram Bot (Optional)
- [ ] Set `TELEGRAM_BOT_TOKEN` from @BotFather
- [ ] Set webhook URL to backend `https://residenthub-backend.onrender.com/api/v1/telegram/webhook`
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
    └───────────────┘             └───────────────┘
```

---

## Key Files to Create/Modify

| File | Purpose |
|------|---------|
| `render.yaml` | Render Blueprint (IaC) |
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

# Production build test with Docker
docker-compose -f docker-compose.prod.yml up --build

# Deploy via Render Blueprint (after pushing to GitHub)
# Render Dashboard → New → Blueprint → Connect Repo

# Manual deployment
# Render Dashboard → New → Web Service / Static Site
```

---

## Important Notes

1. **Next.js Static Export**: Requires `output: 'export'` and `images: { unoptimized: true }`
   - All API calls must go to backend (no Next.js API routes)
   - Dynamic routes need `generateStaticParams` or client-side rendering

2. **Render Free Tier Limits**:
   - Web Services sleep after 15 min inactivity (cold start ~30s)
   - Static Sites: Unlimited bandwidth
   - PostgreSQL: 90 days free, then $7/mo (or use Supabase/Neon free forever)

3. **pgvector Requirement**: For meeting AI embeddings, **must use Supabase/Neon** (Render PG lacks pgvector)

4. **CORS Configuration**: Update backend CORS to allow frontend domain:
   ```python
   # In backend/app/main.py
   allow_origins=["https://residenthub-frontend.onrender.com"]
   ```

5. **Environment Variables**: Set secrets in Render Dashboard (not in render.yaml):
   - `GROQ_API_KEY`
   - `SUPABASE_ANON_KEY` (if using Supabase)
   - `TELEGRAM_BOT_TOKEN`
   - `JWT_SECRET` (auto-generated if using `generateValue: true`)