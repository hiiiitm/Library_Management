import json
import os
import re
import time
from pathlib import Path
from typing import Any, Optional
from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from backend.app.config import settings
from backend.app.utils.query_log import log_database_query

_mongo_client: Optional[MongoClient] = None
_is_connected = False
_mock_storage: dict[str, list[dict]] = {}

def get_raw_data_dir() -> Path:
    return Path(__file__).resolve().parent.parent.parent.parent / "data" / "raw"

def init_mock_storage():
    """Loads generated raw JSON data into memory if MongoDB is offline."""
    global _mock_storage
    raw_dir = get_raw_data_dir()
    collections = ["books", "authors", "members", "loans", "reservations", "reviews"]
    for col in collections:
        file_path = raw_dir / f"{col}.json"
        if file_path.exists():
            with open(file_path, "r", encoding="utf-8") as f:
                _mock_storage[col] = json.load(f)
        else:
            _mock_storage[col] = []
    _mock_storage["audit_log"] = []
    _mock_storage["sync_outbox"] = []

def _is_port_open(host: str, port: int, timeout: float = 0.3) -> bool:
    import socket
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (OSError, socket.timeout):
        return False

def get_mongo_client() -> tuple[Optional[MongoClient], bool]:
    """Attempts to connect to MongoDB, with cached client instance."""
    global _mongo_client, _is_connected
    if _mongo_client is not None and _is_connected:
        try:
            _mongo_client.admin.command('ping')
            return _mongo_client, True
        except Exception:
            _is_connected = False

    # Rapid socket pre-check if connecting to localhost/127.0.0.1
    if "127.0.0.1" in settings.MONGO_URI or "localhost" in settings.MONGO_URI:
        if not _is_port_open("127.0.0.1", 27017):
            _is_connected = False
            if not _mock_storage:
                init_mock_storage()
            return None, False

    try:
        client = MongoClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=1000,
            connectTimeoutMS=1000
        )
        client.admin.command('ping')
        _mongo_client = client
        _is_connected = True
        return _mongo_client, True
    except (ConnectionFailure, ServerSelectionTimeoutError, Exception):
        _is_connected = False
        if not _mock_storage:
            init_mock_storage()
        return None, False

def get_db():
    client, connected = get_mongo_client()
    if connected and client is not None:
        return client[settings.MONGO_DB]
    return None

def is_mongo_alive() -> bool:
    _, connected = get_mongo_client()
    return connected

def ensure_indexes():
    """Creates all required primary, text, and compound indexes in MongoDB."""
    client, connected = get_mongo_client()
    if not connected or client is None:
        return False, "MongoDB offline; cannot create database indexes."

    db = client[settings.MONGO_DB]
    try:
        # 1. Books indexes
        db.books.create_index([("book_id", ASCENDING)], unique=True)
        db.books.create_index([("isbn13", ASCENDING)], unique=True)
        db.books.create_index([
            ("title", TEXT),
            ("authors.name", TEXT),
            ("description", TEXT),
            ("tags", TEXT)
        ], default_language="english")
        db.books.create_index([("genres", ASCENDING)])
        db.books.create_index([("publication_year", DESCENDING)])
        db.books.create_index([("avg_rating", DESCENDING)])

        # 2. Members indexes
        db.members.create_index([("member_id", ASCENDING)], unique=True)
        db.members.create_index([("email", ASCENDING)], unique=True)

        # 3. Authors indexes
        db.authors.create_index([("author_id", ASCENDING)], unique=True)

        # 4. Loans indexes
        db.loans.create_index([("loan_id", ASCENDING)], unique=True)
        db.loans.create_index([("member_id", ASCENDING), ("status", ASCENDING)])
        db.loans.create_index([("book_id", ASCENDING), ("status", ASCENDING)])
        db.loans.create_index([("due_at", ASCENDING)])

        # 5. Reservations & Reviews
        db.reservations.create_index([("reservation_id", ASCENDING)], unique=True)
        db.reservations.create_index([("book_id", ASCENDING), ("status", ASCENDING)])
        db.reviews.create_index([("review_id", ASCENDING)], unique=True)
        db.reviews.create_index([("book_id", ASCENDING)])
        
        # 6. Audit & Outbox
        db.sync_outbox.create_index([("status", ASCENDING)])

        return True, "All indexes created successfully."
    except Exception as e:
        return False, str(e)

# ---------------------------------------------------------------------------
# High-Level Query Helpers with Execution Logging
# ---------------------------------------------------------------------------

def execute_mongo_find(
    collection_name: str,
    filter_doc: dict = None,
    sort_spec: list = None,
    skip: int = 0,
    limit: int = 50,
    projection: dict = None,
    purpose: str = ""
) -> tuple[list[dict], dict]:
    filter_doc = filter_doc or {}
    t0 = time.time()
    db = get_db()
    
    query_display = f"db.{collection_name}.find({json.dumps(filter_doc, default=str)})"
    if sort_spec:
        query_display += f".sort({sort_spec})"
    if skip > 0:
        query_display += f".skip({skip})"
    if limit:
        query_display += f".limit({limit})"

    if db is not None:
        cursor = db[collection_name].find(filter_doc, projection)
        if sort_spec:
            cursor = cursor.sort(sort_spec)
        if skip > 0:
            cursor = cursor.skip(skip)
        if limit:
            cursor = cursor.limit(limit)
        items = list(cursor)
        for item in items:
            if "_id" in item:
                item["_id"] = str(item["_id"])
    else:
        # Mock fallback
        if not _mock_storage:
            init_mock_storage()
        items = _mock_storage.get(collection_name, [])
        # Simple memory filter
        filtered = []
        for doc in items:
            match = True
            for k, v in filter_doc.items():
                if k == "$text":
                    search_term = v.get("$search", "").lower()
                    text_blob = f"{doc.get('title', '')} {doc.get('description', '')} {' '.join(doc.get('tags', []))}".lower()
                    if search_term and search_term not in text_blob:
                        match = False
                        break
                elif isinstance(v, dict):
                    if "$in" in v and doc.get(k) not in v["$in"]:
                        match = False
                        break
                    if "$gte" in v and doc.get(k, 0) < v["$gte"]:
                        match = False
                        break
                    if "$lte" in v and doc.get(k, 0) > v["$lte"]:
                        match = False
                        break
                elif doc.get(k) != v:
                    match = False
                    break
            if match:
                filtered.append(doc)
        
        # Sort
        if sort_spec:
            for field, direction in reversed(sort_spec):
                filtered = sorted(filtered, key=lambda x: x.get(field, 0), reverse=(direction == -1))
        items = filtered[skip : (skip + limit) if limit else None]

    ms = (time.time() - t0) * 1000
    q_rec = log_database_query(
        database="MongoDB",
        operation="find",
        query_text=query_display,
        params={"filter": filter_doc, "sort": sort_spec, "limit": limit},
        execution_ms=ms,
        purpose=purpose or f"Document retrieval from '{collection_name}' collection",
        records_affected=len(items)
    )
    return items, q_rec.to_dict()

def execute_mongo_aggregate(
    collection_name: str,
    pipeline: list[dict],
    purpose: str = ""
) -> tuple[list[dict], dict]:
    t0 = time.time()
    db = get_db()
    
    query_display = f"db.{collection_name}.aggregate([\n" + ",\n".join(
        [f"  {json.dumps(stage, default=str)}" for stage in pipeline]
    ) + "\n])"

    if db is not None:
        items = list(db[collection_name].aggregate(pipeline))
        for item in items:
            if "_id" in item and not isinstance(item["_id"], (str, int, float, bool, type(None))):
                item["_id"] = str(item["_id"])
    else:
        # In-memory mock aggregation handler for 6 key project pipelines
        if not _mock_storage:
            init_mock_storage()
        items = _mock_storage.get(collection_name, [])
        # Emulate common aggregation stages
        current_data = [dict(x) for x in items]
        for stage in pipeline:
            if "$match" in stage:
                match_spec = stage["$match"]
                current_data = [
                    d for d in current_data
                    if all(d.get(k) == v for k, v in match_spec.items() if not isinstance(v, dict))
                ]
            elif "$unwind" in stage:
                path = stage["$unwind"].replace("$", "")
                unwound = []
                for d in current_data:
                    arr = d.get(path, [])
                    if isinstance(arr, list):
                        for val in arr:
                            nd = dict(d)
                            nd[path] = val
                            unwound.append(nd)
                    else:
                        unwound.append(d)
                current_data = unwound
            elif "$group" in stage:
                group_spec = stage["$group"]
                id_field = group_spec.get("_id")
                groups = {}
                for d in current_data:
                    if isinstance(id_field, str) and id_field.startswith("$"):
                        key = d.get(id_field[1:], "Unknown")
                    else:
                        key = "All"
                    groups.setdefault(key, []).append(d)
                grouped_res = []
                for gkey, gitems in groups.items():
                    entry = {"_id": gkey}
                    for out_k, out_v in group_spec.items():
                        if out_k == "_id":
                            continue
                        if isinstance(out_v, dict):
                            if "$sum" in out_v:
                                sval = out_v["$sum"]
                                if sval == 1:
                                    entry[out_k] = len(gitems)
                                elif isinstance(sval, str) and sval.startswith("$"):
                                    entry[out_k] = sum(x.get(sval[1:], 0) for x in gitems)
                            elif "$avg" in out_v:
                                aval = out_v["$avg"]
                                if isinstance(aval, str) and aval.startswith("$"):
                                    vals = [x.get(aval[1:], 0) for x in gitems if aval[1:] in x]
                                    entry[out_k] = round(sum(vals)/len(vals), 2) if vals else 0
                    grouped_res.append(entry)
                current_data = grouped_res
            elif "$sort" in stage:
                sort_spec = stage["$sort"]
                for sk, sdir in reversed(list(sort_spec.items())):
                    current_data = sorted(current_data, key=lambda x: x.get(sk, 0), reverse=(sdir == -1))
            elif "$limit" in stage:
                current_data = current_data[: stage["$limit"]]
        items = current_data

    ms = (time.time() - t0) * 1000
    q_rec = log_database_query(
        database="MongoDB",
        operation="aggregate",
        query_text=query_display,
        params={"pipeline": pipeline},
        execution_ms=ms,
        purpose=purpose or f"Aggregation pipeline over '{collection_name}'",
        records_affected=len(items)
    )
    return items, q_rec.to_dict()

def execute_atomic_checkout(book_id: str, member_id: str, loan_id: str, due_at: str) -> tuple[bool, Optional[dict], str, dict]:
    """
    CRITICAL PROJECT REQUIREMENT:
    Checkout MUST be one atomic find_one_and_update:
    db.books.find_one_and_update(
        { "book_id": book_id, "available_copies": { "$gt": 0 } },
        { "$inc": { "available_copies": -1 } },
        return_document=ReturnDocument.AFTER
    )
    """
    t0 = time.time()
    db = get_db()
    
    query_display = (
        f"db.books.findOneAndUpdate(\n"
        f"  {{ \"book_id\": \"{book_id}\", \"available_copies\": {{ \"$gt\": 0 }} }},\n"
        f"  {{ \"$inc\": {{ \"available_copies\": -1 }} }},\n"
        f"  {{ returnDocument: 'after' }}\n"
        f");"
    )

    if db is not None:
        from pymongo import ReturnDocument
        updated_book = db.books.find_one_and_update(
            {"book_id": book_id, "available_copies": {"$gt": 0}},
            {"$inc": {"available_copies": -1}},
            return_document=ReturnDocument.AFTER
        )
        if not updated_book:
            ms = (time.time() - t0) * 1000
            q_rec = log_database_query(
                database="MongoDB",
                operation="find_one_and_update",
                query_text=query_display,
                params={"book_id": book_id},
                execution_ms=ms,
                purpose="Atomic checkout copy decrement (Guarantees no race conditions / negative copies)",
                records_affected=0
            )
            return False, None, f"Checkout failed: No available copies for book {book_id}.", q_rec.to_dict()
        
        if "_id" in updated_book:
            updated_book["_id"] = str(updated_book["_id"])
    else:
        # Mock atomic handling
        if not _mock_storage:
            init_mock_storage()
        books = _mock_storage.get("books", [])
        target_book = next((b for b in books if b["book_id"] == book_id), None)
        if not target_book or target_book.get("available_copies", 0) <= 0:
            ms = (time.time() - t0) * 1000
            q_rec = log_database_query(
                database="MongoDB",
                operation="find_one_and_update",
                query_text=query_display,
                params={"book_id": book_id},
                execution_ms=ms,
                purpose="Atomic checkout copy decrement (Guarantees no race conditions / negative copies)",
                records_affected=0
            )
            return False, None, f"Checkout failed: No available copies for book {book_id}.", q_rec.to_dict()
        
        target_book["available_copies"] -= 1
        updated_book = dict(target_book)

    ms = (time.time() - t0) * 1000
    q_rec = log_database_query(
        database="MongoDB",
        operation="find_one_and_update",
        query_text=query_display,
        params={"book_id": book_id},
        execution_ms=ms,
        purpose="Atomic checkout copy decrement (Guarantees no race conditions / negative copies)",
        records_affected=1
    )
    return True, updated_book, "Book copy decremented atomically.", q_rec.to_dict()

def execute_atomic_return(book_id: str) -> tuple[bool, Optional[dict], str, dict]:
    """Reverses checkout atomically by incrementing available_copies."""
    t0 = time.time()
    db = get_db()
    
    query_display = (
        f"db.books.findOneAndUpdate(\n"
        f"  {{ \"book_id\": \"{book_id}\" }},\n"
        f"  {{ \"$inc\": {{ \"available_copies\": 1 }} }},\n"
        f"  {{ returnDocument: 'after' }}\n"
        f");"
    )

    if db is not None:
        from pymongo import ReturnDocument
        updated_book = db.books.find_one_and_update(
            {"book_id": book_id},
            {"$inc": {"available_copies": 1}},
            return_document=ReturnDocument.AFTER
        )
        if updated_book and "_id" in updated_book:
            updated_book["_id"] = str(updated_book["_id"])
    else:
        if not _mock_storage:
            init_mock_storage()
        books = _mock_storage.get("books", [])
        target_book = next((b for b in books if b["book_id"] == book_id), None)
        if target_book:
            target_book["available_copies"] = min(target_book["total_copies"], target_book["available_copies"] + 1)
            updated_book = dict(target_book)
        else:
            updated_book = None

    ms = (time.time() - t0) * 1000
    q_rec = log_database_query(
        database="MongoDB",
        operation="find_one_and_update",
        query_text=query_display,
        params={"book_id": book_id},
        execution_ms=ms,
        purpose="Atomic return copy increment",
        records_affected=1 if updated_book else 0
    )
    return bool(updated_book), updated_book, "Book copy incremented atomically.", q_rec.to_dict()

def execute_mongo_insert(collection_name: str, document: dict, purpose: str = "") -> tuple[bool, dict]:
    t0 = time.time()
    db = get_db()
    query_display = f"db.{collection_name}.insertOne({json.dumps(document, default=str)})"

    if db is not None:
        res = db[collection_name].insert_one(document)
        document["_id"] = str(res.inserted_id)
    else:
        if not _mock_storage:
            init_mock_storage()
        _mock_storage.setdefault(collection_name, []).append(document)

    ms = (time.time() - t0) * 1000
    q_rec = log_database_query(
        database="MongoDB",
        operation="insert_one",
        query_text=query_display,
        params={"collection": collection_name},
        execution_ms=ms,
        purpose=purpose or f"Document insert into '{collection_name}'",
        records_affected=1
    )
    return True, q_rec.to_dict()

def execute_mongo_update(collection_name: str, filter_doc: dict, update_doc: dict, purpose: str = "") -> tuple[int, dict]:
    t0 = time.time()
    db = get_db()
    query_display = f"db.{collection_name}.updateOne({json.dumps(filter_doc, default=str)}, {json.dumps(update_doc, default=str)})"
    modified = 0

    if db is not None:
        res = db[collection_name].update_one(filter_doc, update_doc)
        modified = res.modified_count
    else:
        if not _mock_storage:
            init_mock_storage()
        items = _mock_storage.get(collection_name, [])
        for doc in items:
            if all(doc.get(k) == v for k, v in filter_doc.items()):
                if "$set" in update_doc:
                    doc.update(update_doc["$set"])
                if "$inc" in update_doc:
                    for ik, iv in update_doc["$inc"].items():
                        doc[ik] = doc.get(ik, 0) + iv
                modified = 1
                break

    ms = (time.time() - t0) * 1000
    q_rec = log_database_query(
        database="MongoDB",
        operation="update_one",
        query_text=query_display,
        params={"filter": filter_doc, "update": update_doc},
        execution_ms=ms,
        purpose=purpose or f"Document update in '{collection_name}'",
        records_affected=modified
    )
    return modified, q_rec.to_dict()

def execute_mongo_delete(collection_name: str, filter_doc: dict, purpose: str = "") -> tuple[int, dict]:
    t0 = time.time()
    db = get_db()
    query_display = f"db.{collection_name}.deleteOne({json.dumps(filter_doc, default=str)})"
    deleted = 0

    if db is not None:
        res = db[collection_name].delete_one(filter_doc)
        deleted = res.deleted_count
    else:
        if not _mock_storage:
            init_mock_storage()
        items = _mock_storage.get(collection_name, [])
        orig_len = len(items)
        _mock_storage[collection_name] = [
            d for d in items if not all(d.get(k) == v for k, v in filter_doc.items())
        ]
        deleted = orig_len - len(_mock_storage[collection_name])

    ms = (time.time() - t0) * 1000
    q_rec = log_database_query(
        database="MongoDB",
        operation="delete_one",
        query_text=query_display,
        params={"filter": filter_doc},
        execution_ms=ms,
        purpose=purpose or f"Document delete from '{collection_name}'",
        records_affected=deleted
    )
    return deleted, q_rec.to_dict()
