from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.entities.example import Example
from app.dtos.example_dto import ExampleCreateDTO
from app.services import example_service
from app import mapper

mapper.register(ExampleCreateDTO, Example)

router = APIRouter(prefix="/examples", tags=["examples"])


@router.get("")
def list_items(db: Session = Depends(get_db)):
    return example_service.list_items(db)


@router.post("", status_code=201)
def create_item(body: ExampleCreateDTO, db: Session = Depends(get_db)):
    return example_service.create_item(db, mapper.dto_to_entity(body))


@router.get("/{item_id}")
def get_item(item_id: int, db: Session = Depends(get_db)):
    return example_service.get_item(db, item_id)


@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    example_service.delete_item(db, item_id)
