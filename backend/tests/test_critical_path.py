from app.dag_engine.graph import AdjacencyGraph
from app.dag_engine.critical_path import compute_critical_path

def test_critical_path_computation():
    # 1 (3 days) -> 2 (2 days) -> 4 (4 days)  Total: 3 + 2 + 4 = 9 days
    # 1 (3 days) -> 3 (7 days) -> 4 (4 days)  Total: 3 + 7 + 4 = 14 days
    nodes = {1, 2, 3, 4}
    edges = [(1, 2), (1, 3), (2, 4), (3, 4)]
    durations = {1: 3, 2: 2, 3: 7, 4: 4}

    graph = AdjacencyGraph(nodes, edges)
    cp = compute_critical_path(graph, durations)

    # Critical path should be [1, 3, 4] with total weight 14
    assert cp == [1, 3, 4]
