"""
app/services/llm_service.py
───────────────────────────
Single place for "call the LLM" so the summary service and (later) the chatbot
share one code path. Reuses the same litellm + Gemini setup as
query_translation.py. Fail-open: returns None on any error.
"""

from __future__ import annotations

import logging
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)


def resolve_model() -> str:
    """LLM_MODEL if set in .env, otherwise reuse TRANSLATION_MODEL."""
    return settings.llm_model or settings.translation_model


def llm_complete(
    messages: list[dict[str, str]],
    *,
    json_mode: bool = False,
    max_tokens: int = 1500,
) -> str | None:
    """Run one chat completion. Returns the text, or None if the call failed."""
    try:
        import litellm  # lazy import, same as query_translation.py

        kwargs: dict[str, Any] = {
            "model": resolve_model(),
            "messages": messages,
            "max_tokens": max_tokens,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        response = litellm.completion(**kwargs)
        text = (response.choices[0].message.content or "").strip()
        return text or None
    except Exception as exc:  # noqa: BLE001
        logger.error(
            "LLM call failed for model=%s (%s: %s)",
            resolve_model(), type(exc).__name__, exc, exc_info=True,
        )
        return None