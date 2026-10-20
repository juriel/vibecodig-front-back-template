from typing import Literal

from pydantic import BaseModel, Field, field_validator

_CODE = r"^[A-Za-z0-9][A-Za-z0-9_\-]*$"
_URL = r"^(https?://\S+)?$"                                  # empty, or an absolute http(s) URL
_PATH = r"^([A-Za-z0-9._\-]+(/[A-Za-z0-9._\-]+)*)?$"         # empty, or a relative path without leading slash


class _CmsAssetBase(BaseModel):
    """Fields shared by global CSS and JS. Either `url` (external) or `path` + `content` (own file) is used."""
    name: str = Field(min_length=1, max_length=128)
    active: bool = True
    order_show: int = Field(default=0, ge=0, le=100000)
    url: str = Field(default="", max_length=256, pattern=_URL)
    path: str = Field(default="", max_length=512, pattern=_PATH)
    content: str = ""

    @field_validator("path")
    @classmethod
    def _no_dot_segments(cls, value: str) -> str:
        if any(segment in (".", "..") for segment in value.split("/")):
            raise ValueError("invalid path")
        return value


class CmsCssCreateDTO(_CmsAssetBase):
    code: str = Field(min_length=1, max_length=32, pattern=_CODE)


class CmsCssUpdateDTO(_CmsAssetBase):
    pass


class CmsJsCreateDTO(_CmsAssetBase):
    code: str = Field(min_length=1, max_length=32, pattern=_CODE)
    type: Literal["header", "footer"] = "footer"


class CmsJsUpdateDTO(_CmsAssetBase):
    type: Literal["header", "footer"] = "footer"
