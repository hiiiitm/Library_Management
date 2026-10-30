"""
Neo4j Graph Database Seeder Script
Idempotently sets up constraints, clears old graph, and loads nodes & edges using UNWIND batches with MERGE.
Usage:
  python scripts/seed_neo4j.py
"""

import json
import os
import sys
from pathlib import Path
from neo4j import GraphDatabase

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.config import settings

def seed_neo4j():
    raw_dir = Path(__file__).resolve().parent.parent / "data" / "raw"
    if not (raw_dir / "books.json").exists():
        print("Raw dataset not found! Run 'python data/generate_dataset.py' first.")
        sys.exit(1)

    print(f"Connecting to Neo4j at: {settings.NEO4J_URI} (DB: {settings.NEO4J_DATABASE})...")
    try:
        driver = GraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
        )
        driver.verify_connectivity()
    except Exception as e:
        print(f"ERROR: Cannot connect to Neo4j database: {e}")
        print("Please ensure Neo4j Desktop or AuraDB is running and credentials in .env are correct.")
        sys.exit(1)

    # Load data
    with open(raw_dir / "books.json", "r", encoding="utf-8") as f:
        books = json.load(f)
    with open(raw_dir / "members.json", "r", encoding="utf-8") as f:
        members = json.load(f)
    with open(raw_dir / "loans.json", "r", encoding="utf-8") as f:
        loans = json.load(f)
    with open(raw_dir / "reviews.json", "r", encoding="utf-8") as f:
        reviews = json.load(f)

    with driver.session(database=settings.NEO4J_DATABASE) as session:
        print("Creating uniqueness constraints...")
        constraints = [
            "CREATE CONSTRAINT book_id_unique IF NOT EXISTS FOR (b:Book) REQUIRE b.book_id IS UNIQUE",
            "CREATE CONSTRAINT author_id_unique IF NOT EXISTS FOR (a:Author) REQUIRE a.author_id IS UNIQUE",
            "CREATE CONSTRAINT genre_name_unique IF NOT EXISTS FOR (g:Genre) REQUIRE g.name IS UNIQUE",
            "CREATE CONSTRAINT publisher_name_unique IF NOT EXISTS FOR (p:Publisher) REQUIRE p.name IS UNIQUE",
            "CREATE CONSTRAINT member_id_unique IF NOT EXISTS FOR (m:Member) REQUIRE m.member_id IS UNIQUE"
        ]
        for c in constraints:
            session.run(c)

        print("Clearing existing graph...")
        session.run("MATCH (n) DETACH DELETE n")

        print(f"Loading {len(members)} Member nodes (with data minimization)...")
        # Unwind batch members
        member_batch = [{"member_id": m["member_id"], "name": m["name"]} for m in members]
        session.run("""
        UNWIND $batch AS m
        MERGE (:Member {member_id: m.member_id, name: m.name})
        """, batch=member_batch)

        print(f"Loading {len(books)} Books, Authors, Genres, and Publishers...")
        # Prepare book items
        book_batch = []
        for b in books:
            book_batch.append({
                "book_id": b["book_id"],
                "title": b["title"],
                "year": b.get("publication_year"),
                "publisher": b.get("publisher", "Independent"),
                "genres": b.get("genres", []),
                "authors": b.get("authors", [])
            })

        session.run("""
        UNWIND $batch AS item
        MERGE (b:Book {book_id: item.book_id})
        SET b.title = item.title, b.year = item.year

        MERGE (p:Publisher {name: item.publisher})
        MERGE (b)-[:PUBLISHED_BY]->(p)

        FOREACH (genre_name IN item.genres |
            MERGE (g:Genre {name: genre_name})
            MERGE (b)-[:IN_GENRE]->(g)
        )

        FOREACH (auth IN item.authors |
            MERGE (a:Author {author_id: auth.author_id})
            ON CREATE SET a.name = auth.name
            MERGE (a)-[:WROTE]->(b)
        )
        """, batch=book_batch)

        print(f"Loading {len(loans)} BORROWED loan relationships...")
        # Batch in chunks of 500
        chunk_size = 500
        for i in range(0, len(loans), chunk_size):
            chunk = [
                {
                    "loan_id": l["loan_id"],
                    "book_id": l["book_id"],
                    "member_id": l["member_id"],
                    "issued_at": l["issued_at"],
                    "returned": l.get("status") == "returned",
                    "status": l.get("status", "active")
                }
                for l in loans[i : i + chunk_size]
            ]
            session.run("""
            UNWIND $batch AS l
            MATCH (m:Member {member_id: l.member_id})
            MATCH (b:Book {book_id: l.book_id})
            MERGE (m)-[r:BORROWED {loan_id: l.loan_id}]->(b)
            SET r.issued_at = l.issued_at, r.returned = l.returned, r.status = l.status
            """, batch=chunk)

        print(f"Loading {len(reviews)} RATED review relationships...")
        rev_batch = [
            {"member_id": r["member_id"], "book_id": r["book_id"], "score": r["rating"]}
            for r in reviews
        ]
        session.run("""
        UNWIND $batch AS r
        MATCH (m:Member {member_id: r.member_id})
        MATCH (b:Book {book_id: r.book_id})
        MERGE (m)-[rel:RATED]->(b)
        SET rel.score = r.score
        """, batch=rev_batch)

        print("Computing SIMILAR_TO relationships between books sharing 2+ genres...")
        session.run("""
        MATCH (b1:Book)-[:IN_GENRE]->(g:Genre)<-[:IN_GENRE]-(b2:Book)
        WHERE id(b1) < id(b2)
        WITH b1, b2, count(g) AS shared_genres
        WHERE shared_genres >= 2
        MERGE (b1)-[s:SIMILAR_TO]-(b2)
        SET s.score = shared_genres
        """)

        # Verification counts
        res_nodes = session.run("MATCH (n) RETURN labels(n)[0] AS label, count(n) AS cnt")
        node_counts = {rec["label"]: rec["cnt"] for rec in res_nodes}
        res_rels = session.run("MATCH ()-[r]->() RETURN type(r) AS rel, count(r) AS cnt")
        rel_counts = {rec["rel"]: rec["cnt"] for rec in res_rels}

    driver.close()

    print("=" * 60)
    print("NEO4J GRAPH SEEDING COMPLETED SUCCESSFULLY")
    print("=" * 60)
    print("Node Counts:")
    for lbl, cnt in node_counts.items():
        print(f"  (:{lbl:<12}) : {cnt:>5}")
    print("\nRelationship Counts:")
    for rel, cnt in rel_counts.items():
        print(f"  [:{rel:<12}] : {cnt:>5}")
    print("=" * 60)

if __name__ == "__main__":
    seed_neo4j()
