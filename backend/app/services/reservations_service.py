from typing import Optional
from backend.app.db.mongo_client import (
    execute_mongo_find,
    execute_mongo_insert,
    execute_mongo_update
)
from backend.app.utils.ids import generate_reservation_id
from backend.app.utils.dates import now_iso

def get_reservations(book_id: Optional[str] = None, member_id: Optional[str] = None, status: Optional[str] = None) -> dict:
    filter_doc = {}
    if book_id:
        filter_doc["book_id"] = book_id
    if member_id:
        filter_doc["member_id"] = member_id
    if status and status != "all":
        filter_doc["status"] = status

    reservations, qinfo = execute_mongo_find(
        "reservations",
        filter_doc=filter_doc,
        sort_spec=[("reserved_at", -1)],
        limit=50,
        purpose="Fetch book reservation hold queue"
    )
    return {
        "reservations": reservations,
        "query": qinfo
    }

def create_reservation(book_id: str, member_id: str) -> dict:
    # Verify book and member
    books, _ = execute_mongo_find("books", filter_doc={"book_id": book_id}, limit=1)
    if not books:
        return {"success": False, "message": "Book not found."}
    book = books[0]

    members, _ = execute_mongo_find("members", filter_doc={"member_id": member_id}, limit=1)
    if not members:
        return {"success": False, "message": "Member not found."}
    member = members[0]

    all_res, _ = execute_mongo_find("reservations", limit=500)
    existing_ids = [r["reservation_id"] for r in all_res]
    new_id = generate_reservation_id(existing_ids)

    res_doc = {
        "reservation_id": new_id,
        "book_id": book_id,
        "book_title": book.get("title", ""),
        "member_id": member_id,
        "member_name": member.get("name", ""),
        "reserved_at": now_iso(),
        "status": "pending",
        "priority": 1
    }

    _, qinfo = execute_mongo_insert(
        "reservations",
        res_doc,
        purpose=f"Queue reservation {new_id} for book {book_id}"
    )

    return {
        "success": True,
        "reservation": res_doc,
        "message": f"Reservation queued for '{book.get('title')}'.",
        "query": qinfo
    }

def cancel_reservation(reservation_id: str) -> dict:
    modified, qinfo = execute_mongo_update(
        "reservations",
        {"reservation_id": reservation_id},
        {"$set": {"status": "cancelled"}},
        purpose=f"Cancel reservation {reservation_id}"
    )
    return {
        "success": modified > 0,
        "message": f"Reservation {reservation_id} cancelled.",
        "query": qinfo
    }
