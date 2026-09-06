from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB

from app.db.database import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True)
    request_id = Column(String(64), index=True, nullable=False)
    standard_id = Column(Integer, ForeignKey("standards.id", ondelete="CASCADE"), index=True)
    query = Column(Text, nullable=False)
    score = Column(Float, default=0.0)
    matched_requirements = Column(JSONB, default=list)
    reason = Column(Text, default="")
    rank = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
