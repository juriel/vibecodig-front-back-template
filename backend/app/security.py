import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db import get_db
from app.entities.user import User

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", "480"))
_bearer = HTTPBearer(auto_error=False)


def _secret() -> str:
    secret = os.environ.get("JWT_SECRET")
    if not secret:
        raise RuntimeError("Falta JWT_SECRET en el .env")
    return secret


def hash_password(salt: str, password: str) -> str:
    """SHA-256(salt + password) en hex: mismo esquema que la tabla `users` existente."""
    return hashlib.sha256((salt + password).encode()).hexdigest()


def verify_password(user: User, password: str) -> bool:
    return hmac.compare_digest(hash_password(user.salt, password), user.password)


def create_token(login: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    return jwt.encode({"sub": login, "exp": exp}, _secret(), algorithm=JWT_ALGORITHM)


def get_current_user(
    cred: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(status_code=401, detail="No autenticado")
    if cred is None:
        raise unauthorized
    try:
        login = jwt.decode(cred.credentials, _secret(), algorithms=[JWT_ALGORITHM])["sub"]
    except jwt.PyJWTError:
        raise unauthorized
    user = db.get(User, login)
    if user is None or user.deleted:
        raise unauthorized
    return user


def require_privilege(*codes: str):
    """Dependency: exige al menos uno de los privilegios (o ALL). Uso: dependencies=[Depends(require_privilege('VIEW_USER'))]"""
    def checker(user: User = Depends(get_current_user)) -> User:
        privs = user.privileges
        if "ALL" not in privs and not privs.intersection(codes):
            raise HTTPException(status_code=403, detail={"error": "Sin permisos para esta acción"})
        return user
    return checker
