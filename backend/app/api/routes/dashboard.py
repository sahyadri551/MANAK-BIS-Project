from fastapi import APIRouter, Depends
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.recommendation import Recommendation
from app.db.models.standard import Standard
from app.db.repositories.standard_repository import StandardRepository
from app.services.localization import loc_department, loc_title
from app.core.config import settings

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/catalog-status")
def catalog_status(db: Session = Depends(get_db)):
    repo = StandardRepository(db)
    last_updated = db.execute(select(func.max(Standard.updated_at))).scalar_one_or_none()
    return {"total_standards": repo.count(), "provider": settings.recommendation_provider, "embedding_model": settings.embedding_model, "last_updated": last_updated.isoformat() if last_updated else None}


@router.get("")
def dashboard(lang: str = "en", db: Session = Depends(get_db)):
    repo = StandardRepository(db)
    total = repo.count()
    by_status = repo.count_grouped(Standard.status)
    by_dept = repo.count_grouped(Standard.department)
    active = by_status.get("Active", 0)
    rec_count = db.execute(select(func.count(Recommendation.id))).scalar_one()
    recent_scores = db.execute(select(Recommendation.score).order_by(desc(Recommendation.created_at)).limit(20)).scalars().all()
    avg_recent_score = (sum(recent_scores) / len(recent_scores)) if recent_scores else None

    coverage = sorted(
        [{"department": d, "label": loc_department(d, lang), "count": c} for d, c in by_dept.items()],
        key=lambda x: x["count"],
        reverse=True,
    )

    stmt = (
        select(Recommendation, Standard)
        .join(Standard, Standard.id == Recommendation.standard_id)
        .where(Recommendation.rank == 1)
        .order_by(desc(Recommendation.created_at))
        .limit(5)
    )
    recent = [
        {
            "query": rec.query,
            "is_number": std.is_number,
            "title": loc_title(std, lang),
            "relevance": round(rec.score * 100),
            "status": std.status,
            "created_at": rec.created_at.isoformat() if rec.created_at else None,
        }
        for rec, std in db.execute(stmt).all()
    ]

    return {
        "stats": {
            "total": total,
            "active": active,
            "focus_domains": len(repo.distinct_values(Standard.domain)),
            "recommendations": rec_count,
            "trends": {"total": "+12%", "active": "+12%", "recommendations": "+32%"},
        },
        "coverage": coverage,
        "recent": recent,
        "system_health": [
            {"name": "ML Model (BGE)", "detail": "Text embeddings", "status": "planned", "latency_ms": 120},
            {"name": "Vector Index (FAISS)", "detail": "Similarity search", "status": "planned", "latency_ms": 85},
            {"name": "RAG Knowledge Base", "detail": "Document retrieval", "status": "planned", "latency_ms": 110},
            {"name": "API Services", "detail": "FastAPI backend", "status": "online", "latency_ms": 64},
        ],
        "catalog_status": {"total_standards": total, "provider": settings.recommendation_provider, "embedding_model": settings.embedding_model, "last_updated": (db.execute(select(func.max(Standard.updated_at))).scalar_one_or_none().isoformat() if db.execute(select(func.max(Standard.updated_at))).scalar_one_or_none() else None)},
        "ai_performance": [
            {"metric": "Precision@5", "value": None},
            {"metric": "Recall@5", "value": None},
            {"metric": "Hit@1", "value": None},
            {"metric": "Avg. Relevance", "value": None},
            {"metric": "Avg. recommendation confidence (last 20 runs)", "value": round(float(avg_recent_score) * 100, 1) if avg_recent_score is not None else None},
        ],
    }
