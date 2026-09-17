import abc
import re
import uuid
from functools import lru_cache
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models.recommendation import Recommendation
from app.db.models.standard import Standard
from app.db.repositories.standard_repository import StandardRepository
from app.schemas.recommendation import RecommendationItem, RecommendRequest, RecommendResponse
from app.services.allied_standards import build_allied_standards
from app.services.localization import loc_aspect, loc_department, loc_title, req_map
from app.services.query_translation import translate_query_to_english
from app.services.search_service import SearchService
from app.services.standard_service import to_related

_STOPWORDS = {"the", "and", "for", "with", "that", "this", "have", "from", "must", "shall", "will", "need", "want", "should", "our", "are", "used", "use", "per", "any", "all", "not", "but", "can", "may", "into", "than", "then", "them", "a", "an", "of", "to", "in", "on", "at", "is", "it", "we", "be", "as", "or"}


def tokenize(text: str) -> set[str]:
    words = re.findall(r"[a-z0-9]+", (text or "").lower())
    return {word for word in words if len(word) > 2 and word not in _STOPWORDS}


class RecommendationProvider(abc.ABC):
    @abc.abstractmethod
    def recommend(self, request: RecommendRequest, db: Session, candidates: list[Standard]) -> list[tuple[Standard, float, list[str], str]]:
        ...


class MockRecommendationProvider(RecommendationProvider):
    def recommend(self, request, db, candidates):
        english_query = translate_query_to_english(request.query)
        terms = tokenize(english_query)
        scored = []
        for std in candidates:
            keywords = {k.lower() for k in (std.keywords or [])}
            title_terms = tokenize(std.title)
            context = tokenize(" ".join([std.department or "", std.aspect or "", std.domain or "", std.scope or ""]))
            kw_hits = terms & keywords
            title_hits = terms & title_terms
            ctx_hits = terms & context
            matched_reqs = [requirement for requirement in (std.requirements or []) if terms & tokenize(requirement)]
            raw = 3.0 * len(kw_hits) + 2.0 * len(title_hits) + 1.0 * len(ctx_hits) + 1.5 * len(matched_reqs)
            if raw == 0:
                continue
            denom = max(len(terms), 1) * 3.0 + 3.0
            score = round(min(raw / denom, 1.0), 3)
            reason = self._reason(std, kw_hits | title_hits, matched_reqs)
            scored.append((std, score, matched_reqs[:5], reason))
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[: settings.max_recommendations]

    def _reason(self, std, hits, matched_reqs):
        parts = []
        if hits:
            parts.append("matches spec terms: " + ", ".join(sorted(hits)[:4]))
        if matched_reqs:
            parts.append(f"covers {len(matched_reqs)} stated requirement(s)")
        if std.domain:
            parts.append("relevant to " + std.domain.replace("_", " "))
        base = "; ".join(parts) if parts else "closest available standard for this specification"
        return f"{std.is_number} {base}."


_PROVIDERS = {"mock": MockRecommendationProvider}


@lru_cache(maxsize=1)
def get_provider():
    provider_name = settings.recommendation_provider.lower().strip()
    if provider_name == "ml":
        from app.ml.ml_recommendation_provider import MLRecommendationProvider
        return MLRecommendationProvider()
    return _PROVIDERS.get(provider_name, MockRecommendationProvider)()


class RecommendationService:
    def __init__(self, db: Session, provider: Any):
        self.db = db
        self.repo = StandardRepository(db)
        self.provider = provider
        self.search_service = SearchService(db)

    def recommend(self, request: RecommendRequest, lang: str = "en") -> RecommendResponse:
        request_id = uuid.uuid4().hex
        candidates = self.repo.list(status=request.filters.status, department=request.filters.department, aspect=request.filters.aspect)
        ranked = self.provider.recommend(request, self.db, candidates)
        items = []

        for rank, (std, score, matched, reason) in enumerate(ranked, start=1):
            allied = build_allied_standards(std, self.repo, lang)
            related = [item for item in allied]
            rmap = req_map(std, lang)

            items.append(
                RecommendationItem(
                    standard_id=std.id,
                    is_number=std.is_number,
                    title=loc_title(std, lang),
                    score=score,
                    status=std.status,
                    department=loc_department(std.department_name, lang),
                    aspect=loc_aspect(std.aspect, lang),
                    group=std.group,
                    published_on=std.published_on,
                    valid_upto=std.valid_upto,
                    no_of_revision=std.no_of_revision or 0,
                    amendment_count=std.amendment_count or 0,
                    reaffirmation_year=std.reaffirmation_year,
                    matched_requirements=[rmap.get(matched_requirement, matched_requirement) for matched_requirement in matched],
                    reason=reason,
                    evidence=[],
                    related_standards=related,
                    allied_standards=allied,
                )
            )

            self.db.add(Recommendation(request_id=request_id, standard_id=std.id, query=request.query, score=score, matched_requirements=matched, reason=reason, rank=rank))

        self.db.commit()
        self.search_service.record(request_id, request, len(items))
        similarity_map = getattr(self.provider, "last_similarity_map", [])
        return RecommendResponse(request_id=request_id, query=request.query, recommendations=items, similarity_map=similarity_map)
