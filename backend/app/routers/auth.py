from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.dtos.auth_dto import LoginDTO
from app.entities.user import User
from app.security import get_current_user
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(body: LoginDTO, db: Session = Depends(get_db)):
    return auth_service.login(db, body)


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return auth_service.session_data(user)
