"""
app/services/query_translation.py
──────────────────────────────────
Detects whether a query is in a non-English script and translates it
to English before it reaches the embedding / keyword pipeline.

Design decisions
────────────────
* **Zero new dependencies.** `litellm` is already in requirements.txt and
  can proxy to any provider (Gemini, OpenAI, etc.) via env-vars you already
  have.  Detection is done with stdlib `unicodedata` + a simple Unicode-range
  check — no langdetect/polyglot needed.
* **Fail-open.** If the API call fails for any reason the original query is
  returned unchanged, so the rest of the pipeline never crashes.
* **Caching.** An in-process LRU cache avoids re-translating the same query
  twice in the same server session (helpful for hackathon demos).
* **Provider-agnostic.** Set the env-var TRANSLATION_MODEL to any litellm
  model string.  Defaults to "gemini/gemini-1.5-flash" which is free-tier.
  You can switch to "openai/gpt-4o-mini" or "ollama/mistral" with no code
  change.

Environment variables (add to your .env)
─────────────────────────────────────────
  TRANSLATION_MODEL=gemini/gemini-1.5-flash   # or openai/gpt-4o-mini etc.
  GEMINI_API_KEY=...                           # if using Gemini
  OPENAI_API_KEY=...                           # if using OpenAI

Usage
─────
  from app.services.query_translation import translate_query_to_english

  english_query = translate_query_to_english("सीमेंट की मजबूती मानक")
  # → "Cement strength standard"
"""

from __future__ import annotations

import logging
import unicodedata
from functools import lru_cache

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Script detection helpers
# ──────────────────────────────────────────────────────────────────────────────

# Unicode codepoint ranges for Indic / CJK scripts that are NOT Latin.
# Devanagari covers Hindi, Marathi, Sanskrit.
# We also cover Tamil, Bengali, Telugu, Kannada, Malayalam, Gujarati, Gurmukhi
# so voice input in any of those languages works too.
_NON_LATIN_RANGES: list[tuple[int, int]] = [
    (0x0900, 0x097F),   # Devanagari (Hindi, Marathi, Sanskrit)
    (0x0980, 0x09FF),   # Bengali
    (0x0A00, 0x0A7F),   # Gurmukhi (Punjabi)
    (0x0A80, 0x0AFF),   # Gujarati
    (0x0B00, 0x0B7F),   # Oriya
    (0x0B80, 0x0BFF),   # Tamil
    (0x0C00, 0x0C7F),   # Telugu
    (0x0C80, 0x0CFF),   # Kannada
    (0x0D00, 0x0D7F),   # Malayalam
    (0x0E00, 0x0E7F),   # Thai
    (0x0E80, 0x0EFF),   # Lao
    (0x0F00, 0x0FFF),   # Tibetan
    (0x4E00, 0x9FFF),   # CJK Unified Ideographs (Chinese, Japanese Kanji)
    (0xAC00, 0xD7AF),   # Korean Hangul
    (0x0600, 0x06FF),   # Arabic
    (0x0590, 0x05FF),   # Hebrew
]


def _is_non_latin_char(char: str) -> bool:
    """Return True if the character belongs to a non-Latin script."""
    cp = ord(char)
    return any(lo <= cp <= hi for lo, hi in _NON_LATIN_RANGES)


def needs_translation(text: str, threshold: float = 0.15) -> bool:
    """
    Return True if more than `threshold` fraction of the alphabetic
    characters in `text` are from a non-Latin script.

    A 15 % threshold means a single Devanagari word in an otherwise English
    sentence triggers translation, which is the right call for mixed-script
    technical queries ("I need सीमेंट standard").
    """
    if not text:
        return False

    alpha_chars = [
        ch for ch in text
        if not ch.isspace() and not ch.isdigit()
        # Skip punctuation
        and unicodedata.category(ch)[0] not in ("P", "S")
    ]

    if not alpha_chars:
        return False

    non_latin_count = sum(1 for ch in alpha_chars if _is_non_latin_char(ch))
    return (non_latin_count / len(alpha_chars)) >= threshold


# ──────────────────────────────────────────────────────────────────────────────
# Translation via litellm
# ──────────────────────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = (
    "You are a precise technical translator. "
    "Translate the user's query into English. "
    "The query is about industrial / manufacturing standards — "
    "preserve technical terms, material names, measurements, and "
    "standard numbers exactly as-is. "
    "Return ONLY the translated English text with no explanation, "
    "no preamble, and no quotation marks."
)


@lru_cache(maxsize=256)
def _cached_translate(text: str, model: str) -> str:
    """
    Internal cached translation call.  The LRU cache means we never hit the
    API twice for the same query string in the same server process.
    """
    try:
        import litellm  # lazy import — only needed when translation runs

        response = litellm.completion(
            model=model,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": text},
            ],
            max_tokens=512,
        )
        translated = response.choices[0].message.content.strip()

        if translated:
            logger.info(
                "Query translated | original=%r → translated=%r",
                text,
                translated,
            )
            return translated

    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "Translation failed (%s: %s) — using original query.",
            type(exc).__name__,
            exc,
        )

    return text   # fail-open: return original on any error


def translate_query_to_english(
    query: str,
    model: str | None = None,
) -> str:
    """
    Public entry point.

    1. If the query is already in Latin script → return as-is (fast path, no
       API call).
    2. Otherwise → translate via litellm and cache the result.

    Args:
        query:  The raw user query string.
        model:  Override the litellm model string.  Defaults to the value of
                the TRANSLATION_MODEL env-var, falling back to
                "gemini/gemini-1.5-flash".

    Returns:
        The English version of the query (or the original if translation was
        unnecessary or failed).
    """
    if not needs_translation(query):
        return query   # already Latin-script, nothing to do

    # Resolve model: caller override → settings → hardcoded default
    if model is None:
        try:
            from app.core.config import settings
            model = settings.translation_model
        except Exception:  # noqa: BLE001
            model = "gemini/gemini-1.5-flash"
    resolved_model = model

    return _cached_translate(query, resolved_model)

_TRANSLATE_TO_LANG_PROMPT = (
    "You are a precise technical translator. Translate the user's text into "
    "{lang}. The text is about industrial/manufacturing standards — preserve "
    "technical terms, material names, measurements, and standard numbers "
    "exactly as-is. Return ONLY the translated text, no explanation, no "
    "preamble, no quotation marks."
)


@lru_cache(maxsize=4096)
def _cached_translate_to_lang(text: str, lang: str, model: str) -> str:
    if not text or not text.strip():
        return text
    try:
        import litellm
        response = litellm.completion(
            model=model,
            messages=[
                {"role": "system", "content": _TRANSLATE_TO_LANG_PROMPT.format(lang=lang)},
                {"role": "user", "content": text},
            ],
            max_tokens=512,
        )
        translated = response.choices[0].message.content.strip()
        return translated or text
    except Exception as exc:  # noqa: BLE001
        logger.warning("Translation to %s failed (%s: %s) — using original text.", lang, type(exc).__name__, exc)
        return text


def translate_text(text: str, lang: str, model: str | None = None) -> str:
    """Translate arbitrary text INTO `lang` — any target language, not just
    English. Used by scripts/translate_catalogue.py for bulk catalogue
    translation. Kept separate from translate_query_to_english() above,
    which has its own fixed English-only system prompt and runs at request
    time for search queries, not bulk content translation — don't merge these
    two, they serve different call sites with different prompts.
    """
    if lang == "en":
        return text
    resolved_model = model
    if resolved_model is None:
        try:
            from app.core.config import settings
            resolved_model = settings.translation_model
        except Exception:  # noqa: BLE001
            resolved_model = "gemini/gemini-1.5-flash"
    return _cached_translate_to_lang(text, lang, resolved_model)