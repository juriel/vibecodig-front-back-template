from sqlalchemy.orm import Session

from app.dtos.auth_dto import AccountDTO, LoginDTO, PasswordChangeDTO, PreferencesDTO
from app.entities.user import User
from app.entities.user_preference import UserPreference
from app.errors import ApiError
from app.security import create_token, hash_password, verify_password
from app.services.user_service import _new_salt


def preferences(db: Session, user: User) -> dict:
    pref = db.get(UserPreference, user.login)
    if pref is None:
        return {"theme": "light", "palette": None, "brand": None, "accent": None}
    return {"theme": pref.theme, "palette": pref.palette, "brand": pref.brand, "accent": pref.accent}


def save_preferences(db: Session, user: User, dto: PreferencesDTO) -> dict:
    pref = db.get(UserPreference, user.login) or UserPreference(login=user.login, theme="light")
    for field, value in dto.model_dump(exclude_unset=True).items():
        setattr(pref, field, value.lower() if field in ("brand", "accent") and value else value)
    db.add(pref)
    db.commit()
    return preferences(db, user)


def session_data(db: Session, user: User, token: str | None = None) -> dict:
    data = {
        "user": {"login": user.login, "name": user.name, "email": user.email},
        "privileges": sorted(user.privileges),
        "preferences": preferences(db, user),
    }
    if token:
        data["token"] = token
    return data


def login(db: Session, dto: LoginDTO) -> dict:
    user = db.get(User, dto.login)
    # Same error for unknown user, deleted user or wrong password (do not reveal which one).
    if user is None or user.deleted or not verify_password(user, dto.password):
        raise ApiError(401, "error.invalid_credentials")
    return session_data(db, user, create_token(user.login))


def update_account(db: Session, user: User, dto: AccountDTO) -> dict:
    """The signed-in user edits their own name and email (login, profiles and privileges are not theirs to change)."""
    user.name = dto.name.strip()
    user.email = (dto.email or "").strip() or None
    db.commit()
    return session_data(db, user)


def change_password(db: Session, user: User, dto: PasswordChangeDTO) -> None:
    if not verify_password(user, dto.current_password):
        raise ApiError(400, "error.account.wrong_password")
    user.salt = _new_salt()
    user.password = hash_password(user.salt, dto.new_password)
    db.commit()
