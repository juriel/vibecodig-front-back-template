from typing import List, Optional
from pydantic import BaseModel, Field


class UserCreateDTO(BaseModel):
    login: str = Field(min_length=3, max_length=64, pattern=r"^[A-Za-z0-9_.@-]+$")
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=128)
    email: Optional[str] = Field(default=None, max_length=64)
    profile_ids: List[int] = []


class UserUpdateDTO(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    email: Optional[str] = Field(default=None, max_length=64)
    password: Optional[str] = Field(default=None, max_length=128)  # vacío/None = no cambiar
    profile_ids: List[int] = []
