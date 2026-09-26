from collections import deque
from typing import Dict, List, Optional
from .graph import AdjacencyGraph

def compute_critical_path(
    graph: AdjacencyGraph,
    task_durations: Dict[int, int]
) -> List[int]:
    """
    Computes the critical path (longest duration path) in the DAG.
    Uses dynamic programming over topological ordering.

    Returns:
        List of task IDs representing the critical path from start to end.
    """
    if not graph.nodes:
        return []

    # 1. Topological Sort of all nodes
    in_degree = {node: 0 for node in graph.nodes}
    for u in graph.nodes:
        for v in graph.dependents_of.get(u, []):
            if v in in_degree:
                in_degree[v] += 1

    queue = deque([node for node in graph.nodes if in_degree[node] == 0])
    topo_order = []

    while queue:
        u = queue.popleft()
        topo_order.append(u)
        for v in graph.dependents_of.get(u, []):
            if v in in_degree:
                in_degree[v] -= 1
                if in_degree[v] == 0:
                    queue.append(v)

    # 2. Dynamic programming for longest path
    dist: Dict[int, int] = {node: task_durations.get(node, 1) for node in graph.nodes}
    parent: Dict[int, Optional[int]] = {node: None for node in graph.nodes}

    for u in topo_order:
        u_dist = dist[u]
        for v in graph.dependents_of.get(u, []):
            v_dur = task_durations.get(v, 1)
            if u_dist + v_dur > dist[v]:
                dist[v] = u_dist + v_dur
                parent[v] = u

    # 3. Find the node with maximum total duration
    if not dist:
        return []

    end_node = max(dist, key=dist.get)

    # If there are no edges or max dist is just the duration of an isolated node
    if not graph.precursors_of.get(end_node) and not graph.dependents_of.get(end_node):
        # If there are multiple nodes with edges, check if any edge exists
        nodes_with_edges = [n for n in graph.nodes if graph.precursors_of.get(n) or graph.dependents_of.get(n)]
        if nodes_with_edges:
            end_node = max(nodes_with_edges, key=dist.get)

    # 4. Backtrack to find path
    path = []
    curr = end_node
    while curr is not None:
        path.append(curr)
        curr = parent[curr]

    path.reverse()
    return path
