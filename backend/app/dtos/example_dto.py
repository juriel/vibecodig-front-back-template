from pydantic import BaseModel


class ExampleCreateDTO(BaseModel):
    name: str
