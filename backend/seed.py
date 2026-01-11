from database import SessionLocal, engine, init_db
from models import Base, DBUser, DBProject, DBNPO, DBResource, DBGlobalSettings, DBDraft, DBProjectDetails, DBTemplate, DBKnowledgeBaseEntry
import uuid
import random
import os
from datetime import datetime, timedelta
from passlib.context import CryptContext

# Импортируем манифест загруженных ассетов, если он есть
try:
    from assets_manifest import ASSETS
except ImportError:
    ASSETS = {}

def get_random_asset(category, default):
    if category in ASSETS and ASSETS[category]:
        return random.choice(ASSETS[category])
    return default

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_data():
    # Очищаем базу перед заполнением
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    print("Генерация масштабного набора данных для платформы...")

    hashed_password = pwd_context.hash("password123")
    
    # --- 1. Генерация Пользователей (~70) ---
    first_names = ["Александр", "Иван", "Дмитрий", "Сергей", "Михаил", "Анна", "Мария", "Елена", "Ольга", "Наталья", "Виктор", "Артем", "Игорь", "Татьяна", "Светлана"]
    last_names = ["Иванов", "Петров", "Смирнов", "Соколов", "Кузнецов", "Попов", "Васильев", "Морозов", "Новиков", "Федоров", "Волков", "Лебедев", "Козлов", "Павлов"]
    districts = ["Ленинский район", "Кировский район", "Октябрьский район", "Верх-Исетский район", "Чкаловский район", "Железнодорожный район", "Академический район"]
    
    users = []
    # Основные тестовые пользователи
    users.append(DBUser(
        id="user-1", 
        email="citizen@example.com", 
        password=hashed_password, 
        role="initiator", 
        name="Анна Волкова", 
        avatar=get_random_asset("аватары", "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna"),
        phone="+7 (912) 000-11-22",
        address="г. Екатеринбург, ул. Ленина, д. 1",
        bio="Активный гражданин, люблю свой город."
    ))
    users.append(DBUser(id="npo-1", email="npo@example.com", password=hashed_password, role="npo", name="Фонд городской радости", organization="Фонд городской радости", avatar=get_random_asset("нко", "https://api.dicebear.com/7.x/identicon/svg?seed=NPO1")))
    users.append(DBUser(id="admin-1", email="admin@example.com", password=hashed_password, role="admin", name="Системный Администратор", avatar=get_random_asset("аватары", "https://api.dicebear.com/7.x/bottts/svg?seed=Admin")))

    # Генерация инициаторов
    for i in range(2, 50):
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        uid = f"user-{i}"
        users.append(DBUser(
            id=uid,
            email=f"user{i}@example.com",
            password=hashed_password,
            role="initiator",
            name=name,
            avatar=get_random_asset("аватары", f"https://api.dicebear.com/7.x/avataaars/svg?seed={uid}"),
            phone=f"+7 (900) {random.randint(100, 999)}-{random.randint(10, 99)}-{random.randint(10, 99)}",
            address=f"г. Екатеринбург, {random.choice(districts)}, ул. {random.choice(last_names)}",
            bio="Интересуюсь развитием городской среды."
        ))

    # Генерация представителей НКО
    for i in range(2, 20):
        uid = f"npo-user-{i}"
        users.append(DBUser(
            id=uid,
            email=f"npo{i}@example.com",
            password=hashed_password,
            role="npo",
            name=f"Представитель НКО {i}",
            organization=f"Организация {i}",
            avatar=get_random_asset("нко", f"https://api.dicebear.com/7.x/identicon/svg?seed={uid}"),
            phone=f"+7 (950) {random.randint(100, 999)}-{random.randint(10, 99)}-{random.randint(10, 99)}",
            address="Офис организации",
            bio="Представляю интересы НКО."
        ))
    
    db.add_all(users)
    db.commit()

    # --- 2. Генерация НКО (~40) ---
    npo_names = ["Зеленый Город", "Умная Среда", "Безопасные Дороги", "Культурное Наследие", "Спорт для Всех", "Милосердие", "Эко-Логика", "Городской Арт", "Цифровой Регион", "Детство Плюс"]
    expertise_areas = ["Озеленение", "Безопасность", "Культура", "Спорт", "Образование", "Инфраструктура", "Экология", "Доступная среда"]
    
    npos = []
    # Основные НКО из ТЗ/старого скрипта
    npos.append(DBNPO(id="npo-1", name="Фонд городской радости", expertise=["Общественные пространства", "Развитие сообществ"], rating=5.0, avatar=get_random_asset("нко", "https://api.dicebear.com/7.x/identicon/svg?seed=NPO1"), activeProjects=3, pendingRequests=2, status="approved", registrationDate="2023-01-10", description="Занимаемся благоустройством дворовых территорий."))
    
    for i in range(2, 41):
        nid = f"npo-{i}"
        npos.append(DBNPO(
            id=nid,
            name=f"{random.choice(npo_names)} #{i}",
            expertise=random.sample(expertise_areas, k=random.randint(1, 3)),
            rating=round(random.uniform(3.5, 5.0), 1),
            avatar=get_random_asset("нко", f"https://api.dicebear.com/7.x/identicon/svg?seed={nid}"),
            activeProjects=random.randint(0, 5),
            pendingRequests=random.randint(0, 3),
            status=random.choice(["approved", "approved", "approved", "pending"]),
            registrationDate=(datetime.now() - timedelta(days=random.randint(30, 400))).strftime("%Y-%m-%d"),
            description=f"Профессиональная некоммерческая организация, специализирующаяся на {random.choice(expertise_areas).lower()}."
        ))
    db.add_all(npos)
    db.commit()

    # --- 3. Генерация Ресурсов (~100 позиций справочника) ---
    categories = ["Мебель", "Освещение", "Безопасность", "Оборудование", "Инфраструктура", "Озеленение", "Спорт", "Навигация"]
    resource_templates = {
        "Мебель": ["Скамейка парковая", "Урна уличная", "Стол для пикника", "Шезлонг городской", "Вазон для цветов"],
        "Освещение": ["Фонарь LED", "Прожектор заливающий", "Гирлянда уличная", "Световая опора", "Датчик движения"],
        "Безопасность": ["Камера наблюдения", "Забор декоративный", "Покрытие резиновое", "Знак дорожный", "Боллард"],
        "Оборудование": ["Горка детская", "Качели-гнездо", "Песочница закрытая", "Игровой домик", "Карусель"],
        "Озеленение": ["Саженец клена", "Куст сирени", "Газон рулонный", "Цветы (рассада)", "Дерево взрослое"],
        "Спорт": ["Турник", "Брусья", "Тренажер жим ногами", "Теннисный стол", "Баскетбольное кольцо"]
    }

    resources = []
    for i in range(1, 101):
        cat = random.choice(categories)
        tpl = resource_templates.get(cat, ["Общий ресурс"])
        resources.append(DBResource(
            id=f"res-{i}",
            resource=f"{random.choice(tpl)} тип-{i}",
            category=cat,
            basePrice=float(random.randint(1000, 200000)),
            quantity=1
        ))
    db.add_all(resources)
    db.commit()

    # --- 4. Генерация Проектов (~100) ---
    project_titles = ["Реновация парка", "Светлый двор", "Безопасный переход", "Эко-площадка", "Мурал на стене", "Велопарковка", "Чистый пруд", "Зона воркаута", "Умная остановка", "Аллея памяти"]
    project_types = ["Благоустройство", "Дороги", "Освещение", "Спорт", "Культура", "Экология"]
    statuses = ["ACTIVE", "SUCCESS", "NGO_PARTNERED", "AI_SCORING", "DUPLICATE_CHECK", "REFINEMENT", "APPEAL_PENDING", "REJECTED"]
    
    projects = []
    for i in range(1, 101):
        pid = f"proj-{i}"
        status = random.choice(statuses)
        initiator = random.choice(users[:50]) # Берем из первой половины (инициаторы)
        npo = random.choice(npos) if status in ["ACTIVE", "SUCCESS", "NGO_PARTNERED"] else None
        
        # Генерируем смету (ресурсы)
        proj_resources = []
        for _ in range(random.randint(2, 6)):
            ref_res = random.choice(resources)
            proj_resources.append({
                "id": ref_res.id,
                "resource": ref_res.resource,
                "category": ref_res.category,
                "basePrice": ref_res.basePrice,
                "quantity": random.randint(1, 10)
            })
        
        total_budget = sum(r["basePrice"] * r["quantity"] for r in proj_resources)

        projects.append(DBProject(
            id=pid,
            title=f"{random.choice(project_titles)} '{pid}'",
            description=f"Масштабный проект по {random.choice(project_titles).lower()} в районе {random.choice(districts)}. Цель — улучшение качества жизни горожан.",
            budget=total_budget,
            image=get_random_asset("проект", f"https://images.unsplash.com/photo-{random.randint(1500000000000, 1600000000000)}?q=80&w=800"),
            location=f"{random.choice(districts)}, ул. {random.choice(last_names)}, {random.randint(1, 150)}",
            coordinates={"lat": 56.8 + random.uniform(-0.05, 0.05), "lng": 60.6 + random.uniform(-0.05, 0.05)},
            status=status,
            type=random.choice(project_types),
            initiatorId=initiator.id,
            npoId=npo.id if npo else None,
            createdAt=(datetime.now() - timedelta(days=random.randint(1, 180))).strftime("%Y-%m-%d"),
            participants=[initiator.name] + [u.name for u in random.sample(users[:50], k=random.randint(0, 5))],
            resources=proj_resources,
            ai_score=random.randint(60, 100),
            search_radius=500
        ))
    db.add_all(projects)
    db.commit()

    # --- 5. Генерация Деталей Проектов ---
    details = []
    for p in projects[:50]: # Создадим детали для половины проектов
        details.append(DBProjectDetails(
            id=f"detail-{p.id}",
            projectId=p.id,
            stage=random.choice(["Планирование", "Закупки", "Строительство", "Приемка"]),
            progress=random.uniform(0, 100) if p.status != "SUCCESS" else 100.0,
            nextMilestone="Завершение этапа через " + str(random.randint(5, 30)) + " дней",
            collaborators=[{"name": p.participants[0], "role": "Автор", "avatar": ""}],
            documents=[{"name": "ТЗ.pdf", "type": "PDF", "date": p.createdAt, "url": "#"}],
            budget={"spent": p.budget * 0.4, "remaining": p.budget * 0.6, "total": p.budget}
        ))
    db.add_all(details)

    # --- 6. Черновики (~30) ---
    drafts = []
    for i in range(1, 31):
        initiator = random.choice(users[:50])
        drafts.append(DBDraft(
            id=f"draft-{i}",
            initiatorId=initiator.id,
            title=f"Идея №{i}: {random.choice(project_titles)}",
            description="Текст черновика, который находится в процессе доработки...",
            lastModified=(datetime.now() - timedelta(hours=random.randint(1, 100))).isoformat(),
            status="DRAFT",
            step=random.randint(1, 4),
            resources=[],
            type=random.choice(project_types)
        ))
    db.add_all(drafts)

    # --- 7. Шаблоны и База Знаний ---
    templates = [
        DBTemplate(id="t1", name="Заявка на благоустройство", category="Заявки", content="Текст шаблона...", lastModified="2024-01-01"),
        DBTemplate(id="t2", name="Смета типовая", category="Финансы", content="Таблица...", lastModified="2024-01-01")
    ]
    db.add_all(templates)

    kb_entries = []
    for i in range(1, 21):
        kb_entries.append(DBKnowledgeBaseEntry(
            id=f"kb-{i}",
            title=f"Успешный кейс №{i}",
            region=random.choice(["Москва", "СПб", "Казань", "Тюмень"]),
            budget=float(random.randint(500000, 5000000)),
            outcomes="Более 1000 довольных жителей",
            tags=random.sample(expertise_areas, k=2)
        ))
    db.add_all(kb_entries)

    # Глобальные настройки
    db.add(DBGlobalSettings(id=1, inflationRate=8.5, maxBudget=10000000.0, minBudget=10000.0, defaultSubsidyRate=95.0, currentYear=2024))

    db.commit()
    db.close()
    print(f"База данных успешно заполнена! Создано: {len(users)} пользователей, {len(npos)} НКО, {len(projects)} проектов.")

if __name__ == "__main__":
    seed_data()
