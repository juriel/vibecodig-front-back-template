from typing import Optional
from pydantic import BaseModel, Field


class CmsPageCreateDTO(BaseModel):
    cms_layout: int
    url: str = Field(min_length=1, max_length=128, pattern=r"^[A-Za-z0-9][A-Za-z0-9_\-/]*$")
    title: str = Field(min_length=1, max_length=128)
    subtitle: Optional[str] = Field(default=None, max_length=128)
    keywords: Optional[str] = Field(default=None, max_length=1024)
    page_content: str = ""
    css: str = ""
    javascript: str = ""
    is_index: bool = False
    # SEO (stored in cms_page_seo)
    description: Optional[str] = Field(default=None, max_length=320)
    og_title: Optional[str] = Field(default=None, max_length=200)
    og_description: Optional[str] = Field(default=None, max_length=320)
    og_image: Optional[str] = Field(default=None, max_length=512, pattern=r"^$|^(https?://|/)\S*$")
    canonical: Optional[str] = Field(default=None, max_length=512, pattern=r"^$|^https?://\S+$")
    noindex: bool = False


class CmsPageUpdateDTO(CmsPageCreateDTO):
    pass
