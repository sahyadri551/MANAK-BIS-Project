"""add enriched standard metadata fields

Revision ID: d4e7f8a9b1c2
Revises: c3a9e5f1b7d4
Create Date: 2026-09-08
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "d4e7f8a9b1c2"

down_revision: Union[str, None] = "c3a9e5f1b7d4"

branch_labels: Union[str, Sequence[str], None] = None

depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    # ============================================================
    # IDENTIFICATION
    # ============================================================

    op.add_column(
        "standards",
        sa.Column(
            "short_title",
            sa.String(length=1024),
            nullable=True,
        ),
    )

    # ============================================================
    # CLASSIFICATION
    # ============================================================

    op.add_column(
        "standards",
        sa.Column(
            "department_name",
            sa.String(length=512),
            nullable=True,
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "department_alias",
            sa.String(length=256),
            nullable=True,
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "group_classification",
            sa.String(length=1024),
            nullable=True,
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "group",
            sa.String(length=512),
            nullable=True,
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "sub_group",
            sa.String(length=512),
            nullable=True,
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "sub_sub_group",
            sa.String(length=512),
            nullable=True,
        ),
    )

    # ============================================================
    # PUBLICATION / VALIDITY
    # ============================================================

    op.add_column(
        "standards",
        sa.Column(
            "published_on",
            sa.String(length=64),
            nullable=True,
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "valid_upto",
            sa.String(length=64),
            nullable=True,
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "review_on",
            sa.String(length=64),
            nullable=True,
        ),
    )

    # ============================================================
    # AMENDMENT / REVISION
    # ============================================================

    op.add_column(
        "standards",
        sa.Column(
            "amendment_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "no_of_revision",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "latest_version",
            sa.String(length=16),
            nullable=True,
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "standard_base",
            sa.String(length=512),
            nullable=True,
        ),
    )

    # ============================================================
    # TECHNICAL / REFERENCE INFORMATION
    # ============================================================

    op.add_column(
        "standards",
        sa.Column(
            "degree_of_equivalence",
            sa.String(length=512),
            nullable=True,
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "ics_code",
            sa.String(length=256),
            nullable=True,
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "language",
            sa.String(length=256),
            nullable=True,
        ),
    )

    # ============================================================
    # ORGANIZATIONAL INFORMATION
    # ============================================================

    op.add_column(
        "standards",
        sa.Column(
            "ministry",
            sa.String(length=512),
            nullable=True,
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "committee_name",
            sa.String(length=1024),
            nullable=True,
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "member_secretary",
            sa.String(length=1024),
            nullable=True,
        ),
    )

    # ============================================================
    # CERTIFICATION / POLICY
    # ============================================================

    op.add_column(
        "standards",
        sa.Column(
            "certification",
            sa.String(length=512),
            nullable=True,
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "has_qco_gazette",
            sa.String(length=64),
            nullable=True,
        ),
    )

    # ============================================================
    # SDG
    # ============================================================

    op.add_column(
        "standards",
        sa.Column(
            "sdg_goals",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )

    # ============================================================
    # CROSS REFERENCES
    # ============================================================

    op.add_column(
        "standards",
        sa.Column(
            "cross_references",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "referenced_by",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "supersedes",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "superseded_by",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )

    # ============================================================
    # SOURCE IDENTIFIERS
    # ============================================================

    op.add_column(
        "standards",
        sa.Column(
            "source_standard_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "source_standard_enc_id",
            sa.String(length=1024),
            nullable=True,
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "source_department_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "source_committee_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "standards",
        sa.Column(
            "raw_is_status",
            sa.Integer(),
            nullable=True,
        ),
    )

    # ============================================================
    # INDEXES
    # ============================================================

    op.create_index(
        "ix_standards_group",
        "standards",
        ["group"],
        unique=False,
    )

    op.create_index(
        "ix_standards_sub_group",
        "standards",
        ["sub_group"],
        unique=False,
    )

    op.create_index(
        "ix_standards_sub_sub_group",
        "standards",
        ["sub_sub_group"],
        unique=False,
    )

    op.create_index(
        "ix_standards_ministry",
        "standards",
        ["ministry"],
        unique=False,
    )

    op.create_index(
        "ix_standards_committee_name",
        "standards",
        ["committee_name"],
        unique=False,
    )

    # Remove temporary server defaults after existing rows
    # have received 0.
    op.alter_column(
        "standards",
        "amendment_count",
        server_default=None,
    )

    op.alter_column(
        "standards",
        "no_of_revision",
        server_default=None,
    )


def downgrade() -> None:

    # ============================================================
    # INDEXES
    # ============================================================

    op.drop_index(
        "ix_standards_committee_name",
        table_name="standards",
    )

    op.drop_index(
        "ix_standards_ministry",
        table_name="standards",
    )

    op.drop_index(
        "ix_standards_sub_sub_group",
        table_name="standards",
    )

    op.drop_index(
        "ix_standards_sub_group",
        table_name="standards",
    )

    op.drop_index(
        "ix_standards_group",
        table_name="standards",
    )

    # ============================================================
    # SOURCE IDENTIFIERS
    # ============================================================

    op.drop_column(
        "standards",
        "raw_is_status",
    )

    op.drop_column(
        "standards",
        "source_committee_id",
    )

    op.drop_column(
        "standards",
        "source_department_id",
    )

    op.drop_column(
        "standards",
        "source_standard_enc_id",
    )

    op.drop_column(
        "standards",
        "source_standard_id",
    )

    # ============================================================
    # CROSS REFERENCES
    # ============================================================

    op.drop_column(
        "standards",
        "superseded_by",
    )

    op.drop_column(
        "standards",
        "supersedes",
    )

    op.drop_column(
        "standards",
        "referenced_by",
    )

    op.drop_column(
        "standards",
        "cross_references",
    )

    # ============================================================
    # SDG
    # ============================================================

    op.drop_column(
        "standards",
        "sdg_goals",
    )

    # ============================================================
    # CERTIFICATION / POLICY
    # ============================================================

    op.drop_column(
        "standards",
        "has_qco_gazette",
    )

    op.drop_column(
        "standards",
        "certification",
    )

    # ============================================================
    # ORGANIZATIONAL INFORMATION
    # ============================================================

    op.drop_column(
        "standards",
        "member_secretary",
    )

    op.drop_column(
        "standards",
        "committee_name",
    )

    op.drop_column(
        "standards",
        "ministry",
    )

    # ============================================================
    # TECHNICAL / REFERENCE
    # ============================================================

    op.drop_column(
        "standards",
        "language",
    )

    op.drop_column(
        "standards",
        "ics_code",
    )

    op.drop_column(
        "standards",
        "degree_of_equivalence",
    )

    # ============================================================
    # AMENDMENT / REVISION
    # ============================================================

    op.drop_column(
        "standards",
        "standard_base",
    )

    op.drop_column(
        "standards",
        "latest_version",
    )

    op.drop_column(
        "standards",
        "no_of_revision",
    )

    op.drop_column(
        "standards",
        "amendment_count",
    )

    # ============================================================
    # PUBLICATION / VALIDITY
    # ============================================================

    op.drop_column(
        "standards",
        "review_on",
    )

    op.drop_column(
        "standards",
        "valid_upto",
    )

    op.drop_column(
        "standards",
        "published_on",
    )

    # ============================================================
    # GROUP CLASSIFICATION
    # ============================================================

    op.drop_column(
        "standards",
        "sub_sub_group",
    )

    op.drop_column(
        "standards",
        "sub_group",
    )

    op.drop_column(
        "standards",
        "group",
    )

    op.drop_column(
        "standards",
        "group_classification",
    )

    # ============================================================
    # BASIC CLASSIFICATION
    # ============================================================

    op.drop_column(
        "standards",
        "department_alias",
    )

    op.drop_column(
        "standards",
        "department_name",
    )

    # ============================================================
    # IDENTIFICATION
    # ============================================================

    op.drop_column(
        "standards",
        "short_title",
    )