from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.db import get_db
from app.entities.user import User
from app.dtos.user_dto import LoginDTO
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(body: LoginDTO, request: Request, db: Session = Depends(get_db)):
    user = auth_service.authenticate(db, body.login, body.password)
    request.session.clear()
    request.session["user_id"] = user.id
    return user.to_dict()


@router.post("/logout", status_code=204)
def logout(request: Request):
    request.session.clear()


@router.get("/me")
def me(user: User = Depends(auth_service.current_user)):
    return user.to_dict()
