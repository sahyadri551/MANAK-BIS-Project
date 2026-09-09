import json
import math
import sys
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models.standard import Standard


BASE_DIR = Path(__file__).resolve().parents[1]

DEFAULT_JSONL_FILE = (
    BASE_DIR
    / "data"
    / "new_portal_catalog_enriched.jsonl"
)


def clean(value):
    if value is None:
        return None

    if isinstance(value, float) and math.isnan(value):
        return None

    if isinstance(value, str):
        value = value.strip()

        if value in ("", "None", "nan", "NaN"):
            return None

        return value

    return value


def clean_string(value):
    value = clean(value)

    if value is None:
        return None

    return str(value).strip()


def clean_list(value):
    if value is None:
        return []

    if isinstance(value, float) and math.isnan(value):
        return []

    if isinstance(value, list):
        return [
            clean_string(item)
            for item in value
            if clean_string(item)
        ]

    if isinstance(value, tuple):
        return [
            clean_string(item)
            for item in value
            if clean_string(item)
        ]

    if isinstance(value, str):
        value = value.strip()

        if not value or value in ("None", "nan", "NaN"):
            return []

        try:
            parsed = json.loads(value)

            if isinstance(parsed, list):
                return [
                    clean_string(item)
                    for item in parsed
                    if clean_string(item)
                ]
        except (json.JSONDecodeError, TypeError):
            pass

        return [value]

    return [str(value)]


def clean_bool_string(value):
    value = clean(value)

    if value is None:
        return None

    if isinstance(value, bool):
        return "true" if value else "false"

    return str(value)


def clean_int(value):
    value = clean(value)

    if value is None:
        return None

    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None


def extract_year(row):
    year = clean_int(row.get("year"))

    if year:
        return year

    published_on = clean_string(
        row.get("_published_on")
    )

    if published_on:
        for part in published_on.replace("-", "/").split("/"):
            if len(part) == 4 and part.isdigit():
                return int(part)

    is_number = clean_string(
        row.get("is_number")
    )

    if is_number:
        parts = is_number.split(":")

        for part in reversed(parts):
            part = part.strip()

            if len(part) == 4 and part.isdigit():
                return int(part)

    return None


def derive_domain(row):
    department_alias = clean_string(
        row.get("department_alias")
    )

    department = clean_string(
        row.get("department")
    )

    return (
        department_alias
        or department
        or "others"
    ).lower()


def load_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(
            f"JSONL file not found:\n{path}"
        )

    records = []

    with path.open(
        "r",
        encoding="utf-8",
    ) as file:
        for line_number, line in enumerate(
            file,
            start=1,
        ):
            line = line.strip()

            if not line:
                continue

            try:
                row = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(
                    f"Invalid JSON on line {line_number}: "
                    f"{exc}"
                ) from exc

            if not isinstance(row, dict):
                continue

            records.append(row)

    return records


def main():
    print("=" * 70)
    print("IMPORTING NEW BIS CATALOGUE INTO POSTGRESQL")
    print("=" * 70)

    # --------------------------------------------------
    # Input file
    # --------------------------------------------------

    if len(sys.argv) > 1:
        jsonl_file = Path(sys.argv[1]).expanduser()
    else:
        jsonl_file = DEFAULT_JSONL_FILE

    print(
        f"\nCatalogue file:\n{jsonl_file}"
    )

    # --------------------------------------------------
    # Load JSONL
    # --------------------------------------------------

    print("\nLoading new catalogue...")

    rows = load_jsonl(jsonl_file)

    print(
        f"Loaded: {len(rows):,} records"
    )

    if not rows:
        raise ValueError(
            "The catalogue contains no records."
        )

    # --------------------------------------------------
    # Validate and deduplicate
    # --------------------------------------------------

    valid_rows = []

    for row in rows:
        is_number = clean_string(
            row.get("is_number")
        )

        if not is_number:
            continue

        row["is_number"] = is_number
        valid_rows.append(row)

    print(
        f"Valid IS-number records: "
        f"{len(valid_rows):,}"
    )

    # Keep the latest occurrence when the same
    # IS number appears more than once.
    deduplicated = {}

    for row in valid_rows:
        is_number = row["is_number"]
        year = extract_year(row)

        existing = deduplicated.get(is_number)

        if existing is None:
            deduplicated[is_number] = row
            continue

        existing_year = extract_year(existing)

        if (
            year is not None
            and (
                existing_year is None
                or year > existing_year
            )
        ):
            deduplicated[is_number] = row

    rows = list(deduplicated.values())

    print(
        f"Unique standards: "
        f"{len(rows):,}"
    )

    # --------------------------------------------------
    # Database
    # --------------------------------------------------

    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,
    )

    with Session(engine) as db:

        # --------------------------------------------------
        # Remove OLD catalogue
        # --------------------------------------------------

        print(
            "\nClearing existing standards..."
        )

        db.execute(
            text(
                "TRUNCATE TABLE standards "
                "RESTART IDENTITY CASCADE"
            )
        )

        db.commit()

        print(
            "Existing standards removed."
        )

        # --------------------------------------------------
        # Insert NEW catalogue
        # --------------------------------------------------

        print(
            "\nImporting new BIS standards..."
        )

        inserted = 0

        for row in rows:

            is_number = clean_string(
                row.get("is_number")
            )

            title = (
                clean_string(
                    row.get("is_title")
                )
                or is_number
                or "Unknown"
            )

            status = (
                clean_string(
                    row.get("status")
                )
                or "Active"
            )

            department_name = (
                clean_string(
                    row.get("department_name")
                )
            )

            department_alias = (
                clean_string(
                    row.get("department_alias")
                )
            )
            department = (
                department_alias
                or department_name
                or clean_string(row.get("department"))
            )

            aspect = clean_string(
                row.get("aspect")
            )

            # Split the enriched group hierarchy into
            # group / sub_group / sub_sub_group.
            # Example:
            # A / B / C -> A, B, C
            group_classification = clean_string(
                row.get("group_classification")
            )

            hierarchy_parts = [
                part.strip()
                for part in (group_classification or "").split("/")
                if part.strip()
            ]

            group = (
                clean_string(row.get("group"))
                or (
                    hierarchy_parts[0]
                    if len(hierarchy_parts) > 0
                    else None
                )
            )

            sub_group = (
                clean_string(row.get("sub_group"))
                or (
                    hierarchy_parts[1]
                    if len(hierarchy_parts) > 1
                    else None
                )
            )

            sub_sub_group = (
                clean_string(row.get("sub_sub_group"))
                or (
                    hierarchy_parts[2]
                    if len(hierarchy_parts) > 2
                    else None
                )
            )

            year = extract_year(row)

            standard = Standard(
                # --------------------------------------------------
                # Identification
                # --------------------------------------------------
                is_number=is_number,
                title=title,
                short_title=clean_string(
                    row.get("short_title")
                ),

                # --------------------------------------------------
                # Classification
                # --------------------------------------------------
                status=status,
                department=department,
                department_name=department_name,
                department_alias=department_alias,
                aspect=aspect,
                domain=(
                    clean_string(row.get("domain"))
                    or derive_domain(row)
                ),

                group_classification=group_classification,
                group=group,
                sub_group=sub_group,
                sub_sub_group=sub_sub_group,

                # --------------------------------------------------
                # Publication
                # --------------------------------------------------
                year=year,
                published_on=clean_string(
                    row.get("_published_on")
                    or row.get("published_on")
                ),
                valid_upto=clean_string(
                    row.get("_valid_upto")
                    or row.get("valid_upto")
                ),
                reaffirmation_year=clean_int(
                    row.get("reaffirmation_year")
                ),
                review_on=clean_string(
                    row.get("review_on")
                ),

                # --------------------------------------------------
                # Revision
                # --------------------------------------------------
                amendment_count=(
                    clean_int(
                        row.get("amendment_count")
                    )
                    or 0
                ),
                no_of_revision=(
                    clean_int(
                        row.get("no_of_revision")
                    )
                    or 0
                ),
                latest_version=clean_string(
                    row.get("latest_version")
                ),
                standard_base=clean_string(
                    row.get("standard_base")
                ),

                # --------------------------------------------------
                # Technical information
                # --------------------------------------------------
                degree_of_equivalence=clean_string(
                    row.get("degree_of_equivalence")
                ),
                ics_code=clean_string(
                    row.get("ics_code")
                ),
                language=clean_string(
                    row.get("language")
                ),

                # --------------------------------------------------
                # Organization
                # --------------------------------------------------
                ministry=clean_string(
                    row.get("ministry")
                ),
                committee_name=clean_string(
                    row.get("committee_name")
                ),
                member_secretary=clean_string(
                    row.get("member_secretary")
                ),

                # --------------------------------------------------
                # Certification / policy
                # --------------------------------------------------
                certification=clean_string(
                    row.get("certification")
                ),
                has_qco_gazette=clean_bool_string(
                    row.get("has_qco_gazette")
                ),

                # --------------------------------------------------
                # Structured metadata
                # --------------------------------------------------
                sdg_goals=clean_list(
                    row.get("sdg_goals")
                ),
                cross_references=clean_list(
                    row.get("cross_references")
                ),
                referenced_by=clean_list(
                    row.get("referenced_by")
                ),
                supersedes=clean_list(
                    row.get("supersedes")
                ),
                superseded_by=clean_list(
                    row.get("superseded_by")
                ),

                # --------------------------------------------------
                # Content
                # --------------------------------------------------
                description=clean_string(
                    row.get("description")
                ) or "",
                scope=clean_string(
                    row.get("scope")
                ) or "",
                keywords=clean_list(
                    row.get("keywords")
                ),
                requirements=clean_list(
                    row.get("requirements")
                ),

                # --------------------------------------------------
                # Localization
                # --------------------------------------------------
                title_hi=clean_string(
                    row.get("title_hi")
                ),
                scope_hi=clean_string(
                    row.get("scope_hi")
                ),
                requirements_hi=clean_list(
                    row.get("requirements_hi")
                ),
                i18n=(
                    row.get("i18n")
                    if isinstance(
                        row.get("i18n"),
                        dict,
                    )
                    else {}
                ),

                # --------------------------------------------------
                # Source identifiers
                # --------------------------------------------------
            )
            db.add(standard)

            inserted += 1

            if inserted % 1000 == 0:
                db.commit()

                print(
                    f"Imported "
                    f"{inserted:,} / "
                    f"{len(rows):,}"
                )

        db.commit()

        # --------------------------------------------------
        # Verify
        # --------------------------------------------------

        total = db.execute(
            text(
                "SELECT COUNT(*) "
                "FROM standards"
            )
        ).scalar()

        print(
            f"\nPostgreSQL total: "
            f"{total:,}"
        )

    print("\n" + "=" * 70)
    print("NEW BIS CATALOGUE IMPORT COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()