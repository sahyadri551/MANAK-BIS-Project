from sqlalchemy import Column, DateTime, Integer, String, Text, func

from app.db.database import Base


# Placeholder for future document ingestion (PDF specs). Unused in the mock phase.
class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True)
    name = Column(String(512), nullable=False)
    source_path = Column(Text)
    status = Column(String(32), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
