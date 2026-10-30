from fastapi import APIRouter, Query
from backend.app.services import recommendations_service

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

@router.get("/also-borrowed/{book_id}")
def also_borrowed(book_id: str, limit: int = Query(6)):
    return recommendations_service.get_also_borrowed_recommendations(book_id, limit)

@router.get("/member/{member_id}")
def member_recommendations(member_id: str, limit: int = Query(8)):
    return recommendations_service.get_personalized_member_recommendations(member_id, limit)

@router.get("/similar-genres/{book_id}")
def similar_genres(book_id: str, limit: int = Query(6)):
    return recommendations_service.get_shared_genre_books(book_id, limit)

@router.get("/more-by-author/{book_id}")
def more_by_author(book_id: str, limit: int = Query(4)):
    return recommendations_service.get_more_by_author(book_id, limit)

@router.get("/genre-popularity")
def genre_popularity():
    return recommendations_service.get_genre_popularity_ranking()
