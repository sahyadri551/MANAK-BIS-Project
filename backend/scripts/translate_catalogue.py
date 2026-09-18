"""Translate the standards actually stored in the database — works against
whatever's in the `standards` table, whether that's the small demo seed set
or your real imported BIS catalogue. Unlike the old translate_standards.py,
this doesn't read seed_data.py/seed_extra.py, so it isn't blind to real data.

Writes directly into each Standard row's `i18n` JSONB column in the
database. Safe to re-run: skips any (standard, language) pair that already
has content, so an interrupted run just resumes.

Usage (from backend/):
    python -m scripts.translate_catalogue --languages ta,bn,te
    python -m scripts.translate_catalogue --languages all --limit 50 --dry-run
    python -m scripts.translate_catalogue --labels-only --languages hi,ta
"""
from __future__ import annotations

import argparse

from sqlalchemy import select

from app.db.database import SessionLocal
from app.db.models.standard import Standard
from app.services.query_translation import translate_text

ALL_LANGUAGES = ("hi", "ta", "bn", "te", "mr", "gu", "kn", "ml", "pa", "or", "ur")
BATCH_COMMIT_SIZE = 25


def _needs_translation(std: Standard, lang: str) -> bool:
    entry = (std.i18n or {}).get(lang)
    return not entry or not entry.get("title")


def translate_content(languages: list[str], limit: int | None, dry_run: bool) -> None:
    db = SessionLocal()
    try:
        stmt = select(Standard).order_by(Standard.id)
        if limit:
            stmt = stmt.limit(limit)
        standards = db.execute(stmt).scalars().all()
        print(f"Loaded {len(standards)} standards from the database.")

        processed = 0
        for std in standards:
            store = dict(std.i18n or {})
            changed = False

            for lang in languages:
                if not _needs_translation(std, lang):
                    continue
                store[lang] = {
                    "title": translate_text(std.title or "", lang),
                    "scope": translate_text(std.scope or "", lang) if std.scope else "",
                    "requirements": [translate_text(r, lang) for r in (std.requirements or [])],
                }
                changed = True

            if changed and not dry_run:
                std.i18n = store
                db.add(std)
                processed += 1
                if processed % BATCH_COMMIT_SIZE == 0:
                    db.commit()
                    print(f"  committed {processed} standards so far...")
            elif changed:
                print(f"  [dry-run] would translate {std.is_number}")

        if not dry_run:
            db.commit()
        print(f"Done. Translated content for {processed} standards.")
    finally:
        db.close()


def translate_labels(languages: list[str]) -> None:
    """One-off: translate the *distinct* department/aspect values actually
    present in your real data and print a dict to paste into
    app/services/i18n_labels.py — small finite set, doesn't need per-row work.
    """
    db = SessionLocal()
    try:
        departments = [r[0] for r in db.execute(
            select(Standard.department_name).distinct().where(Standard.department_name.isnot(None))
        ).all()]
        aspects = [r[0] for r in db.execute(
            select(Standard.aspect).distinct().where(Standard.aspect.isnot(None))
        ).all()]
        print(f"Found {len(departments)} distinct departments, {len(aspects)} distinct aspects.")

        for lang in languages:
            print(f'\n"{lang}": {{  # departments')
            for dept in departments:
                print(f"    {dept!r}: {translate_text(dept, lang)!r},")
            print("},")
            print(f'\n"{lang}": {{  # aspects')
            for aspect in aspects:
                print(f"    {aspect!r}: {translate_text(aspect, lang)!r},")
            print("},")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--languages", default="ta,bn,te,mr,gu,kn,ml,pa,or,ur")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--labels-only", action="store_true")
    args = parser.parse_args()

    languages = list(ALL_LANGUAGES) if args.languages == "all" else [l.strip() for l in args.languages.split(",") if l.strip()]

    if args.labels_only:
        translate_labels(languages)
    else:
        translate_content(languages, args.limit, args.dry_run)


if __name__ == "__main__":
    main()