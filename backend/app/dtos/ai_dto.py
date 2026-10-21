from typing import Literal, Optional

from pydantic import BaseModel, Field


class DraftRequestDTO(BaseModel):
    brief: str = Field(min_length=10, max_length=4000)   # what the page should be about, in plain words
    cms_layout: Optional[int] = None                       # empty = the default layout


class CompletionDTO(BaseModel):
    language: Literal["html", "css", "javascript"]
    before: str = Field(default="", max_length=6000)       # code before the cursor (the editor sends the tail)
    after: str = Field(default="", max_length=2000)        # code after the cursor
