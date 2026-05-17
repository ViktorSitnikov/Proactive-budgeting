import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from datetime import timedelta

from api.auth import create_access_token, get_current_user, get_password_hash, verify_password
from api.config import ACCESS_TOKEN_EXPIRE_MINUTES
from database import get_db
from models import DBUser
from schemas import Token, User, UserLogin, UserRegister, UserRole, UserUpdate


router = APIRouter()


def serialize_user(db_user: DBUser) -> User:
    return User(
        id=db_user.id,
        email=db_user.email,
        role=UserRole(db_user.role),
        name=db_user.name,
        organization=db_user.organization,
        phone=db_user.phone,
        address=db_user.address,
        bio=db_user.bio,
        avatar=db_user.avatar,
    )


@router.post("/api/auth/register", response_model=Token)
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
        organization=user_in.organization,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(
        data={"sub": new_user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": serialize_user(new_user),
    }


@router.post("/api/auth/login", response_model=Token)
async def login(user_in: UserLogin, db: Session = Depends(get_db)):
    email_normalized = user_in.email.lower()
    user = db.query(DBUser).filter(DBUser.email == email_normalized).first()
    if not user or not verify_password(user_in.password, user.password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": serialize_user(user),
    }


@router.get("/api/auth/me", response_model=User)
async def read_users_me(current_user: DBUser = Depends(get_current_user)):
    return serialize_user(current_user)


@router.patch("/api/users/me", response_model=User)
async def update_user_me(
    user_update: UserUpdate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for key, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)
    db.refresh(current_user)
    return serialize_user(current_user)


@router.get("/api/users/{user_id}", response_model=User)
async def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_user(user)
