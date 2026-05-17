"""add proposal document fields

Revision ID: c8d9e0f1a2b3
Revises:
Create Date: 2026-05-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c8d9e0f1a2b3"
down_revision: Union[str, None] = "a4b5c6d7e8f9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("proposal_document_html", sa.Text(), nullable=True))
    op.add_column("projects", sa.Column("proposal_document_path", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("projects", "proposal_document_path")
    op.drop_column("projects", "proposal_document_html")
