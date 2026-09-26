from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = ""
    workflow_status: str = Field(default="Backlog")
    position: int = Field(default=0)
    start_date: date = Field(default_factory=date.today)
    duration: int = Field(default=1, ge=1)

    @field_validator("workflow_status")
    @classmethod
    def validate_workflow_status(cls, v: str) -> str:
        valid_statuses = {"Backlog", "In Progress", "Review", "Done"}
        if v not in valid_statuses:
            raise ValueError(f"workflow_status must be one of {valid_statuses}")
        return v

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = ""
    workflow_status: Optional[str] = "Backlog"
    start_date: Optional[date] = None
    duration: Optional[int] = Field(default=1, ge=1)
    position: Optional[int] = 0

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    workflow_status: Optional[str] = None
    start_date: Optional[date] = None
    duration: Optional[int] = Field(default=None, ge=1)
    position: Optional[int] = None

class TaskMove(BaseModel):
    workflow_status: str
    position: int

class DependencyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    precursor_id: int
    dependent_id: int

class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: Optional[str] = ""
    workflow_status: str
    position: int
    start_date: date
    duration: int
    end_date: date
    is_ready: bool = True
    is_blocked: bool = False
    blocking_prerequisites: List[int] = []
    is_critical: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class DependencyCreate(BaseModel):
    precursor_id: int
    dependent_id: int

class CycleErrorResponse(BaseModel):
    detail: str
    cycle: List[int]

class GraphResponse(BaseModel):
    tasks: List[TaskRead]
    dependencies: List[DependencyRead]
    critical_path: List[int]

class AISuggestionItem(BaseModel):
    precursor_id: int
    dependent_id: int
    reason: str

class AISuggestionResponse(BaseModel):
    suggestions: List[AISuggestionItem]
