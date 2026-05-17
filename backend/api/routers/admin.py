from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import DBGlobalSettings, DBKnowledgeBaseEntry, DBTemplate
from schemas import GlobalSettings, KnowledgeBaseEntry, Template


router = APIRouter()


@router.get("/api/admin/settings", response_model=GlobalSettings)
async def get_settings(db: Session = Depends(get_db)):
    settings = db.query(DBGlobalSettings).filter(DBGlobalSettings.id == 1).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    return settings


@router.get("/api/admin/templates", response_model=List[Template])
async def get_templates(db: Session = Depends(get_db)):
    return db.query(DBTemplate).all()


@router.get("/api/admin/knowledge-base", response_model=List[KnowledgeBaseEntry])
async def get_knowledge_base(db: Session = Depends(get_db)):
    return db.query(DBKnowledgeBaseEntry).all()
