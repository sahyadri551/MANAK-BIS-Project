from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class StandardRelationship(Base):
    __tablename__ = "standard_relationships"

    id = Column(Integer, primary_key=True)
    source_standard_id = Column(
        Integer, ForeignKey("standards.id", ondelete="CASCADE"), nullable=False, index=True
    )
    target_standard_id = Column(
        Integer, ForeignKey("standards.id", ondelete="CASCADE"), nullable=False, index=True
    )
    relationship_type = Column(String(64), default="related")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    source = relationship("Standard", foreign_keys=[source_standard_id], back_populates="outgoing_relationships")
    target = relationship("Standard", foreign_keys=[target_standard_id])
