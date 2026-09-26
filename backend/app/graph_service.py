from datetime import date
from typing import List, Tuple
from sqlalchemy.orm import Session
from .models import Task, Dependency
from .schemas import TaskRead, DependencyRead, GraphResponse
from .dag_engine import (
    AdjacencyGraph,
    evaluate_readiness,
    compute_critical_path,
    calculate_end_date,
    propagate_schedules,
)

def build_graph_from_db(db: Session) -> Tuple[AdjacencyGraph, List[Task], List[Dependency]]:
    tasks = db.query(Task).order_by(Task.workflow_status, Task.position, Task.id).all()
    dependencies = db.query(Dependency).all()

    nodes = {t.id for t in tasks}
    edges = [(d.precursor_id, d.dependent_id) for d in dependencies]
    graph = AdjacencyGraph(nodes, edges)

    return graph, tasks, dependencies

def get_graph_state_payload(db: Session) -> GraphResponse:
    graph, tasks, dependencies = build_graph_from_db(db)

    # 1. Readiness evaluation
    task_statuses = {t.id: t.workflow_status for t in tasks}
    readiness_map = evaluate_readiness(graph, task_statuses)

    # 2. Critical path
    task_durations = {t.id: t.duration for t in tasks}
    critical_path_ids = compute_critical_path(graph, task_durations)
    critical_path_set = set(critical_path_ids)

    # 3. Construct TaskRead items
    task_reads = []
    for t in tasks:
        is_ready, is_blocked, blocking_ids = readiness_map.get(
            t.id, (True, False, [])
        )
        end_d = calculate_end_date(t.start_date, t.duration)
        task_reads.append(
            TaskRead(
                id=t.id,
                title=t.title,
                description=t.description or "",
                workflow_status=t.workflow_status,
                position=t.position,
                start_date=t.start_date,
                duration=t.duration,
                end_date=end_d,
                is_ready=is_ready,
                is_blocked=is_blocked,
                blocking_prerequisites=blocking_ids,
                is_critical=(t.id in critical_path_set),
                created_at=t.created_at,
                updated_at=t.updated_at,
            )
        )

    dep_reads = [
        DependencyRead(
            id=d.id, precursor_id=d.precursor_id, dependent_id=d.dependent_id
        )
        for d in dependencies
    ]

    return GraphResponse(
        tasks=task_reads,
        dependencies=dep_reads,
        critical_path=critical_path_ids,
    )

def propagate_and_persist_schedule(db: Session, changed_task_ids: List[int]):
    """
    Recalculates downstream schedules and updates database.
    """
    graph, tasks, _ = build_graph_from_db(db)
    tasks_dict = {
        t.id: {"start_date": t.start_date, "duration": t.duration} for t in tasks
    }

    updated_schedules = propagate_schedules(tasks_dict, graph, changed_task_ids)

    if updated_schedules:
        for tid, (new_start, new_end) in updated_schedules.items():
            task_obj = db.query(Task).filter(Task.id == tid).first()
            if task_obj:
                task_obj.start_date = new_start
        db.commit()
