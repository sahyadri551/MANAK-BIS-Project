from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db.models.standard import Standard
from app.db.models.standard_relationship import StandardRelationship


class StandardRepository:
    def __init__(self, db: Session):
        self.db = db

    def _base_query(
        self,
        status=None,
        department=None,
        aspect=None,
        domain=None,
        group=None,
        sub_group=None,
        sub_sub_group=None,
        ministry=None,
        committee_name=None,
        search=None,
    ):
        stmt = select(Standard)
        if status:
            stmt = stmt.where(Standard.status == status)
        if department:
            stmt = stmt.where(Standard.department_name == department)
        if aspect:
            stmt = stmt.where(Standard.aspect == aspect)
        if domain:
            stmt = stmt.where(Standard.domain == domain)
        if group:
            stmt = stmt.where(Standard.group == group)
        if sub_group:
            stmt = stmt.where(Standard.sub_group == sub_group)
        if sub_sub_group:
            stmt = stmt.where(Standard.sub_sub_group == sub_sub_group)
        if ministry:
            stmt = stmt.where(Standard.ministry == ministry)
        if committee_name:
            stmt = stmt.where(Standard.committee_name == committee_name)
        if search:
            like = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(Standard.title).like(like),
                    func.lower(Standard.is_number).like(like),
                    func.lower(Standard.short_title).like(like),
                    func.lower(Standard.department).like(like),
                    func.lower(Standard.department_name).like(like),
                    func.lower(Standard.department_alias).like(like),
                    func.lower(Standard.aspect).like(like),
                    func.lower(Standard.domain).like(like),
                    func.lower(Standard.group).like(like),
                    func.lower(Standard.sub_group).like(like),
                    func.lower(Standard.sub_sub_group).like(like),
                    func.lower(Standard.ministry).like(like),
                    func.lower(Standard.committee_name).like(like),
                    func.lower(Standard.degree_of_equivalence).like(like),
                    func.lower(Standard.ics_code).like(like),
                )
            )
        return stmt

    def list(
        self,
        status=None,
        department=None,
        aspect=None,
        domain=None,
        group=None,
        sub_group=None,
        sub_sub_group=None,
        ministry=None,
        committee_name=None,
        search=None,
        limit=200,
        offset=0,
    ):
        stmt = self._base_query(
            status=status,
            department=department,
            aspect=aspect,
            domain=domain,
            group=group,
            sub_group=sub_group,
            sub_sub_group=sub_sub_group,
            ministry=ministry,
            committee_name=committee_name,
            search=search,
        )
        stmt = stmt.order_by(Standard.is_number).limit(limit).offset(offset)
        return list(self.db.execute(stmt).scalars().all())

    def get(self, standard_id: int) -> Standard | None:
        return self.db.get(Standard, standard_id)

    def get_by_is_number(self, is_number: str) -> Standard | None:
        stmt = select(Standard).where(Standard.is_number == is_number)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_is_numbers(self, is_numbers: list[str]) -> list[Standard]:
        """Resolve multiple IS numbers with one database query."""
        numbers = list(dict.fromkeys(number.strip() for number in is_numbers if number and number.strip()))
        if not numbers:
            return []
        stmt = select(Standard).where(Standard.is_number.in_(numbers))
        return list(self.db.execute(stmt).scalars().all())

    def create(self, standard: Standard) -> Standard:
        self.db.add(standard)
        self.db.commit()
        self.db.refresh(standard)
        return standard

    def related(self, standard_id: int) -> list[tuple[Standard, str]]:
        stmt = (
            select(Standard, StandardRelationship.relationship_type)
            .join(
                StandardRelationship,
                StandardRelationship.target_standard_id == Standard.id,
            )
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
