from app.dag_engine.graph import AdjacencyGraph
from app.dag_engine.readiness import evaluate_readiness

def test_readiness_and_regression_rollback():
    # 1 -> 2 -> 3
    nodes = {1, 2, 3}
    edges = [(1, 2), (2, 3)]
    graph = AdjacencyGraph(nodes, edges)

    # 1. Initially all tasks in Backlog
    statuses = {1: "Backlog", 2: "Backlog", 3: "Backlog"}
    readiness = evaluate_readiness(graph, statuses)

    # Task 1 has no prerequisites -> Ready
    assert readiness[1] == (True, False, [])
    # Task 2 blocked by 1
    assert readiness[2] == (False, True, [1])
    # Task 3 blocked by 2
    assert readiness[3] == (False, True, [2])

    # 2. Complete Task 1 -> Task 2 becomes Ready
    statuses[1] = "Done"
    readiness = evaluate_readiness(graph, statuses)
    assert readiness[2] == (True, False, [])
    assert readiness[3] == (False, True, [2])

    # 3. Complete Task 2 -> Task 3 becomes Ready
    statuses[2] = "Done"
    readiness = evaluate_readiness(graph, statuses)
    assert readiness[3] == (True, False, [])

    # 4. REGRESSION: Task 1 moves from "Done" back to "In Progress"
    statuses[1] = "In Progress"
    readiness = evaluate_readiness(graph, statuses)

    # Task 2 MUST roll back to Blocked!
    assert readiness[2] == (False, True, [1])

    # If Task 2 is also regressed or re-evaluated, its prereqs are not satisfied
    statuses[2] = "In Progress"
    readiness = evaluate_readiness(graph, statuses)
    assert readiness[3] == (False, True, [2])
