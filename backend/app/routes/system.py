from fastapi import APIRouter, Query
from typing import Optional
from backend.app.services import system_service, sync_service
from backend.app.utils.query_log import get_recent_queries, clear_query_history

router = APIRouter(prefix="/api/system", tags=["System & DB Inspector"])

@router.get("/overview")
def system_overview():
    return system_service.get_system_overview()

@router.get("/queries")
def query_history(limit: int = Query(50), database: Optional[str] = Query(None)):
    return {
        "queries": get_recent_queries(limit=limit, database=database),
        "total": len(get_recent_queries(limit=100))
    }

@router.delete("/queries")
def clear_queries():
    clear_query_history()
    return {"success": True, "message": "Query history cleared."}

@router.post("/outbox/replay")
def replay_syncs():
    return sync_service.replay_failed_syncs()

@router.post("/rebuild-graph")
def rebuild_graph():
    return sync_service.rebuild_entire_graph_from_mongo()
