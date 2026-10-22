from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from app.db import Base


class ApiToken(Base):
    """Personal access token: lets an external client (Claude, through the MCP server) act as its user.
    Only the SHA-256 of the token is stored; the token itself is shown once, when it is created.
    Revoking keeps the row (revoked_at) so the list of what had access stays auditable."""
    __tablename__ = "api_token"

    id = Column(Integer, primary_key=True, autoincrement=True)
    login = Column(String(64), ForeignKey("users.login"), nullable=False, index=True)
    name = Column(String(64), nullable=False)                  # what the user called it, e.g. "Claude de la oficina"
    token_hash = Column(String(64), nullable=False, unique=True)
    prefix = Column(String(16), nullable=False)                 # first characters, to recognize it in the list
    created_at = Column(DateTime, nullable=False)
    last_used_at = Column(DateTime)
    revoked_at = Column(DateTime)
