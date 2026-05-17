import asyncio
import uuid
from math import atan2, cos, radians, sin, sqrt
from typing import Dict, List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from api.ai_client import post_check_idea, try_parse_json
from api.auth import get_current_user
from api.utils import build_point_wkt, build_polygon_wkt, derive_coordinates_from_polygon, utcnow
from api.websockets import manager
from database import get_db
from models import DBProject, DBProjectDetails, DBUser
from schemas import (
    AppealAction,
    JoinRequestAction,
    NGO_PartnerRequest,
    PartnerRequest,
    PolygonIntersectionRequest,
    Project,
    ProjectDetails,
    ProjectEstimateUpdate,
    ProjectStatusUpdate,
)


router = APIRouter()


@router.post("/api/projects", response_model=Project)
async def create_project(
    project_data: Dict = Body(...),
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resources = project_data.get("resources", [])
    total_budget = project_data.get("budget")
    if not total_budget:
        total_budget = sum(resource.get("basePrice", 0) * resource.get("quantity", 0) for resource in resources)

    polygon = project_data.get("polygon")
    coordinates = derive_coordinates_from_polygon(polygon) or project_data.get("coordinates", {"lat": 56.8380, "lng": 60.6030})
    project_photos = project_data.get("projectPhotos") or []
    analysis_photos = project_data.get("analysisPhotos") or []
    now = utcnow()
    draft_id = project_data.get("draftId")

    project_type = project_data.get("type", "Благоустройство")
    description = project_data.get("description", "")
    if description:
        try:
            ai_resp = await post_check_idea(description)
            if ai_resp.status_code == 200:
                ai_data = try_parse_json(ai_resp)
                if isinstance(ai_data, dict) and ai_data.get("category"):
                    project_type = ai_data["category"]
        except Exception as exc:
            print(f"Ошибка при определении категории проекта через ИИ: {exc}")

    if draft_id:
        existing = (
            db.query(DBProject)
            .filter(DBProject.id == draft_id, DBProject.initiatorId == current_user.id, DBProject.status == "DRAFT")
            .first()
        )
        if existing:
            existing.title = project_data.get("title", existing.title)
            existing.description = project_data.get("description", existing.description)
            existing.budget = total_budget
            existing.image = project_data.get(
                "image",
                existing.image or "https://images.unsplash.com/photo-1585829365291-1762f55e972e?q=80&w=800&auto=format&fit=crop",
            )
            if not project_data.get("image") and project_photos:
                existing.image = project_photos[0]
            existing.location = project_data.get("location", existing.location)
            existing.coordinates = coordinates
            existing.status = project_data.get("status", "ACTIVE")
            existing.resources = resources
            existing.type = project_type
            existing.ai_score = project_data.get("ai_score", 100)
            existing.search_radius = project_data.get("search_radius", 500)
            existing.geom = build_point_wkt(coordinates)
            existing.geom_polygon = build_polygon_wkt(polygon) if polygon else None
            existing.project_photos = project_photos
            existing.analysis_photos = analysis_photos
            existing.photos = project_photos
            if polygon is not None:
                existing.polygon = polygon
            existing.draft_step = None
            existing.updated_at = now
            existing.createdAt = project_data.get("createdAt") or now.strftime("%Y-%m-%d")
            parts = list(existing.participants or [])
            if current_user.name and current_user.name not in parts:
                parts.insert(0, current_user.name)
            if not parts:
                parts = [current_user.name]
            existing.participants = parts
            db.commit()
            db.refresh(existing)
            return existing

    new_project = DBProject(
        id=str(uuid.uuid4()),
        title=project_data.get("title", "Новый проект"),
        description=project_data.get("description", ""),
        budget=total_budget,
        image=project_data.get("image")
        or (project_photos[0] if project_photos else "https://images.unsplash.com/photo-1585829365291-1762f55e972e?q=80&w=800&auto=format&fit=crop"),
        location=project_data.get("location", "Не указано"),
        coordinates=coordinates,
        status=project_data.get("status", "ACTIVE"),
        initiatorId=current_user.id,
        createdAt=now.strftime("%Y-%m-%d"),
        participants=[current_user.name],
        pendingJoinRequests=[],
        ngoPartnerRequests=[],
        resources=resources,
        type=project_type,
        ai_score=project_data.get("ai_score", 100),
        search_radius=project_data.get("search_radius", 500),
        geom=build_point_wkt(coordinates),
        geom_polygon=build_polygon_wkt(polygon) if polygon else None,
        project_photos=project_photos,
        analysis_photos=analysis_photos,
        photos=project_photos,
        polygon=polygon,
        created_at=now,
        updated_at=now,
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


@router.post("/api/projects/intersections", response_model=List[Project])
async def find_polygon_intersections(payload: PolygonIntersectionRequest, db: Session = Depends(get_db)):
    if not payload.coordinates or len(payload.coordinates) < 3:
        return []

    selected_polygon = build_polygon_wkt(payload.coordinates)
    query = db.query(DBProject).filter(
        or_(func.ST_Intersects(DBProject.geom_polygon, selected_polygon), func.ST_Intersects(DBProject.geom, selected_polygon))
    )
    if payload.draftId:
        query = query.filter(DBProject.id != payload.draftId)
    return query.all()


@router.get("/api/projects", response_model=List[Project])
async def get_projects(
    initiator_id: Optional[str] = None,
    npo_id: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius: Optional[int] = 500,
    db: Session = Depends(get_db),
):
    query = db.query(DBProject).filter(DBProject.status != "DRAFT")
    if initiator_id:
        query = query.filter(DBProject.initiatorId == initiator_id)
    if npo_id:
        query = query.filter(DBProject.npoId == npo_id)
    projects = query.all()

    if lat is not None and lng is not None:
        def is_within_radius(project: DBProject) -> bool:
            if not project.coordinates:
                return False
            earth_radius_m = 6371000
            p_lat, p_lng = radians(project.coordinates["lat"]), radians(project.coordinates["lng"])
            u_lat, u_lng = radians(lat), radians(lng)
            dlat = u_lat - p_lat
            dlng = u_lng - p_lng
            a = sin(dlat / 2) ** 2 + cos(p_lat) * cos(u_lat) * sin(dlng / 2) ** 2
            c = 2 * atan2(sqrt(a), sqrt(1 - a))
            return earth_radius_m * c <= radius

        projects = [project for project in projects if is_within_radius(project)]

    return projects


@router.get("/api/projects/{project_id}", response_model=Project)
async def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(DBProject).filter(DBProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/api/projects/{project_id}/details", response_model=ProjectDetails)
async def get_project_details(project_id: str, db: Session = Depends(get_db)):
    details = db.query(DBProjectDetails).filter(DBProjectDetails.projectId == project_id).first()
    if not details:
        return ProjectDetails(
            id=str(uuid.uuid4()),
            projectId=project_id,
            stage="Инициализация",
            progress=0.0,
            nextMilestone="Планирование",
            collaborators=[],
            documents=[],
            budget={"spent": 0, "remaining": 0, "total": 0},
        )
    return details


@router.patch("/api/projects/{project_id}/status", response_model=Project)
async def update_project_status(project_id: str, update: ProjectStatusUpdate, db: Session = Depends(get_db)):
    project = db.query(DBProject).filter(DBProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.status = update.status
    db.commit()
    db.refresh(project)
    return project


@router.patch("/api/projects/{project_id}/estimate", response_model=Project)
async def update_project_estimate(project_id: str, update: ProjectEstimateUpdate, db: Session = Depends(get_db)):
    project = db.query(DBProject).filter(DBProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    resources_data = [resource.dict() for resource in update.resources]
    project.resources = resources_data
    project.budget = sum(resource.get("basePrice", 0) * resource.get("quantity", 0) for resource in resources_data)
    db.commit()
    db.refresh(project)
    return project


@router.post("/api/projects/{project_id}/join")
async def join_project(project_id: str, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(DBProject).filter(DBProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    pending = list(project.pendingJoinRequests) if project.pendingJoinRequests else []
    if current_user.name not in pending and current_user.name not in (project.participants or []):
        pending.append(current_user.name)
        project.pendingJoinRequests = pending
        db.commit()

        asyncio.create_task(
            manager.send_personal_message(
                {
                    "type": "new_join_request",
                    "project_id": project.id,
                    "project_title": project.title,
                    "user_name": current_user.name,
                    "message": f"Новый запрос на присоединение от {current_user.name}",
                },
                project.initiatorId,
            )
        )

    return {"message": "Join request sent"}


@router.post("/api/projects/{project_id}/requests")
async def handle_join_request(project_id: str, request: JoinRequestAction, db: Session = Depends(get_db)):
    project = db.query(DBProject).filter(DBProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    pending = list(project.pendingJoinRequests) if project.pendingJoinRequests else []
    if request.name in pending:
        pending.remove(request.name)
        project.pendingJoinRequests = pending
        if request.action == "approve":
            participants = list(project.participants) if project.participants else []
            if request.name not in participants:
                participants.append(request.name)
                project.participants = participants

        db.commit()
        db.refresh(project)

        user = db.query(DBUser).filter(DBUser.name == request.name).first()
        if user:
            status_text = "одобрен" if request.action == "approve" else "отклонен"
            asyncio.create_task(
                manager.send_personal_message(
                    {
                        "type": "join_request_result",
                        "project_id": project.id,
                        "project_title": project.title,
                        "message": f"Ваш запрос на присоединение к проекту «{project.title}» был {status_text}.",
                    },
                    user.id,
                )
            )

    return {"message": f"Request {request.action}ed for {request.name}", "project": project}


@router.post("/api/projects/{project_id}/partner")
async def partner_project(project_id: str, request: PartnerRequest, db: Session = Depends(get_db)):
    project = db.query(DBProject).filter(DBProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.npoId = request.npoId
    project.status = "NGO_PARTNERED"
    db.commit()
    db.refresh(project)
    return {"message": "Partnership accepted", "project": project}


@router.post("/api/projects/{project_id}/partner-request")
async def send_partner_request(project_id: str, request: NGO_PartnerRequest, db: Session = Depends(get_db)):
    project = db.query(DBProject).filter(DBProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    new_request = {"npoId": request.npoId, "npoName": request.npoName, "message": request.message}
    current_requests = list(project.ngoPartnerRequests) if project.ngoPartnerRequests else []
    if not any(existing.get("npoId") == request.npoId for existing in current_requests):
        current_requests.append(new_request)
        project.ngoPartnerRequests = current_requests
        db.commit()

    return {"message": "Partnership request sent"}


@router.post("/api/projects/{project_id}/appeal")
async def handle_appeal(project_id: str, action: AppealAction, db: Session = Depends(get_db)):
    project = db.query(DBProject).filter(DBProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if action.action == "approve":
        project.status = "ACTIVE"
    else:
        project.status = "REJECTED"
    db.commit()
    db.refresh(project)
    return project
