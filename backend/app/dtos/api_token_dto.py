from pydantic import BaseModel, Field


class ApiTokenCreateDTO(BaseModel):
    name: str = Field(min_length=1, max_length=64)
