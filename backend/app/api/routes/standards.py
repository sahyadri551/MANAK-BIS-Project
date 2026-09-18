from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.repositories.standard_repository import StandardRepository
from app.schemas.standard import (
    FilterOptions,
    StandardCreate,
    StandardDetail,
    StandardSummary,
    StatsOverview,
)
from app.services.pdf_report_service import build_standard_pdf
from app.services.standard_service import StandardService

router = APIRouter(prefix="/standards", tags=["standards"])


def get_service(db: Session = Depends(get_db)) -> StandardService:
    return StandardService(StandardRepository(db))


@router.get("", response_model=list[StandardSummary])
def list_standards(
    status: str | None = None,
    department: str | None = None,
    aspect: str | None = None,
    domain: str | None = None,
    search: str | None = None,
    lang: str = "en",
    limit: int = Query(200, le=500),
    offset: int = 0,
    service: StandardService = Depends(get_service),
):
    return service.list(
        lang=lang,
        status=status,
        department=department,
        aspect=aspect,
        domain=domain,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.get("/stats/overview", response_model=StatsOverview)
def stats(service: StandardService = Depends(get_service)):
    return service.stats()


@router.get("/meta/filters", response_model=FilterOptions)
def filter_options(service: StandardService = Depends(get_service)):
    return service.filter_options()


@router.get("/{standard_id}/pdf")
def download_standard_pdf(
    standard_id: int,
    lang: str = "en",
    service: StandardService = Depends(get_service),
):
    detail = service.get_detail(standard_id, lang=lang)

    if not detail:
        raise HTTPException(status_code=404, detail="Standard not found")

    pdf_bytes, filename = build_standard_pdf(detail, lang=lang)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )


@router.get("/{standard_id}", response_model=StandardDetail)
def get_standard(
    standard_id: int,
    lang: str = "en",
    service: StandardService = Depends(get_service),
):
    detail = service.get_detail(standard_id, lang=lang)

    if not detail:
        raise HTTPException(status_code=404, detail="Standard not found")

    return detail


@router.post("", response_model=StandardSummary, status_code=201)
def create_standard(
    payload: StandardCreate,
    service: StandardService = Depends(get_service),
):
    return service.create(payload)
