"""add_enrichment_columns

Revision ID: 2b4c6e8a0f1d
Revises: 1e3da984c80c
Create Date: 2026-10-25 08:15:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "2b4c6e8a0f1d"
down_revision: Union[str, Sequence[str], None] = "1e3da984c80c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add description_hash and enriched_at to jobs table."""
    op.add_column("jobs", sa.Column("description_hash", sa.String(length=64), nullable=True))
    op.add_column("jobs", sa.Column("enriched_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Remove description_hash and enriched_at from jobs table."""
    op.drop_column("jobs", "enriched_at")
    op.drop_column("jobs", "description_hash")
