from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.services.recommendation_service import get_provider

configure_logging()
logger = get_logger("bis.api")

# Define the lifespan context manager for startup and shutdown tasks
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup Actions ---
    if settings.recommendation_provider.lower().strip() == "ml":
        logger.info("Initializing recommendation provider at startup...")
        get_provider()
        logger.info("Recommendation provider initialized successfully.")
    
    yield  # yield control to the ASGI server
app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/")
def root():
    return {"service": settings.app_name, "docs": "/docs", "api": settings.api_prefix}
