import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .seed import seed_initial_data
from .routers import tasks, dependencies, graph, ai

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite / PostgreSQL tables
    Base.metadata.create_all(bind=engine)
    # Seed initial 8 realistic tasks if empty
    db = SessionLocal()
    try:
        seed_initial_data(db, force=False)
    finally:
        db.close()
    yield

app = FastAPI(
    title="TaskFlow Pro API",
    description="Dependency-Aware Workflow and DAG Scheduling Engine with cycle detection, non-compounding delay propagation, and AI suggestions.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
allowed_origins_env = os.getenv("CORS_ORIGINS", "")
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]
if allowed_origins_env:
    origins.extend([o.strip() for o in allowed_origins_env.split(",") if o.strip()])
else:
    origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(tasks.router, prefix="/api")
app.include_router(dependencies.router, prefix="/api")
app.include_router(graph.router, prefix="/api")
app.include_router(ai.router, prefix="/api")

@app.get("/")
def root():
    return {
        "app": "TaskFlow Pro",
        "status": "online",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
