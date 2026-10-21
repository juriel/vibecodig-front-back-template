from typing import Literal, Optional

from pydantic import BaseModel, Field


class LoginDTO(BaseModel):
    login: str
    password: str


class PreferencesDTO(BaseModel):
    """Partial update: only the fields sent are changed."""
    theme: Optional[Literal["light", "dark"]] = None
    palette: Optional[str] = Field(default=None, pattern=r"^[a-z0-9-]{1,16}$")
    brand: Optional[str] = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    accent: Optional[str] = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")


class AccountDTO(BaseModel):
    """What a user can change about their own account."""
    name: str = Field(min_length=1, max_length=128)
    email: Optional[str] = Field(default=None, max_length=64)


class PasswordChangeDTO(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)
