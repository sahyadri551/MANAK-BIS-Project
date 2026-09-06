from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.recommendation import RelatedStandard


class StandardBase(BaseModel):
    is_number: str
    title: str
    status: str = "Active"
    department: str | None = None
    aspect: str | None = None
    domain: str | None = None
    description: str = ""
    scope: str = ""
    keywords: list[str] = Field(default_factory=list)
    requirements: list[str] = Field(default_factory=list)
    year: int | None = None
    reaffirmation_year: int | None = None


class StandardCreate(StandardBase):
    pass


class StandardSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_number: str
    title: str
    status: str
    department: str | None = None
    aspect: str | None = None
    domain: str | None = None


class StandardDetail(StandardSummary):
    description: str = ""
    scope: str = ""
    keywords: list[str] = Field(default_factory=list)
    requirements: list[str] = Field(default_factory=list)
    year: int | None = None
    reaffirmation_year: int | None = None
    created_at: datetime | None = None
    related_standards: list[RelatedStandard] = Field(default_factory=list)


class StatsOverview(BaseModel):
    total: int
    by_status: dict[str, int]
    by_domain: dict[str, int]
    by_department: dict[str, int]


class FilterOptions(BaseModel):
    statuses: list[str]
    departments: list[str]
    aspects: list[str]
    domains: list[str]
