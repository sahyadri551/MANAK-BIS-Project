from typing import Literal

from pydantic import BaseModel, Field


AlliedStandardCategory = Literal[
    "normative_reference",
    "test_method",
    "terminology",
    "safety",
    "installation",
    "product_spec",
    "supersedes",
    "superseded_by",
]


class RelatedStandard(BaseModel):
    id: int
    is_number: str
    title: str
    status: str
    relationship_type: str = "related"
    category: AlliedStandardCategory | None = None


class RecommendationFilters(BaseModel):
    status: str | None = None
    department: str | None = None
    aspect: str | None = None


class RecommendRequest(BaseModel):
    query: str = Field(min_length=1)
    document_name: str | None = None
    filters: RecommendationFilters = Field(default_factory=RecommendationFilters)


class RecommendationItem(BaseModel):
    standard_id: int
    is_number: str
    title: str
    score: float
    status: str
    department: str | None = None
    aspect: str | None = None
    group: str | None = None
    published_on: str | None = None
    valid_upto: str | None = None
    no_of_revision: int = 0
    amendment_count: int = 0
    reaffirmation_year: int | None = None
    matched_requirements: list[str] = Field(default_factory=list)
    reason: str = ""
    evidence: list = Field(default_factory=list)  # type: ignore
    related_standards: list[RelatedStandard] = Field(default_factory=list)
    allied_standards: list[RelatedStandard] = Field(default_factory=list)


class SimilarityMapPoint(BaseModel):
    standard_id: int
    is_number: str
    title: str
    x: float
    y: float
    score: float
    is_query: bool = False


class RecommendResponse(BaseModel):
    request_id: str
    query: str
    recommendations: list[RecommendationItem]
    similarity_map: list[SimilarityMapPoint] = Field(default_factory=list)
