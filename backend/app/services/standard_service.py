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
from app.services.allied_standards import build_allied_standards, category_for_relationship
from app.services.certification import classify
from app.services.localization import (
    loc_aspect,
    loc_department,
    loc_requirements,
    loc_scope,
    loc_title,
)

CANONICAL_DEPARTMENTS = (
    "AYUSH DEPARTMENT",
    "CHEMICAL DEPARTMENT",
    "CIVIL ENGINEERING DEPARTMENT",
    "ELECTRONICS AND INFORMATION TECHNOLOGY DEPARTMENT",
    "ELECTROTECHNICAL DEPARTMENT",
    "ENVIRONMENT AND ECOLOGY DEPARTMENT",
    "FOOD AND AGRICULTURE DEPARTMENT",
    "MANAGEMENT SYSTEM DEPARTMENT",
    "MECHANICAL ENGINEERING DEPARTMENT",
    "MEDICAL EQUIPMENT AND HOSPITAL PLANNING DEPARTMENT",
    "METALLURGICAL ENGINEERING DEPARTMENT",
    "PETROLEUM, COAL AND RELATED PRODUCTS DEPARTMENT",
    "PRODUCTION AND GENERAL ENGINEERING DEPARTMENT",
    "SERVICE SECTOR DEPARTMENT",
    "TEXTILE DEPARTMENT",
    "TRANSPORT ENGINEERING DEPARTMENT",
    "WATER RESOURCES DEPARTMENT",
)

CANONICAL_GROUPS = (
    "Accounting and Finance Services",
    "Agriculture, Agricultural Products and Implements",
    "Banking and Financial Services",
    "Building Materials including Paints",
    "Business Services",
    "Chemicals, Plastics and their Products including packaging and Environment",
    "Civil Engineering Design and Construction",
    "Coal and Petroleum products",
    "Communication Services",
    "Education, Educational Services and other related Services",
    "Electrical Switchgear and Other Electrical Products",
    "Electrical Appliances and Accessories",
    "Electronic and Telecom equipments, components and devices",
    "Environment Services",
    "Equipments for use in Mines and Explosive Atmosphere",
    "Ergonomics and Anthropometry",
    "Fire Fighting Equipments and Accessories",
    "Food, Food Products and food processing equipments",
    "Furniture",
    "Gases, Gas Cylinders , Machine tools and other mechanical products",
    "Health, Sports and Fitness Services",
    "Household Products Appliances(non-electrical)",
    "Information Technology products and applications",
    "IT and IT Enabled Services",
    "Leather and Leather Products",
    "Management systems",
    "Media and Entertainment Services",
    "Medical and Hospital Equipments",
    "Metals, Alloys and Metal Products (including Steel Products)",
    "Pumps, Engines and Compressors",
    "Rubber and Rubber Products",
    "Software and systems",
    "Sports goods including mountaineering equipment",
    "Textile, Textile Products and Machinery",
    "Transport and Logistics Services",
    "Transport and Related Products",
    "Travel,Tourism and Hospitality",
)

CANONICAL_MINISTRIES = (
    "Department of Atomic Energy",
    "Ministry of Agriculture",
    "Ministry of Animal Husbandry",
    "Ministry of AYUSH",
    "Ministry of Chemicals and Fertilizers",
    "Ministry of Civil Aviation",
    "Ministry of Coal",
    "Ministry of Commerce and Industry",
    "Ministry of Communications",
    "Ministry of Consumer Affairs",
    "Ministry of Corporate Affairs",
    "Ministry of Culture",
    "Ministry of Defence",
    "Ministry of Earth Sciences",
    "Ministry of Education",
    "Ministry of Electronics and Information Technology",
    "Ministry of Environment",
    "Ministry of Finance",
    "Ministry of Food Processing Industries",
    "Ministry of Health and Family Welfare",
    "Ministry of Heavy Industries",
    "Ministry of Home Affairs",
    "Ministry of Housing and Urban Affairs",
    "Ministry of Housing and Urban Poverty Alleviation",
    "Ministry of Information and Broadcasting",
    "Ministry of Jal Shakti",
    "Ministry of Labour and Employment",
    "Ministry of Micro",
    "Ministry of Mines",
    "Ministry of New and Renewable Energy",
    "Ministry of Personnel",
    "Ministry of Petroleum and Natural Gas",
    "Ministry of Ports",
    "Ministry of Power",
    "Ministry of Railways",
    "Ministry of Road Transport and Highways",
    "Ministry of Rural Development",
    "Ministry of Science and Technology",
    "Ministry of Social Justice and Empowerment",
    "Ministry of Statistics and Programme Implementation",
    "Ministry of Steel",
    "Ministry of Textiles",
    "Ministry of Tourism",
    "Ministry of Women and Child Development",
)

def _catalog_key(value: str) -> str:
    normalized = " ".join(str(value).strip().casefold().split())
    return normalized.replace(" ,", ",").replace(", ", ",").replace(" (", "(").replace("( ", "(").replace(" )", ")")


def _canonical(value: str, values: tuple[str, ...]) -> str | None:
    key = _catalog_key(value)
    for candidate in values:
        if _catalog_key(candidate) == key:
            return candidate
    return None


def _canonical_department(value: str) -> str | None:
    return _canonical(value, CANONICAL_DEPARTMENTS)


def _canonical_group(value: str) -> str | None:
    return _canonical(value, CANONICAL_GROUPS)


def _canonical_ministries(value: str) -> list[str]:
    result: list[str] = []
    for part in str(value).split(","):
        canonical = _canonical(part, CANONICAL_MINISTRIES)
        if canonical and canonical not in result:
            result.append(canonical)
    return result


def to_related(
    standard: Standard,
    rel_type: str,
    lang: str = "en",
) -> RelatedStandard:
    category = category_for_relationship(standard, rel_type)
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
            certification_scheme=classify(s.certification, s.has_qco_gazette)[0],
            certification_mandatory=classify(s.certification, s.has_qco_gazette)[1],
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
            certification_scheme=classify(standard.certification, standard.has_qco_gazette)[0],
            certification_mandatory=classify(standard.certification, standard.has_qco_gazette)[1],
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
            related_standards=[to_related(target, rel_type, lang) for target, rel_type in self.repo.related(standard.id)],
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

    def browse_options(self, lang: str = "en"):
        def grouped_items(column, canonicalizer, localizer=None):
            merged: dict[str, dict[str, object]] = {}
            for value, count in self.repo.count_grouped(column).items():
                if value == "unknown" or not value:
                    continue
                raw = str(value).strip()
                canonical = canonicalizer(raw)
                if not canonical:
                    continue
                entry = merged.setdefault(canonical, {"value": canonical, "label": localizer(canonical) if localizer else canonical, "count": 0})
                entry["count"] = int(entry["count"]) + int(count)
            return sorted(merged.values(), key=lambda item: str(item["label"]).casefold())

        def department_items():
            counts = {value: 0 for value in CANONICAL_DEPARTMENTS}
            for raw, count in self.repo.count_grouped(Standard.department_name).items():
                if raw and raw != "unknown":
                    canonical = _canonical_department(str(raw))
                    if canonical:
                        counts[canonical] += int(count)
            return sorted(
                ({"value": value, "label": loc_department(value, lang), "count": count} for value, count in counts.items() if count),
                key=lambda item: str(item["label"]).casefold(),
            )

        def ministry_items():
            counts = {value: 0 for value in CANONICAL_MINISTRIES}
            for raw, count in self.repo.count_grouped(Standard.ministry).items():
                if raw and raw != "unknown":
                    for ministry in _canonical_ministries(str(raw)):
                        counts[ministry] += int(count)
            return sorted(
                ({"value": value, "label": value, "count": count} for value, count in counts.items() if count),
                key=lambda item: str(item["label"]).casefold(),
            )

        from app.db.models.standard import Standard as _Standard
        return {
            "departments": department_items(),
            "aspects": grouped_items(_Standard.aspect, lambda value: value.strip(), lambda value: loc_aspect(value, lang)),
            "groups": grouped_items(_Standard.group, _canonical_group),
            "ministries": ministry_items(),
        }

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
