"""Project repository — data access for Project model."""

from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.uploaded_log import UploadedLog


class ProjectRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, name: str, user_id: UUID, description: Optional[str] = None) -> Project:
        project = Project(name=name, description=description, user_id=user_id)
        self.session.add(project)
        await self.session.flush()
        await self.session.refresh(project)
        return project

    async def get_by_id(self, project_id: UUID) -> Optional[Project]:
        result = await self.session.execute(
            select(Project).where(Project.id == project_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user(
        self, user_id: UUID, skip: int = 0, limit: int = 50
    ) -> list[Project]:
        result = await self.session.execute(
            select(Project)
            .where(Project.user_id == user_id)
            .order_by(Project.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_by_user(self, user_id: UUID) -> int:
        result = await self.session.execute(
            select(func.count()).select_from(Project).where(Project.user_id == user_id)
        )
        return result.scalar_one()

    async def get_log_count(self, project_id: UUID) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(UploadedLog)
            .where(UploadedLog.project_id == project_id)
        )
        return result.scalar_one()

    async def update(self, project: Project, **kwargs) -> Project:
        for key, value in kwargs.items():
            if value is not None:
                setattr(project, key, value)
        await self.session.flush()
        await self.session.refresh(project)
        return project

    async def delete(self, project: Project) -> None:
        await self.session.delete(project)
        await self.session.flush()
