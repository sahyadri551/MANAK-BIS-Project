from fastapi import APIRouter

from app.api.routes import dashboard, health, recommendations, search, standards, pdf_analysis, summary

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(dashboard.router)
api_router.include_router(recommendations.router)
api_router.include_router(standards.router)
api_router.include_router(search.router)
api_router.include_router(pdf_analysis.router)
api_router.include_router(summary.router)
