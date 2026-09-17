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
from app.services.allied_standards import build_allied_standards
from app.services.localization import (
    loc_aspect,
    loc_department,
    loc_requirements,
    loc_scope,
    loc_title,
)


def to_related(
    standard: Standard,
    rel_type: str,
    lang: str = "en",
) -> RelatedStandard:
    category = None
    relationship_category = {
        "supersedes": "supersedes",
        "superseded_by": "superseded_by",
    }
    if rel_type in relationship_category:
        category = relationship_category[rel_type]
    else:
        aspect = (standard.aspect or "").strip().lower()
        category = {
            "methods of test": "test_method",
            "method of test": "test_method",
            "test method": "test_method",
            "test methods": "test_method",
            "terminology": "terminology",
            "safety standard": "safety",
            "safety": "safety",
            "code of practice": "installation",
            "installation": "installation",
            "product specification": "product_spec",
            "product standard": "product_spec",
            "product spec": "product_spec",
        }.get(aspect, "normative_reference")
    return RelatedStandard(
        id=standard.id,
        is_number=standard.is_number,
        title=loc_title(standard, lang),
        status=standard.status,
        relationship_type=rel_type,
        category=category,
    )


class StandardService:
    def __init__(self, repo: StandardRepository):
        self.repo = repo

    def _summary(self, s: Standard, lang: str) -> StandardSummary:
        return StandardSummary(
            id=s.id,
            is_number=s.is_number,
            title=loc_title(s, lang),
            short_title=s.short_title,
            status=s.status,
            department=loc_department(s.department, lang),
            department_name=s.department_name,
            department_alias=s.department_alias,
            aspect=loc_aspect(s.aspect, lang),
            domain=s.domain,
            group=s.group,
            sub_group=s.sub_group,
            sub_sub_group=s.sub_sub_group,
            year=s.year,
            published_on=s.published_on,
            valid_upto=s.valid_upto,
            amendment_count=s.amendment_count or 0,
            degree_of_equivalence=s.degree_of_equivalence,
            ministry=s.ministry,
            committee_name=s.committee_name,
            certification=s.certification,
        )

    def list(self, lang: str = "en", **filters) -> list[StandardSummary]:
        standards = self.repo.list(**filters)
        return [self._summary(standard, lang) for standard in standards]

    def get_detail(self, standard_id: int, lang: str = "en") -> StandardDetail | None:
        standard = self.repo.get(standard_id)
        if not standard:
            return None

        allied = build_allied_standards(standard, self.repo, lang)

        return StandardDetail(
            id=standard.id,
            is_number=standard.is_number,
            title=loc_title(standard, lang),
            short_title=standard.short_title,
            status=standard.status,
            department=loc_department(standard.department, lang),
            department_name=standard.department_name,
            department_alias=standard.department_alias,
            aspect=loc_aspect(standard.aspect, lang),
            domain=standard.domain,
            group_classification=standard.group_classification,
            group=standard.group,
            sub_group=standard.sub_group,
            sub_sub_group=standard.sub_sub_group,
            description=standard.description or "",
            scope=loc_scope(standard, lang) or "",
            keywords=standard.keywords or [],
            requirements=loc_requirements(standard, lang) or [],
            year=standard.year,
            published_on=standard.published_on,
            valid_upto=standard.valid_upto,
            reaffirmation_year=standard.reaffirmation_year,
            review_on=standard.review_on,
            amendment_count=standard.amendment_count or 0,
            no_of_revision=standard.no_of_revision or 0,
            latest_version=standard.latest_version,
            standard_base=standard.standard_base,
            degree_of_equivalence=standard.degree_of_equivalence,
            ics_code=standard.ics_code,
            language=standard.language,
            ministry=standard.ministry,
            committee_name=standard.committee_name,
            member_secretary=standard.member_secretary,
            certification=standard.certification,
            has_qco_gazette=standard.has_qco_gazette,
            sdg_goals=standard.sdg_goals or [],
            cross_references=standard.cross_references or [],
            referenced_by=standard.referenced_by or [],
            supersedes=standard.supersedes or [],
            superseded_by=standard.superseded_by or [],
            title_hi=standard.title_hi,
            scope_hi=standard.scope_hi,
            requirements_hi=standard.requirements_hi or [],
            i18n=standard.i18n,
            source_standard_id=standard.source_standard_id,
            source_standard_enc_id=standard.source_standard_enc_id,
            source_department_id=standard.source_department_id,
            source_committee_id=standard.source_committee_id,
            raw_is_status=standard.raw_is_status,
            created_at=standard.created_at,
            updated_at=standard.updated_at,
            related_standards=allied,
            allied_standards=allied,
        )

    def create(self, payload: StandardCreate) -> StandardSummary:
        standard = Standard(**payload.model_dump())
        created = self.repo.create(standard)
        return self._summary(created, "en")

    def stats(self) -> StatsOverview:
        return StatsOverview(
            total=self.repo.count(),
            by_status=self.repo.count_grouped(Standard.status),
            by_domain=self.repo.count_grouped(Standard.domain),
            by_aspect=self.repo.count_grouped(Standard.aspect),
            by_department=self.repo.count_grouped(Standard.department),
        )

    def filter_options(self) -> FilterOptions:
        return FilterOptions(
            statuses=self.repo.distinct_values(Standard.status),
            departments=self.repo.distinct_values(Standard.department_name),
            aspects=self.repo.distinct_values(Standard.aspect),
            domains=self.repo.distinct_values(Standard.domain),
            groups=self.repo.distinct_values(Standard.group),
            sub_groups=self.repo.distinct_values(Standard.sub_group),
            sub_sub_groups=self.repo.distinct_values(Standard.sub_sub_group),
            ministries=self.repo.distinct_values(Standard.ministry),
            committees=self.repo.distinct_values(Standard.committee_name),
        )
