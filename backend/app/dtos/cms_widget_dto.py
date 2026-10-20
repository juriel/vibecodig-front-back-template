from pydantic import BaseModel, Field


class CmsWidgetCreateDTO(BaseModel):
    # Referenced as %WIDGET:name%, hence only letters, digits, hyphen and underscore.
    name: str = Field(min_length=1, max_length=256, pattern=r"^[A-Za-z0-9_\-]+$")
    value: str = ""


class CmsWidgetUpdateDTO(CmsWidgetCreateDTO):
    pass
