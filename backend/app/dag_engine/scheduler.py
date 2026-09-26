from collections import deque
from datetime import date, timedelta
from typing import Dict, List, Set, Tuple
from .graph import AdjacencyGraph

def calculate_end_date(start_date: date, duration: int) -> date:
    """
    Returns end date of task: start_date + duration days.
    A task starting on day D with duration 1 ends on day D+1 (ready for dependent to start on D+1).
    """
    return start_date + timedelta(days=duration)

def propagate_schedules(
    tasks_dict: Dict[int, dict],
    graph: AdjacencyGraph,
    changed_task_ids: List[int],
) -> Dict[int, Tuple[date, date]]:
    """
    Propagates schedule changes strictly using topological order to prevent compounding delays.

    tasks_dict is expected to be a dict of:
    {
        task_id: {
            "start_date": date,
            "duration": int
        }
    }

    Returns a dict of updated {task_id: (new_start_date, new_end_date)} for all modified tasks.
    """
    if not changed_task_ids:
        return {}

    # 1. Identify all downstream descendants reachable from changed_task_ids
    affected_descendants: Set[int] = set()
    queue = deque(changed_task_ids)

    while queue:
        curr = queue.popleft()
        for dep in graph.dependents_of.get(curr, []):
            if dep not in affected_descendants:
                affected_descendants.add(dep)
                queue.append(dep)

    if not affected_descendants and not any(tid in tasks_dict for tid in changed_task_ids):
        return {}

    # We need to process nodes in topological order.
    # Nodes involved: changed_task_ids union affected_descendants
    relevant_nodes = set(changed_task_ids).union(affected_descendants)

    # Compute in-degrees within relevant_nodes
    in_degree: Dict[int, int] = {node: 0 for node in relevant_nodes}
    for u in relevant_nodes:
        for v in graph.dependents_of.get(u, []):
            if v in relevant_nodes:
                in_degree[v] += 1

    # Kahn's algorithm queue: nodes with in-degree 0
    kahn_queue = deque([node for node in relevant_nodes if in_degree[node] == 0])

    # Store working copy of start dates and end dates
    current_starts: Dict[int, date] = {
        tid: tasks_dict[tid]["start_date"] for tid in relevant_nodes if tid in tasks_dict
    }
    current_durations: Dict[int, int] = {
        tid: tasks_dict[tid]["duration"] for tid in relevant_nodes if tid in tasks_dict
    }

    updated_schedules: Dict[int, Tuple[date, date]] = {}

    while kahn_queue:
        curr = kahn_queue.popleft()

        # Check all precursors of curr to ensure curr.start_date >= max(precursor.end_date)
        precursors = graph.precursors_of.get(curr, [])
        if precursors:
            # Find the latest end date among all precursors
            max_precursor_end: date = None
            for p in precursors:
                p_start = current_starts.get(p)
                p_duration = current_durations.get(p)
                if p_start is None or p_duration is None:
                    # fallback to tasks_dict if outside relevant set
                    if p in tasks_dict:
                        p_start = tasks_dict[p]["start_date"]
                        p_duration = tasks_dict[p]["duration"]
                if p_start and p_duration:
                    p_end = calculate_end_date(p_start, p_duration)
                    if max_precursor_end is None or p_end > max_precursor_end:
                        max_precursor_end = p_end

            if max_precursor_end:
                original_start = current_starts.get(curr, date.today())
                if original_start < max_precursor_end:
                    current_starts[curr] = max_precursor_end
                    dur = current_durations.get(curr, 1)
                    new_end = calculate_end_date(max_precursor_end, dur)
                    updated_schedules[curr] = (max_precursor_end, new_end)

        # Propagate to dependents
        for dep in graph.dependents_of.get(curr, []):
            if dep in relevant_nodes:
                in_degree[dep] -= 1
                if in_degree[dep] == 0:
                    kahn_queue.append(dep)

    return updated_schedules
