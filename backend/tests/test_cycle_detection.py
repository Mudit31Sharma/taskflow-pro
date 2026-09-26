from app.dag_engine.graph import AdjacencyGraph
from app.dag_engine.cycle_detector import detect_cycle_if_edge_added

def test_detect_cycle_simple():
    # 1 -> 2 -> 3
    nodes = {1, 2, 3}
    edges = [(1, 2), (2, 3)]
    graph = AdjacencyGraph(nodes, edges)

    # Adding 3 -> 1 should be detected as a cycle
    has_cycle, cycle_path = detect_cycle_if_edge_added(graph, 3, 1)
    assert has_cycle is True
    assert cycle_path[0] == 3
    assert cycle_path[-1] == 3
    assert set(cycle_path) == {1, 2, 3}

def test_detect_cycle_self_loop():
    nodes = {1, 2}
    edges = []
    graph = AdjacencyGraph(nodes, edges)

    has_cycle, cycle_path = detect_cycle_if_edge_added(graph, 1, 1)
    assert has_cycle is True
    assert cycle_path == [1, 1]

def test_valid_dag_edge_addition():
    # 1 -> 2, 3 -> 4
    # Adding 2 -> 3 is completely valid
    nodes = {1, 2, 3, 4}
    edges = [(1, 2), (3, 4)]
    graph = AdjacencyGraph(nodes, edges)

    has_cycle, cycle_path = detect_cycle_if_edge_added(graph, 2, 3)
    assert has_cycle is False
    assert cycle_path == []

def test_diamond_dag_no_cycle():
    # 1 -> 2, 1 -> 3, 2 -> 4, 3 -> 4
    # Diamond graph is valid DAG
    nodes = {1, 2, 3, 4}
    edges = [(1, 2), (1, 3), (2, 4)]
    graph = AdjacencyGraph(nodes, edges)

    has_cycle, cycle_path = detect_cycle_if_edge_added(graph, 3, 4)
    assert has_cycle is False

    # But adding 4 -> 1 would cycle
    graph.add_edge(3, 4)
    has_cycle_rev, cycle_path_rev = detect_cycle_if_edge_added(graph, 4, 1)
    assert has_cycle_rev is True
