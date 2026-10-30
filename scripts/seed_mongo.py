"""
MongoDB Seeder Script
Drops existing collections, creates indexes, loads data/raw/*.json, and reports document counts.
Usage:
  python scripts/seed_mongo.py
"""

import json
import os
import sys
from pathlib import Path
from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.config import settings

def seed_mongo():
    raw_dir = Path(__file__).resolve().parent.parent / "data" / "raw"
    if not (raw_dir / "books.json").exists():
        print("Raw dataset not found! Run 'python data/generate_dataset.py' first.")
        sys.exit(1)

    print(f"Connecting to MongoDB at: {settings.MONGO_URI} (DB: {settings.MONGO_DB})...")
    try:
        client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=3000)
        client.admin.command('ping')
    except Exception as e:
        print(f"ERROR: Cannot connect to MongoDB server: {e}")
        print("Please ensure MongoDB Community is running locally ('net start MongoDB') or configure MONGO_URI in .env.")
        sys.exit(1)

    db = client[settings.MONGO_DB]
    collections = ["books", "authors", "members", "loans", "reservations", "reviews", "sync_outbox", "audit_log"]

    print("Dropping existing collections in database...")
    for col in collections:
        db[col].drop()

    # Load and insert raw data
    files_map = {
        "books": "books.json",
        "authors": "authors.json",
        "members": "members.json",
        "loans": "loans.json",
        "reservations": "reservations.json",
        "reviews": "reviews.json"
    }

    counts = {}
    for col_name, filename in files_map.items():
        filepath = raw_dir / filename
        with open(filepath, "r", encoding="utf-8") as f:
            docs = json.load(f)
        if docs:
            db[col_name].insert_many(docs)
            counts[col_name] = len(docs)
        else:
            counts[col_name] = 0

    print("Creating indexes...")
    # Books
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

    # Members
    db.members.create_index([("member_id", ASCENDING)], unique=True)
    db.members.create_index([("email", ASCENDING)], unique=True)

    # Authors
    db.authors.create_index([("author_id", ASCENDING)], unique=True)

    # Loans
    db.loans.create_index([("loan_id", ASCENDING)], unique=True)
    db.loans.create_index([("member_id", ASCENDING), ("status", ASCENDING)])
    db.loans.create_index([("book_id", ASCENDING), ("status", ASCENDING)])
    db.loans.create_index([("due_at", ASCENDING)])

    # Reservations & Reviews
    db.reservations.create_index([("reservation_id", ASCENDING)], unique=True)
    db.reservations.create_index([("book_id", ASCENDING), ("status", ASCENDING)])
    db.reviews.create_index([("review_id", ASCENDING)], unique=True)
    db.reviews.create_index([("book_id", ASCENDING)])

    print("=" * 60)
    print("MONGODB SEEDING COMPLETED SUCCESSFULLY")
    print("=" * 60)
    for k, v in counts.items():
        print(f"  {k:<15} : {v:>5} documents")
    print("=" * 60)

if __name__ == "__main__":
    seed_mongo()
