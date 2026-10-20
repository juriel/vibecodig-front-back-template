import secrets
import string

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.dtos.user_dto import UserCreateDTO, UserUpdateDTO
from app.entities.profile import Profile
from app.entities.user import User
from app.security import hash_password

MIN_PASSWORD = 6


def _is_super(user: User) -> bool:
    return "ALL" in user.privileges


def _serialize(user: User) -> dict:
    return {
        "login": user.login,
        "name": user.name,
        "email": user.email,
        "profile_ids": [p.id for p in user.profiles],
        "profiles": [{"id": p.id, "name": p.name} for p in user.profiles],
    }


def _find(db: Session, login: str) -> User:
    user = db.get(User, login)
    if user is None or user.deleted:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


def _profiles(db: Session, actor: User, ids: list[int]) -> list[Profile]:
    """Perfiles solicitados; solo un super usuario puede asignar perfiles que contengan ALL."""
    found = db.query(Profile).filter(Profile.id.in_(ids)).all() if ids else []
    if len(found) != len(set(ids)):
        raise HTTPException(status_code=400, detail="Perfil inexistente")
    if not _is_super(actor) and any(any(pr.code == "ALL" for pr in p.privileges) for p in found):
        raise HTTPException(status_code=403, detail={"error": "No puedes asignar perfiles de super usuario"})
    return found


def _guard_target(actor: User, target: User):
    if _is_super(target) and not _is_super(actor):
        raise HTTPException(status_code=403, detail={"error": "No puedes modificar a un super usuario"})


def list_profiles(db: Session, actor: User) -> list[dict]:
    """Perfiles asignables por el actor (para el selector del formulario)."""
    profiles = db.query(Profile).order_by(Profile.name).all()
    if not _is_super(actor):
        profiles = [p for p in profiles if not any(pr.code == "ALL" for pr in p.privileges)]
    return [{"id": p.id, "name": p.name} for p in profiles]


def list_users(db: Session) -> list[dict]:
    users = db.query(User).filter(User.deleted.is_(False)).order_by(User.login).all()
    return [_serialize(u) for u in users]


def get_user(db: Session, login: str) -> dict:
    return _serialize(_find(db, login))


def create_user(db: Session, actor: User, dto: UserCreateDTO) -> dict:
    # También valida contra usuarios borrados: el login es la PK y no se puede reutilizar.
    if db.get(User, dto.login) is not None:
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese login")
    salt = "".join(secrets.choice(string.ascii_uppercase) for _ in range(6))
    user = User(
        login=dto.login, salt=salt, password=hash_password(salt, dto.password),
        name=dto.name, email=dto.email or None, deleted=False,
        profiles=_profiles(db, actor, dto.profile_ids),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _serialize(user)


def update_user(db: Session, actor: User, login: str, dto: UserUpdateDTO) -> dict:
    user = _find(db, login)
    _guard_target(actor, user)
    user.name = dto.name
    user.email = dto.email or None
    if dto.password:
        if len(dto.password) < MIN_PASSWORD:
            raise HTTPException(status_code=422, detail=f"La contraseña debe tener al menos {MIN_PASSWORD} caracteres")
        user.salt = "".join(secrets.choice(string.ascii_uppercase) for _ in range(6))
        user.password = hash_password(user.salt, dto.password)
    user.profiles = _profiles(db, actor, dto.profile_ids)
    db.commit()
    db.refresh(user)
    return _serialize(user)


def delete_user(db: Session, actor: User, login: str) -> None:
    """Borrado lógico (deleted=1), como el resto del sistema."""
    if login == actor.login:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propio usuario")
    user = _find(db, login)
    _guard_target(actor, user)
    user.deleted = True
    db.commit()
