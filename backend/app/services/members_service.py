from typing import Optional
from backend.app.db.mongo_client import (
    execute_mongo_find,
    execute_mongo_insert,
    execute_mongo_update
)
from backend.app.services.sync_service import sync_member_to_neo4j
from backend.app.utils.ids import generate_member_id
from backend.app.utils.dates import now_iso

def get_members(
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
) -> dict:
    filter_doc = {}
    if role and role != "all":
        filter_doc["role"] = role
    if status and status != "all":
        filter_doc["status"] = status

    members, qinfo = execute_mongo_find(
        collection_name="members",
        filter_doc=filter_doc,
        sort_spec=[("member_id", 1)],
        skip=skip,
        limit=limit,
        purpose="Fetch member directory with membership type and status filters"
    )

    if search and search.strip():
        s = search.strip().lower()
        members = [
            m for m in members
            if s in m.get("name", "").lower()
            or s in m.get("email", "").lower()
            or s in m.get("member_id", "").lower()
        ]

    all_members, _ = execute_mongo_find("members", filter_doc=filter_doc, limit=500)

    return {
        "members": members,
        "total": len(all_members),
        "skip": skip,
        "limit": limit,
        "query": qinfo
    }

def get_member_by_id(member_id: str) -> dict:
    members, qinfo = execute_mongo_find("members", filter_doc={"member_id": member_id}, limit=1)
    if not members:
        return {"member": None, "query": qinfo}
    member = members[0]

    # Fetch loans for this member
    loans, l_qinfo = execute_mongo_find(
        "loans",
        filter_doc={"member_id": member_id},
        sort_spec=[("issued_at", -1)],
        limit=50,
        purpose=f"Fetch complete borrowing history for member {member_id}"
    )

    active_loans = [l for l in loans if l.get("status") in ["active", "overdue"]]
    returned_loans = [l for l in loans if l.get("status") == "returned"]
    total_fines = sum(l.get("fine_amount", 0.0) for l in active_loans)

    return {
        "member": member,
        "active_loans": active_loans,
        "returned_loans": returned_loans,
        "total_borrowed": len(loans),
        "unpaid_fines": round(total_fines, 2),
        "query": qinfo,
        "loans_query": l_qinfo
    }

def create_member(data: dict) -> dict:
    all_members, _ = execute_mongo_find("members", limit=500)
    existing_ids = [m["member_id"] for m in all_members]
    new_id = generate_member_id(existing_ids)

    mtype = data.get("membership_type", "standard")
    max_loans = 8 if mtype in ["faculty", "premium"] else 5

    member_doc = {
        "member_id": new_id,
        "name": data.get("name"),
        "email": data.get("email"),
        "phone": data.get("phone", ""),
        "role": data.get("role", "member"),
        "membership_type": mtype,
        "status": "active",
        "max_loans": max_loans,
        "favorite_genres": data.get("favorite_genres", []),
        "joined_at": now_iso()
    }

    _, qinfo = execute_mongo_insert(
        "members",
        member_doc,
        purpose=f"Create new member record ({new_id})"
    )

    # Sync to Neo4j (data minimisation)
    neo_synced, neo_msg = sync_member_to_neo4j(member_doc)

    return {
        "success": True,
        "member": member_doc,
        "neo4j_synced": neo_synced,
        "query": qinfo
    }

def update_member(member_id: str, fields: dict) -> dict:
    allowed = ["name", "phone", "status", "membership_type", "max_loans", "favorite_genres"]
    clean = {k: v for k, v in fields.items() if k in allowed}

    modified, qinfo = execute_mongo_update(
        "members",
        {"member_id": member_id},
        {"$set": clean},
        purpose=f"Update member profile {member_id}"
    )

    if "name" in clean:
        sync_member_to_neo4j({"member_id": member_id, "name": clean["name"]})

    return {
        "success": modified > 0,
        "query": qinfo
    }
