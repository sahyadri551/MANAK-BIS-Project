from sqlalchemy import Column, ForeignKey, Integer, Text

from app.db.database import Base


# Placeholder for future RAG chunking. The embedding column stays plain text until
# pgvector is introduced. Unused in the mock phase.
class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    chunk_index = Column(Integer, default=0)
    content = Column(Text)
    embedding = Column(Text, nullable=True)
