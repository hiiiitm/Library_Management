from typing import Optional
from backend.app.config import settings
from backend.app.db.mongo_client import (
    execute_mongo_find,
    execute_mongo_insert,
    execute_mongo_update,
    execute_atomic_checkout,
    execute_atomic_return
)
from backend.app.services.sync_service import sync_loan_to_neo4j
from backend.app.utils.dates import now_utc, now_iso, add_days, calculate_days_overdue
from backend.app.utils.fines import compute_fine_for_due_date, is_blocked_by_fines
from backend.app.utils.ids import generate_loan_id

def get_loans(
    member_id: Optional[str] = None,
    book_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
) -> dict:
    filter_doc = {}
    if member_id:
        filter_doc["member_id"] = member_id
    if book_id:
        filter_doc["book_id"] = book_id
    if status and status != "all":
        filter_doc["status"] = status

    loans, qinfo = execute_mongo_find(
        collection_name="loans",
        filter_doc=filter_doc,
        sort_spec=[("issued_at", -1)],
        skip=skip,
        limit=limit,
        purpose="Retrieve loans filtered by member, book, or circulation status"
    )

    # Recalculate live fines for any currently overdue loans
    for l in loans:
        if l.get("status") == "overdue":
            live_fine = compute_fine_for_due_date(l["due_at"])
            l["fine_amount"] = max(l.get("fine_amount", 0.0), live_fine)

    all_matching, _ = execute_mongo_find("loans", filter_doc=filter_doc, limit=2000)

    return {
        "loans": loans,
        "total": len(all_matching),
        "skip": skip,
        "limit": limit,
        "query": qinfo
    }

def checkout_book(book_id: str, member_id: str) -> dict:
    """
    Executes circulation checkout adhering strictly to all project constraints:
    1. Member existence & active status check.
    2. Active loan count limit (5 for standard, 8 for faculty/premium).
    3. Fine block check (unpaid fines > Rs 50).
    4. Duplicate active loan check (member cannot borrow same book twice concurrently).
    5. ATOMIC MongoDB copy decrement (find_one_and_update).
    6. Loan document insertion in MongoDB.
    7. Dual-sync edge to Neo4j.
    """
    # 1. Member check
    members, _ = execute_mongo_find("members", filter_doc={"member_id": member_id}, limit=1)
    if not members:
        return {"success": False, "message": f"Member {member_id} not found."}
    member = members[0]
    if member.get("status") == "suspended":
        return {"success": False, "message": f"Member account {member_id} is suspended."}

    # 2. Check active loans limit
    active_loans, _ = execute_mongo_find(
        "loans",
        filter_doc={"member_id": member_id, "status": {"$in": ["active", "overdue"]}},
        limit=20
    )
    max_allowed = member.get("max_loans", settings.MAX_LOANS_STANDARD)
    if len(active_loans) >= max_allowed:
        return {
            "success": False,
            "message": f"Member has reached the maximum limit of {max_allowed} active loans."
        }

    # 3. Check unpaid fines
    unpaid_fines = sum(l.get("fine_amount", 0.0) for l in active_loans)
    blocked, fine_msg = is_blocked_by_fines(unpaid_fines)
    if blocked:
        return {"success": False, "message": fine_msg}

    # 4. Check duplicate active loan of same book
    for l in active_loans:
        if l["book_id"] == book_id:
            return {
                "success": False,
                "message": f"Member already has an active loan of book {book_id} ('{l.get('book_title')}')."
            }

    # 5. Atomic checkout in MongoDB
    all_loans, _ = execute_mongo_find("loans", limit=3000)
    existing_loan_ids = [x["loan_id"] for x in all_loans]
    new_loan_id = generate_loan_id(existing_loan_ids)

    issued_dt = now_utc()
    due_dt = add_days(issued_dt, settings.STANDARD_LOAN_DAYS)
    issued_iso = issued_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    due_iso = due_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    success, updated_book, copy_msg, atomic_qinfo = execute_atomic_checkout(
        book_id=book_id,
        member_id=member_id,
        loan_id=new_loan_id,
        due_at=due_iso
    )

    if not success or not updated_book:
        return {
            "success": False,
            "message": copy_msg,
            "query": atomic_qinfo
        }

    # 6. Insert loan record into MongoDB
    loan_doc = {
        "loan_id": new_loan_id,
        "book_id": book_id,
        "book_title": updated_book.get("title", ""),
        "member_id": member_id,
        "issued_at": issued_iso,
        "due_at": due_iso,
        "returned_at": None,
        "status": "active",
        "renewals": 0,
        "fine_amount": 0.0
    }
    _, insert_qinfo = execute_mongo_insert(
        collection_name="loans",
        document=loan_doc,
        purpose=f"Record issuance of loan {new_loan_id}"
    )

    # 7. Dual-sync to Neo4j
    neo_synced, neo_msg = sync_loan_to_neo4j(loan_doc)

    return {
        "success": True,
        "message": f"Successfully checked out '{updated_book.get('title')}'. Due date: {due_iso[:10]}.",
        "loan": loan_doc,
        "available_copies_remaining": updated_book.get("available_copies"),
        "neo4j_synced": neo_synced,
        "query": atomic_qinfo
    }

def return_book(loan_id: str) -> dict:
    """
    Executes circulation book return:
    1. Looks up active loan.
    2. Calculates any late fine due (Rs 2/day).
    3. Updates loan status to 'returned' in MongoDB.
    4. ATOMICALLY increments available_copies in MongoDB.
    5. Dual-syncs returned state to Neo4j relationship.
    """
    loans, _ = execute_mongo_find("loans", filter_doc={"loan_id": loan_id}, limit=1)
    if not loans:
        return {"success": False, "message": f"Loan {loan_id} not found."}
    loan = loans[0]
    if loan.get("status") == "returned":
        return {"success": False, "message": f"Loan {loan_id} has already been returned."}

    ret_iso = now_iso()
    due_iso = loan["due_at"]
    fine = compute_fine_for_due_date(due_iso, ret_iso)

    # 1. Update loan in Mongo
    execute_mongo_update(
        "loans",
        {"loan_id": loan_id},
        {"$set": {"status": "returned", "returned_at": ret_iso, "fine_amount": fine}},
        purpose=f"Mark loan {loan_id} returned with fine ₹{fine:.2f}"
    )

    # 2. Atomic copy increment in Mongo
    success, updated_book, _, atomic_qinfo = execute_atomic_return(loan["book_id"])

    # 3. Dual-sync to Neo4j
    loan_copy = dict(loan)
    loan_copy["status"] = "returned"
    loan_copy["returned_at"] = ret_iso
    neo_synced, _ = sync_loan_to_neo4j(loan_copy)

    msg = f"Book '{loan.get('book_title')}' returned successfully."
    if fine > 0:
        msg += f" Overdue fine assessed: ₹{fine:.2f}."

    return {
        "success": True,
        "message": msg,
        "fine_assessed": fine,
        "available_copies": updated_book.get("available_copies") if updated_book else None,
        "neo4j_synced": neo_synced,
        "query": atomic_qinfo
    }

def renew_loan(loan_id: str) -> dict:
    """
    Extends loan due date by 14 days, max 2 renewals, checks reservations.
    """
    loans, _ = execute_mongo_find("loans", filter_doc={"loan_id": loan_id}, limit=1)
    if not loans:
        return {"success": False, "message": f"Loan {loan_id} not found."}
    loan = loans[0]
    if loan.get("status") != "active":
        return {"success": False, "message": f"Only active loans can be renewed. (Status: {loan.get('status')})"}

    renewals = loan.get("renewals", 0)
    if renewals >= settings.MAX_RENEWALS:
        return {
            "success": False,
            "message": f"Maximum of {settings.MAX_RENEWALS} renewals reached for this loan."
        }

    # Check for pending reservations
    res, _ = execute_mongo_find(
        "reservations",
        filter_doc={"book_id": loan["book_id"], "status": "pending"},
        limit=1
    )
    if res:
        return {
            "success": False,
            "message": "Cannot renew: Another member has reserved this title."
        }

    curr_due = loan["due_at"]
    from backend.app.utils.dates import parse_iso
    new_due_dt = add_days(parse_iso(curr_due), settings.STANDARD_LOAN_DAYS)
    new_due_iso = new_due_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    _, qinfo = execute_mongo_update(
        "loans",
        {"loan_id": loan_id},
        {"$set": {"due_at": new_due_iso}, "$inc": {"renewals": 1}},
        purpose=f"Renew loan {loan_id} (Renewal #{renewals + 1})"
    )

    return {
        "success": True,
        "message": f"Loan renewed successfully. New due date: {new_due_iso[:10]}.",
        "new_due_at": new_due_iso,
        "renewals_count": renewals + 1,
        "query": qinfo
    }

def pay_fine(loan_id: str) -> dict:
    """Clears fine amount on a returned or active loan."""
    loans, _ = execute_mongo_find("loans", filter_doc={"loan_id": loan_id}, limit=1)
    if not loans:
        return {"success": False, "message": "Loan not found."}
    
    amount = loans[0].get("fine_amount", 0.0)
    _, qinfo = execute_mongo_update(
        "loans",
        {"loan_id": loan_id},
        {"$set": {"fine_amount": 0.0}},
        purpose=f"Settle fine of ₹{amount:.2f} on loan {loan_id}"
    )
    return {
        "success": True,
        "message": f"Fine of ₹{amount:.2f} settled successfully.",
        "paid_amount": amount,
        "query": qinfo
    }
