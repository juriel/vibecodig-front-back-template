import bcrypt
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db import get_db
from app.repository import BaseRepository
from app.entities.user import User


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def authenticate(db: Session, login: str, password: str) -> User:
    user = BaseRepository(db, User).find_by(login=login)
    # Mismo mensaje si el usuario no existe o la clave es errada, para no revelar qué logins existen
    if not user or not user.active or not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    return user


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Dependencia para proteger rutas: 401 si no hay sesión válida."""
    user_id = request.session.get("user_id")
    user = BaseRepository(db, User).find(user_id) if user_id else None
    if not user or not user.active:
        request.session.clear()
        raise HTTPException(status_code=401, detail="No autenticado")
    return user
