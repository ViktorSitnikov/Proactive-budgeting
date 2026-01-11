from sqlalchemy import Column, String, Float, Integer, Enum, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()

class ProjectStatus(str, enum.Enum):
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

class UserRole(str, enum.Enum):
    initiator = "initiator"
    npo = "npo"
    admin = "admin"

class NPOStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class DBUser(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String) # initiator, npo, admin
    name = Column(String)
    avatar = Column(String, nullable=True)
    organization = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    bio = Column(String, nullable=True)

class DBProject(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    budget = Column(Float)
    image = Column(String)
    location = Column(String)
    coordinates = Column(JSON) # {lat: float, lng: float}
    status = Column(String)
    initiatorId = Column(String)
    npoId = Column(String, nullable=True)
    createdAt = Column(String)
    participants = Column(JSON, default=[])
    pendingJoinRequests = Column(JSON, default=[])
    ngoPartnerRequests = Column(JSON, default=[])
    resources = Column(JSON, default=[])
    type = Column(String, nullable=True) # Тип проекта (Благоустройство, Дороги и т.д.)
    
    # Новые поля по ТЗ:
    ai_score = Column(Float, default=0)
    rejection_reason = Column(String, nullable=True)
    image_analysis = Column(JSON, nullable=True) # { quality_score: float, detected_objects: string[] }
    search_radius = Column(Integer, default=500)

class DBDraft(Base):
    __tablename__ = "drafts"
    id = Column(String, primary_key=True, index=True)
    initiatorId = Column(String, index=True)
    title = Column(String)
    description = Column(String)
    lastModified = Column(String)
    status = Column(String, default="DRAFT")
    step = Column(Integer)
    resources = Column(JSON, default=[])
    type = Column(String, nullable=True)

class DBNPO(Base):
    __tablename__ = "npos"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    expertise = Column(JSON) # List[str]
    rating = Column(Float)
    avatar = Column(String)
    activeProjects = Column(Integer)
    pendingRequests = Column(Integer)
    status = Column(String, nullable=True)
    description = Column(String, nullable=True)
    registrationDate = Column(String, nullable=True)

class DBResource(Base):
    __tablename__ = "resources"
    id = Column(String, primary_key=True, index=True)
    resource = Column(String)
    category = Column(String)
    basePrice = Column(Float)
    quantity = Column(Integer)

class DBOpportunity(Base):
    __tablename__ = "opportunities"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    location = Column(String)
    budget = Column(Float)
    matchReason = Column(String)
    tags = Column(JSON) # List[str]
    initiatorId = Column(String)
    status = Column(String)

class DBProjectDetails(Base):
    __tablename__ = "project_details"
    id = Column(String, primary_key=True, index=True)
    projectId = Column(String, ForeignKey("projects.id"))
    stage = Column(String)
    progress = Column(Float)
    nextMilestone = Column(String)
    collaborators = Column(JSON) # List[Dict]
    documents = Column(JSON) # List[Dict]
    budget = Column(JSON) # {spent, remaining, total}

class DBTemplate(Base):
    __tablename__ = "templates"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    category = Column(String)
    content = Column(String)
    lastModified = Column(String)

class DBKnowledgeBaseEntry(Base):
    __tablename__ = "knowledge_base"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    region = Column(String)
    budget = Column(Float)
    outcomes = Column(String)
    tags = Column(JSON) # List[str]

class DBGlobalSettings(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True)
    inflationRate = Column(Float)
    maxBudget = Column(Float)
    minBudget = Column(Float)
    defaultSubsidyRate = Column(Float)
    currentYear = Column(Integer)

