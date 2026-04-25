"""add project_photos and analysis_photos to projects

Revision ID: a4b5c6d7e8f9
Revises: e3f8a1b2c4d5
Create Date: 2026-04-16
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a4b5c6d7e8f9"
down_revision: Union[str, Sequence[str], None] = "e3f8a1b2c4d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("project_photos", sa.JSON(), nullable=True))
    op.add_column("projects", sa.Column("analysis_photos", sa.JSON(), nullable=True))
    op.execute(
        """
        UPDATE projects
        SET project_photos = COALESCE(project_photos, photos, '[]'::json),
            analysis_photos = COALESCE(analysis_photos, '[]'::json)
        """
    )


def downgrade() -> None:
    op.drop_column("projects", "analysis_photos")
    op.drop_column("projects", "project_photos")
