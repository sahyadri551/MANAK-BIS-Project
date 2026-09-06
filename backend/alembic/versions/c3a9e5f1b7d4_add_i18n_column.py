"""add generic i18n json column (ta/bn) to standards

Revision ID: c3a9e5f1b7d4
Revises: b2f1a7c4d9e2
Create Date: 2026-06-06
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "c3a9e5f1b7d4"
down_revision: Union[str, None] = "b2f1a7c4d9e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("standards", sa.Column("i18n", postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column("standards", "i18n")
