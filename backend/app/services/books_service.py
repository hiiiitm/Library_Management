import json
from typing import Optional
from backend.app.db.mongo_client import (
    execute_mongo_find,
    execute_mongo_insert,
    execute_mongo_update,
    execute_mongo_delete,
    execute_mongo_aggregate
)
from backend.app.services.sync_service import sync_book_to_neo4j
from backend.app.utils.ids import generate_book_id
from backend.app.utils.dates import now_iso

def get_books(
    search: Optional[str] = None,
    genre: Optional[str] = None,
    author: Optional[str] = None,
    year_min: Optional[int] = None,
    year_max: Optional[int] = None,
    language: Optional[str] = None,
    available_only: bool = False,
    sort_by: str = "avg_rating_desc",
    skip: int = 0,
    limit: int = 24
) -> dict:
    filter_doc = {}
    
    if search and search.strip():
        # Text search using MongoDB index
        filter_doc["$text"] = {"$search": search.strip()}

    if genre and genre != "All":
        filter_doc["genres"] = genre

    if author and author != "All":
        filter_doc["authors.name"] = author

    if language and language != "All":
        filter_doc["language"] = language

    if year_min is not None or year_max is not None:
        year_filter = {}
        if year_min is not None:
            year_filter["$gte"] = year_min
        if year_max is not None:
            year_filter["$lte"] = year_max
        filter_doc["publication_year"] = year_filter

    if available_only:
        filter_doc["available_copies"] = {"$gte": 1}

    # Sorting options
    sort_map = {
        "avg_rating_desc": [("avg_rating", -1), ("ratings_count", -1)],
        "title_asc": [("title", 1)],
        "year_desc": [("publication_year", -1)],
        "year_asc": [("publication_year", 1)],
        "popularity_desc": [("ratings_count", -1), ("avg_rating", -1)]
    }
    sort_spec = sort_map.get(sort_by, [("avg_rating", -1)])

    books, qinfo = execute_mongo_find(
        collection_name="books",
        filter_doc=filter_doc,
        sort_spec=sort_spec,
        skip=skip,
        limit=limit,
        purpose=f"Catalogue search with MongoDB text index and compound filtering"
    )

    # Get total count matching filter
    all_matching, _ = execute_mongo_find("books", filter_doc=filter_doc, limit=1000)
    total_count = len(all_matching)

    return {
        "books": books,
        "total": total_count,
        "skip": skip,
        "limit": limit,
        "query": qinfo
    }

def get_book_by_id(book_id: str) -> dict:
    items, qinfo = execute_mongo_find(
        collection_name="books",
        filter_doc={"book_id": book_id},
        limit=1,
        purpose=f"Lookup full primary book document by unique ID ({book_id})"
    )
    book = items[0] if items else None
    
    # Also fetch reviews from Mongo
    reviews, rev_qinfo = execute_mongo_find(
        collection_name="reviews",
        filter_doc={"book_id": book_id},
        sort_spec=[("created_at", -1)],
        limit=20,
        purpose=f"Fetch reader reviews for book {book_id}"
    )

    return {
        "book": book,
        "reviews": reviews,
        "query": qinfo,
        "reviews_query": rev_qinfo
    }

def get_catalogue_metadata() -> dict:
    """Returns available genres, authors, and languages for filter controls."""
    books, qinfo = execute_mongo_find("books", limit=500)
    genres = sorted(list(set(g for b in books for g in b.get("genres", []))))
    authors = sorted(list(set(a["name"] for b in books for a in b.get("authors", []))))
    languages = sorted(list(set(b.get("language", "English") for b in books)))
    years = [b.get("publication_year") for b in books if b.get("publication_year")]
    
    return {
        "genres": genres,
        "authors": authors,
        "languages": languages,
        "year_min": min(years) if years else 1900,
        "year_max": max(years) if years else 2026,
        "total_books": len(books),
        "query": qinfo
    }

def create_book(book_data: dict) -> dict:
    all_books, _ = execute_mongo_find("books", limit=500)
    existing_ids = [b["book_id"] for b in all_books]
    new_book_id = generate_book_id(existing_ids)
    
    book_doc = {
        "book_id": new_book_id,
        "isbn13": book_data.get("isbn13"),
        "title": book_data.get("title"),
        "authors": book_data.get("authors", []),
        "genres": book_data.get("genres", []),
        "publisher": book_data.get("publisher", "Independent"),
        "publication_year": int(book_data.get("publication_year", 2024)),
        "language": book_data.get("language", "English"),
        "pages": int(book_data.get("pages", 250)),
        "description": book_data.get("description", ""),
        "tags": book_data.get("tags", []),
        "total_copies": int(book_data.get("total_copies", 5)),
        "available_copies": int(book_data.get("total_copies", 5)),
        "shelf_location": book_data.get("shelf_location", "GEN-01"),
        "avg_rating": 0.0,
        "ratings_count": 0,
        "created_at": now_iso()
    }

    _, qinfo = execute_mongo_insert(
        collection_name="books",
        document=book_doc,
        purpose="Insert new book record into MongoDB (system of record)"
    )

    # Dual-sync to Neo4j
    neo_synced, neo_msg = sync_book_to_neo4j(book_doc)

    return {
        "success": True,
        "book": book_doc,
        "neo4j_synced": neo_synced,
        "neo4j_message": neo_msg,
        "query": qinfo
    }

def update_book(book_id: str, update_fields: dict) -> dict:
    allowed = [
        "title", "description", "genres", "publisher", "publication_year",
        "language", "pages", "tags", "total_copies", "shelf_location"
    ]
    cleaned_fields = {k: v for k, v in update_fields.items() if k in allowed}
    
    modified, qinfo = execute_mongo_update(
        collection_name="books",
        filter_doc={"book_id": book_id},
        update_doc={"$set": cleaned_fields},
        purpose=f"Update book record {book_id} in MongoDB"
    )

    # Re-fetch and re-sync
    books, _ = execute_mongo_find("books", filter_doc={"book_id": book_id}, limit=1)
    if books:
        sync_book_to_neo4j(books[0])

    return {
        "success": modified > 0,
        "book": books[0] if books else None,
        "query": qinfo
    }

def delete_book(book_id: str) -> dict:
    deleted, qinfo = execute_mongo_delete(
        collection_name="books",
        filter_doc={"book_id": book_id},
        purpose=f"Delete book record {book_id} from MongoDB"
    )
    
    # Also remove from Neo4j
    from backend.app.db.neo4j_client import run_cypher_query
    run_cypher_query(
        "MATCH (b:Book {book_id: $book_id}) DETACH DELETE b",
        {"book_id": book_id},
        purpose="Remove Book node and its graph relationships from Neo4j"
    )

    return {
        "success": deleted > 0,
        "message": f"Book {book_id} removed from MongoDB and Neo4j.",
        "query": qinfo
    }
