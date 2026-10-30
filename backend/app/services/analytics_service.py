from backend.app.db.mongo_client import execute_mongo_aggregate, execute_mongo_find

def get_dashboard_kpis() -> dict:
    """Calculates KPI cards for Dashboard."""
    books, b_q = execute_mongo_find("books", limit=500)
    members, m_q = execute_mongo_find("members", limit=500)
    loans, l_q = execute_mongo_find("loans", limit=3000)

    total_books = len(books)
    total_copies = sum(b.get("total_copies", 0) for b in books)
    available_copies = sum(b.get("available_copies", 0) for b in books)
    
    active_loans = [l for l in loans if l.get("status") == "active"]
    overdue_loans = [l for l in loans if l.get("status") == "overdue"]
    total_members = len(members)
    
    total_fines_due = sum(l.get("fine_amount", 0.0) for l in overdue_loans)
    total_fines_collected = sum(l.get("fine_amount", 0.0) for l in loans if l.get("status") == "returned" and l.get("fine_amount", 0.0) > 0)

    return {
        "total_books": total_books,
        "total_copies": total_copies,
        "available_copies": available_copies,
        "active_loans": len(active_loans),
        "overdue_loans": len(overdue_loans),
        "total_members": total_members,
        "total_fines_due": round(total_fines_due, 2),
        "total_fines_collected": round(total_fines_collected, 2),
        "queries": [b_q, m_q, l_q]
    }

def pipeline_1_genre_distribution() -> dict:
    """
    MongoDB Aggregation Pipeline 1:
    Uses $unwind, $group, and $sort to calculate genre catalog holdings and average rating.
    """
    pipeline = [
        {"$unwind": "$genres"},
        {
            "$group": {
                "_id": "$genres",
                "total_titles": {"$sum": 1},
                "total_copies": {"$sum": "$total_copies"},
                "avg_rating": {"$avg": "$avg_rating"}
            }
        },
        {"$sort": {"total_titles": -1}},
        {"$limit": 12}
    ]
    results, qinfo = execute_mongo_aggregate(
        collection_name="books",
        pipeline=pipeline,
        purpose="MongoDB Aggregation: $unwind + $group + $sort on genres"
    )
    # Format for chart
    chart_data = [
        {
            "genre": r["_id"],
            "titles": r["total_titles"],
            "copies": r.get("total_copies", r["total_titles"] * 5),
            "avg_rating": round(r.get("avg_rating", 4.0), 2)
        }
        for r in results
    ]
    return {
        "pipeline_name": "Genre Distribution & Rating Analysis",
        "operators": ["$unwind", "$group", "$sort", "$limit"],
        "data": chart_data,
        "query": qinfo
    }

def pipeline_2_monthly_loan_trends() -> dict:
    """
    MongoDB Aggregation Pipeline 2:
    Uses $dateToString (or substr), $group, and $sort to group loans by issuance month.
    """
    pipeline = [
        {
            "$group": {
                "_id": {"$substr": ["$issued_at", 0, 7]},  # "YYYY-MM"
                "total_loans": {"$sum": 1},
                "fines_accrued": {"$sum": "$fine_amount"}
            }
        },
        {"$sort": {"_id": 1}},
        {"$limit": 12}
    ]
    results, qinfo = execute_mongo_aggregate(
        collection_name="loans",
        pipeline=pipeline,
        purpose="MongoDB Aggregation: Monthly loan volume via string/date operator and $group"
    )
    chart_data = [
        {
            "month": r["_id"],
            "loans": r["total_loans"],
            "fines": round(r.get("fines_accrued", 0.0), 2)
        }
        for r in results
    ]
    return {
        "pipeline_name": "Monthly Loan Volume & Trends",
        "operators": ["$substr / $dateToString", "$group", "$sort"],
        "data": chart_data,
        "query": qinfo
    }

def pipeline_3_book_page_buckets() -> dict:
    """
    MongoDB Aggregation Pipeline 3:
    Uses $bucket to segment books into length categories (Short, Medium, Long, Epic).
    """
    pipeline = [
        {
            "$bucket": {
                "groupBy": "$pages",
                "boundaries": [0, 200, 400, 600, 1500],
                "default": "Other",
                "output": {
                    "count": {"$sum": 1},
                    "avg_rating": {"$avg": "$avg_rating"}
                }
            }
        }
    ]
    results, qinfo = execute_mongo_aggregate(
        collection_name="books",
        pipeline=pipeline,
        purpose="MongoDB Aggregation: $bucket by page length boundaries"
    )
    labels = {
        0: "Quick Read (< 200 pages)",
        200: "Standard (200 - 399 pages)",
        400: "Extensive (400 - 599 pages)",
        600: "Epic (600+ pages)"
    }
    chart_data = []
    for r in results:
        gid = r["_id"]
        chart_data.append({
            "category": labels.get(gid, str(gid)),
            "books_count": r.get("count", 0),
            "avg_rating": round(r.get("avg_rating", 0.0), 2)
        })
    return {
        "pipeline_name": "Book Length / Page Count Bucketing",
        "operators": ["$bucket", "$sum", "$avg"],
        "data": chart_data,
        "query": qinfo
    }

def pipeline_4_publisher_market_share() -> dict:
    """
    MongoDB Aggregation Pipeline 4:
    Groups by publisher to identify top publishing houses by catalog holdings and ratings.
    """
    pipeline = [
        {
            "$group": {
                "_id": "$publisher",
                "titles": {"$sum": 1},
                "total_inventory": {"$sum": "$total_copies"},
                "avg_rating": {"$avg": "$avg_rating"}
            }
        },
        {"$sort": {"titles": -1}},
        {"$limit": 10}
    ]
    results, qinfo = execute_mongo_aggregate(
        collection_name="books",
        pipeline=pipeline,
        purpose="MongoDB Aggregation: $group by publisher with inventory sum and rating average"
    )
    chart_data = [
        {
            "publisher": r["_id"],
            "titles": r["titles"],
            "inventory": r.get("total_inventory", r["titles"] * 5),
            "avg_rating": round(r.get("avg_rating", 0.0), 2)
        }
        for r in results
    ]
    return {
        "pipeline_name": "Publisher Market Share & Inventory",
        "operators": ["$group", "$sum", "$avg", "$sort"],
        "data": chart_data,
        "query": qinfo
    }

def pipeline_5_overdue_fines_by_status() -> dict:
    """
    MongoDB Aggregation Pipeline 5:
    Uses $match, $group on loan status to analyze fine exposure.
    """
    pipeline = [
        {
            "$group": {
                "_id": "$status",
                "total_loans": {"$sum": 1},
                "total_fines": {"$sum": "$fine_amount"},
                "avg_renewals": {"$avg": "$renewals"}
            }
        },
        {"$sort": {"total_fines": -1}}
    ]
    results, qinfo = execute_mongo_aggregate(
        collection_name="loans",
        pipeline=pipeline,
        purpose="MongoDB Aggregation: $group on loan status with fine totals and renewal metrics"
    )
    chart_data = [
        {
            "status": r["_id"].capitalize(),
            "loans": r["total_loans"],
            "fines": round(r.get("total_fines", 0.0), 2),
            "avg_renewals": round(r.get("avg_renewals", 0.0), 1)
        }
        for r in results
    ]
    return {
        "pipeline_name": "Circulation Status & Fine Analysis",
        "operators": ["$group", "$sum", "$avg", "$sort"],
        "data": chart_data,
        "query": qinfo
    }

def pipeline_6_multi_faceted_inventory() -> dict:
    """
    MongoDB Aggregation Pipeline 6:
    Uses $facet to run multi-pipeline sub-queries simultaneously across the books collection.
    """
    pipeline = [
        {
            "$facet": {
                "top_rated": [
                    {"$match": {"ratings_count": {"$gte": 2}}},
                    {"$sort": {"avg_rating": -1}},
                    {"$limit": 5},
                    {"$project": {"title": 1, "avg_rating": 1, "ratings_count": 1}}
                ],
                "availability_overview": [
                    {
                        "$group": {
                            "_id": None,
                            "total_titles": {"$sum": 1},
                            "total_copies": {"$sum": "$total_copies"},
                            "available_copies": {"$sum": "$available_copies"}
                        }
                    }
                ],
                "by_language": [
                    {"$group": {"_id": "$language", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}}
                ]
            }
        }
    ]
    results, qinfo = execute_mongo_aggregate(
        collection_name="books",
        pipeline=pipeline,
        purpose="MongoDB Aggregation: Multi-faceted analytics using $facet"
    )
    facet_obj = results[0] if results else {}
    return {
        "pipeline_name": "Multi-Faceted Catalog Overview ($facet)",
        "operators": ["$facet", "$match", "$sort", "$limit", "$group", "$project"],
        "top_rated": facet_obj.get("top_rated", []),
        "availability_overview": facet_obj.get("availability_overview", []),
        "by_language": facet_obj.get("by_language", []),
        "query": qinfo
    }
