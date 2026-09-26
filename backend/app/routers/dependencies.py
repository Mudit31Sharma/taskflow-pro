from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Task, Dependency
from ..schemas import DependencyCreate, DependencyRead
from ..dag_engine import detect_cycle_if_edge_added
from ..graph_service import (
    build_graph_from_db,
    propagate_and_persist_schedule,
)

router = APIRouter(prefix="/dependencies", tags=["dependencies"])

@router.get("", response_model=List[DependencyRead])
def get_all_dependencies(db: Session = Depends(get_db)):
    return db.query(Dependency).all()

@router.post("", response_model=DependencyRead, status_code=status.HTTP_201_CREATED)
def create_dependency(dep_in: DependencyCreate, db: Session = Depends(get_db)):
    if dep_in.precursor_id == dep_in.dependent_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Self-dependency is not allowed (a task cannot depend on itself).",
                "cycle": [dep_in.precursor_id, dep_in.precursor_id],
            },
        )

    # Check existence
    p_task = db.query(Task).filter(Task.id == dep_in.precursor_id).first()
    d_task = db.query(Task).filter(Task.id == dep_in.dependent_id).first()
    if not p_task or not d_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "One or both tasks do not exist."},
        )

    # Check if duplicate
    existing = (
        db.query(Dependency)
        .filter(
            Dependency.precursor_id == dep_in.precursor_id,
            Dependency.dependent_id == dep_in.dependent_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "This dependency relationship already exists."},
        )

    # Cycle Detection using DAG engine DFS
    graph, _, _ = build_graph_from_db(db)
    has_cycle, cycle_path = detect_cycle_if_edge_added(
        graph, dep_in.precursor_id, dep_in.dependent_id
    )

    if has_cycle:
        # Map IDs to task titles for human-friendly error display
        tasks_by_id = {t.id: t.title for t in db.query(Task).all()}
        path_str = " -> ".join([tasks_by_id.get(tid, f"Task {tid}") for tid in cycle_path])
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": f"Circular dependency rejected! Adding this relationship creates an infinite loop: {path_str}",
                "cycle": cycle_path,
            },
        )

    # Valid DAG edge: persist transactionally
    new_dep = Dependency(
        precursor_id=dep_in.precursor_id, dependent_id=dep_in.dependent_id
    )
    db.add(new_dep)
    db.commit()
    db.refresh(new_dep)

    # Propagate schedule in case dependent task needs to be pushed forward
    propagate_and_persist_schedule(db, [dep_in.precursor_id])

    return new_dep

@router.delete("/{dep_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dependency(dep_id: int, db: Session = Depends(get_db)):
    dep = db.query(Dependency).filter(Dependency.id == dep_id).first()
    if not dep:
        raise HTTPException(status_code=404, detail="Dependency not found")

    db.delete(dep)
    db.commit()
    return None

@router.delete("/edge/{precursor_id}/{dependent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dependency_by_edge(
    precursor_id: int, dependent_id: int, db: Session = Depends(get_db)
):
    dep = (
        db.query(Dependency)
        .filter(
            Dependency.precursor_id == precursor_id,
            Dependency.dependent_id == dependent_id,
        )
        .first()
    )
    if not dep:
        raise HTTPException(status_code=404, detail="Dependency not found")

    db.delete(dep)
    db.commit()
    return None
