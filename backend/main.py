from fastapi import FastAPI, HTTPException, Body, Depends, status, File, UploadFile, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import shutil
from schemas import (
    Project, ProjectStatus, ProjectStatusUpdate, ProjectEstimateUpdate,
    JoinRequestAction, PartnerRequest, NGO_PartnerRequest, AppealAction, Draft, Resource, NPO, NPOStatusUpdate,
    Resource, GlobalSettings, User, UserRegister, UserLogin, Token, UserRole,
    Opportunity, ProjectDetails, Template, KnowledgeBaseEntry, UserUpdate, PolygonIntersectionRequest
)
from models import DBProject, DBNPO, DBResource, DBGlobalSettings, DBUser, DBOpportunity, DBProjectDetails, DBTemplate, DBKnowledgeBaseEntry
from database import get_db
import database
import uuid
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from geoalchemy2.elements import WKTElement

from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv(dotenv_path=os.path.join(BASE_DIR, ".env"), override=True, encoding="utf-8")

# Auth Constants
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 day

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

app = FastAPI(title="Городская Инициатива API")

# Создаем папку для загрузок, если её нет
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Монтируем статику, чтобы картинки были доступны по ссылке
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Инициализация БД при старте сервера
    database.init_db()

# --- WebSockets ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error sending message to {user_id}: {e}")

manager = ConnectionManager()

@app.websocket("/api/ws/notifications/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

# --- Auth Helpers ---

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)


def _build_point_wkt(coordinates: Dict) -> Optional[WKTElement]:
    if not coordinates:
        return None
    lat = coordinates.get("lat")
    lng = coordinates.get("lng")
    if lat is None or lng is None:
        return None
    return WKTElement(f"POINT({float(lng)} {float(lat)})", srid=4326)


def _build_polygon_wkt(points: List[List[float]]) -> WKTElement:
    if len(points) < 3:
        raise HTTPException(status_code=400, detail="Polygon must contain at least 3 points")
    try:
        normalized = [
            (float(p[0]), float(p[1]))
            for p in points
            if isinstance(p, list) and len(p) == 2
        ]
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Each polygon point must be [lng, lat]")
    if len(normalized) < 3:
        raise HTTPException(status_code=400, detail="Each polygon point must be [lng, lat]")
    if normalized[0] != normalized[-1]:
        normalized.append(normalized[0])
    ring = ", ".join([f"{lng} {lat}" for lng, lat in normalized])
    return WKTElement(f"POLYGON(({ring}))", srid=4326)


def _derive_coordinates_from_polygon(points: Optional[List[List[float]]]) -> Optional[Dict[str, float]]:
    """Возвращает центр полигона в формате {lat, lng} на основе [lng, lat] точек."""
    if not points:
        return None
    normalized: List[List[float]] = []
    for p in points:
        if isinstance(p, list) and len(p) == 2:
            try:
                normalized.append([float(p[0]), float(p[1])])
            except (TypeError, ValueError):
                continue
    if len(normalized) < 3:
        return None
    # Убираем замыкающую дубликат-точку, если есть.
    if normalized[0][0] == normalized[-1][0] and normalized[0][1] == normalized[-1][1]:
        normalized = normalized[:-1]
    if not normalized:
        return None
    lng = sum(p[0] for p in normalized) / len(normalized)
    lat = sum(p[1] for p in normalized) / len(normalized)
    return {"lat": lat, "lng": lng}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _draft_resources_to_schema(raw: Any) -> List[Resource]:
    if not raw:
        return []
    out: List[Resource] = []
    for i, item in enumerate(raw):
        if not isinstance(item, dict):
            continue
        data = dict(item)
        if not data.get("id"):
            data["id"] = f"draft-res-{i}"
        try:
            out.append(Resource.model_validate(data))
        except Exception:
            out.append(
                Resource(
                    id=data.get("id", f"draft-res-{i}"),
                    resource=data.get("resource") or data.get("name"),
                    category=data.get("category") or "Прочее",
                    basePrice=float(data.get("basePrice") or 0),
                    quantity=float(data.get("quantity") or 0),
                )
            )
    return out


def _project_row_to_draft(p: DBProject) -> Draft:
    ts = p.updated_at or p.created_at or _utcnow()
    project_photos = list(p.project_photos) if p.project_photos else (list(p.photos) if p.photos else [])
    analysis_photos = list(p.analysis_photos) if p.analysis_photos else []
    return Draft(
        id=p.id,
        initiatorId=p.initiatorId,
        title=p.title,
        description=p.description or "",
        lastModified=ts.isoformat(),
        status="DRAFT",
        step=p.draft_step or 1,
        resources=_draft_resources_to_schema(p.resources),
        type=p.type,
        photos=project_photos,
        projectPhotos=project_photos,
        analysisPhotos=analysis_photos,
        location=p.location,
        coordinates=p.coordinates,
        polygon=p.polygon,
    )


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(DBUser).filter(DBUser.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# --- Utils ---

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    # Генерируем уникальное имя файла
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Сохраняем файл на диск
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Возвращаем относительный URL
    return {"url": f"/static/uploads/{unique_filename}"}

# --- Auth Endpoints ---

@app.post("/api/auth/register", response_model=Token)
async def register(user_in: UserRegister, db: Session = Depends(get_db)):
    email_normalized = user_in.email.lower()
    user = db.query(DBUser).filter(DBUser.email == email_normalized).first()
    if user:
        raise HTTPException(status_code=400, detail="Пользователь с таким Email уже зарегистрирован")
    
    new_user = DBUser(
        id=str(uuid.uuid4()),
        email=email_normalized,
        password=get_password_hash(user_in.password),
        role=user_in.role.value,
        name=user_in.name,
        organization=user_in.organization
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": User(
            id=new_user.id,
            email=new_user.email,
            role=UserRole(new_user.role),
            name=new_user.name,
            organization=new_user.organization
        )
    }

@app.post("/api/auth/login", response_model=Token)
async def login(user_in: UserLogin, db: Session = Depends(get_db)):
    email_normalized = user_in.email.lower()
    user = db.query(DBUser).filter(DBUser.email == email_normalized).first()
    if not user or not verify_password(user_in.password, user.password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": User(
            id=user.id,
            email=user.email,
            role=UserRole(user.role),
            name=user.name,
            organization=user.organization
        )
    }

@app.get("/api/auth/me", response_model=User)
async def read_users_me(current_user: DBUser = Depends(get_current_user)):
    return User(
        id=current_user.id,
        email=current_user.email,
        role=UserRole(current_user.role),
        name=current_user.name,
        organization=current_user.organization,
        phone=current_user.phone,
        address=current_user.address,
        bio=current_user.bio,
        avatar=current_user.avatar
    )

@app.patch("/api/users/me", response_model=User)
async def update_user_me(user_update: UserUpdate, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    for key, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@app.get("/api/users/{user_id}", response_model=User)
async def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(
        id=user.id,
        email=user.email,
        role=UserRole(user.role),
        name=user.name,
        organization=user.organization,
        phone=user.phone,
        address=user.address,
        bio=user.bio,
        avatar=user.avatar
    )

# --- AI Check ---
import httpx

class CheckIdeaRequest(BaseModel):
    idea: str

@app.post("/api/projects/check-idea")
async def check_idea(payload: CheckIdeaRequest, current_user: DBUser = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://26.217.14.46:8000/api/check-idea",
                json={"idea": payload.idea},
                timeout=15.0
            )
            response.raise_for_status()
            return response.json()
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {exc}")
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail="Error from AI service")

# --- Drafts (строки в projects со status=DRAFT) ---

async def _update_draft_category_bg(draft_id: str, description: str):
    from database import SessionLocal
    try:
        async with httpx.AsyncClient() as client:
            ai_resp = await client.post(
                "http://26.217.14.46:8000/api/check-idea",
                json={"idea": description},
                timeout=10.0
            )
            if ai_resp.status_code == 200:
                ai_data = ai_resp.json()
                if ai_data.get("category"):
                    with SessionLocal() as db:
                        draft = db.query(DBProject).filter(DBProject.id == draft_id).first()
                        if draft:
                            draft.type = ai_data["category"]
                            db.commit()
    except Exception as e:
        print(f"Ошибка фонового обновления категории черновика: {e}")

@app.get("/api/projects/drafts", response_model=List[Draft])
async def get_drafts(current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(DBProject)
        .filter(DBProject.initiatorId == current_user.id, DBProject.status == "DRAFT")
        .all()
    )
    return [_project_row_to_draft(p) for p in rows]

@app.post("/api/projects/drafts", response_model=Draft)
async def create_draft(background_tasks: BackgroundTasks, draft_data: Dict = Body(...), current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    now = _utcnow()
    polygon = draft_data.get("polygon")
    derived_coords = _derive_coordinates_from_polygon(polygon)
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
        geom=_build_point_wkt(coords) if coords else None,
        geom_polygon=_build_polygon_wkt(polygon) if polygon else None,
    )
    db.add(new_draft)
    db.commit()
    db.refresh(new_draft)
    
    description = new_draft.description
    if description and len(description) > 10:
        background_tasks.add_task(_update_draft_category_bg, new_draft.id, description)
        
    return _project_row_to_draft(new_draft)

@app.get("/api/projects/drafts/{draft_id}", response_model=Draft)
async def get_draft(draft_id: str, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    draft = (
        db.query(DBProject)
        .filter(
            DBProject.id == draft_id,
            DBProject.initiatorId == current_user.id,
            DBProject.status == "DRAFT",
        )
        .first()
    )
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return _project_row_to_draft(draft)

@app.patch("/api/projects/drafts/{draft_id}", response_model=Draft)
async def update_draft(draft_id: str, background_tasks: BackgroundTasks, draft_data: Dict = Body(...), current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    draft = (
        db.query(DBProject)
        .filter(
            DBProject.id == draft_id,
            DBProject.initiatorId == current_user.id,
            DBProject.status == "DRAFT",
        )
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
        derived_coords = _derive_coordinates_from_polygon(payload.get("polygon"))
        if derived_coords:
            payload["coordinates"] = derived_coords
        polygon = payload.get("polygon")
        draft.geom_polygon = _build_polygon_wkt(polygon) if polygon else None

    if "coordinates" in payload:
        draft.geom = _build_point_wkt(payload.get("coordinates"))

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

    draft.updated_at = _utcnow()
    if draft.coordinates:
        draft.geom = _build_point_wkt(draft.coordinates)
    db.commit()
    db.refresh(draft)
    
    if should_check_ai:
        background_tasks.add_task(_update_draft_category_bg, draft.id, draft.description)
        
    return _project_row_to_draft(draft)

@app.delete("/api/projects/drafts/{draft_id}")
async def delete_draft(draft_id: str, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    draft = (
        db.query(DBProject)
        .filter(
            DBProject.id == draft_id,
            DBProject.initiatorId == current_user.id,
            DBProject.status == "DRAFT",
        )
        .first()
    )
    if draft:
        db.delete(draft)
        db.commit()
    return {"message": "Draft deleted"}

# --- Projects ---

@app.post("/api/projects", response_model=Project)
async def create_project(project_data: Dict = Body(...), current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    # Calculate total budget from resources if provided
    resources = project_data.get("resources", [])
    total_budget = project_data.get("budget")
    if not total_budget:
        total_budget = sum(r.get("basePrice", 0) * r.get("quantity", 0) for r in resources)

    polygon = project_data.get("polygon")
    coordinates = _derive_coordinates_from_polygon(polygon) or project_data.get("coordinates", {"lat": 56.8380, "lng": 60.6030})
    project_photos = project_data.get("projectPhotos") or []
    analysis_photos = project_data.get("analysisPhotos") or []
    now = _utcnow()
    draft_id = project_data.get("draftId")

    project_type = project_data.get("type", "Благоустройство")
    description = project_data.get("description", "")
    
    if description:
        try:
            async with httpx.AsyncClient() as client:
                ai_resp = await client.post(
                    "http://26.217.14.46:8000/api/check-idea",
                    json={"idea": description},
                    timeout=10.0
                )
                if ai_resp.status_code == 200:
                    ai_data = ai_resp.json()
                    if ai_data.get("category"):
                        project_type = ai_data["category"]
        except Exception as e:
            print(f"Ошибка при определении категории проекта через ИИ: {e}")

    if draft_id:
        existing = (
            db.query(DBProject)
            .filter(
                DBProject.id == draft_id,
                DBProject.initiatorId == current_user.id,
                DBProject.status == "DRAFT",
            )
            .first()
        )
        if existing:
            existing.title = project_data.get("title", existing.title)
            existing.description = project_data.get("description", existing.description)
            existing.budget = total_budget
            existing.image = project_data.get(
                "image",
                existing.image
                or "https://images.unsplash.com/photo-1585829365291-1762f55e972e?q=80&w=800&auto=format&fit=crop",
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
            existing.geom = _build_point_wkt(coordinates)
            existing.geom_polygon = _build_polygon_wkt(polygon) if polygon else None
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
        image=project_data.get("image") or (project_photos[0] if project_photos else "https://images.unsplash.com/photo-1585829365291-1762f55e972e?q=80&w=800&auto=format&fit=crop"),
        location=project_data.get("location", "Не указано"),
        coordinates=coordinates,
        status=project_data.get("status", "ACTIVE"),
        initiatorId=current_user.id,
        createdAt=now.strftime("%Y-%m-%d"),
        participants=[current_user.name], # Добавляем инициатора в участники
        pendingJoinRequests=[],
        ngoPartnerRequests=[],
        resources=resources,
        type=project_type,
        ai_score=project_data.get("ai_score", 100),
        search_radius=project_data.get("search_radius", 500),
        geom=_build_point_wkt(coordinates),
        geom_polygon=_build_polygon_wkt(polygon) if polygon else None,
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


@app.post("/api/projects/intersections", response_model=List[Project])
async def find_polygon_intersections(payload: PolygonIntersectionRequest, db: Session = Depends(get_db)):
    if not payload.coordinates or len(payload.coordinates) < 3:
        return []
        
    selected_polygon = _build_polygon_wkt(payload.coordinates)
    
    query = db.query(DBProject).filter(
        or_(
            func.ST_Intersects(DBProject.geom_polygon, selected_polygon),
            func.ST_Intersects(DBProject.geom, selected_polygon),
        )
    )
    
    if payload.draftId:
        query = query.filter(DBProject.id != payload.draftId)
        
    intersections = query.all()
    
    return intersections

@app.get("/api/projects", response_model=List[Project])
async def get_projects(
    initiator_id: Optional[str] = None, 
    npo_id: Optional[str] = None, 
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius: Optional[int] = 500,
    db: Session = Depends(get_db)
):
    query = db.query(DBProject).filter(DBProject.status != "DRAFT")
    if initiator_id:
        query = query.filter(DBProject.initiatorId == initiator_id)
    if npo_id:
        query = query.filter(DBProject.npoId == npo_id)
    
    projects = query.all()

    # Если переданы координаты, фильтруем по радиусу (Spatial Query Lite)
    if lat is not None and lng is not None:
        def is_within_radius(proj):
            if not proj.coordinates: return False
            # Простейшая формула Гаверсинуса для SQLite
            from math import sin, cos, sqrt, atan2, radians
            R = 6371000  # Радиус Земли в метрах
            p_lat, p_lng = radians(proj.coordinates['lat']), radians(proj.coordinates['lng'])
            u_lat, u_lng = radians(lat), radians(lng)
            dlat = u_lat - p_lat
            dlng = u_lng - p_lng
            a = sin(dlat / 2)**2 + cos(p_lat) * cos(u_lat) * sin(dlng / 2)**2
            c = 2 * atan2(sqrt(a), sqrt(1 - a))
            return R * c <= radius

        projects = [p for p in projects if is_within_radius(p)]

    return projects

@app.get("/api/projects/{project_id}", response_model=Project)
async def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(DBProject).filter(DBProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.get("/api/projects/{project_id}/details", response_model=ProjectDetails)
async def get_project_details(project_id: str, db: Session = Depends(get_db)):
    details = db.query(DBProjectDetails).filter(DBProjectDetails.projectId == project_id).first()
    if not details:
        # Create default details if not found
        return ProjectDetails(
            id=str(uuid.uuid4()),
            projectId=project_id,
            stage="Инициализация",
            progress=0.0,
            nextMilestone="Планирование",
            collaborators=[],
            documents=[],
            budget={"spent": 0, "remaining": 0, "total": 0}
        )
    return details

@app.patch("/api/projects/{project_id}/status", response_model=Project)
async def update_project_status(project_id: str, update: ProjectStatusUpdate, db: Session = Depends(get_db)):
    project = db.query(DBProject).filter(DBProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.status = update.status
    db.commit()
    db.refresh(project)
    return project

@app.patch("/api/projects/{project_id}/estimate", response_model=Project)
async def update_project_estimate(project_id: str, update: ProjectEstimateUpdate, db: Session = Depends(get_db)):
    project = db.query(DBProject).filter(DBProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Конвертируем Pydantic модели ресурсов в словари для JSON поля
    resources_data = [r.dict() for r in update.resources]
    project.resources = resources_data
    
    # Пересчитываем бюджет
    project.budget = sum(r.get("basePrice", 0) * r.get("quantity", 0) for r in resources_data)
    
    db.commit()
    db.refresh(project)
    return project

@app.post("/api/projects/{project_id}/join")
async def join_project(project_id: str, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(DBProject).filter(DBProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Добавляем пользователя в список ожидающих
    pending = list(project.pendingJoinRequests) if project.pendingJoinRequests else []
    if current_user.name not in pending and current_user.name not in (project.participants or []):
        pending.append(current_user.name)
        project.pendingJoinRequests = pending
        db.commit()
        
        import asyncio
        asyncio.create_task(manager.send_personal_message({
            "type": "new_join_request",
            "project_id": project.id,
            "project_title": project.title,
            "user_name": current_user.name,
            "message": f"Новый запрос на присоединение от {current_user.name}"
        }, project.initiatorId))
        
    return {"message": "Join request sent"}

@app.post("/api/projects/{project_id}/requests")
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
            import asyncio
            status_text = "одобрен" if request.action == "approve" else "отклонен"
            asyncio.create_task(manager.send_personal_message({
                "type": "join_request_result",
                "project_id": project.id,
                "project_title": project.title,
                "message": f"Ваш запрос на присоединение к проекту «{project.title}» был {status_text}."
            }, user.id))
    
    return {"message": f"Request {request.action}ed for {request.name}", "project": project}

@app.post("/api/projects/{project_id}/partner")
async def partner_project(project_id: str, request: PartnerRequest, db: Session = Depends(get_db)):
    project = db.query(DBProject).filter(DBProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Устанавливаем NPO как партнера
    project.npoId = request.npoId
    project.status = "NGO_PARTNERED"
    
    db.commit()
    db.refresh(project)
    return {"message": "Partnership accepted", "project": project}

@app.post("/api/projects/{project_id}/partner-request")
async def send_partner_request(project_id: str, request: NGO_PartnerRequest, db: Session = Depends(get_db)):
    project = db.query(DBProject).filter(DBProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Добавляем запрос в список запросов проекта
    new_request = {
        "npoId": request.npoId,
        "npoName": request.npoName,
        "message": request.message
    }
    
    current_requests = list(project.ngoPartnerRequests) if project.ngoPartnerRequests else []
    # Проверяем, нет ли уже такого запроса
    if not any(r.get("npoId") == request.npoId for r in current_requests):
        current_requests.append(new_request)
        project.ngoPartnerRequests = current_requests
        db.commit()
    
    return {"message": "Partnership request sent"}

@app.post("/api/projects/{project_id}/appeal")
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

# --- NPOs ---

@app.get("/api/npos", response_model=List[NPO])
async def get_npos(db: Session = Depends(get_db)):
    return db.query(DBNPO).all()

@app.patch("/api/npos/{npo_id}/status", response_model=NPO)
async def update_npo_status(npo_id: str, update: NPOStatusUpdate, db: Session = Depends(get_db)):
    npo = db.query(DBNPO).filter(DBNPO.id == npo_id).first()
    if not npo:
        raise HTTPException(status_code=404, detail="NPO not found")
    npo.status = update.status
    db.commit()
    db.refresh(npo)
    return npo

# --- Resources ---

@app.get("/api/resources", response_model=List[Resource])
async def get_resources(db: Session = Depends(get_db)):
    return db.query(DBResource).all()

@app.get("/api/opportunities", response_model=List[Opportunity])
async def get_opportunities(db: Session = Depends(get_db)):
    return db.query(DBOpportunity).all()

# --- Admin / AI ---

@app.get("/api/admin/settings", response_model=GlobalSettings)
async def get_settings(db: Session = Depends(get_db)):
    settings = db.query(DBGlobalSettings).filter(DBGlobalSettings.id == 1).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    return settings

@app.get("/api/admin/templates", response_model=List[Template])
async def get_templates(db: Session = Depends(get_db)):
    return db.query(DBTemplate).all()

@app.get("/api/admin/knowledge-base", response_model=List[KnowledgeBaseEntry])
async def get_knowledge_base(db: Session = Depends(get_db)):
    return db.query(DBKnowledgeBaseEntry).all()

@app.post("/api/ai/models/{model_id}/retrain")
async def retrain_model(model_id: str):
    return {"message": f"Model {model_id} retraining started"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
