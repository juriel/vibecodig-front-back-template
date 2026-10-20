from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.dtos.user_dto import UserCreateDTO, UserUpdateDTO
from app.entities.user import User
from app.security import require_privilege
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])


# Static routes before dynamic ones (/{login})
@router.get("/profiles")
def list_profiles(db: Session = Depends(get_db), actor: User = Depends(require_privilege("VIEW_USER", "ADD_USER", "EDIT_USER"))):
    return user_service.list_profiles(db, actor)


@router.get("", dependencies=[Depends(require_privilege("VIEW_USER"))])
def list_users(db: Session = Depends(get_db)):
    return user_service.list_users(db)


@router.post("", status_code=201)
def create_user(body: UserCreateDTO, db: Session = Depends(get_db), actor: User = Depends(require_privilege("ADD_USER"))):
    return user_service.create_user(db, actor, body)


@router.get("/{login}", dependencies=[Depends(require_privilege("VIEW_USER"))])
def get_user(login: str, db: Session = Depends(get_db)):
    return user_service.get_user(db, login)


@router.put("/{login}")
def update_user(login: str, body: UserUpdateDTO, db: Session = Depends(get_db), actor: User = Depends(require_privilege("EDIT_USER"))):
    return user_service.update_user(db, actor, login, body)


@router.delete("/{login}", status_code=204)
def delete_user(login: str, db: Session = Depends(get_db), actor: User = Depends(require_privilege("DELETE_USER"))):
    user_service.delete_user(db, actor, login)
