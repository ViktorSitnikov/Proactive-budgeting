"""Добавить колонки proposal_document_* если их нет (обход рассинхрона alembic)."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"), override=True)

url = os.getenv("DATABASE_URL")
if not url:
    raise SystemExit("DATABASE_URL не задан")

engine = create_engine(url)
with engine.begin() as conn:
    for col, col_type in (
        ("proposal_document_html", "TEXT"),
        ("proposal_document_path", "VARCHAR"),
    ):
        exists = conn.execute(
            text(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_name = 'projects' AND column_name = :name"
            ),
            {"name": col},
        ).scalar()
        if exists:
            print(f"OK: {col} уже есть")
        else:
            conn.execute(text(f"ALTER TABLE projects ADD COLUMN {col} {col_type}"))
            print(f"ADDED: {col}")

print("Готово.")
