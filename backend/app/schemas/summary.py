from pydantic import BaseModel, Field


class SummaryItemIn(BaseModel):
    standard_id: int
    score: float = 0.0
    matched_requirements: list[str] = Field(default_factory=list)


class SummaryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    lang: str = "en"
    items: list[SummaryItemIn] = Field(min_length=1, max_length=10)


class SummaryResponse(BaseModel):
    # False when the LLM failed; the UI should simply hide the summaries.
    available: bool = True
    overall: str = ""
    # Keyed by str(standard_id) so the JSON shape is unambiguous.
    per_standard: dict[str, str] = Field(default_factory=dict)