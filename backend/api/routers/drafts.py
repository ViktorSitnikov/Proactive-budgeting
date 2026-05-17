import uuid
from typing import Dict, List

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from api.ai_client import post_check_idea, try_parse_json
from api.auth import get_current_user
from api.utils import build_point_wkt, build_polygon_wkt, derive_coordinates_from_polygon, project_row_to_draft, utcnow
from database import get_db
from models import DBProject, DBUser
from schemas import Draft


router = APIRouter()


async def _update_draft_category_bg(draft_id: str, description: str):
    from database import SessionLocal

    try:
        ai_resp = await post_check_idea(description)
        if ai_resp.status_code == 200:
            ai_data = try_parse_json(ai_resp)
            if isinstance(ai_data, dict) and ai_data.get("category"):
                    with SessionLocal() as db:
                        draft = db.query(DBProject).filter(DBProject.id == draft_id).first()
                        if draft:
                            draft.type = ai_data["category"]
                            db.commit()
    except Exception as exc:
        print(f"Ошибка фонового обновления категории черновика: {exc}")


@router.get("/api/projects/drafts", response_model=List[Draft])
async def get_drafts(current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(DBProject).filter(DBProject.initiatorId == current_user.id, DBProject.status == "DRAFT").all()
    return [project_row_to_draft(project) for project in rows]


@router.post("/api/projects/drafts", response_model=Draft)
async def create_draft(
    background_tasks: BackgroundTasks,
    draft_data: Dict = Body(...),
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = utcnow()
    polygon = draft_data.get("polygon")
    derived_coords = derive_coordinates_from_polygon(polygon)
    coords = derived_coords or draft_data.get("coordinates") or {"lat": 56.8389, "lng": 60.6057}
    new_draft = DBProject(
        id=str(uuid.uuid4()),
        initiatorId=current_user.id,
        title=draft_data.get("title", "Новый черновик"),
        description=draft_data.get("description", ""),
        budget=0,
        image=draft_data.get(
            "image",
            "https://images.unsplash.com/photo-1585829365291-1762f55e972e?q=80&w=800&auto=format&fit=crop",
        ),
        location=draft_data.get("location") or "Не указано",
        coordinates=coords,
        status="DRAFT",
        createdAt=now.strftime("%Y-%m-%d"),
        participants=[],
        pendingJoinRequests=[],
        ngoPartnerRequests=[],
        resources=draft_data.get("resources", []),
        type=draft_data.get("type"),
        draft_step=draft_data.get("step", 1),
        photos=draft_data.get("projectPhotos") or draft_data.get("photos"),
        project_photos=draft_data.get("projectPhotos") or draft_data.get("photos"),
        analysis_photos=draft_data.get("analysisPhotos"),
        polygon=polygon,
        created_at=now,
        updated_at=now,
        geom=build_point_wkt(coords) if coords else None,
        geom_polygon=build_polygon_wkt(polygon) if polygon else None,
    )

    db.add(new_draft)
    db.commit()
    db.refresh(new_draft)

    description = new_draft.description
    if description and len(description) > 10:
        background_tasks.add_task(_update_draft_category_bg, new_draft.id, description)

    return project_row_to_draft(new_draft)


@router.get("/api/projects/drafts/{draft_id}", response_model=Draft)
async def get_draft(draft_id: str, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    draft = (
        db.query(DBProject)
        .filter(DBProject.id == draft_id, DBProject.initiatorId == current_user.id, DBProject.status == "DRAFT")
        .first()
    )
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return project_row_to_draft(draft)


@router.patch("/api/projects/drafts/{draft_id}", response_model=Draft)
async def update_draft(
    draft_id: str,
    background_tasks: BackgroundTasks,
    draft_data: Dict = Body(...),
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    draft = (
        db.query(DBProject)
        .filter(DBProject.id == draft_id, DBProject.initiatorId == current_user.id, DBProject.status == "DRAFT")
        .first()
    )
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    payload = dict(draft_data)
    should_check_ai = False
    if "description" in payload:
        old_desc = draft.description or ""
        new_desc = payload["description"] or ""
        if new_desc != old_desc and len(new_desc) > 10:
            should_check_ai = True

    if "step" in payload:
        payload["draft_step"] = payload.pop("step")
    if "polygon" in payload:
        derived_coords = derive_coordinates_from_polygon(payload.get("polygon"))
        if derived_coords:
            payload["coordinates"] = derived_coords
        polygon = payload.get("polygon")
        draft.geom_polygon = build_polygon_wkt(polygon) if polygon else None

    if "coordinates" in payload:
        draft.geom = build_point_wkt(payload.get("coordinates"))

    skip = {"id", "initiatorId", "lastModified", "status"}
    for key, value in payload.items():
        if key in skip:
            continue
        if hasattr(draft, key):
            setattr(draft, key, value)
    if "projectPhotos" in payload:
        draft.project_photos = payload.get("projectPhotos")
        draft.photos = payload.get("projectPhotos")
    if "analysisPhotos" in payload:
        draft.analysis_photos = payload.get("analysisPhotos")

    draft.updated_at = utcnow()
    if draft.coordinates:
        draft.geom = build_point_wkt(draft.coordinates)
    db.commit()
    db.refresh(draft)

    if should_check_ai:
        background_tasks.add_task(_update_draft_category_bg, draft.id, draft.description)

    return project_row_to_draft(draft)


@router.delete("/api/projects/drafts/{draft_id}")
async def delete_draft(draft_id: str, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    draft = (
        db.query(DBProject)
        .filter(DBProject.id == draft_id, DBProject.initiatorId == current_user.id, DBProject.status == "DRAFT")
        .first()
    )
    if draft:
        db.delete(draft)
        db.commit()
    return {"message": "Draft deleted"}
