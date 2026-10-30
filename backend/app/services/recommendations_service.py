from backend.app.db.neo4j_client import run_cypher_query

def get_also_borrowed_recommendations(book_id: str, limit: int = 6) -> dict:
    """
    Cypher Feature 1: Collaborative Filtering
    Finds books borrowed by readers who also borrowed the given book, ranked by frequency.
    """
    cypher = """
    MATCH (b1:Book {book_id: $book_id})<-[:BORROWED]-(m:Member)-[:BORROWED]->(b2:Book)
    WHERE b1 <> b2
    RETURN b2.book_id AS book_id,
           b2.title AS title,
           b2.year AS year,
           [(b2)-[:IN_GENRE]->(g:Genre) | g.name] AS genres,
           [(a:Author)-[:WROTE]->(b2) | a.name] AS authors,
           count(DISTINCT m) AS common_readers
    ORDER BY common_readers DESC
    LIMIT $limit
    """
    records, qinfo = run_cypher_query(
        cypher=cypher,
        params={"book_id": book_id, "limit": limit},
        purpose="Collaborative filtering: 'Members who borrowed this book also borrowed...'"
    )
    return {
        "book_id": book_id,
        "recommendations": records,
        "query": qinfo
    }

def get_personalized_member_recommendations(member_id: str, limit: int = 8) -> dict:
    """
    Cypher Feature 2: Personalized Recommendations
    Finds books borrowed by members with overlapping reading history, which this member hasn't borrowed yet.
    """
    cypher = """
    MATCH (m1:Member {member_id: $member_id})-[:BORROWED]->(b:Book)<-[:BORROWED]-(m2:Member)
    WHERE m1 <> m2
    WITH m1, m2, count(DISTINCT b) AS overlap_score
    WHERE overlap_score >= 1
    MATCH (m2)-[:BORROWED]->(rec:Book)
    WHERE NOT (m1)-[:BORROWED]->(rec)
    RETURN rec.book_id AS book_id,
           rec.title AS title,
           rec.year AS year,
           [(rec)-[:IN_GENRE]->(g:Genre) | g.name] AS genres,
           [(a:Author)-[:WROTE]->(rec) | a.name] AS authors,
           sum(overlap_score) AS recommendation_score,
           count(DISTINCT m2) AS peer_count
    ORDER BY recommendation_score DESC, peer_count DESC
    LIMIT $limit
    """
    records, qinfo = run_cypher_query(
        cypher=cypher,
        params={"member_id": member_id, "limit": limit},
        purpose="Personalized collaborative filtering graph traversal for member"
    )
    
    # Enrich with 'why' explanation
    for r in records:
        r["why"] = f"Recommended based on {r.get('peer_count', 1)} readers who share your reading preferences."

    return {
        "member_id": member_id,
        "recommendations": records,
        "query": qinfo
    }

def get_shared_genre_books(book_id: str, limit: int = 6) -> dict:
    """
    Cypher Feature 6: Books sharing 2+ genres with a given book.
    """
    cypher = """
    MATCH (b1:Book {book_id: $book_id})-[:IN_GENRE]->(g:Genre)<-[:IN_GENRE]-(b2:Book)
    WHERE b1 <> b2
    WITH b2, count(DISTINCT g) AS shared_genres_count, collect(g.name) AS shared_genres
    WHERE shared_genres_count >= 1
    RETURN b2.book_id AS book_id,
           b2.title AS title,
           b2.year AS year,
           shared_genres_count,
           shared_genres,
           [(a:Author)-[:WROTE]->(b2) | a.name] AS authors
    ORDER BY shared_genres_count DESC
    LIMIT $limit
    """
    records, qinfo = run_cypher_query(
        cypher=cypher,
        params={"book_id": book_id, "limit": limit},
        purpose="Find books sharing genre nodes with a target book"
    )
    return {
        "book_id": book_id,
        "similar_books": records,
        "query": qinfo
    }

def get_more_by_author(book_id: str, limit: int = 4) -> dict:
    cypher = """
    MATCH (b1:Book {book_id: $book_id})<-[:WROTE]-(a:Author)-[:WROTE]->(b2:Book)
    WHERE b1 <> b2
    RETURN b2.book_id AS book_id,
           b2.title AS title,
           b2.year AS year,
           a.name AS author_name,
           [(b2)-[:IN_GENRE]->(g:Genre) | g.name] AS genres
    LIMIT $limit
    """
    records, qinfo = run_cypher_query(
        cypher=cypher,
        params={"book_id": book_id, "limit": limit},
        purpose="Find other titles written by the same author node"
    )
    return {
        "book_id": book_id,
        "author_books": records,
        "query": qinfo
    }

def get_genre_popularity_ranking() -> dict:
    """
    Cypher Feature 7: Genre popularity by borrow count.
    """
    cypher = """
    MATCH (g:Genre)<-[:IN_GENRE]-(b:Book)<-[:BORROWED]-(m:Member)
    RETURN g.name AS genre, count(b) AS borrow_count
    ORDER BY borrow_count DESC
    LIMIT 12
    """
    records, qinfo = run_cypher_query(
        cypher=cypher,
        purpose="Calculate genre popularity by traversing (:Genre)<-[:IN_GENRE]-(:Book)<-[:BORROWED]-"
    )
    return {
        "genres": records,
        "query": qinfo
    }
