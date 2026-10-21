from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.dtos.auth_dto import AccountDTO, LoginDTO, PasswordChangeDTO, PreferencesDTO
from app.entities.user import User
from app.security import get_current_user
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(body: LoginDTO, db: Session = Depends(get_db)):
    return auth_service.login(db, body)


@router.get("/me")
def me(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return auth_service.session_data(db, user)


@router.put("/me/preferences")
def save_preferences(body: PreferencesDTO, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Any signed-in user can change their own panel preferences (theme)."""
    return auth_service.save_preferences(db, user, body)


@router.put("/me")
def update_account(body: AccountDTO, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Any signed-in user can edit their own name and email."""
    return auth_service.update_account(db, user, body)


@router.put("/me/password", status_code=204)
def change_password(body: PasswordChangeDTO, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    auth_service.change_password(db, user, body)
