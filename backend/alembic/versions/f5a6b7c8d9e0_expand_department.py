"""Expand department column for enriched BIS catalogue."""

from alembic import op
import sqlalchemy as sa


revision = "f5a6b7c8d9e0"
down_revision = "e8f9a1b2c3d4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "standards",
        "department",
        existing_type=sa.String(length=128),
        type_=sa.String(length=512),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "standards",
        "department",
        existing_type=sa.String(length=512),
        type_=sa.String(length=128),
        existing_nullable=True,
    )