from sqlalchemy import Column, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.db.database import Base


class Standard(Base):
    __tablename__ = "standards"

    id = Column(Integer, primary_key=True)
    is_number = Column(String(64), unique=True, nullable=False, index=True)
    title = Column(String(512), nullable=False)
    status = Column(String(32), nullable=False, default="Active", index=True)
    department = Column(String(128), index=True)
    aspect = Column(String(128), index=True)
    domain = Column(String(64), index=True)
    description = Column(Text, default="")
    scope = Column(Text, default="")
    keywords = Column(JSONB, default=list)
    requirements = Column(JSONB, default=list)
    title_hi = Column(String(512), nullable=True)
    scope_hi = Column(Text, nullable=True)
    requirements_hi = Column(JSONB, nullable=True)
    i18n = Column(JSONB, nullable=True)
    year = Column(Integer)
    reaffirmation_year = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    outgoing_relationships = relationship(
        "StandardRelationship",
        foreign_keys="StandardRelationship.source_standard_id",
        cascade="all, delete-orphan",
        back_populates="source",
    )
