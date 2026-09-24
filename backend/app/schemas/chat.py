from pydantic import BaseModel, Field


class ChatTurn(BaseModel):
    """One prior turn, echoed back by the client so the backend stays stateless."""

    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    # Client-held history, most recent last. Kept short; older turns are dropped server-side.
    history: list[ChatTurn] = Field(default_factory=list, max_length=12)
    lang: str = "en"


class ChatStandardRef(BaseModel):
    """A standard the reply is grounded in, so the UI can link to it."""

    id: int
    is_number: str
    title: str


class ChatResponse(BaseModel):
    reply: str
    # Standards actually looked up from the dataset for this turn (may be empty).
    standards: list[ChatStandardRef] = Field(default_factory=list)
    # False only when nothing could be produced at all (should be rare; there's a
    # deterministic fallback even if the LLM call fails).
    available: bool = True
