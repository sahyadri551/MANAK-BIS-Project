from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.recommendation import RelatedStandard


class StandardBase(BaseModel):
    is_number: str
    title: str
    short_title: str | None = None
    status: str = "Active"
    department: str | None = None
    department_name: str | None = None
    department_alias: str | None = None
    aspect: str | None = None
    domain: str | None = None
    group_classification: str | None = None
    group: str | None = None
    sub_group: str | None = None
    sub_sub_group: str | None = None
    year: int | None = None
    published_on: str | None = None
    valid_upto: str | None = None
    reaffirmation_year: int | None = None
    review_on: str | None = None
    amendment_count: int = 0
    no_of_revision: int = 0
    latest_version: str | None = None
    standard_base: str | None = None
    degree_of_equivalence: str | None = None
    ics_code: str | None = None
    language: str | None = None
    ministry: str | None = None
    committee_name: str | None = None
    member_secretary: str | None = None
    certification: str | None = None
    certification_scheme: str = "NONE"
    certification_mandatory: bool = False
    has_qco_gazette: str | None = None
    sdg_goals: list = Field(default_factory=list)
    cross_references: list = Field(default_factory=list)
    referenced_by: list = Field(default_factory=list)
    supersedes: list = Field(default_factory=list)
    superseded_by: list = Field(default_factory=list)
    description: str = ""
    scope: str = ""
    keywords: list[str] = Field(default_factory=list)
    requirements: list[str] = Field(default_factory=list)
    title_hi: str | None = None
    scope_hi: str | None = None
    requirements_hi: list = Field(default_factory=list)
    i18n: dict | None = None
    source_standard_id: int | None = None
    source_standard_enc_id: str | None = None
    source_department_id: int | None = None
    source_committee_id: int | None = None
    raw_is_status: int | None = None


class StandardCreate(StandardBase):
    pass


class StandardSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
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
    certification_scheme: str = "NONE"
    certification_mandatory: bool = False


class StandardDetail(StandardSummary):
    description: str = ""
    scope: str = ""
    keywords: list[str] = Field(default_factory=list)
    requirements: list[str] = Field(default_factory=list)
    reaffirmation_year: int | None = None
    review_on: str | None = None
    no_of_revision: int = 0
    latest_version: str | None = None
    standard_base: str | None = None
    ics_code: str | None = None
    language: str | None = None
    degree_of_equivalence: str | None = None
    ministry: str | None = None
    committee_name: str | None = None
    member_secretary: str | None = None
    group_classification: str | None = None
    group: str | None = None
    sub_group: str | None = None
    sub_sub_group: str | None = None
    certification: str | None = None
    has_qco_gazette: str | None = None
    sdg_goals: list = Field(default_factory=list)
    cross_references: list = Field(default_factory=list)
    referenced_by: list = Field(default_factory=list)
    supersedes: list = Field(default_factory=list)
    superseded_by: list = Field(default_factory=list)
    title_hi: str | None = None
    scope_hi: str | None = None
    requirements_hi: list = Field(default_factory=list)
    i18n: dict | None = None
    source_standard_id: int | None = None
    source_standard_enc_id: str | None = None
    source_department_id: int | None = None
    source_committee_id: int | None = None
    raw_is_status: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    related_standards: list[RelatedStandard] = Field(default_factory=list)
    allied_standards: list[RelatedStandard] = Field(default_factory=list)


class StatsOverview(BaseModel):
    total: int
    by_status: dict[str, int]
    by_domain: dict[str, int]
    by_aspect: dict[str, int]
    by_department: dict[str, int]


class BrowseItem(BaseModel):
    value: str
    label: str
    count: int


class BrowseResponse(BaseModel):
    departments: list[BrowseItem] = Field(default_factory=list)
    aspects: list[BrowseItem] = Field(default_factory=list)
    groups: list[BrowseItem] = Field(default_factory=list)
    ministries: list[BrowseItem] = Field(default_factory=list)


class FilterOptions(BaseModel):
    statuses: list[str]
    departments: list[str]
    aspects: list[str]
    domains: list[str]
    groups: list[str] = Field(default_factory=list)
    sub_groups: list[str] = Field(default_factory=list)
    sub_sub_groups: list[str] = Field(default_factory=list)
    ministries: list[str] = Field(default_factory=list)
    committees: list[str] = Field(default_factory=list)
