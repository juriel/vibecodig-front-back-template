from pydantic import BaseModel, Field


class CmsRedirectCreateDTO(BaseModel):
    # Old path on this site (e.g. /servicios.html); query strings are not matched.
    source: str = Field(min_length=2, max_length=255, pattern=r"^/[^\s?#]+$")
    # A path on this site (/servicios.page) or an absolute URL.
    target: str = Field(min_length=1, max_length=512, pattern=r"^(/|https?://)\S*$")
    status_code: int = Field(default=301, ge=301, le=302)   # 301 permanent, 302 temporary (the form sends it as text)
    active: bool = True


class CmsRedirectUpdateDTO(CmsRedirectCreateDTO):
    pass
