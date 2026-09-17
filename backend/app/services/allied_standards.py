from __future__ import annotations

from collections import OrderedDict
from typing import Iterable

from app.db.models.standard import Standard
from app.db.repositories.standard_repository import StandardRepository
from app.schemas.recommendation import AlliedStandardCategory, RelatedStandard
from app.services.localization import loc_aspect, loc_title


_ASPECT_CATEGORIES: dict[str, AlliedStandardCategory] = {
    "methods of test": "test_method",
    "method of test": "test_method",
    "test method": "test_method",
    "test methods": "test_method",
    "terminology": "terminology",
    "safety standard": "safety",
    "safety": "safety",
    "code of practice": "installation",
    "installation": "installation",
    "product specification": "product_spec",
    "product standard": "product_spec",
    "product spec": "product_spec",
}


def _category_from_aspect(aspect: str | None) -> AlliedStandardCategory | None:
    if not aspect:
        return None
    return _ASPECT_CATEGORIES.get(aspect.strip().lower())


def _normalise_is_numbers(values: Iterable[object] | None) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for value in values or []:
        if isinstance(value, dict):
            value = value.get("is_number") or value.get("standard") or value.get("name") or value.get("value")
        if value is None:
            continue
        number = str(value).strip()
        if number and number not in seen:
            seen.add(number)
            result.append(number)
    return result


def _add_target(
    grouped: OrderedDict[str, list[RelatedStandard]],
    target: Standard,
    category: AlliedStandardCategory,
    relationship_type: str,
    lang: str,
) -> None:
    grouped.setdefault(category, []).append(
        RelatedStandard(
            id=target.id,
            is_number=target.is_number,
            title=loc_title(target, lang),
            status=target.status,
            relationship_type=relationship_type,
            category=category,
        )
    )


def build_allied_standards(
    standard: Standard,
    repo: StandardRepository,
    lang: str = "en",
    relationships: list[tuple[Standard, str]] | None = None,
) -> list[RelatedStandard]:
    """Resolve and categorize all allied references for one standard.

    JSON reference lists are IS numbers, so they are resolved in one batch.
    Explicit relationship rows are retained and categorized from their
    relationship type first, then from the target standard aspect.
    """
    grouped: OrderedDict[str, list[RelatedStandard]] = OrderedDict()

    rels = relationships if relationships is not None else repo.related(standard.id)
    relation_categories: dict[str, AlliedStandardCategory] = {
        "supersedes": "supersedes",
        "superseded_by": "superseded_by",
    }

    json_groups: list[tuple[str, AlliedStandardCategory, list[object]]] = [
        ("cross_references", "normative_reference", standard.cross_references or []),
        ("referenced_by", "normative_reference", standard.referenced_by or []),
        ("supersedes", "supersedes", standard.supersedes or []),
        ("superseded_by", "superseded_by", standard.superseded_by or []),
    ]

    numbers: list[str] = []
    for _, _, values in json_groups:
        numbers.extend(_normalise_is_numbers(values))
    targets_by_number = {
        target.is_number: target
        for target in repo.get_by_is_numbers(numbers)
    }

    seen: set[tuple[int, str]] = set()

    for _, category, values in json_groups:
        relationship_type = _.replace("_", " ")
        for number in _normalise_is_numbers(values):
            target = targets_by_number.get(number)
            if not target:
                continue
            key = (target.id, category)
            if key in seen:
                continue
            seen.add(key)
            _add_target(grouped, target, category, relationship_type, lang)

    for target, relationship_type in rels:
        category = relation_categories.get(relationship_type)
        if category is None:
            category = _category_from_aspect(target.aspect) or "normative_reference"
        key = (target.id, category)
        if key in seen:
            continue
        seen.add(key)
        _add_target(grouped, target, category, relationship_type, lang)

    # Ensure aspect-derived categories are also represented when the JSON
    # reference is present without an explicit relationship row.
    flat = [item for values in grouped.values() for item in values]
    for item in flat:
        target = targets_by_number.get(item.is_number)
        if target is None:
            continue
        aspect_category = _category_from_aspect(target.aspect)
        if aspect_category and aspect_category != item.category:
            key = (target.id, aspect_category)
            if key not in seen:
                seen.add(key)
                _add_target(grouped, target, aspect_category, item.relationship_type, lang)

    return [item for values in grouped.values() for item in values]


def group_allied_standards(
    standards: Iterable[RelatedStandard],
) -> dict[str, list[RelatedStandard]]:
    grouped: dict[str, list[RelatedStandard]] = {}
    for standard in standards:
        if standard.category is None:
            continue
        grouped.setdefault(standard.category, []).append(standard)
    return grouped
