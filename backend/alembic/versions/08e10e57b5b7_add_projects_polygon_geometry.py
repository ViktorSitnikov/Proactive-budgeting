"""add projects polygon geometry

Revision ID: 08e10e57b5b7
Revises: 37cfb22fc7a9
Create Date: 2026-04-08 13:33:42.804951

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry


# revision identifiers, used by Alembic.
revision: str = '08e10e57b5b7'
down_revision: Union[str, Sequence[str], None] = '37cfb22fc7a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "projects",
        sa.Column("geom_polygon", Geometry(geometry_type="POLYGON", srid=4326), nullable=True),
    )
    op.create_index(
        "ix_projects_geom_polygon",
        "projects",
        ["geom_polygon"],
        unique=False,
        postgresql_using="gist",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_projects_geom_polygon", table_name="projects")
    op.drop_column("projects", "geom_polygon")
