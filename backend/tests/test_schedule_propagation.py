from datetime import date, timedelta
from app.dag_engine.graph import AdjacencyGraph
from app.dag_engine.scheduler import propagate_schedules, calculate_end_date

def test_non_compounding_schedule_propagation():
    """
    Test case specified directly in prompt:
    Task A -> Task B -> Task D
    Task A -> Task C -> Task D
    Extending Task A by +3 days must shift Task D by +3 days, NOT +6 days!
    """
    start_base = date(2026, 1, 1)

    # Initial state:
    # Task A (id=1): Jan 1 - Jan 3 (duration 2 days, ends Jan 3)
    # Task B (id=2): Jan 3 - Jan 5 (duration 2 days, ends Jan 5)
    # Task C (id=3): Jan 3 - Jan 5 (duration 2 days, ends Jan 5)
    # Task D (id=4): Jan 5 - Jan 7 (duration 2 days, ends Jan 7)
    tasks_dict = {
        1: {"start_date": start_base, "duration": 2},
        2: {"start_date": start_base + timedelta(days=2), "duration": 2},
        3: {"start_date": start_base + timedelta(days=2), "duration": 2},
        4: {"start_date": start_base + timedelta(days=4), "duration": 2},
    }

    nodes = {1, 2, 3, 4}
    edges = [(1, 2), (1, 3), (2, 4), (3, 4)]
    graph = AdjacencyGraph(nodes, edges)

    # Now extend Task A's duration by +3 days (from 2 days to 5 days, so end date is Jan 6)
    tasks_dict[1]["duration"] = 5
    new_a_end = calculate_end_date(tasks_dict[1]["start_date"], tasks_dict[1]["duration"])
    assert new_a_end == date(2026, 1, 6)

    # Propagate schedule changes from Task 1
    updated = propagate_schedules(tasks_dict, graph, changed_task_ids=[1])

    # Check Task B and Task C new start: must be Jan 6 (+3 days)
    assert updated[2][0] == date(2026, 1, 6)
    assert updated[2][1] == date(2026, 1, 8)
    assert updated[3][0] == date(2026, 1, 6)
    assert updated[3][1] == date(2026, 1, 8)

    # CRITICAL CHECK: Task D start date MUST be Jan 8 (exactly +3 days from original Jan 5)
    # If compounding occurred, it would have been Jan 11 (+6 days).
    assert updated[4][0] == date(2026, 1, 8)
    assert updated[4][1] == date(2026, 1, 10)
    delay_days = (updated[4][0] - (start_base + timedelta(days=4))).days
    assert delay_days == 3, f"Expected 3 days delay, got {delay_days} days (compounding detected!)"

def test_slack_in_schedule():
    """
    If a downstream task already has a start date far into the future (slack),
    an upstream delay smaller than the slack should NOT unnecessarily push the downstream task.
    """
    start_base = date(2026, 1, 1)

    # Task A: Jan 1 - Jan 3 (duration 2)
    # Task B: Jan 10 - Jan 12 (duration 2, depends on A, has 7 days slack)
    tasks_dict = {
        1: {"start_date": start_base, "duration": 2},
        2: {"start_date": date(2026, 1, 10), "duration": 2},
    }
    graph = AdjacencyGraph({1, 2}, [(1, 2)])

    # Task A delayed by 2 days (duration becomes 4, ends Jan 5)
    tasks_dict[1]["duration"] = 4
    updated = propagate_schedules(tasks_dict, graph, [1])

    # Task B's start date (Jan 10) is still >= Jan 5, so Task B does not need to shift!
    assert 2 not in updated
