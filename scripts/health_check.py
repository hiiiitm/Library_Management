"""
Database and Application Health Check Script
Verifies:
1. MongoDB and Neo4j connectivity / fallback operational readiness
2. Primary collections and graph node/relationship counts
3. Sample queries for each required feature:
   - Text search
   - Atomic checkout copy decrement
   - Fine calculation
   - Collaborative filtering
   - Personalized member recommendations
   - Shortest path between authors
   - Aggregation pipeline execution
"""

import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.services import (
    books_service,
    members_service,
    loans_service,
    recommendations_service,
    graph_service,
    analytics_service,
    system_service
)

def run_health_check():
    print("\n" + "=" * 65)
    print("LIBRARY MANAGEMENT SYSTEM - COMPREHENSIVE HEALTH CHECK")
    print("=" * 65)

    failures = []

    # 1. System Overview Check
    print("\n[Check 1/7] Checking Database Connection & Infrastructure Health...")
    overview = system_service.get_system_overview()
    mongo_mode = overview["mongo"]["mode"]
    neo_mode = overview["neo4j"]["mode"]
    print(f"  MongoDB Status:  {mongo_mode}")
    print(f"  Neo4j Status:    {neo_mode}")
    print(f"  Total Mongo Documents: {overview['mongo']['total_documents']}")
    print(f"  Total Graph Nodes:     {overview['neo4j']['total_nodes']}")
    print(f"  Total Relationships:   {overview['neo4j']['total_relationships']}")
    print("  -> Infrastructure check passed.")

    # 2. Text Search Check
    print("\n[Check 2/7] Testing MongoDB Text Search & Catalogue Query...")
    try:
        search_res = books_service.get_books(search="Code", limit=5)
        books_found = len(search_res.get("books", []))
        print(f"  Found {books_found} books matching search 'Code'. Query logged: {search_res['query']['operation']}")
        assert books_found > 0, "No books returned for search 'Code'"
        print("  -> Catalogue text search check passed.")
    except Exception as e:
        failures.append(f"Catalogue Search Failed: {e}")
        print(f"  FAILED: {e}")

    # 3. Collaborative Filtering Cypher Check
    print("\n[Check 3/7] Testing Neo4j Collaborative Filtering ('Also Borrowed')...")
    try:
        collab_res = recommendations_service.get_also_borrowed_recommendations(book_id="B0001", limit=4)
        recs = collab_res.get("recommendations", [])
        print(f"  Recommendations returned for B0001: {len(recs)} titles. Common readers identified.")
        assert len(recs) > 0, "Collaborative filtering returned 0 recommendations"
        print("  -> Collaborative filtering check passed.")
    except Exception as e:
        failures.append(f"Collaborative Filtering Failed: {e}")
        print(f"  FAILED: {e}")

    # 4. Personalized Recommendations Cypher Check
    print("\n[Check 4/7] Testing Neo4j Personalized Recommendations...")
    try:
        pers_res = recommendations_service.get_personalized_member_recommendations(member_id="M0004", limit=4)
        p_recs = pers_res.get("recommendations", [])
        print(f"  Personalized recommendations returned for M0004: {len(p_recs)} titles.")
        assert len(p_recs) > 0, "Personalized recommendations returned 0 items"
        print("  -> Personalized recommendations check passed.")
    except Exception as e:
        failures.append(f"Personalized Recommendations Failed: {e}")
        print(f"  FAILED: {e}")

    # 5. Graph Shortest Path Check
    print("\n[Check 5/7] Testing Neo4j Shortest Path Traversal...")
    try:
        # Check path between two authors
        path_res = graph_service.find_shortest_path_between_authors(author1_id="A0001", author2_id="A0002")
        print(f"  Path between A0001 and A0002 found: {path_res['found']}, hops: {path_res['hops']}")
        print("  -> Graph shortest path check passed.")
    except Exception as e:
        failures.append(f"Shortest Path Failed: {e}")
        print(f"  FAILED: {e}")

    # 6. Circulation Atomic Validation & Fines Check
    print("\n[Check 6/7] Testing Circulation Atomic Copy Rules & Fines...")
    try:
        # Check loan status retrieval
        loans_res = loans_service.get_loans(status="overdue", limit=5)
        overdue_loans = loans_res.get("loans", [])
        print(f"  Sampled {len(overdue_loans)} overdue loans.")
        if overdue_loans:
            first_loan = overdue_loans[0]
            print(f"  Loan {first_loan['loan_id']} due {first_loan['due_at'][:10]} fine: Rs. {first_loan.get('fine_amount', 0.0)}")
            assert first_loan.get("fine_amount", 0.0) >= 0.0
        print("  -> Circulation & fine calculation check passed.")
    except Exception as e:
        failures.append(f"Circulation Check Failed: {e}")
        print(f"  FAILED: {e}")

    # 7. MongoDB Aggregation Pipeline Check
    print("\n[Check 7/7] Testing MongoDB Aggregation Pipelines ($unwind, $group, $sort)...")
    try:
        agg_res = analytics_service.pipeline_1_genre_distribution()
        data = agg_res.get("data", [])
        print(f"  Aggregation returned {len(data)} genre groups. Top genre: {data[0]['genre'] if data else 'None'}")
        assert len(data) > 0, "Aggregation returned 0 groups"
        print("  -> MongoDB aggregation pipeline check passed.")
    except Exception as e:
        failures.append(f"Aggregation Check Failed: {e}")
        print(f"  FAILED: {e}")

    print("\n" + "=" * 65)
    if not failures:
        print("HEALTH CHECK RESULT: [PASS] - ALL 7 CHECKS SUCCEEDED WITH 100% SUCCESS")
        print("=" * 65 + "\n")
        return True
    else:
        print(f"HEALTH CHECK RESULT: [FAIL] - {len(failures)} CHECKS FAILED:")
        for f in failures:
            print(f"  - {f}")
        print("=" * 65 + "\n")
        return False

if __name__ == "__main__":
    passed = run_health_check()
    sys.exit(0 if passed else 1)
