from backend.app.db.neo4j_client import run_cypher_query
from backend.app.db.mongo_client import execute_mongo_find

def find_shortest_path_between_authors(author1_id: str, author2_id: str) -> dict:
    """
    Cypher Feature 5: Shortest path between two authors via shortestPath
    Traverses the collaborative network: (Author)-[:WROTE]->(Book)<-[:WROTE]-(Author)
    """
    cypher = """
    MATCH (a1:Author {author_id: $author1_id}), (a2:Author {author_id: $author2_id})
    MATCH p = shortestPath((a1)-[*]-(a2))
    RETURN [n IN nodes(p) | {
        id: CASE
            WHEN 'Author' IN labels(n) THEN n.author_id
            WHEN 'Book' IN labels(n) THEN n.book_id
            ELSE n.name
        END,
        type: labels(n)[0],
        name: CASE
            WHEN 'Author' IN labels(n) THEN n.name
            WHEN 'Book' IN labels(n) THEN n.title
            ELSE n.name
        END
    }] AS path_nodes,
    length(p) AS hops
    """
    records, qinfo = run_cypher_query(
        cypher=cypher,
        params={"author1_id": author1_id, "author2_id": author2_id},
        purpose="Find shortest path between two author nodes in the graph"
    )

    path_nodes = records[0]["path_nodes"] if records else []
    hops = records[0]["hops"] if records else 0

    return {
        "author1_id": author1_id,
        "author2_id": author2_id,
        "hops": hops,
        "path_nodes": path_nodes,
        "found": len(path_nodes) > 0,
        "query": qinfo
    }

def get_graph_network_data(view_type: str = "authors", max_nodes: int = 80) -> dict:
    """
    Generates node & edge data for interactive front-end visualizers (Vis Network / D3).
    view_type options: 'authors', 'genres', 'books'
    """
    nodes = []
    edges = []
    node_ids = set()

    def add_node(nid, label, group, title=None, val=1):
        if nid not in node_ids:
            node_ids.add(nid)
            nodes.append({
                "id": nid,
                "label": label[:22] + "..." if len(label) > 22 else label,
                "full_label": label,
                "group": group,
                "title": title or label,
                "value": val
            })

    def add_edge(source, target, label="", weight=1):
        edges.append({
            "from": source,
            "to": target,
            "label": label,
            "weight": weight
        })

    if view_type == "authors":
        # Author to Book network
        cypher = """
        MATCH (a:Author)-[:WROTE]->(b:Book)
        RETURN a.author_id AS author_id, a.name AS author_name, b.book_id AS book_id, b.title AS title
        LIMIT $limit
        """
        records, qinfo = run_cypher_query(cypher, {"limit": max_nodes}, purpose="Fetch Author-Book bipartite subgraph")
        for r in records:
            add_node(r["author_id"], r["author_name"], "author", val=3)
            add_node(r["book_id"], r["title"], "book", val=2)
            add_edge(r["author_id"], r["book_id"], "WROTE")

    elif view_type == "genres":
        # Book to Genre network
        cypher = """
        MATCH (b:Book)-[:IN_GENRE]->(g:Genre)
        RETURN b.book_id AS book_id, b.title AS title, g.name AS genre_name
        LIMIT $limit
        """
        records, qinfo = run_cypher_query(cypher, {"limit": max_nodes}, purpose="Fetch Book-Genre cluster subgraph")
        for r in records:
            add_node(r["genre_name"], r["genre_name"], "genre", val=5)
            add_node(r["book_id"], r["title"], "book", val=2)
            add_edge(r["book_id"], r["genre_name"], "IN_GENRE")

    else:
        # Full book neighborhood with readers
        cypher = """
        MATCH (m:Member)-[r:BORROWED]->(b:Book)
        RETURN m.member_id AS member_id, m.name AS member_name, b.book_id AS book_id, b.title AS title
        LIMIT $limit
        """
        records, qinfo = run_cypher_query(cypher, {"limit": max_nodes}, purpose="Fetch Member-Book borrow network")
        for r in records:
            add_node(r["member_id"], r["member_name"], "member", val=2)
            add_node(r["book_id"], r["title"], "book", val=3)
            add_edge(r["member_id"], r["book_id"], "BORROWED")

    return {
        "nodes": nodes,
        "edges": edges,
        "total_nodes": len(nodes),
        "total_edges": len(edges),
        "query": qinfo
    }

def get_most_connected_authors(limit: int = 10) -> dict:
    """
    Cypher Feature 4: Most connected authors in the library catalog.
    """
    cypher = """
    MATCH (a:Author)-[:WROTE]->(b:Book)
    RETURN a.author_id AS author_id, a.name AS name, count(b) AS books_count
    ORDER BY books_count DESC
    LIMIT $limit
    """
    records, qinfo = run_cypher_query(
        cypher=cypher,
        params={"limit": limit},
        purpose="Calculate degree centrality for author nodes"
    )
    return {
        "authors": records,
        "query": qinfo
    }
