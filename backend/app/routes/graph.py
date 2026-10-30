from fastapi import APIRouter, Query
from backend.app.services import graph_service

router = APIRouter(prefix="/api/graph", tags=["Graph Explorer"])

@router.get("/network")
def graph_network(view_type: str = Query("authors"), limit: int = Query(70)):
    return graph_service.get_graph_network_data(view_type=view_type, max_nodes=limit)

@router.get("/shortest-path")
def shortest_path(author1_id: str = Query(...), author2_id: str = Query(...)):
    return graph_service.find_shortest_path_between_authors(author1_id, author2_id)

@router.get("/connected-authors")
def connected_authors(limit: int = Query(10)):
    return graph_service.get_most_connected_authors(limit=limit)
