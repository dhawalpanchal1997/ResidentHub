# ResidentHub: Local Build, Dockerization & Vercel Deployment Plan

## Project Overview
- **Frontend**: Next.js 14 (App Router, TypeScript, Tailwind CSS) → Deploy to Vercel
- **Backend**: FastAPI (Python 3.11+) with SQLite (local) / PostgreSQL (prod) → Deploy to Render/Fly.io
- **AI Engine**: Dual-tier (Ollama local, Groq production)
- **Database**: SQLite for local dev, PostgreSQL + pgvector for production

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

## Phase 2: Dockerization

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

### 2.4 Production Docker Compose
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

## Phase 3: Vercel Deployment (Frontend Only)

### 3.1 Prepare Next.js for Vercel
Update `frontend/next.config.mjs`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',  // Required for Docker, optional for Vercel
  images: {
    domains: ['localhost', 'your-vercel-app.vercel.app'],
  },
};

export default nextConfig;
```

### 3.2 Environment Variables for Vercel
In Vercel dashboard, add:
- `NEXT_PUBLIC_API_URL` = `https://your-backend-host.onrender.com/api/v1` (or Fly.io URL)

### 3.3 Deploy to Vercel
```bash
# Option 1: Vercel CLI
cd frontend
npx vercel

# Option 2: GitHub Integration
# 1. Push to GitHub
# 2. Import project in Vercel dashboard
# 3. Set root directory to 'frontend'
# 4. Add environment variables
# 5. Deploy
```

---

## Phase 4: Backend Deployment (Render / Fly.io)

### 4.1 Render.com (Recommended - Free Tier)
1. Create new **Web Service** from GitHub repo
2. Root Directory: `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables from `.env.example`
6. Use **Free PostgreSQL** add-on or Supabase/Neon

### 4.2 Fly.io (Alternative)
```bash
fly launch --name residenthub-backend --region ord
# Set secrets:
fly secrets set JWT_SECRET=... GROQ_API_KEY=... DATABASE_URL=...
fly deploy
```

### 4.3 Database Setup (Production)
- **Supabase** (Free): Create project → Get connection string → Add to `DATABASE_URL`
- **Neon** (Free): Create project → Get connection string
- Run migrations: `alembic upgrade head` (if using Alembic) or rely on `init_db()`

---

## Phase 5: Production Checklist

### 5.1 Security
- [ ] Generate strong `JWT_SECRET` for production
- [ ] Set `ENVIRONMENT=production`
- [ ] Configure CORS for specific Vercel domain (not `*`)
- [ ] Enable HTTPS (automatic on Vercel/Render)

### 5.2 AI Configuration
- [ ] Set `LLM_PROVIDER=groq`
- [ ] Add `GROQ_API_KEY` from Groq Cloud console
- [ ] Test AI endpoints work with Groq

### 5.3 Database
- [ ] Verify PostgreSQL + pgvector extension works
- [ ] Test `init_db()` creates tables correctly
- [ ] Verify meeting embeddings table works with pgvector

### 5.4 File Storage
- [ ] Configure Supabase Storage or Cloudflare R2
- [ ] Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `STORAGE_BUCKET`
- [ ] Test file upload/download

### 5.5 Telegram Bot (Optional)
- [ ] Set `TELEGRAM_BOT_TOKEN` from @BotFather
- [ ] Set webhook URL to backend `/api/v1/telegram/webhook`
- [ ] Test bot commands

---

## Architecture Summary

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Vercel        │────▶│   Render/Fly.io  │────▶│   Supabase/Neon  │
│   (Frontend)    │     │   (Backend API)  │     │   (PostgreSQL)   │
└─────────────────┘     └──────────────────┘     └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Groq Cloud     │
                       │   (LLM API)      │
                       └──────────────────┘
```

---

## Key Files to Create/Modify

| File | Purpose |
|------|---------|
| `backend/Dockerfile` | Backend container |
| `frontend/Dockerfile` | Frontend container |
| `docker-compose.yml` | Local dev with Ollama |
| `docker-compose.prod.yml` | Production with PostgreSQL |
| `frontend/next.config.mjs` | Vercel/standalone config |
| `backend/.dockerignore` | Exclude venv, __pycache__, .env |
| `frontend/.dockerignore` | Exclude node_modules, .next, .env.local |

---

## Commands Reference

```bash
# Local development with Docker
docker-compose up --build

# Production build test
docker-compose -f docker-compose.prod.yml up --build

# Deploy frontend to Vercel
cd frontend && vercel --prod

# Deploy backend to Render (via GitHub) or Fly.io
fly deploy
```

---

## Notes

1. **Backend and Frontend deploy separately** - Vercel only hosts the Next.js frontend
2. **Database must be external** - Use Supabase/Neon free tier for PostgreSQL + pgvector
3. **Ollama is local-only** - Production uses Groq Cloud API
4. **File storage** - Use Supabase Storage (1GB free) or Cloudflare R2 (10GB free)
5. **Telegram bot** - Requires backend to have public HTTPS endpoint for webhook