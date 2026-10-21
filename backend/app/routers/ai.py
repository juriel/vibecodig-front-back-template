"""AI assistant (under /api/ai): status, page drafts and code completions."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.dtos.ai_dto import CompletionDTO, DraftRequestDTO
from app.entities.user import User
from app.security import get_current_user, require_privilege
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/status", dependencies=[Depends(get_current_user)])
def status():
    return ai_service.status()


@router.post("/draft-page", status_code=201)
def draft_page(body: DraftRequestDTO, db: Session = Depends(get_db), actor: User = Depends(require_privilege("ADD_CMS_PAGE"))):
    return ai_service.draft_page(db, actor, body)


@router.post("/complete", dependencies=[Depends(require_privilege("ADD_CMS_PAGE", "EDIT_CMS_PAGE", "ADD_CMS_LAYOUT", "EDIT_CMS_LAYOUT"))])
def complete(body: CompletionDTO):
    return ai_service.complete(body)
