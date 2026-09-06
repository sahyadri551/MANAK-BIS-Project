"""Seed the database with mock standards and their relationships.

Idempotent: skips standards that already exist. Run with `--force` to wipe and
reload. Usage: `python -m scripts.seed_db` from the backend directory.
"""

import sys

from app.db.database import SessionLocal
from app.db.models.recommendation import Recommendation
from app.db.models.search_history import SearchHistory
from app.db.models.standard import Standard
from app.db.models.standard_relationship import StandardRelationship
from app.db.seed_data import STANDARDS
from app.db.seed_extra import EXTRA
from app.db.seed_hi import HINDI
from app.db.seed_i18n import TRANSLATIONS


def seed(force: bool = False) -> None:
    db = SessionLocal()
    try:
        if force:
            db.query(Recommendation).delete()
            db.query(SearchHistory).delete()
            db.query(StandardRelationship).delete()
            db.query(Standard).delete()
            db.commit()

        by_number: dict[str, Standard] = {}
        for row in STANDARDS + EXTRA:
            existing = db.query(Standard).filter_by(is_number=row["is_number"]).one_or_none()
            if existing:
                by_number[row["is_number"]] = existing
                continue
            data = {k: v for k, v in row.items() if k != "related"}
            hi = HINDI.get(row["is_number"], {})
            data["title_hi"] = hi.get("title")
            data["scope_hi"] = hi.get("scope")
            data["requirements_hi"] = hi.get("requirements")
            data["i18n"] = {
                lang: table[row["is_number"]]
                for lang, table in TRANSLATIONS.items()
                if row["is_number"] in table
            } or None
            std = Standard(**data)
            db.add(std)
            by_number[row["is_number"]] = std
        db.commit()

        for row in STANDARDS + EXTRA:
            source = by_number[row["is_number"]]
            for target_number in row.get("related", []):
                target = by_number.get(target_number)
                if not target:
                    continue
                exists = (
                    db.query(StandardRelationship)
                    .filter_by(source_standard_id=source.id, target_standard_id=target.id)
                    .first()
                )
                if not exists:
                    db.add(
                        StandardRelationship(
                            source_standard_id=source.id,
                            target_standard_id=target.id,
                            relationship_type="related",
                        )
                    )
        db.commit()
        print(f"Seeded {db.query(Standard).count()} standards, {db.query(StandardRelationship).count()} relationships.")
    finally:
        db.close()


if __name__ == "__main__":
    seed(force="--force" in sys.argv)
