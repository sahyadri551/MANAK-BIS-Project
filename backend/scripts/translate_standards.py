"""Generate multilingual standard content for the seeded BIS catalogue.

Run this one-off script from the backend directory after configuring the same
LiteLLM provider used by query_translation.py. It reads the English seed data,
generates title/scope/requirements for each requested language, and writes a
Python module that can be imported by seed_db.py.
"""

from __future__ import annotations

import json
from pathlib import Path

from app.db.seed_data import STANDARDS
from app.db.seed_extra import EXTRA
from app.services.query_translation import _cached_translate
from app.core.config import settings

LANGUAGES = ("te", "mr", "gu", "kn", "ml", "pa", "or", "ur")
OUTPUT = Path(__file__).with_name("seed_i18n_extra.py")


def translate(value: str, lang: str) -> str:
    prompt = f"Translate this BIS technical text into {lang}. Preserve IS numbers, units, grades and technical notation. Return only the translation.\n\n{value}"
    return _cached_translate(prompt, settings.translation_model)


def generate() -> None:
    rows = STANDARDS + EXTRA
    output: dict[str, dict[str, dict[str, object]]] = {lang: {} for lang in LANGUAGES}
    for row in rows:
        number = row["is_number"]
        for lang in LANGUAGES:
            output[lang][number] = {
                "title": translate(str(row.get("title", "")), lang),
                "scope": translate(str(row.get("scope", "")), lang),
                "requirements": [translate(str(item), lang) for item in (row.get("requirements") or [])],
            }
    OUTPUT.write_text("from __future__ import annotations\n\nEXTRA_TRANSLATIONS = " + repr(output) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT} for {len(rows)} standards and {len(LANGUAGES)} languages")


if __name__ == "__main__":
    generate()
