from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import DBNPO
from schemas import NPO, NPOStatusUpdate


router = APIRouter()


@router.get("/api/npos", response_model=List[NPO])
async def get_npos(db: Session = Depends(get_db)):
    return db.query(DBNPO).all()


@router.patch("/api/npos/{npo_id}/status", response_model=NPO)
async def update_npo_status(npo_id: str, update: NPOStatusUpdate, db: Session = Depends(get_db)):
    npo = db.query(DBNPO).filter(DBNPO.id == npo_id).first()
    if not npo:
        raise HTTPException(status_code=404, detail="NPO not found")
    npo.status = update.status
    db.commit()
    db.refresh(npo)
    return npo
