import pickle
import math
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models.standard import Standard


BASE_DIR = Path(__file__).resolve().parents[1]

PKL_FILE = (
    BASE_DIR
    / "app"
    / "ml"
    / "artifacts"
    / "standards.pkl"
)


def clean(value):
    if value is None:
        return None

    if isinstance(value, float) and math.isnan(value):
        return None

    return str(value).strip()


def main():

    print("=" * 60)
    print("IMPORTING BIS CATALOGUE INTO POSTGRESQL")
    print("=" * 60)

    # --------------------------------------------------
    # Load catalogue
    # --------------------------------------------------

    print("\nLoading standards.pkl...")

    with open(PKL_FILE, "rb") as f:
        df = pickle.load(f)

    print(f"Loaded: {len(df):,} records")

    # --------------------------------------------------
    # Remove invalid IS numbers
    # --------------------------------------------------

    df["is_number"] = df["is_number"].apply(clean)

    before = len(df)

    df = df[
        df["is_number"].notna()
        & (df["is_number"] != "")
    ].copy()

    print(
        f"Removed invalid records: "
        f"{before - len(df):,}"
    )

    # --------------------------------------------------
    # Deduplicate IS numbers
    # --------------------------------------------------

    duplicates = (
        df["is_number"]
        .duplicated(keep=False)
        .sum()
    )

    print(
        f"Duplicate records found: "
        f"{duplicates:,}"
    )

    # Sort so latest year is preferred
    df["_year_sort"] = (
        df["year"]
        .fillna(0)
    )

    df = df.sort_values(
        "_year_sort",
        ascending=False,
    )

    # Keep latest occurrence
    df = df.drop_duplicates(
        subset=["is_number"],
        keep="first",
    )

    df = df.drop(
        columns=["_year_sort"]
    )

    print(
        f"Unique standards to import: "
        f"{len(df):,}"
    )

    # --------------------------------------------------
    # Database
    # --------------------------------------------------

    engine = create_engine(
        settings.database_url
    )

    with Session(engine) as db:

        # --------------------------------------------------
        # Clear demo data
        # --------------------------------------------------

        print("\nClearing existing standards...")

        db.execute(
            text(
                "TRUNCATE TABLE standards "
                "RESTART IDENTITY CASCADE"
            )
        )

        db.commit()

        print("Existing data cleared.")

        # --------------------------------------------------
        # Insert
        # --------------------------------------------------

        print("\nImporting BIS standards...")

        inserted = 0

        for _, row in df.iterrows():

            is_number = clean(
                row.get("is_number")
            )

            title = clean(
                row.get("is_title")
            )

            status = (
                clean(row.get("status"))
                or "Active"
            )

            aspect = clean(
                row.get("aspect")
            )

            department = clean(
                row.get("department")
            )

            year = row.get("year")

            if year is not None:
                try:
                    year = int(float(year))
                except (
                    ValueError,
                    TypeError,
                ):
                    year = None

            domain = (
                department.lower()
                if department
                else "others"
            )

            standard = Standard(
                is_number=is_number,
                title=(
                    title
                    or is_number
                    or "Unknown"
                ),
                status=status,
                department=department,
                aspect=aspect,
                domain=domain,
                description="",
                scope="",
                keywords=[],
                requirements=[],
                title_hi=None,
                scope_hi=None,
                requirements_hi=[],
                i18n={},
                year=year,
                reaffirmation_year=None,
            )

            db.add(standard)

            inserted += 1

            if inserted % 1000 == 0:

                db.commit()

                print(
                    f"Imported "
                    f"{inserted:,} / "
                    f"{len(df):,}"
                )

        db.commit()

        # --------------------------------------------------
        # Verify
        # --------------------------------------------------

        total = db.execute(
            text(
                "SELECT COUNT(*) FROM standards"
            )
        ).scalar()

        print(
            f"\nPostgreSQL total: "
            f"{total:,}"
        )

    print("\n" + "=" * 60)
    print("IMPORT COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()