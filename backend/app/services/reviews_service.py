from backend.app.db.mongo_client import (
    execute_mongo_find,
    execute_mongo_insert,
    execute_mongo_update
)
from backend.app.utils.ids import generate_review_id
from backend.app.utils.dates import now_iso

def add_review(book_id: str, member_id: str, rating: int, comment: str) -> dict:
    # Validate book
    books, _ = execute_mongo_find("books", filter_doc={"book_id": book_id}, limit=1)
    if not books:
        return {"success": False, "message": "Book not found."}
    book = books[0]

    members, _ = execute_mongo_find("members", filter_doc={"member_id": member_id}, limit=1)
    member_name = members[0].get("name", "Reader") if members else "Reader"

    all_revs, _ = execute_mongo_find("reviews", limit=2000)
    existing_ids = [r["review_id"] for r in all_revs]
    new_id = generate_review_id(existing_ids)

    rev_doc = {
        "review_id": new_id,
        "book_id": book_id,
        "member_id": member_id,
        "member_name": member_name,
        "rating": rating,
        "comment": comment,
        "created_at": now_iso()
    }

    _, qinfo = execute_mongo_insert(
        "reviews",
        rev_doc,
        purpose=f"Add reader review {new_id} for book {book_id}"
    )

    # Recalculate book's ratings_count and avg_rating
    existing_ratings = [r["rating"] for r in all_revs if r.get("book_id") == book_id]
    existing_ratings.append(rating)
    new_avg = round(sum(existing_ratings) / len(existing_ratings), 2)
    
    execute_mongo_update(
        "books",
        {"book_id": book_id},
        {"$set": {"avg_rating": new_avg, "ratings_count": len(existing_ratings)}},
        purpose=f"Recalculate book {book_id} avg_rating to {new_avg}"
    )

    return {
        "success": True,
        "review": rev_doc,
        "new_avg_rating": new_avg,
        "query": qinfo
    }
