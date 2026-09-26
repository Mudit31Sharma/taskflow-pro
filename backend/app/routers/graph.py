from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import GraphResponse
from ..graph_service import get_graph_state_payload
from ..seed import seed_initial_data

router = APIRouter(prefix="/graph", tags=["graph"])

@router.get("", response_model=GraphResponse)
def get_graph(db: Session = Depends(get_db)):
    return get_graph_state_payload(db)

@router.post("/reset", response_model=GraphResponse)
def reset_seed_data(db: Session = Depends(get_db)):
    seed_initial_data(db, force=True)
    return get_graph_state_payload(db)
