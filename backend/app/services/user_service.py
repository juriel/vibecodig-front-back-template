import secrets
import string

from sqlalchemy.orm import Session

from app.dtos.user_dto import UserCreateDTO, UserUpdateDTO
from app.entities.profile import Profile
from app.entities.user import User
from app.errors import ApiError
from app.security import hash_password

MIN_PASSWORD = 6


def _is_super(user: User) -> bool:
    return "ALL" in user.privileges


def _new_salt() -> str:
    return "".join(secrets.choice(string.ascii_uppercase) for _ in range(6))


def _serialize(user: User) -> dict:
    return {
        "login": user.login,
        "name": user.name,
        "email": user.email,
        "profile_ids": [p.id for p in user.profiles],
        # super = the profile includes ALL (full access); shown in the list so it is clear who can do everything
        "profiles": [{"id": p.id, "name": p.name, "super": any(pr.code == "ALL" for pr in p.privileges)} for p in user.profiles],
    }


def _find(db: Session, login: str) -> User:
    user = db.get(User, login)
    if user is None or user.deleted:
        raise ApiError(404, "error.user.not_found")
    return user


def _profiles(db: Session, actor: User, ids: list[int]) -> list[Profile]:
    """Requested profiles; only a super user may assign profiles that contain ALL."""
    found = db.query(Profile).filter(Profile.id.in_(ids)).all() if ids else []
    if len(found) != len(set(ids)):
        raise ApiError(400, "error.user.profile_not_found")
    if not _is_super(actor) and any(any(pr.code == "ALL" for pr in p.privileges) for p in found):
        raise ApiError(403, "error.user.assign_super_profile")
    return found


def _guard_target(actor: User, target: User):
    if _is_super(target) and not _is_super(actor):
        raise ApiError(403, "error.user.modify_super")


def list_profiles(db: Session, actor: User) -> list[dict]:
    """Profiles the actor may assign (for the form selector)."""
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
    # Also checks deleted users: the login is the primary key and cannot be reused.
    if db.get(User, dto.login) is not None:
        raise ApiError(409, "error.user.login_exists")
    salt = _new_salt()
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
            raise ApiError(422, "error.user.password_too_short", MIN_PASSWORD)
        user.salt = _new_salt()
        user.password = hash_password(user.salt, dto.password)
    user.profiles = _profiles(db, actor, dto.profile_ids)
    db.commit()
    db.refresh(user)
    return _serialize(user)


def delete_user(db: Session, actor: User, login: str) -> None:
    """Soft delete (deleted=1), like the rest of the system."""
    if login == actor.login:
        raise ApiError(400, "error.user.cannot_delete_self")
    user = _find(db, login)
    _guard_target(actor, user)
    user.deleted = True
    db.commit()
