from typing import Dict, List, Set, Tuple
from .graph import AdjacencyGraph

def evaluate_readiness(
    graph: AdjacencyGraph,
    task_statuses: Dict[int, str]
) -> Dict[int, Tuple[bool, bool, List[int]]]:
    """
    Evaluates dynamic Ready / Blocked status for all tasks in the graph.

    A task is Ready if all of its precursors have workflow_status == 'Done'.
    A task is Blocked if any prerequisite is not yet 'Done'.
    Tasks with zero prerequisites are immediately Ready.

    Returns:
        {
            task_id: (is_ready, is_blocked, [blocking_prerequisite_ids])
        }
    """
    readiness_map = {}

    for task_id in graph.nodes:
        precursors = graph.precursors_of.get(task_id, [])
        if not precursors:
            # No prerequisites -> Ready
            readiness_map[task_id] = (True, False, [])
        else:
            blocking = [
                p for p in precursors if task_statuses.get(p) != "Done"
            ]
            if blocking:
                readiness_map[task_id] = (False, True, blocking)
            else:
                readiness_map[task_id] = (True, False, [])

    return readiness_map
