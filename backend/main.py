from fastapi import FastAPI, HTTPException, Body, Depends, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
import os
import shutil
from schemas import (
    Project, ProjectStatus, ProjectStatusUpdate, ProjectEstimateUpdate,
    JoinRequestAction, PartnerRequest, NGO_PartnerRequest, AppealAction, Draft, NPO, NPOStatusUpdate,
    Resource, GlobalSettings, User, UserRegister, UserLogin, Token, UserRole,
    Opportunity, ProjectDetails, Template, KnowledgeBaseEntry, UserUpdate
)
from models import DBProject, DBDraft, DBNPO, DBResource, DBGlobalSettings, DBUser, DBOpportunity, DBProjectDetails, DBTemplate, DBKnowledgeBaseEntry
from database import get_db
import database
import uuid
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

# Auth Constants
SECRET_KEY = "SUPER_SECRET_KEY_CHANGE_ME"
ALGORITHM = "HS256"
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

# --- Auth Helpers ---

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

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

# --- Drafts ---

@app.get("/api/projects/drafts", response_model=List[Draft])
async def get_drafts(current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(DBDraft).filter(DBDraft.initiatorId == current_user.id).all()

@app.post("/api/projects/drafts", response_model=Draft)
async def create_draft(draft_data: Dict = Body(...), current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    new_draft = DBDraft(
        id=str(uuid.uuid4()),
        initiatorId=current_user.id,
        title=draft_data.get("title", "Новый черновик"),
        description=draft_data.get("description", ""),
        lastModified=datetime.now().isoformat(),
        step=draft_data.get("step", 1),
        resources=draft_data.get("resources", []),
        type=draft_data.get("type")
    )
    db.add(new_draft)
    db.commit()
    db.refresh(new_draft)
    return new_draft

@app.get("/api/projects/drafts/{draft_id}", response_model=Draft)
async def get_draft(draft_id: str, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    draft = db.query(DBDraft).filter(DBDraft.id == draft_id, DBDraft.initiatorId == current_user.id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return draft

@app.patch("/api/projects/drafts/{draft_id}", response_model=Draft)
async def update_draft(draft_id: str, draft_data: Dict = Body(...), current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    draft = db.query(DBDraft).filter(DBDraft.id == draft_id, DBDraft.initiatorId == current_user.id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    for key, value in draft_data.items():
        if hasattr(draft, key) and key != "id" and key != "initiatorId":
            setattr(draft, key, value)
    
    draft.lastModified = datetime.now().isoformat()
    db.commit()
    db.refresh(draft)
    return draft

@app.delete("/api/projects/drafts/{draft_id}")
async def delete_draft(draft_id: str, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    draft = db.query(DBDraft).filter(DBDraft.id == draft_id, DBDraft.initiatorId == current_user.id).first()
    if draft:
        db.delete(draft)
        db.commit()
    return {"message": "Draft deleted"}

# --- Projects ---

@app.post("/api/projects", response_model=Project)
async def create_project(project_data: Dict = Body(...), current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    # Calculate total budget from resources if provided
    resources = project_data.get("resources", [])
    total_budget = sum(r.get("basePrice", 0) * r.get("quantity", 0) for r in resources)
    if total_budget == 0:
        total_budget = project_data.get("budget", 0)

    new_project = DBProject(
        id=str(uuid.uuid4()),
        title=project_data.get("title", "Новый проект"),
        description=project_data.get("description", ""),
        budget=total_budget,
        image=project_data.get("image", "https://images.unsplash.com/photo-1585829365291-1762f55e972e?q=80&w=800&auto=format&fit=crop"),
        location=project_data.get("location", "Не указано"),
        coordinates=project_data.get("coordinates", {"lat": 56.8380, "lng": 60.6030}),
        status=project_data.get("status", "ACTIVE"),
        initiatorId=current_user.id,
        createdAt=datetime.now().strftime("%Y-%m-%d"),
        participants=[current_user.name], # Добавляем инициатора в участники
        pendingJoinRequests=[],
        ngoPartnerRequests=[],
        resources=resources,
        type=project_data.get("type"),
        ai_score=project_data.get("ai_score", 100),
        search_radius=project_data.get("search_radius", 500)
    )
    db.add(new_project)
    
    # If project was created from a draft, delete the draft
    draft_id = project_data.get("draftId")
    if draft_id:
        draft = db.query(DBDraft).filter(DBDraft.id == draft_id).first()
        if draft:
            db.delete(draft)
            
    db.commit()
    db.refresh(new_project)
    return new_project

@app.get("/api/projects", response_model=List[Project])
async def get_projects(
    initiator_id: Optional[str] = None, 
    npo_id: Optional[str] = None, 
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius: Optional[int] = 500,
    db: Session = Depends(get_db)
):
    query = db.query(DBProject)
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
    uvicorn.run(app, host="0.0.0.0", port=4000)
