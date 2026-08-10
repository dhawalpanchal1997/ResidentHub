from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db, AsyncSessionLocal
from app.api.v1.api_router import api_router
from app.models.user import User
from app.core.security import get_password_hash
from sqlalchemy.future import select

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables on startup
    await init_db()
    
    # Create default demo admin & member if empty
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == "admin@residenthub.local"))
        if not result.scalars().first():
            demo_admin = User(
                email="admin@residenthub.local",
                hashed_password=get_password_hash("admin123"),
                full_name="Rajesh Sharma (Secretary)",
                flat_number="A-402",
                phone_number="+91 98765 43210",
                role="admin"
            )
            demo_member = User(
                email="member@residenthub.local",
                hashed_password=get_password_hash("member123"),
                full_name="Priya Patel",
                flat_number="B-201",
                phone_number="+91 98111 22334",
                role="member"
            )
            session.add_all([demo_admin, demo_member])
            await session.commit()
            
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="All-in-one Society Management Platform with Deterministic Meeting AI",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "llm_provider": settings.LLM_PROVIDER,
        "docs_url": "/docs"
    }
