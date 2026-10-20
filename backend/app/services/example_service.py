from sqlalchemy.orm import Session
from app.repository import BaseRepository
from app.entities.example import Example
from app.errors import ApiError


def list_items(db: Session):
    return [i.to_dict() for i in BaseRepository(db, Example).find_all()]


def create_item(db: Session, entity: Example):
    return BaseRepository(db, Example).save(entity).to_dict()


def get_item(db: Session, item_id: int):
    item = BaseRepository(db, Example).find(item_id)
    if not item:
        raise ApiError(404, "error.example.not_found")
    return item.to_dict()


def delete_item(db: Session, item_id: int):
    repo = BaseRepository(db, Example)
    if not repo.find(item_id):
        raise ApiError(404, "error.example.not_found")
    repo.delete(item_id)
