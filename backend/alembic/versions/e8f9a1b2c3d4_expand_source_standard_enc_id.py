"""Expand source standard encrypted ID column."""

from alembic import op
import sqlalchemy as sa


revision = "e8f9a1b2c3d4"
down_revision = "d4e7f8a9b1c2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "standards",
        "source_standard_enc_id",
        existing_type=sa.String(length=128),
        type_=sa.Text(),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "standards",
        "source_standard_enc_id",
        existing_type=sa.Text(),
        type_=sa.String(length=128),
        existing_nullable=True,
    )