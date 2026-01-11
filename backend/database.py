from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, DBUser, DBProject, DBNPO, DBResource, DBGlobalSettings, DBOpportunity, DBProjectDetails, DBTemplate, DBKnowledgeBaseEntry
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(BASE_DIR, 'app.db').replace('\\', '/')
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if we already have data
    if db.query(DBUser).first():
        db.close()
        return

    # Add Mock Users with hashed passwords
    mock_users = [
        DBUser(
            id="user-1",
            email="citizen@example.com",
            password=pwd_context.hash("password123"),
            role="initiator",
            name="Анна Волкова",
            avatar="/placeholder.svg?height=48&width=48",
        ),
        DBUser(
            id="npo-1",
            email="npo@example.com",
            password=pwd_context.hash("password123"),
            role="npo",
            name="Фонд городской радости",
            organization="Фонд городской радости",
            avatar="/placeholder.svg?height=48&width=48",
        ),
        DBUser(
            id="admin-1",
            email="admin@example.com",
            password=pwd_context.hash("password123"),
            role="admin",
            name="Системный Администратор",
            avatar="/placeholder.svg?height=48&width=48",
        ),
    ]
    db.add_all(mock_users)

    # Add Mock Projects
    mock_projects = [
        DBProject(
            id="proj-1",
            title="Инклюзивная детская площадка 'Радуга'",
            description="Создание современной игровой зоны, адаптированной для детей с ограниченными возможностями здоровья...",
            budget=850000.0,
            image="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=800&auto=format&fit=crop",
            location="Октябрьский район, ул. Луначарского",
            coordinates={"lat": 56.8380, "lng": 60.6030},
            status="ACTIVE",
            initiatorId="user-1",
            npoId="npo-1",
            createdAt="2024-01-15",
            participants=["user-1", "user-2"],
            pendingJoinRequests=["Александр Матросов", "Мария Кюри"],
            ngoPartnerRequests=[
                {"npoId": "npo-2", "npoName": "Эко-Наблюдатели", "message": "Мы готовы предоставить волонтеров и экспертов по озеленению."}
            ]
        ),
        DBProject(
            id="proj-2",
            title="Эко-сквер 'Зеленый остров'",
            description="Восстановление заброшенного пустыря и превращение его в цветущий сквер...",
            budget=1200000.0,
            image="https://images.unsplash.com/photo-1585829365291-1762f55e972e?q=80&w=800&auto=format&fit=crop",
            location="Ленинский район, ул. Вайнера",
            coordinates={"lat": 56.8395, "lng": 60.6060},
            status="SUCCESS",
            initiatorId="user-2",
            npoId="npo-2",
            createdAt="2023-11-20",
            participants=["user-2", "user-3", "user-4"]
        ),
    ]
    db.add_all(mock_projects)

    # Add Mock NPOs
    mock_npos = [
        DBNPO(
            id="npo-1",
            name="Фонд городской радости",
            expertise=["Общественные пространства", "Развитие сообществ"],
            rating=5.0,
            avatar="/placeholder.svg?height=48&width=48",
            activeProjects=3,
            pendingRequests=5,
            status="approved",
            registrationDate="2023-01-10",
        ),
    ]
    db.add_all(mock_npos)

    # Add Mock Resources
    mock_resources = [
        DBResource(id="est-1", resource="Стальная скамейка", category="Мебель", basePrice=15000.0, quantity=4),
        DBResource(id="est-2", resource="Резиновое покрытие", category="Безопасность", basePrice=2500.0, quantity=40),
    ]
    db.add_all(mock_resources)

    # Add Opportunities
    mock_opportunities = [
        DBOpportunity(
            id="opp-1",
            title="Реновация общественного парка",
            location="Екатеринбург, Ленинский район",
            budget=380000.0,
            matchReason="Ваша экспертиза в общественных пространствах идеально подходит",
            tags=["Общественное пространство", "Парки"],
            initiatorId="user-2",
            status="open"
        )
    ]
    db.add_all(mock_opportunities)

    # Add Project Details
    mock_details = [
        DBProjectDetails(
            id="detail-1",
            projectId="proj-1",
            stage="Фаза строительства",
            progress=65.0,
            nextMilestone="Установка оборудования - до 15 марта 2024",
            collaborators=[
                {"name": "Анна Волкова", "role": "Инициатор", "avatar": "/placeholder.svg"},
                {"name": "Команда Фонда городской радости", "role": "НКО Партнер", "avatar": "/placeholder.svg"}
            ],
            documents=[
                {"name": "Проектное предложение.pdf", "type": "PDF", "date": "2024-01-15", "url": "#"}
            ],
            budget={"spent": 292500, "remaining": 157500, "total": 450000}
        )
    ]
    db.add_all(mock_details)

    # Add Templates
    mock_templates = [
        DBTemplate(id="temp-1", name="Стандартное предложение", category="Заявки", content="# Шаблон", lastModified="2024-02-15")
    ]
    db.add_all(mock_templates)

    # Add Knowledge Base
    mock_kb = [
        DBKnowledgeBaseEntry(id="kb-1", title="Инклюзивная площадка", region="Москва", budget=420000.0, outcomes="500+ детей", tags=["Доступность"])
    ]
    db.add_all(mock_kb)

    # Add Global Settings
    settings = DBGlobalSettings(
        id=1,
        inflationRate=8.0,
        maxBudget=1000000.0,
        minBudget=50000.0,
        defaultSubsidyRate=95.0,
        currentYear=2024,
    )
    db.add(settings)

    db.commit()
    db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
