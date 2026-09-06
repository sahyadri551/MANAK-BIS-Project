from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db.models.standard import Standard
from app.db.models.standard_relationship import StandardRelationship


class StandardRepository:
    def __init__(self, db: Session):
        self.db = db

    def _base_query(self, status=None, department=None, aspect=None, domain=None, search=None):
        stmt = select(Standard)
        if status:
            stmt = stmt.where(Standard.status == status)
        if department:
            stmt = stmt.where(Standard.department == department)
        if aspect:
            stmt = stmt.where(Standard.aspect == aspect)
        if domain:
            stmt = stmt.where(Standard.domain == domain)
        if search:
            like = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(Standard.title).like(like),
                    func.lower(Standard.is_number).like(like),
                )
            )
        return stmt

    def list(self, status=None, department=None, aspect=None, domain=None, search=None, limit=200, offset=0):
        stmt = self._base_query(status, department, aspect, domain, search)
        stmt = stmt.order_by(Standard.is_number).limit(limit).offset(offset)
        return list(self.db.execute(stmt).scalars().all())

    def get(self, standard_id: int) -> Standard | None:
        return self.db.get(Standard, standard_id)

    def get_by_is_number(self, is_number: str) -> Standard | None:
        stmt = select(Standard).where(Standard.is_number == is_number)
        return self.db.execute(stmt).scalar_one_or_none()

    def create(self, standard: Standard) -> Standard:
        self.db.add(standard)
        self.db.commit()
        self.db.refresh(standard)
        return standard

    def related(self, standard_id: int) -> list[tuple[Standard, str]]:
        stmt = (
            select(Standard, StandardRelationship.relationship_type)
            .join(StandardRelationship, StandardRelationship.target_standard_id == Standard.id)
            .where(StandardRelationship.source_standard_id == standard_id)
        )
        return [(row[0], row[1]) for row in self.db.execute(stmt).all()]

    def count(self) -> int:
        return self.db.execute(select(func.count(Standard.id))).scalar_one()

    def count_grouped(self, column):
        stmt = select(column, func.count(Standard.id)).group_by(column)
        return {row[0] or "unknown": row[1] for row in self.db.execute(stmt).all()}

    def distinct_values(self, column) -> list[str]:
        stmt = select(column).where(column.isnot(None)).distinct().order_by(column)
        return [row[0] for row in self.db.execute(stmt).all()]
