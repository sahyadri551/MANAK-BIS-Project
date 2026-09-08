from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.recommendation import RelatedStandard


# ============================================================
# STANDARD BASE
# ============================================================


class StandardBase(BaseModel):
    # --------------------------------------------------------
    # Identification
    # --------------------------------------------------------

    is_number: str
    title: str
    short_title: str | None = None

    # --------------------------------------------------------
    # Basic classification
    # --------------------------------------------------------

    status: str = "Active"
    department: str | None = None
    department_name: str | None = None
    department_alias: str | None = None
    aspect: str | None = None
    domain: str | None = None

    # --------------------------------------------------------
    # Group classification
    # --------------------------------------------------------

    group_classification: str | None = None
    group: str | None = None
    sub_group: str | None = None
    sub_sub_group: str | None = None

    # --------------------------------------------------------
    # Publication / validity
    # --------------------------------------------------------

    year: int | None = None
    published_on: str | None = None
    valid_upto: str | None = None
    reaffirmation_year: int | None = None
    review_on: str | None = None

    # --------------------------------------------------------
    # Amendment / revision
    # --------------------------------------------------------

    amendment_count: int = 0
    no_of_revision: int = 0
    latest_version: str | None = None
    standard_base: str | None = None

    # --------------------------------------------------------
    # Technical / reference information
    # --------------------------------------------------------

    degree_of_equivalence: str | None = None
    ics_code: str | None = None
    language: str | None = None

    # --------------------------------------------------------
    # Organization
    # --------------------------------------------------------

    ministry: str | None = None
    committee_name: str | None = None
    member_secretary: str | None = None

    # --------------------------------------------------------
    # Certification / policy
    # --------------------------------------------------------

    certification: str | None = None
    has_qco_gazette: str | None = None

    # --------------------------------------------------------
    # SDG
    # --------------------------------------------------------

    sdg_goals: list = Field(
        default_factory=list
    )

    # --------------------------------------------------------
    # Cross references
    # --------------------------------------------------------

    cross_references: list = Field(
        default_factory=list
    )

    referenced_by: list = Field(
        default_factory=list
    )

    supersedes: list = Field(
        default_factory=list
    )

    superseded_by: list = Field(
        default_factory=list
    )

    # --------------------------------------------------------
    # Existing content fields
    # --------------------------------------------------------

    description: str = ""
    scope: str = ""

    keywords: list[str] = Field(
        default_factory=list
    )

    requirements: list[str] = Field(
        default_factory=list
    )

    # --------------------------------------------------------
    # Hindi / internationalization
    # --------------------------------------------------------

    title_hi: str | None = None
    scope_hi: str | None = None

    requirements_hi: list = Field(
        default_factory=list
    )

    i18n: dict | None = None

    # --------------------------------------------------------
    # Source identifiers
    # --------------------------------------------------------

    source_standard_id: int | None = None
    source_standard_enc_id: str | None = None
    source_department_id: int | None = None
    source_committee_id: int | None = None
    raw_is_status: int | None = None


# ============================================================
# CREATE
# ============================================================


class StandardCreate(StandardBase):
    pass


# ============================================================
# SUMMARY
# ============================================================


class StandardSummary(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int

    is_number: str
    title: str
    short_title: str | None = None

    status: str

    department: str | None = None
    department_name: str | None = None
    department_alias: str | None = None

    aspect: str | None = None
    domain: str | None = None

    group: str | None = None
    sub_group: str | None = None
    sub_sub_group: str | None = None

    year: int | None = None

    published_on: str | None = None
    valid_upto: str | None = None

    amendment_count: int = 0

    degree_of_equivalence: str | None = None

    ministry: str | None = None

    committee_name: str | None = None

    certification: str | None = None


# ============================================================
# DETAIL
# ============================================================


class StandardDetail(StandardSummary):
    # --------------------------------------------------------
    # Content
    # --------------------------------------------------------

    description: str = ""
    scope: str = ""

    keywords: list[str] = Field(
        default_factory=list
    )

    requirements: list[str] = Field(
        default_factory=list
    )

    # --------------------------------------------------------
    # Publication / validity
    # --------------------------------------------------------

    reaffirmation_year: int | None = None
    review_on: str | None = None

    # --------------------------------------------------------
    # Amendment / revision
    # --------------------------------------------------------

    no_of_revision: int = 0
    latest_version: str | None = None
    standard_base: str | None = None

    # --------------------------------------------------------
    # Technical information
    # --------------------------------------------------------

    ics_code: str | None = None
    language: str | None = None
    degree_of_equivalence: str | None = None

    # --------------------------------------------------------
    # Organization
    # --------------------------------------------------------

    ministry: str | None = None
    committee_name: str | None = None
    member_secretary: str | None = None

    # --------------------------------------------------------
    # Group information
    # --------------------------------------------------------

    group_classification: str | None = None
    group: str | None = None
    sub_group: str | None = None
    sub_sub_group: str | None = None

    # --------------------------------------------------------
    # Certification / policy
    # --------------------------------------------------------

    certification: str | None = None
    has_qco_gazette: str | None = None

    # --------------------------------------------------------
    # SDG
    # --------------------------------------------------------

    sdg_goals: list = Field(
        default_factory=list
    )

    # --------------------------------------------------------
    # References
    # --------------------------------------------------------

    cross_references: list = Field(
        default_factory=list
    )

    referenced_by: list = Field(
        default_factory=list
    )

    supersedes: list = Field(
        default_factory=list
    )

    superseded_by: list = Field(
        default_factory=list
    )

    # --------------------------------------------------------
    # Hindi / i18n
    # --------------------------------------------------------

    title_hi: str | None = None
    scope_hi: str | None = None

    requirements_hi: list = Field(
        default_factory=list
    )

    i18n: dict | None = None

    # --------------------------------------------------------
    # Source information
    # --------------------------------------------------------

    source_standard_id: int | None = None
    source_standard_enc_id: str | None = None
    source_department_id: int | None = None
    source_committee_id: int | None = None
    raw_is_status: int | None = None

    # --------------------------------------------------------
    # Timestamp
    # --------------------------------------------------------

    created_at: datetime | None = None

    updated_at: datetime | None = None

    # --------------------------------------------------------
    # Relationships
    # --------------------------------------------------------

    related_standards: list[RelatedStandard] = Field(
        default_factory=list
    )


# ============================================================
# STATISTICS
# ============================================================


class StatsOverview(BaseModel):
    total: int

    by_status: dict[str, int]

    by_domain: dict[str, int]

    by_department: dict[str, int]


# ============================================================
# FILTER OPTIONS
# ============================================================


class FilterOptions(BaseModel):
    statuses: list[str]

    departments: list[str]

    aspects: list[str]

    domains: list[str]

    groups: list[str] = Field(
        default_factory=list
    )

    sub_groups: list[str] = Field(
        default_factory=list
    )

    sub_sub_groups: list[str] = Field(
        default_factory=list
    )

    ministries: list[str] = Field(
        default_factory=list
    )

    committees: list[str] = Field(
        default_factory=list
    )