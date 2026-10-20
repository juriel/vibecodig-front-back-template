from pydantic import BaseModel, Field


class CmsLayoutCreateDTO(BaseModel):
    layout_name: str = Field(min_length=1, max_length=128)
    cms_type_layout: str = Field(min_length=1, max_length=32)
    layout_content: str = ""
    default_layout: bool = False


class CmsLayoutUpdateDTO(CmsLayoutCreateDTO):
    pass
