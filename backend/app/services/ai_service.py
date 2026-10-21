"""AI assistant (Claude): drafts of new pages and code completions for the panel's code editors.

Off until a key is configured: ANTHROPIC_API_KEY (or ANTHROPIC_AUTH_TOKEN) in .env.
Models (.env, optional): AI_DRAFT_MODEL (default claude-opus-5-5), AI_COMPLETE_MODEL (default claude-haiku-5-5, fast and
cheap: it runs while people type).
AI_FAKE=1 answers with fixed text without calling the API — only for the automated browser tests.
"""
import os
import re
from typing import Optional

import anthropic
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.dtos.ai_dto import CompletionDTO, DraftRequestDTO
from app.dtos.cms_page_dto import CmsPageCreateDTO
from app.entities.cms_asset import CmsCss
from app.entities.cms_layout import CmsLayout
from app.entities.cms_page import CmsPage
from app.entities.cms_widget import CmsWidget
from app.entities.user import User
from app.errors import ApiError
from app.services import cms_page_service

DRAFT_MODEL = os.environ.get("AI_DRAFT_MODEL", "claude-opus-5-5")
COMPLETE_MODEL = os.environ.get("AI_COMPLETE_MODEL", "claude-haiku-5-5")


def _fake() -> bool:
    return os.environ.get("AI_FAKE") == "1"


def enabled() -> bool:
    return _fake() or bool(os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN"))


def status() -> dict:
    return {"enabled": enabled(), "draft_model": DRAFT_MODEL, "complete_model": COMPLETE_MODEL}


_client: Optional[anthropic.Anthropic] = None


def _api() -> anthropic.Anthropic:
    global _client
    if not enabled():
        raise ApiError(503, "error.ai.not_configured")
    if _client is None:
        _client = anthropic.Anthropic(timeout=120.0)
    return _client


def _call(fn):
    """Runs an API call and turns SDK errors into messages the panel can show (most specific first)."""
    try:
        return fn()
    except anthropic.AuthenticationError:
        raise ApiError(503, "error.ai.bad_key")
    except anthropic.RateLimitError:
        raise ApiError(429, "error.ai.rate_limited")
    except anthropic.APIConnectionError:
        raise ApiError(503, "error.ai.unreachable")
    except anthropic.APIStatusError:
        raise ApiError(502, "error.ai.failed")


# ---------------------------------------------------------------- page drafts

class PageDraft(BaseModel):
    """What the model returns for a new page (validated by the SDK against this schema)."""
    title: str = Field(description="Page title, max 70 characters, as it appears in Google")
    subtitle: str = Field(description="One-line subtitle, max 120 characters")
    url: str = Field(description="Short URL slug: lowercase letters, digits and hyphens only, no accents")
    description: str = Field(description="SEO meta description, 120-160 characters")
    keywords: str = Field(description="5 to 8 comma-separated keywords")
    page_content: str = Field(description="The page body as HTML (no <html>, <head>, <body> or <script>)")


SYSTEM = """You write web pages for a Colombian company's site, inside its CMS.
Write in Spanish (Colombia), in a clear, warm and professional tone.

How the site is built:
- The page body is plain HTML that goes inside a layout; do not write <html>, <head>, <body>, <style> or <script>.
- Use ONLY the CSS classes listed under "Available classes", so the page looks like the rest of the site.
- Reusable pieces are inserted with %WIDGET:name%; use the listed widgets when one fits (for example a call to action),
  instead of rewriting them.
- Structure the page in sections with headings (h2/h3), short paragraphs and lists. No inline styles.

Facts:
- Never invent prices, phone numbers, addresses, legal commitments, statistics or client names. When the page needs one,
  write a visible placeholder in square brackets, e.g. [precio por confirmar], so a person fills it in.
- This is a draft that a person will review before publishing."""


def _site_context(db: Session, layout: CmsLayout) -> str:
    classes: set[str] = set()
    for css in db.query(CmsCss).filter(CmsCss.active == 1):
        classes.update(re.findall(r"\.([A-Za-z][\w-]{1,40})", css.content or ""))
    widgets = [f"- {w.name}: {re.sub(r'<[^>]+>|\\s+', ' ', w.value or '')[:160].strip()}" for w in db.query(CmsWidget).order_by(CmsWidget.name)]
    pages = [p.url for p in db.query(CmsPage.url).order_by(CmsPage.url)]
    return (
        f"Layout of the new page: «{layout.layout_name}». Its HTML (the page body replaces %CONTENT%):\n{(layout.layout_content or '')[:1500]}\n\n"
        f"Available classes: {', '.join(sorted(classes)[:220])}\n\n"
        f"Widgets:\n" + "\n".join(widgets) + "\n\n"
        f"Existing page URLs (do not reuse them): {', '.join(pages)}"
    )


def _unique_url(db: Session, wanted: str) -> str:
    base = re.sub(r"[^a-z0-9-]+", "-", wanted.lower()).strip("-")[:60] or "pagina"
    url, n = base, 2
    while db.query(CmsPage).filter(CmsPage.url == url).first():
        url, n = f"{base}-{n}", n + 1
    return url


def _fake_draft(brief: str) -> PageDraft:
    return PageDraft(
        title=f"Borrador: {brief[:50]}", subtitle="Texto generado para pruebas", url="borrador-ia",
        description="Borrador de prueba generado sin llamar a la API de IA. " * 2,
        keywords="prueba, borrador, ia",
        page_content=f"<section><div class=\"container\"><h2>{brief[:80]}</h2><p>Contenido de prueba [dato por confirmar].</p></div></section>",
    )


def draft_page(db: Session, actor: User, dto: DraftRequestDTO) -> dict:
    """Writes a draft page from a request in plain words and saves it hidden (noindex) for a person to review."""
    layout = db.get(CmsLayout, dto.cms_layout) if dto.cms_layout else (
        db.query(CmsLayout).filter(CmsLayout.default_layout == True).order_by(CmsLayout.id).first())  # noqa: E712
    if layout is None:
        raise ApiError(400, "error.page.layout_not_found")

    if _fake():
        draft = _fake_draft(dto.brief)
    else:
        client = _api()
        response = _call(lambda: client.beta.messages.parse(
            model=DRAFT_MODEL,
            max_tokens=16000,
            output_config={"effort": "medium"},
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",                # a declined request is retried on another model by the API
            system=SYSTEM,
            messages=[{"role": "user", "content": f"{_site_context(db, layout)}\n\nWrite this page:\n{dto.brief}"}],
            output_format=PageDraft,
        ))
        if response.stop_reason == "refusal":
            raise ApiError(422, "error.ai.refused")
        if response.stop_reason == "max_tokens" or response.parsed_output is None:
            raise ApiError(502, "error.ai.incomplete")
        draft = response.parsed_output

    page = cms_page_service.create_page(db, actor, CmsPageCreateDTO(
        cms_layout=layout.id, url=_unique_url(db, draft.url), title=draft.title[:128], subtitle=draft.subtitle[:128] or None,
        keywords=draft.keywords[:1024], page_content=draft.page_content, description=draft.description[:320],
        noindex=True,           # hidden from search engines until someone reviews and publishes it
    ))
    return page


# ---------------------------------------------------------------- code completion

COMPLETE_SYSTEM = """You complete code in a web CMS editor, like an IDE's inline suggestion.
You receive the code before and after the cursor. Answer with ONLY the text to insert at the cursor: no explanations,
no markdown fences, no repetition of the code around it. Keep it short (at most a few lines) and consistent with the
surrounding code and its CSS classes. If nothing useful fits, answer with an empty string."""


def complete(dto: CompletionDTO) -> dict:
    if _fake():
        return {"text": "</p>" if dto.before.rstrip().endswith("<p>") or "<p>" in dto.before[-40:] else ""}
    client = _api()
    response = _call(lambda: client.messages.create(
        model=COMPLETE_MODEL,
        max_tokens=256,
        thinking={"type": "disabled"},        # latency matters more than reasoning for a few characters
        output_config={"effort": "low"},
        system=COMPLETE_SYSTEM,
        messages=[{"role": "user", "content": f"Language: {dto.language}\n<before>{dto.before}</before><cursor/><after>{dto.after}</after>"}],
    ))
    if response.stop_reason == "refusal":
        return {"text": ""}
    text = "".join(b.text for b in response.content if b.type == "text")
    text = re.sub(r"^```[\w-]*\n?|\n?```$", "", text.strip("\n"))   # in case fences slip through
    return {"text": text}
