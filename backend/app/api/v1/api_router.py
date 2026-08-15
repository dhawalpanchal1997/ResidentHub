from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.events import router as events_router
from app.api.v1.ledger import router as ledger_router
from app.api.v1.vendors import router as vendors_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.notices import router as notices_router
from app.api.v1.committee import router as committee_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(events_router)
api_router.include_router(ledger_router)
api_router.include_router(vendors_router)
api_router.include_router(analytics_router)
api_router.include_router(notices_router)
api_router.include_router(committee_router)
