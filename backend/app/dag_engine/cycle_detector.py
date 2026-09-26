from typing import List, Optional, Tuple, Set
from .graph import AdjacencyGraph

def detect_cycle_if_edge_added(
    graph: AdjacencyGraph, precursor_id: int, dependent_id: int
) -> Tuple[bool, List[int]]:
    """
    Checks if adding the directed edge (precursor_id -> dependent_id) would introduce a cycle.
    A cycle is introduced if:
    1. precursor_id == dependent_id (self-loop).
    2. A path already exists from dependent_id to precursor_id.

    Returns:
        (has_cycle: bool, cycle_path: List[int])
    """
    if precursor_id == dependent_id:
        return True, [precursor_id, precursor_id]

    # Search for a path from dependent_id -> precursor_id using DFS
    visited: Set[int] = set()
    parent_map = {}

    stack = [dependent_id]
    visited.add(dependent_id)
    found_target = False

    while stack:
        curr = stack.pop()
        if curr == precursor_id:
            found_target = True
            break

        for neighbor in graph.dependents_of.get(curr, []):
            if neighbor not in visited:
                visited.add(neighbor)
                parent_map[neighbor] = curr
                stack.append(neighbor)

    if found_target:
        # Reconstruct path from dependent_id -> precursor_id
        path = [precursor_id]
        curr = precursor_id
        while curr != dependent_id:
            curr = parent_map[curr]
            path.append(curr)
        path.reverse()
        # Full cycle is precursor_id -> dependent_id -> ... -> precursor_id
        full_cycle = [precursor_id] + path
        return True, full_cycle

    return False, []
