from __future__ import annotations

import re
from typing import Literal

CertificationScheme = Literal["ISI_MANDATORY", "ISI_VOLUNTARY", "CRS", "HALLMARKING", "NONE"]


def classify(certification: str | None, has_qco_gazette: str | bool | None) -> tuple[CertificationScheme, bool]:
    text = " ".join(part for part in (certification, str(has_qco_gazette or "")) if part).strip().lower()
    if not text:
        return "NONE", False
    if re.search(r"\bcrs\b|compulsory registration", text):
        return "CRS", True
    if "hallmark" in text:
        return "HALLMARKING", True
    if "isi" in text or "is mark" in text or "qco" in text or "quality control order" in text:
        voluntary = any(term in text for term in ("voluntary", "optional", "not mandatory", "non-mandatory"))
        return ("ISI_VOLUNTARY", False) if voluntary else ("ISI_MANDATORY", True)
    return "NONE", False
