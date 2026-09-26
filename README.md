# TaskFlow Pro ⚡
### Dependency-Aware Workflow & DAG Scheduling Engine

TaskFlow Pro is a full-stack, dependency-aware workflow management platform. While conventional Kanban tools treat cards as isolated entities, TaskFlow Pro coordinates tasks through an authoritative **Directed Acyclic Graph (DAG)** scheduling engine.

---

## 🌟 Key Engineering Features

1. **Cycle Prevention Engine (No Cycles: $A \to B \to C \to A$)**
   - Employs Depth-First Search (DFS) cycle detection before committing any dependency edge.
   - Any circular relationship is rejected with HTTP `400 Bad Request` and returns the exact cycle path (`A -> B -> C -> A`) to alert the user while keeping the existing DAG intact.

2. **Non-Compounding Schedule Propagation**
   - **The Invariant:** When an upstream task is delayed (e.g. Task A $+3$ days), multiple converging dependency paths (e.g., $A \to B \to D$ and $A \to C \to D$) must **not** compound delays ($+6$ days).
   - **Mathematical Formulation:**
     $$\text{Earliest Start}(T) = \max \left( \text{Current Start}(T), \max_{P \in \text{Prerequisites}(T)} (\text{End Date}(P)) \right)$$
     $$\text{End Date}(T) = \text{Earliest Start}(T) + \text{Duration}(T)$$
   - Propagates strictly along **Kahn's Topological Sort** order so delays are applied once per node based on the maximum prerequisite completion.

3. **Dynamic Readiness & Regression Rollback**
   - Decouples persistent column status (`Backlog`, `In Progress`, `Review`, `Done`) from derived dependency readiness (`Ready` vs `Blocked`).
   - A task is `Ready` if and only if **all** of its direct prerequisites are `Done`.
   - **Regression Rollback:** If a completed task regresses from `Done` to `In Progress`, downstream tasks whose prerequisites are no longer satisfied immediately revert to `Blocked`.

4. **Critical Path Calculation (Longest Dependency Chain)**
   - Computes the critical path using dynamic programming over topological ordering:
     $$\text{Dist}(T) = \text{Duration}(T) + \max_{P \in \text{Prerequisites}(T)} (\text{Dist}(P), 0)$$
   - Visually highlights tasks on the critical path in gold with interactive badges on both the Kanban board and the visual DAG.

5. **AI-Augmented Dependency Assistant (15% Evaluation Criterion)**
   - Powered by Google Gemini with strict prompt grounding on current task context.
   - Outputs strict JSON schema with concrete technical reasoning.
   - **Human-in-the-Loop:** Suggestions are rendered in an interactive review drawer. Once accepted by the user, candidates pass through the backend cycle detection engine before persistence.

6. **Dual Visualizations: Kanban Board + Interactive React Flow DAG**
   - **Kanban Board:** Smooth `@dnd-kit` drag-and-drop between columns with immediate database persistence.
   - **DAG Graph View:** Full interactive canvas powered by `@xyflow/react` showing directed dependency arrows, topological layering, and critical path highlighting.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, `@dnd-kit/core`, `@xyflow/react`, Lucide Icons.
- **Backend:** Python 3.11, FastAPI, SQLAlchemy ORM, Pydantic v2, Pytest.
- **Database:** SQLite (local zero-config evaluation) / PostgreSQL (Neon Serverless free tier for production).
- **AI / LLM:** Google Gemini Flash API (Free Tier) with heuristic fallback for offline testing.

---

## 🚀 Quick Start (Local Setup)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment & install dependencies
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run automated tests
pytest -v tests

# Start FastAPI backend server (port 8000)
uvicorn app.main:app --reload --port 8000
```

Backend will be live at `http://127.0.0.1:8000` (API documentation at `http://127.0.0.1:8000/docs`).

### 2. Frontend Setup

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server (port 5173)
npm run dev
```

Frontend will be live at `http://localhost:5173`.

---

## 🧪 Automated Test Verification

All mathematical invariants and requirements are covered by 13 unit & integration tests:

```bash
pytest -v backend/tests
```

Key test suites:
- `test_cycle_detection.py`: Verifies cycle rejection on self-loops, simple cycles ($A \to B \to C \to A$), and diamond topologies.
- `test_schedule_propagation.py`: Explicitly tests the prompt's non-compounding invariant: extending Task A by $+3$ days with converging paths ($A \to B \to D$ and $A \to C \to D$) moves Task D by $+3$ days, **not** $+6$ days.
- `test_regression_rollback.py`: Verifies regression rollback to `Blocked` when an upstream prerequisite moves back to `In Progress`.
- `test_critical_path.py`: Verifies dynamic programming calculation of the longest duration path.
- `test_api_endpoints.py`: Verifies end-to-end HTTP API contracts and transaction rollbacks.

---

## 🌐 100% Free Production Deployment Guide

### Option 1: Render + Neon + Vercel

1. **Free PostgreSQL Database (Neon):**
   - Create a free project at [neon.tech](https://neon.tech) (0.5 GB free serverless Postgres, no credit card required).
   - Copy the connection string `postgresql://...`.

2. **Backend (Render):**
   - Link your GitHub repository to [render.com](https://render.com).
   - Create a new **Web Service** with:
     - Root directory: `backend`
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
     - Environment Variables:
       - `DATABASE_URL`: Your Neon Postgres connection string.
       - `GEMINI_API_KEY`: (Optional) Free Gemini API key from [Google AI Studio](https://aistudio.google.com).
       - `CORS_ORIGINS`: `*` (or your Vercel URL).

3. **Frontend (Vercel):**
   - Import your repository on [vercel.com](https://vercel.com).
   - Root directory: `frontend`
   - Framework preset: `Vite`
   - Environment Variable:
     - `VITE_API_URL`: Your deployed Render backend URL (e.g. `https://taskflow-pro-backend.onrender.com`).
   - Click **Deploy**!
