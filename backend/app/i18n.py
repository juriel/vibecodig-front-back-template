"""Server-side i18n.

Shares the catalog with the frontend: frontend/web/assets/i18n/<lang>.properties (UTF-8, `key=value`, `{0}` placeholders).
The language comes from the request's Accept-Language header; English is the default and the fallback.
"""
import re
from functools import lru_cache
from pathlib import Path

CATALOG_DIR = Path(__file__).resolve().parents[2] / "frontend" / "web" / "assets" / "i18n"
SUPPORTED = ("en", "es")
DEFAULT = "en"


@lru_cache(maxsize=None)
def _load(lang: str) -> dict[str, str]:
    path = CATALOG_DIR / f"{lang}.properties"
    messages: dict[str, str] = {}
    if not path.is_file():
        return messages
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith(("#", "!")) or "=" not in line:
            continue
        key, value = line.split("=", 1)
        messages[key.strip()] = value.strip()
    return messages


def negotiate(accept_language: str | None) -> str:
    """Pick the best supported language from an Accept-Language header (e.g. "es-ES,es;q=0.9,en;q=0.8")."""
    candidates = []
    for position, part in enumerate((accept_language or "").split(",")):
        tag, _, params = part.strip().partition(";")
        match = re.search(r"q=([0-9.]+)", params)
        quality = float(match.group(1)) if match else 1.0
        if tag:
            candidates.append((-quality, position, tag.split("-")[0].lower()))
    for _, _, lang in sorted(candidates):
        if lang in SUPPORTED:
            return lang
    return DEFAULT


def t(key: str, lang: str = DEFAULT, *args) -> str:
    """Translate `key`; falls back to English and then to the key itself. `{0}`, `{1}`... are replaced by `args`."""
    value = _load(lang).get(key) or _load(DEFAULT).get(key) or key
    return re.sub(r"\{(\d+)\}", lambda m: str(args[int(m.group(1))]) if int(m.group(1)) < len(args) else m.group(0), value)
