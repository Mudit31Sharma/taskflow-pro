from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Task, Dependency
from ..schemas import TaskCreate, TaskUpdate, TaskMove, TaskRead
from ..graph_service import (
    get_graph_state_payload,
    propagate_and_persist_schedule,
)

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("", response_model=List[TaskRead])
def get_all_tasks(db: Session = Depends(get_db)):
    graph_state = get_graph_state_payload(db)
    return graph_state.tasks

@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db)):
    # Calculate position at the bottom of the requested column
    status_val = task_in.workflow_status or "Backlog"
    max_pos = (
        db.query(Task)
        .filter(Task.workflow_status == status_val)
        .order_by(Task.position.desc())
        .first()
    )
    new_pos = (max_pos.position + 1) if max_pos else 0

    new_task = Task(
        title=task_in.title,
        description=task_in.description or "",
        workflow_status=status_val,
        position=new_pos,
        start_date=task_in.start_date or date.today(),
        duration=task_in.duration or 1,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    graph_state = get_graph_state_payload(db)
    for t in graph_state.tasks:
        if t.id == new_task.id:
            return t
    raise HTTPException(status_code=500, detail="Failed to retrieve created task")

@router.get("/{task_id}", response_model=TaskRead)
def get_task(task_id: int, db: Session = Depends(get_db)):
    graph_state = get_graph_state_payload(db)
    for t in graph_state.tasks:
        if t.id == task_id:
            return t
    raise HTTPException(status_code=404, detail="Task not found")

@router.patch("/{task_id}", response_model=TaskRead)
def update_task(task_id: int, task_in: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    date_or_duration_changed = False

    if task_in.title is not None:
        task.title = task_in.title
    if task_in.description is not None:
        task.description = task_in.description
    if task_in.workflow_status is not None:
        task.workflow_status = task_in.workflow_status
    if task_in.position is not None:
        task.position = task_in.position
    if task_in.start_date is not None and task_in.start_date != task.start_date:
        task.start_date = task_in.start_date
        date_or_duration_changed = True
    if task_in.duration is not None and task_in.duration != task.duration:
        task.duration = task_in.duration
        date_or_duration_changed = True

    db.commit()

    if date_or_duration_changed:
        propagate_and_persist_schedule(db, [task_id])

    graph_state = get_graph_state_payload(db)
    for t in graph_state.tasks:
        if t.id == task_id:
            return t
    raise HTTPException(status_code=500, detail="Failed to retrieve updated task")

@router.post("/{task_id}/move", response_model=List[TaskRead])
def move_task(task_id: int, move_in: TaskMove, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.workflow_status = move_in.workflow_status
    task.position = move_in.position
    db.commit()

    graph_state = get_graph_state_payload(db)
    return graph_state.tasks

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return None
