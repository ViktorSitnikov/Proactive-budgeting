"""add projects geom point 4326

Revision ID: 37cfb22fc7a9
Revises: b15ce1ace06b
Create Date: 2026-04-08 13:10:36.454629

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry


# revision identifiers, used by Alembic.
revision: str = '37cfb22fc7a9'
down_revision: Union[str, Sequence[str], None] = 'b15ce1ace06b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    op.add_column(
        "projects",
        sa.Column("geom", Geometry(geometry_type="POINT", srid=4326), nullable=True),
    )
    op.create_index("ix_projects_geom", "projects", ["geom"], unique=False, postgresql_using="gist")
    op.execute(
        """
        UPDATE projects
        SET geom = ST_SetSRID(
            ST_MakePoint(
                (coordinates->>'lng')::double precision,
                (coordinates->>'lat')::double precision
            ),
            4326
        )
        WHERE coordinates IS NOT NULL
          AND (coordinates->>'lat') IS NOT NULL
          AND (coordinates->>'lng') IS NOT NULL;
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_projects_geom", table_name="projects")
    op.drop_column("projects", "geom")
