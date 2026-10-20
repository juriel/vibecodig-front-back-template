from typing import List
from pydantic import BaseModel, Field


class ProfileCreateDTO(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    privilege_codes: List[str] = []


class ProfileUpdateDTO(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    privilege_codes: List[str] = []
