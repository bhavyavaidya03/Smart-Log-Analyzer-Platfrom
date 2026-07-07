"""Project API routes."""

import math
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_verified_user
from app.db.session import get_session
from app.repositories.project_repository import ProjectRepository
from app.schemas.common import DataResponse, PaginatedResponse
from app.schemas.logs import ProjectCreateRequest, ProjectResponse, ProjectUpdateRequest

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=PaginatedResponse[ProjectResponse])
async def list_projects(
    page: int = 1,
    page_size: int = 20,
    current_user=Depends(get_current_verified_user),
    session: AsyncSession = Depends(get_session),
):
    """List all projects for the authenticated user."""
    repo = ProjectRepository(session)
    skip = (page - 1) * page_size
    projects = await repo.get_by_user(current_user.id, skip=skip, limit=page_size)
    total = await repo.count_by_user(current_user.id)

    # Attach log counts
    project_responses = []
    for p in projects:
        log_count = await repo.get_log_count(p.id)
        r = ProjectResponse.model_validate(p)
        r.log_count = log_count
        project_responses.append(r)

    return PaginatedResponse(
        data=project_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size),
    )


@router.post("", response_model=DataResponse[ProjectResponse], status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreateRequest,
    current_user=Depends(get_current_verified_user),
    session: AsyncSession = Depends(get_session),
):
    """Create a new project."""
    repo = ProjectRepository(session)
    project = await repo.create(
        name=data.name,
        description=data.description,
        user_id=current_user.id,
    )
    return DataResponse(
        message="Project created successfully.",
        data=ProjectResponse.model_validate(project),
    )


@router.get("/{project_id}", response_model=DataResponse[ProjectResponse])
async def get_project(
    project_id: UUID,
    current_user=Depends(get_current_verified_user),
    session: AsyncSession = Depends(get_session),
):
    """Get a specific project by ID."""
    repo = ProjectRepository(session)
    project = await repo.get_by_id(project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    log_count = await repo.get_log_count(project.id)
    r = ProjectResponse.model_validate(project)
    r.log_count = log_count
    return DataResponse(data=r)


@router.patch("/{project_id}", response_model=DataResponse[ProjectResponse])
async def update_project(
    project_id: UUID,
    data: ProjectUpdateRequest,
    current_user=Depends(get_current_verified_user),
    session: AsyncSession = Depends(get_session),
):
    """Update a project."""
    repo = ProjectRepository(session)
    project = await repo.get_by_id(project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    project = await repo.update(project, name=data.name, description=data.description)
    return DataResponse(
        message="Project updated.",
        data=ProjectResponse.model_validate(project),
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    current_user=Depends(get_current_verified_user),
    session: AsyncSession = Depends(get_session),
):
    """Delete a project and all its associated logs."""
    repo = ProjectRepository(session)
    project = await repo.get_by_id(project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    await repo.delete(project)
