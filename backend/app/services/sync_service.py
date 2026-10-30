import json
import time
from typing import Any
from backend.app.config import settings
from backend.app.db.mongo_client import (
    execute_mongo_insert,
    execute_mongo_find,
    execute_mongo_update,
    get_db
)
from backend.app.db.neo4j_client import run_cypher_query, is_neo4j_alive
from backend.app.utils.dates import now_iso

def sync_book_to_neo4j(book: dict) -> tuple[bool, str]:
    """
    Syncs a Book document to Neo4j nodes and relationships:
    (:Book), (:Author), (:Genre), (:Publisher)
    (Author)-[:WROTE]->(Book)
    (Book)-[:IN_GENRE]->(Genre)
    (Book)-[:PUBLISHED_BY]->(Publisher)
    """
    cypher = """
    MERGE (b:Book {book_id: $book_id})
    SET b.title = $title, b.year = $year

    // Link Publisher
    WITH b
    MERGE (p:Publisher {name: $publisher})
    MERGE (b)-[:PUBLISHED_BY]->(p)

    // Link Genres
    WITH b
    UNWIND $genres AS genre_name
    MERGE (g:Genre {name: genre_name})
    MERGE (b)-[:IN_GENRE]->(g)

    // Link Authors
    WITH b
    UNWIND $authors AS author
    MERGE (a:Author {author_id: author.author_id})
    ON CREATE SET a.name = author.name
    MERGE (a)-[:WROTE]->(b)
    """
    params = {
        "book_id": book["book_id"],
        "title": book["title"],
        "year": book.get("publication_year"),
        "publisher": book.get("publisher", "Independent"),
        "genres": book.get("genres", []),
        "authors": book.get("authors", [])
    }
    
    try:
        if is_neo4j_alive():
            records, qinfo = run_cypher_query(
                cypher=cypher,
                params=params,
                purpose="Sync Book, Authors, Genres, and Publisher to Neo4j graph"
            )
            return True, "Synced to Neo4j."
        else:
            # Store in sync_outbox for replay
            _queue_outbox_event("SYNC_BOOK", {"book_id": book["book_id"]}, "Neo4j is currently unreachable.")
            return False, "Neo4j offline; stored in sync_outbox."
    except Exception as e:
        _queue_outbox_event("SYNC_BOOK", {"book_id": book["book_id"]}, str(e))
        return False, f"Neo4j sync failed: {str(e)}"

def sync_loan_to_neo4j(loan: dict) -> tuple[bool, str]:
    """
    Syncs a Loan to Neo4j relationship:
    (Member)-[:BORROWED {loan_id, issued_at, returned}]->(Book)
    """
    cypher = """
    MERGE (m:Member {member_id: $member_id})
    MERGE (b:Book {book_id: $book_id})
    MERGE (m)-[r:BORROWED {loan_id: $loan_id}]->(b)
    SET r.issued_at = $issued_at,
        r.returned = $returned,
        r.status = $status
    """
    params = {
        "member_id": loan["member_id"],
        "book_id": loan["book_id"],
        "loan_id": loan["loan_id"],
        "issued_at": loan["issued_at"],
        "returned": loan.get("status") == "returned",
        "status": loan.get("status", "active")
    }

    try:
        if is_neo4j_alive():
            records, qinfo = run_cypher_query(
                cypher=cypher,
                params=params,
                purpose="Sync Member BORROWED relationship to Neo4j graph"
            )
            return True, "Loan synced to Neo4j."
        else:
            _queue_outbox_event("SYNC_LOAN", {"loan_id": loan["loan_id"]}, "Neo4j is currently unreachable.")
            return False, "Neo4j offline; stored in sync_outbox."
    except Exception as e:
        _queue_outbox_event("SYNC_LOAN", {"loan_id": loan["loan_id"]}, str(e))
        return False, f"Neo4j sync failed: {str(e)}"

def sync_member_to_neo4j(member: dict) -> tuple[bool, str]:
    """
    Syncs Member node to Neo4j (DATA MINIMISATION: only member_id and name, NO email/phone).
    """
    cypher = """
    MERGE (m:Member {member_id: $member_id})
    SET m.name = $name
    """
    params = {
        "member_id": member["member_id"],
        "name": member["name"]
    }
    try:
        if is_neo4j_alive():
            run_cypher_query(
                cypher=cypher,
                params=params,
                purpose="Sync Member node to Neo4j (data minimization: only id and name)"
            )
            return True, "Member synced to Neo4j."
        else:
            _queue_outbox_event("SYNC_MEMBER", {"member_id": member["member_id"]}, "Neo4j is currently unreachable.")
            return False, "Neo4j offline; stored in sync_outbox."
    except Exception as e:
        _queue_outbox_event("SYNC_MEMBER", {"member_id": member["member_id"]}, str(e))
        return False, f"Neo4j sync failed: {str(e)}"

def _queue_outbox_event(event_type: str, payload: dict, error_message: str):
    doc = {
        "event_type": event_type,
        "payload": payload,
        "status": "pending",
        "error_message": error_message,
        "created_at": now_iso()
    }
    execute_mongo_insert("sync_outbox", doc, purpose="Queue failed Neo4j sync in outbox")

def get_outbox_status() -> dict:
    items, qinfo = execute_mongo_find("sync_outbox", limit=100, sort_spec=[("created_at", -1)])
    pending = [x for x in items if x.get("status") == "pending"]
    failed = [x for x in items if x.get("status") == "failed"]
    synced = [x for x in items if x.get("status") == "synced"]
    return {
        "total": len(items),
        "pending": len(pending),
        "failed": len(failed),
        "synced": len(synced),
        "items": items[:25],
        "query": qinfo
    }

def replay_failed_syncs() -> dict:
    """Replays pending and failed sync events from sync_outbox."""
    items, _ = execute_mongo_find("sync_outbox", filter_doc={"status": {"$in": ["pending", "failed"]}}, limit=200)
    replayed = 0
    errors = 0

    for item in items:
        event_type = item.get("event_type")
        payload = item.get("payload", {})
        success = False
        
        if event_type == "SYNC_BOOK":
            bid = payload.get("book_id")
            bdocs, _ = execute_mongo_find("books", filter_doc={"book_id": bid}, limit=1)
            if bdocs:
                s, _ = sync_book_to_neo4j(bdocs[0])
                success = s
        elif event_type == "SYNC_LOAN":
            lid = payload.get("loan_id")
            ldocs, _ = execute_mongo_find("loans", filter_doc={"loan_id": lid}, limit=1)
            if ldocs:
                s, _ = sync_loan_to_neo4j(ldocs[0])
                success = s
        elif event_type == "SYNC_MEMBER":
            mid = payload.get("member_id")
            mdocs, _ = execute_mongo_find("members", filter_doc={"member_id": mid}, limit=1)
            if mdocs:
                s, _ = sync_member_to_neo4j(mdocs[0])
                success = s

        if success:
            replayed += 1
            execute_mongo_update(
                "sync_outbox",
                {"_id": item["_id"]} if "_id" in item else {"event_type": event_type, "created_at": item.get("created_at")},
                {"$set": {"status": "synced", "synced_at": now_iso()}}
            )
        else:
            errors += 1

    return {
        "replayed": replayed,
        "failed": errors,
        "message": f"Replayed {replayed} events ({errors} failed)."
    }

def rebuild_entire_graph_from_mongo() -> dict:
    """Rebuilds the entire Neo4j graph directly from MongoDB books, members, and loans collections."""
    if not is_neo4j_alive():
        return {
            "success": False,
            "message": "Cannot rebuild graph: Neo4j server is currently unreachable. Please start Neo4j Desktop."
        }

    from backend.app.db.neo4j_client import ensure_constraints
    ensure_constraints()

    books, _ = execute_mongo_find("books", limit=500)
    members, _ = execute_mongo_find("members", limit=500)
    loans, _ = execute_mongo_find("loans", limit=3000)

    # 1. Sync all members
    for m in members:
        sync_member_to_neo4j(m)

    # 2. Sync all books
    for b in books:
        sync_book_to_neo4j(b)

    # 3. Sync all loans
    for l in loans:
        sync_loan_to_neo4j(l)

    return {
        "success": True,
        "books_synced": len(books),
        "members_synced": len(members),
        "loans_synced": len(loans),
        "message": f"Successfully rebuilt Neo4j graph: {len(books)} books, {len(members)} members, {len(loans)} loan edges."
    }
