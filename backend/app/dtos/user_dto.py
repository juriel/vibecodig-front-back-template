from pydantic import BaseModel


class LoginDTO(BaseModel):
    login: str
    password: str
