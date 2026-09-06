from __future__ import annotations

from app.db.models.standard import Standard
from app.db.repositories.standard_repository import StandardRepository
from app.schemas.recommendation import RelatedStandard
from app.schemas.standard import (
    FilterOptions,
    StandardCreate,
    StandardDetail,
    StandardSummary,
    StatsOverview,
)
from app.services.localization import (
    loc_aspect,
    loc_department,
    loc_requirements,
    loc_scope,
    loc_title,
)


def to_related(standard: Standard, rel_type: str, lang: str = "en") -> RelatedStandard:
    return RelatedStandard(
        id=standard.id,
        is_number=standard.is_number,
        title=loc_title(standard, lang),
        status=standard.status,
        relationship_type=rel_type,
    )


class StandardService:
    def __init__(self, repo: StandardRepository):
        self.repo = repo

    def _summary(self, s: Standard, lang: str) -> StandardSummary:
        return StandardSummary(
            id=s.id,
            is_number=s.is_number,
            title=loc_title(s, lang),
            status=s.status,
            department=loc_department(s.department, lang),
            aspect=loc_aspect(s.aspect, lang),
            domain=s.domain,
        )

    def list(self, lang: str = "en", **filters) -> list[StandardSummary]:
        return [self._summary(s, lang) for s in self.repo.list(**filters)]

    def get_detail(self, standard_id: int, lang: str = "en") -> StandardDetail | None:
        s = self.repo.get(standard_id)
        if not s:
            return None
        return StandardDetail(
            id=s.id,
            is_number=s.is_number,
            title=loc_title(s, lang),
            status=s.status,
            department=loc_department(s.department, lang),
            aspect=loc_aspect(s.aspect, lang),
            domain=s.domain,
            description=s.description or "",
            scope=loc_scope(s, lang) or "",
            keywords=s.keywords or [],
            requirements=loc_requirements(s, lang) or [],
            year=s.year,
            reaffirmation_year=s.reaffirmation_year,
            created_at=s.created_at,
            related_standards=[to_related(r, rel, lang) for r, rel in self.repo.related(standard_id)],
        )

    def create(self, payload: StandardCreate) -> StandardSummary:
        standard = Standard(**payload.model_dump())
        return StandardSummary.model_validate(self.repo.create(standard))

    def stats(self) -> StatsOverview:
        return StatsOverview(
            total=self.repo.count(),
            by_status=self.repo.count_grouped(Standard.status),
            by_domain=self.repo.count_grouped(Standard.domain),
            by_department=self.repo.count_grouped(Standard.department),
        )

    def filter_options(self) -> FilterOptions:
        return FilterOptions(
            statuses=self.repo.distinct_values(Standard.status),
            departments=self.repo.distinct_values(Standard.department),
            aspects=self.repo.distinct_values(Standard.aspect),
            domains=self.repo.distinct_values(Standard.domain),
        )
