from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.dtos.profile_dto import ProfileCreateDTO, ProfileUpdateDTO
from app.entities.user import User
from app.security import require_privilege
from app.services import profile_service

router = APIRouter(tags=["profiles"])


@router.get("/privileges", dependencies=[Depends(require_privilege("VIEW_PROFILE"))])
def list_privileges(db: Session = Depends(get_db)):
    """Privilege catalog (read-only: the codes are defined by the platform code)."""
    return profile_service.list_privileges(db)


# Static routes before dynamic ones (/profiles/{id})
@router.get("/profiles/privileges")
def grantable_privileges(db: Session = Depends(get_db), actor: User = Depends(require_privilege("ADD_PROFILE", "EDIT_PROFILE"))):
    return profile_service.grantable_privileges(db, actor)


@router.get("/profiles", dependencies=[Depends(require_privilege("VIEW_PROFILE"))])
def list_profiles(db: Session = Depends(get_db)):
    return profile_service.list_profiles(db)


@router.post("/profiles", status_code=201)
def create_profile(body: ProfileCreateDTO, db: Session = Depends(get_db), actor: User = Depends(require_privilege("ADD_PROFILE"))):
    return profile_service.create_profile(db, actor, body)


@router.get("/profiles/{profile_id}", dependencies=[Depends(require_privilege("VIEW_PROFILE"))])
def get_profile(profile_id: int, db: Session = Depends(get_db)):
    return profile_service.get_profile(db, profile_id)


@router.put("/profiles/{profile_id}")
def update_profile(profile_id: int, body: ProfileUpdateDTO, db: Session = Depends(get_db), actor: User = Depends(require_privilege("EDIT_PROFILE"))):
    return profile_service.update_profile(db, actor, profile_id, body)


@router.delete("/profiles/{profile_id}", status_code=204)
def delete_profile(profile_id: int, db: Session = Depends(get_db), actor: User = Depends(require_privilege("DELETE_PROFILE"))):
    profile_service.delete_profile(db, actor, profile_id)
