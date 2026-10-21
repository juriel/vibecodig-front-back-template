from sqlalchemy import Column, ForeignKey, Integer, String
from app.db import Base


class CmsPageSeo(Base):
    """SEO data of a page (1:1 with cms_page). A separate table so the original cms_page schema stays untouched."""
    __tablename__ = "cms_page_seo"

    cms_page = Column(Integer, ForeignKey("cms_page.id"), primary_key=True)
    description = Column(String(320))
    og_title = Column(String(200))           # empty → page title
    og_description = Column(String(320))     # empty → description
    og_image = Column(String(512))           # absolute URL or a site path (/media/...)
    canonical = Column(String(512))          # empty → the page's own URL
    noindex = Column(Integer, nullable=False, default=0)


class CmsRedirect(Base):
    """Permanent (301) or temporary (302) redirect from an old path, e.g. /servicios.html → /servicios.page."""
    __tablename__ = "cms_redirect"

    id = Column(Integer, primary_key=True)
    source = Column(String(255), nullable=False, unique=True)
    target = Column(String(512), nullable=False)
    status_code = Column(Integer, nullable=False, default=301)
    active = Column(Integer, nullable=False, default=1)


class GlobalConfiguration(Base):
    """Key/value site settings (same table as the original CMS). SEO uses seo.site_url, seo.site_name and seo.locale."""
    __tablename__ = "global_configuration"

    code = Column(String(32), primary_key=True)
    name = Column(String(128), nullable=False)
    value = Column(String(1024), default="")
    removable = Column(Integer, default=1)
