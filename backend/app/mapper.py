from typing import TypeVar
from pydantic import BaseModel

T = TypeVar('T')

_registry: dict[type, type] = {}


def register(dto_cls: type, entity_cls: type) -> None:
    _registry[dto_cls] = entity_cls


def _iter_dto(dto: BaseModel) -> dict:
    if hasattr(dto, 'model_fields'):
        return {name: getattr(dto, name) for name in dto.model_fields}
    return {name: getattr(dto, name) for name in dto.__fields__}


def dto_to_entity(dto: BaseModel, entity_cls: type = None) -> object:
    if entity_cls is None:
        entity_cls = _registry.get(type(dto))
        if not entity_cls:
            raise ValueError(f"Sin mapeo registrado para {type(dto).__name__}")

    col_fields = {c.key for c in entity_cls.__mapper__.column_attrs}
    rel_fields = {r.key: r for r in entity_cls.__mapper__.relationships}

    fields = {}
    for field_name, value in _iter_dto(dto).items():
        if field_name in rel_fields:
            child_cls = rel_fields[field_name].mapper.class_
            if isinstance(value, list):
                fields[field_name] = [dto_to_entity(v, child_cls) for v in value if isinstance(v, BaseModel)]
            elif isinstance(value, BaseModel):
                fields[field_name] = dto_to_entity(value, child_cls)
        elif field_name in col_fields:
            fields[field_name] = value

    return entity_cls(**fields)
