import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.seed import seed_initial_data

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_initial_data(db, force=True)
    db.close()
    yield

def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["app"] == "TaskFlow Pro"

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"

def test_get_graph_and_seed_data():
    res = client.get("/api/graph")
    assert res.status_code == 200
    data = res.json()
    assert len(data["tasks"]) == 8
    assert len(data["dependencies"]) == 7
    assert len(data["critical_path"]) > 0

    # Task 1 (DB Schema) is Done
    # Task 3 (User Profile API) depends on 2 (Auth Service, Done), so Task 3 is Ready
    # Task 5 (Checkout) depends on 3 & 4 (both In Progress), so Task 5 is Blocked
    t5 = next(t for t in data["tasks"] if t["id"] == 5)
    assert t5["is_blocked"] is True
    assert t5["is_ready"] is False
    assert set(t5["blocking_prerequisites"]) == {3, 4}

def test_cycle_rejection_via_api():
    # Existing chain: 1 -> 2 -> 3 -> 5 -> 6 -> 7
    # Attempting to add 7 -> 1 MUST return HTTP 400
    res = client.post("/api/dependencies", json={"precursor_id": 7, "dependent_id": 1})
    assert res.status_code == 400
    err_data = res.json()["detail"]
    assert "cycle" in err_data
    assert err_data["cycle"][0] == 7
    assert err_data["cycle"][-1] == 7
    assert "Circular dependency rejected" in err_data["message"]

def test_task_move_and_regression_rollback():
    # Task 2 is Done. Task 3 is Ready.
    # Move Task 2 back to 'In Progress'
    res = client.post("/api/tasks/2/move", json={"workflow_status": "In Progress", "position": 0})
    assert res.status_code == 200

    # Fetch updated graph
    graph_res = client.get("/api/graph")
    tasks = graph_res.json()["tasks"]
    t3 = next(t for t in tasks if t["id"] == 3)

    # Task 3 MUST now be Blocked because prerequisite Task 2 is no longer Done!
    assert t3["is_blocked"] is True
    assert 2 in t3["blocking_prerequisites"]

def test_ai_suggestions_endpoint():
    res = client.post("/api/ai/suggest")
    assert res.status_code == 200
    data = res.json()
    assert "suggestions" in data
    assert isinstance(data["suggestions"], list)
