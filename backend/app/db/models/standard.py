from sqlalchemy import Column, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.db.database import Base


class Standard(Base):
    __tablename__ = "standards"

    # ============================================================
    # PRIMARY IDENTIFICATION
    # ============================================================

    id = Column(Integer, primary_key=True)

    is_number = Column(
        String(128),
        unique=True,
        nullable=False,
        index=True,
    )

    title = Column(
        String(1024),
        nullable=False,
    )

    short_title = Column(
        String(1024),
        nullable=True,
    )

    # ============================================================
    # BASIC CLASSIFICATION
    # ============================================================

    status = Column(
        String(64),
        nullable=False,
        default="Active",
        index=True,
    )

    department = Column(
        String(512),
        index=True,
    )

    department_name = Column(
        String(512),
        nullable=True,
        index=True,
    )

    department_alias = Column(
        String(256),
        nullable=True,
        index=True,
    )

    aspect = Column(
        String(256),
        index=True,
    )

    domain = Column(
        String(256),
        index=True,
    )

    # ============================================================
    # GROUP CLASSIFICATION
    # ============================================================

    group_classification = Column(
        String(1024),
        nullable=True,
    )

    group = Column(
        String(512),
        nullable=True,
        index=True,
    )

    sub_group = Column(
        String(512),
        nullable=True,
        index=True,
    )

    sub_sub_group = Column(
        String(512),
        nullable=True,
        index=True,
    )

    # ============================================================
    # PUBLICATION / VALIDITY
    # ============================================================

    year = Column(
        Integer,
        nullable=True,
    )

    published_on = Column(
        String(64),
        nullable=True,
    )

    valid_upto = Column(
        String(64),
        nullable=True,
    )

    reaffirmation_year = Column(
        Integer,
        nullable=True,
    )

    review_on = Column(
        String(64),
        nullable=True,
    )

    # ============================================================
    # REVISION / AMENDMENT INFORMATION
    # ============================================================

    amendment_count = Column(
        Integer,
        nullable=False,
        default=0,
    )

    no_of_revision = Column(
        Integer,
        nullable=False,
        default=0,
    )

    latest_version = Column(
        String(16),
        nullable=True,
    )

    standard_base = Column(
        String(512),
        nullable=True,
        index=True,
    )

    # ============================================================
    # TECHNICAL / REFERENCE INFORMATION
    # ============================================================

    degree_of_equivalence = Column(
        String(512),
        nullable=True,
    )

    ics_code = Column(
        String(256),
        nullable=True,
    )

    language = Column(
        String(256),
        nullable=True,
    )

    # ============================================================
    # ORGANIZATIONAL INFORMATION
    # ============================================================

    ministry = Column(
        String(512),
        nullable=True,
        index=True,
    )

    committee_name = Column(
        String(1024),
        nullable=True,
        index=True,
    )

    member_secretary = Column(
        String(1024),
        nullable=True,
    )

    # ============================================================
    # CERTIFICATION / POLICY
    # ============================================================

    certification = Column(
        String(512),
        nullable=True,
    )

    has_qco_gazette = Column(
        String(64),
        nullable=True,
    )

    # ============================================================
    # SDG
    # ============================================================

    sdg_goals = Column(
        JSONB,
        nullable=True,
        default=list,
    )

    # ============================================================
    # CROSS REFERENCES
    # ============================================================

    cross_references = Column(
        JSONB,
        nullable=True,
        default=list,
    )

    referenced_by = Column(
        JSONB,
        nullable=True,
        default=list,
    )

    supersedes = Column(
        JSONB,
        nullable=True,
        default=list,
    )

    superseded_by = Column(
        JSONB,
        nullable=True,
        default=list,
    )

    # ============================================================
    # EXISTING CONTENT FIELDS
    # ============================================================

    description = Column(
        Text,
        default="",
    )

    scope = Column(
        Text,
        default="",
    )

    keywords = Column(
        JSONB,
        default=list,
    )

    requirements = Column(
        JSONB,
        default=list,
    )

    # ============================================================
    # HINDI / INTERNATIONALIZATION
    # ============================================================

    title_hi = Column(
        String(1024),
        nullable=True,
    )

    scope_hi = Column(
        Text,
        nullable=True,
    )

    requirements_hi = Column(
        JSONB,
        nullable=True,
    )

    i18n = Column(
        JSONB,
        nullable=True,
    )

    # ============================================================
    # SOURCE / INTERNAL IDENTIFIERS
    # ============================================================

    source_standard_id = Column(
        Integer,
        nullable=True,
    )

    source_standard_enc_id = Column(
        String(Text),
        nullable=True,
    )

    source_department_id = Column(
        Integer,
        nullable=True,
    )

    source_committee_id = Column(
        Integer,
        nullable=True,
    )

    raw_is_status = Column(
        Integer,
        nullable=True,
    )

    # ============================================================
    # TIMESTAMPS
    # ============================================================

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # ============================================================
    # RELATIONSHIPS
    # ============================================================

    outgoing_relationships = relationship(
        "StandardRelationship",
        foreign_keys="StandardRelationship.source_standard_id",
        cascade="all, delete-orphan",
        back_populates="source",
    )