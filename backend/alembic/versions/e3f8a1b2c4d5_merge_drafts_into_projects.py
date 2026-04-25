"""merge drafts into projects + timestamptz + fk initiator

Revision ID: e3f8a1b2c4d5
Revises: c2a4f1d9e8ab
Create Date: 2026-04-11

Черновики переносятся в projects со status=DRAFT; таблица drafts удаляется.
Добавляются draft_step, photos, polygon (json), created_at, updated_at и FK initiatorId -> users.

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "e3f8a1b2c4d5"
down_revision: Union[str, Sequence[str], None] = "c2a4f1d9e8ab"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("draft_step", sa.Integer(), nullable=True))
    op.add_column("projects", sa.Column("photos", sa.JSON(), nullable=True))
    op.add_column("projects", sa.Column("polygon", sa.JSON(), nullable=True))
    op.add_column(
        "projects",
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "projects",
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.execute(
        """
        UPDATE projects
        SET created_at = COALESCE(created_at, now()),
            updated_at = COALESCE(updated_at, now())
        WHERE created_at IS NULL OR updated_at IS NULL;
        """
    )

    bind = op.get_bind()
    insp = inspect(bind)
    tables = insp.get_table_names()

    if "drafts" in tables:
        op.execute(
            """
            INSERT INTO projects (
                id, title, description, budget, image, location, coordinates, status,
                "initiatorId", "npoId", "createdAt", participants, "pendingJoinRequests",
                "ngoPartnerRequests", resources, type,
                ai_score, "rejection_reason", "image_analysis", search_radius,
                geom, geom_polygon,
                draft_step, photos, polygon, created_at, updated_at
            )
            SELECT
                d.id,
                d.title,
                d.description,
                0,
                'https://images.unsplash.com/photo-1585829365291-1762f55e972e?q=80&w=800&auto=format&fit=crop',
                COALESCE(d.location, 'Не указано'),
                COALESCE(d.coordinates, '{"lat": 56.8389, "lng": 60.6057}'::json),
                'DRAFT',
                d."initiatorId",
                NULL,
                to_char(now(), 'YYYY-MM-DD'),
                '[]'::json,
                '[]'::json,
                '[]'::json,
                COALESCE(d.resources, '[]'::json),
                d.type,
                0,
                NULL,
                NULL,
                500,
                NULL,
                NULL,
                d.step,
                NULL,
                d.polygon,
                COALESCE(NULLIF(d."lastModified", '')::timestamptz, now()),
                now()
            FROM drafts d
            WHERE NOT EXISTS (SELECT 1 FROM projects p WHERE p.id = d.id);
            """
        )
        op.drop_table("drafts")

    # Ссылки инициатора на существующего пользователя (иначе VALIDATE CONSTRAINT упадёт)
    op.execute(
        """
        UPDATE projects p
        SET "initiatorId" = (SELECT u.id FROM users u ORDER BY u.id LIMIT 1)
        WHERE p."initiatorId" IS NULL
           OR NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p."initiatorId");
        """
    )

    op.create_foreign_key(
        "fk_projects_initiator_users",
        "projects",
        "users",
        ["initiatorId"],
        ["id"],
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    op.drop_constraint("fk_projects_initiator_users", "projects", type_="foreignkey")
    op.drop_column("projects", "updated_at")
    op.drop_column("projects", "created_at")
    op.drop_column("projects", "polygon")
    op.drop_column("projects", "photos")
    op.drop_column("projects", "draft_step")
    # Восстановление таблицы drafts и данных из projects со status DRAFT не выполняется автоматически.
