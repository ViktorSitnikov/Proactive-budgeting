"""add drafts location coordinates polygon

Revision ID: c2a4f1d9e8ab
Revises: 08e10e57b5b7
Create Date: 2026-04-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c2a4f1d9e8ab"
down_revision: Union[str, Sequence[str], None] = "08e10e57b5b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("drafts", sa.Column("location", sa.String(), nullable=True))
    op.add_column("drafts", sa.Column("coordinates", sa.JSON(), nullable=True))
    op.add_column("drafts", sa.Column("polygon", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("drafts", "polygon")
    op.drop_column("drafts", "coordinates")
    op.drop_column("drafts", "location")
