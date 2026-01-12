from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from enum import Enum
from datetime import datetime

class ProjectStatus(str, Enum):
    DRAFT = "DRAFT"
    AI_SCORING = "AI_SCORING"
    DUPLICATE_CHECK = "DUPLICATE_CHECK"
    RESOURCE_GENERATION = "RESOURCE_GENERATION"
    REFINEMENT = "REFINEMENT"
    ACTIVE = "ACTIVE"
    NGO_PARTNERED = "NGO_PARTNERED"
    REJECTED = "REJECTED"
    APPEAL_PENDING = "APPEAL_PENDING"
    SUCCESS = "SUCCESS"

class Coordinates(BaseModel):
    lat: float
    lng: float

class NGO_PartnerRequest(BaseModel):
    npoId: str
    npoName: str
    message: str

class ImageAnalysis(BaseModel):
    quality_score: float
    detected_objects: List[str]

class Resource(BaseModel):
    id: str
    name: Optional[str] = Field(default=None)
    resource: Optional[str] = Field(default=None)
    category: Optional[str] = Field(default="Прочее")
    basePrice: Optional[float] = Field(default=0.0)
    quantity: float = Field(default=0.0)
    unit: Optional[str] = Field(default="шт.")
    estimatedCost: Optional[float] = Field(default=0.0)

class Project(BaseModel):
    id: str
    title: str
    description: str
    budget: float
    image: str
    location: str
    coordinates: Coordinates
    status: ProjectStatus
    initiatorId: str
    npoId: Optional[str] = None
    createdAt: str
    participants: Optional[List[str]] = []
    pendingJoinRequests: Optional[List[str]] = []
    ngoPartnerRequests: Optional[List[NGO_PartnerRequest]] = []
    resources: Optional[List[Resource]] = []
    type: Optional[str] = None
    
    # Новые поля по ТЗ:
    ai_score: Optional[float] = 0
    rejection_reason: Optional[str] = None
    image_analysis: Optional[ImageAnalysis] = None
    search_radius: int = 500

    class Config:
        from_attributes = True

class ProjectStatusUpdate(BaseModel):
    status: ProjectStatus

class ProjectEstimateUpdate(BaseModel):
    resources: List[Resource]

class JoinAction(str, Enum):
    approve = "approve"
    reject = "reject"

class JoinRequestAction(BaseModel):
    name: str
    action: JoinAction

class PartnerRequest(BaseModel):
    npoId: str

class AppealAction(BaseModel):
    action: JoinAction # reuse approve/reject

class Draft(BaseModel):
    id: str
    initiatorId: str
    title: str
    description: str
    lastModified: str
    status: str = "DRAFT"
    step: int
    resources: List[Resource] = []
    type: Optional[str] = None
    photos: Optional[List[str]] = []

    class Config:
        from_attributes = True

class NPOStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class NPO(BaseModel):
    id: str
    name: str
    expertise: List[str]
    rating: float
    avatar: str
    activeProjects: int
    pendingRequests: int
    status: Optional[NPOStatus] = None
    description: Optional[str] = None
    registrationDate: Optional[str] = None

    class Config:
        from_attributes = True

class NPOStatusUpdate(BaseModel):
    status: NPOStatus

class UserRole(str, Enum):
    initiator = "initiator"
    npo = "npo"
    admin = "admin"

class User(BaseModel):
    id: str
    email: str
    role: UserRole
    name: str
    avatar: Optional[str] = None
    organization: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None

class UserRegister(BaseModel):
    email: str
    password: str
    role: UserRole
    name: str
    organization: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Opportunity(BaseModel):
    id: str
    title: str
    location: str
    budget: float
    matchReason: str
    tags: List[str]
    initiatorId: str
    status: str

class ProjectCollaborator(BaseModel):
    name: str
    role: str
    avatar: str

class ProjectDocument(BaseModel):
    name: str
    type: str
    date: str
    url: str

class ProjectDetailsBudget(BaseModel):
    spent: float
    remaining: float
    total: float

class ProjectDetails(BaseModel):
    id: str
    projectId: str
    stage: str
    progress: float
    nextMilestone: str
    collaborators: List[ProjectCollaborator]
    documents: List[ProjectDocument]
    budget: ProjectDetailsBudget

class Template(BaseModel):
    id: str
    name: str
    category: str
    content: str
    lastModified: str

class KnowledgeBaseEntry(BaseModel):
    id: str
    title: str
    region: str
    budget: float
    outcomes: str
    tags: List[str]

class GlobalSettings(BaseModel):
    inflationRate: float
    maxBudget: float
    minBudget: float
    defaultSubsidyRate: float
    currentYear: int
