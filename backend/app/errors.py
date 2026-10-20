"""API errors with a translation key. The handler translates the message using the request's Accept-Language."""
from fastapi import Request
from fastapi.responses import JSONResponse

from app.i18n import negotiate, t


class ApiError(Exception):
    """Business error: `key` is an `error.*` catalog key and `args` fill its `{0}`, `{1}` placeholders."""

    def __init__(self, status: int, key: str, *args):
        super().__init__(key)
        self.status = status
        self.key = key
        self.args_ = args


async def api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
    lang = negotiate(request.headers.get("accept-language"))
    return JSONResponse({"detail": t(exc.key, lang, *exc.args_), "code": exc.key}, status_code=exc.status)
