from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from backend.app.services import books_service

router = APIRouter(prefix="/api/books", tags=["Books"])

@router.get("")
def list_books(
    search: Optional[str] = Query(None),
    genre: Optional[str] = Query(None),
    author: Optional[str] = Query(None),
    year_min: Optional[int] = Query(None),
    year_max: Optional[int] = Query(None),
    language: Optional[str] = Query(None),
    available_only: bool = Query(False),
    sort_by: str = Query("avg_rating_desc"),
    skip: int = Query(0),
    limit: int = Query(24)
):
    return books_service.get_books(
        search=search,
        genre=genre,
        author=author,
        year_min=year_min,
        year_max=year_max,
        language=language,
        available_only=available_only,
        sort_by=sort_by,
        skip=skip,
        limit=limit
    )

@router.get("/metadata")
def get_metadata():
    return books_service.get_catalogue_metadata()

@router.get("/{book_id}")
def get_book_detail(book_id: str):
    res = books_service.get_book_by_id(book_id)
    if not res.get("book"):
        raise HTTPException(status_code=404, detail="Book not found")
    return res

@router.post("")
def create_book(book_data: dict):
    return books_service.create_book(book_data)

@router.put("/{book_id}")
def update_book(book_id: str, update_data: dict):
    return books_service.update_book(book_id, update_data)

@router.delete("/{book_id}")
def delete_book(book_id: str):
    return books_service.delete_book(book_id)
