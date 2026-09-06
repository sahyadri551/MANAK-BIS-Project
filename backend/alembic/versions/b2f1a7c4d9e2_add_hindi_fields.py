"""add hindi localized fields to standards

Revision ID: b2f1a7c4d9e2
Revises: 9b190b9aad17
Create Date: 2026-06-05
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "b2f1a7c4d9e2"
down_revision: Union[str, None] = "9b190b9aad17"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("standards", sa.Column("title_hi", sa.String(length=512), nullable=True))
    op.add_column("standards", sa.Column("scope_hi", sa.Text(), nullable=True))
    op.add_column("standards", sa.Column("requirements_hi", postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column("standards", "requirements_hi")
    op.drop_column("standards", "scope_hi")
    op.drop_column("standards", "title_hi")
