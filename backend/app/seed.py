from datetime import date, timedelta
from sqlalchemy.orm import Session
from .models import Task, Dependency
from .dag_engine.scheduler import calculate_end_date

def seed_initial_data(db: Session, force: bool = False):
    """
    Populates realistic software engineering tasks demonstrating:
    - Linear dependencies
    - Branching & converging dependencies (Diamond DAG)
    - Independent parallel tasks
    - Various workflow states (Done, In Progress, Review, Backlog)
    """
    task_count = db.query(Task).count()
    if task_count > 0 and not force:
        return

    if force:
        db.query(Dependency).delete()
        db.query(Task).delete()
        db.commit()

    today = date.today()

    tasks_data = [
        {
            "id": 1,
            "title": "Design Database Schema & Models",
            "description": "Define relational schema for users, orders, and payment records with migrations.",
            "workflow_status": "Done",
            "position": 0,
            "start_date": today - timedelta(days=6),
            "duration": 2,
        },
        {
            "id": 2,
            "title": "Implement Authentication Service",
            "description": "JWT authentication, password hashing, and user registration endpoints.",
            "workflow_status": "Done",
            "position": 1,
            "start_date": today - timedelta(days=4),
            "duration": 2,
        },
        {
            "id": 3,
            "title": "Develop User Profile API",
            "description": "CRUD endpoints for user profiles, avatar uploads, and role management.",
            "workflow_status": "In Progress",
            "position": 0,
            "start_date": today - timedelta(days=2),
            "duration": 3,
        },
        {
            "id": 4,
            "title": "Implement Payment Gateway Integration",
            "description": "Stripe & PayPal webhooks, payment intent processing, and refund flows.",
            "workflow_status": "In Progress",
            "position": 1,
            "start_date": today - timedelta(days=2),
            "duration": 4,
        },
        {
            "id": 5,
            "title": "Build Checkout & Order Service",
            "description": "Order creation, stock reservation, and payment capture flow.",
            "workflow_status": "Backlog",
            "position": 0,
            "start_date": today + timedelta(days=2),
            "duration": 3,
        },
        {
            "id": 6,
            "title": "End-to-End Integration Testing",
            "description": "Automated Cypress and Pytest suite covering full customer purchase journey.",
            "workflow_status": "Backlog",
            "position": 1,
            "start_date": today + timedelta(days=5),
            "duration": 2,
        },
        {
            "id": 7,
            "title": "Setup CI/CD Pipeline & Staging Deploy",
            "description": "GitHub Actions workflow for automated testing and deployment to staging server.",
            "workflow_status": "Backlog",
            "position": 2,
            "start_date": today + timedelta(days=7),
            "duration": 2,
        },
        {
            "id": 8,
            "title": "Design System & Landing Page",
            "description": "Tailwind CSS component library, responsive marketing hero, and typography.",
            "workflow_status": "Review",
            "position": 0,
            "start_date": today - timedelta(days=3),
            "duration": 3,
        },
    ]

    task_objects = {}
    for data in tasks_data:
        t = Task(
            id=data["id"],
            title=data["title"],
            description=data["description"],
            workflow_status=data["workflow_status"],
            position=data["position"],
            start_date=data["start_date"],
            duration=data["duration"],
        )
        db.add(t)
        task_objects[data["id"]] = t

    db.commit()

    # Dependencies:
    # 1 -> 2 (DB Schema -> Auth Service)
    # 1 -> 4 (DB Schema -> Payment Gateway)
    # 2 -> 3 (Auth Service -> User Profile API)
    # 3 -> 5 (User Profile API -> Checkout Service)
    # 4 -> 5 (Payment Gateway -> Checkout Service) [Converging Diamond!]
    # 5 -> 6 (Checkout Service -> E2E Integration Testing)
    # 6 -> 7 (Integration Testing -> CI/CD Pipeline)
    dependencies_data = [
        (1, 2),
        (1, 4),
        (2, 3),
        (3, 5),
        (4, 5),
        (5, 6),
        (6, 7),
    ]

    for prec_id, dep_id in dependencies_data:
        dep = Dependency(precursor_id=prec_id, dependent_id=dep_id)
        db.add(dep)

    db.commit()
