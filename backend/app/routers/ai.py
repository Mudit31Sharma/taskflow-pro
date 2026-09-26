from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import AISuggestionResponse, AISuggestionItem
from ..graph_service import build_graph_from_db
from ..ai_service import get_ai_dependency_suggestions

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/suggest", response_model=AISuggestionResponse)
async def suggest_dependencies(db: Session = Depends(get_db)):
    graph, tasks, dependencies = build_graph_from_db(db)

    task_dicts = [
        {"id": t.id, "title": t.title, "description": t.description}
        for t in tasks
    ]
    existing_edges = [(d.precursor_id, d.dependent_id) for d in dependencies]

    suggestions = await get_ai_dependency_suggestions(
        tasks=task_dicts,
        existing_dependencies=existing_edges,
        graph=graph
    )

    items = [
        AISuggestionItem(
            precursor_id=s["precursor_id"],
            dependent_id=s["dependent_id"],
            reason=s["reason"]
        )
        for s in suggestions
    ]
    return AISuggestionResponse(suggestions=items)
