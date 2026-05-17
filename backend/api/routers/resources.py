from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import DBOpportunity, DBResource
from schemas import Opportunity, Resource


router = APIRouter()


@router.get("/api/resources", response_model=List[Resource])
async def get_resources(db: Session = Depends(get_db)):
    return db.query(DBResource).all()


@router.get("/api/opportunities", response_model=List[Opportunity])
async def get_opportunities(db: Session = Depends(get_db)):
    return db.query(DBOpportunity).all()
