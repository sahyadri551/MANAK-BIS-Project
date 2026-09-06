from sqlalchemy import Column, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB

from app.db.database import Base


class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True)
    request_id = Column(String(64), index=True, nullable=False)
    query = Column(Text, nullable=False)
    document_name = Column(String(512), nullable=True)
    filters = Column(JSONB, default=dict)
    result_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
