# Import every entity here so Base.metadata.create_all can detect it
from app.entities.privilege import Privilege
from app.entities.profile import Profile
from app.entities.user import User
from app.entities.user_preference import UserPreference
from app.entities.cms_layout import CmsTypeLayout, CmsLayout
from app.entities.cms_page import CmsPage, PageXRegisteredUserGroup
from app.entities.cms_widget import CmsWidget
from app.entities.cms_asset import CmsCss, CmsJs
from app.entities.cms_media import MediaFolder, MediaFile, Vfs
from app.entities.cms_seo import CmsPageSeo, CmsRedirect, GlobalConfiguration
# from app.entities.example import Example
