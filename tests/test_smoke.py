"""
Smoke test suite for Library Management System
Tests:
1. Checkout and return atomicity (available_copies never negative)
2. Overdue fine calculation (Rs 2/day)
3. Recommendation query returning results
"""

import pytest
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.services import books_service, loans_service, recommendations_service
from backend.app.utils.fines import compute_fine_for_due_date, is_blocked_by_fines
from backend.app.utils.dates import add_days, now_utc

def test_fine_calculation():
    # 5 days overdue at Rs 2/day should equal Rs 10.0
    due_date = add_days(now_utc(), -5).strftime("%Y-%m-%dT%H:%M:%SZ")
    fine = compute_fine_for_due_date(due_date)
    assert fine == 10.0, f"Expected fine 10.0, got {fine}"

    # On-time return should have fine 0.0
    due_future = add_days(now_utc(), 3).strftime("%Y-%m-%dT%H:%M:%SZ")
    fine_zero = compute_fine_for_due_date(due_future)
    assert fine_zero == 0.0, f"Expected fine 0.0, got {fine_zero}"

    # Blocked checkout check
    blocked, msg = is_blocked_by_fines(60.0)
    assert blocked is True
    assert "exceeding" in msg

    not_blocked, _ = is_blocked_by_fines(30.0)
    assert not_blocked is False

def test_checkout_and_return_atomicity():
    # Pick a book with available copies
    books_res = books_service.get_books(available_only=True, limit=5)
    books = books_res["books"]
    assert len(books) > 0, "No books available for testing"
    test_book = books[0]
    initial_copies = test_book["available_copies"]
    book_id = test_book["book_id"]

    # Pick a valid member
    from backend.app.services import members_service
    members_res = members_service.get_members(limit=5)
    member_id = members_res["members"][0]["member_id"]

    # Checkout
    co_res = loans_service.checkout_book(book_id=book_id, member_id=member_id)
    if co_res.get("success"):
        loan = co_res["loan"]
        loan_id = loan["loan_id"]
        
        # Verify available copies decremented
        book_after = books_service.get_book_by_id(book_id)["book"]
        assert book_after["available_copies"] == initial_copies - 1
        assert book_after["available_copies"] >= 0

        # Return book
        ret_res = loans_service.return_book(loan_id=loan_id)
        assert ret_res["success"] is True

        # Verify available copies restored
        book_restored = books_service.get_book_by_id(book_id)["book"]
        assert book_restored["available_copies"] == initial_copies

def test_recommendation_query():
    # Test 'also borrowed' collaborative filtering
    rec_res = recommendations_service.get_also_borrowed_recommendations("B0001", limit=5)
    assert "recommendations" in rec_res
    assert len(rec_res["recommendations"]) > 0
    assert rec_res["query"]["database"] == "Neo4j"
    assert "MATCH" in rec_res["query"]["query_text"]

def test_mongodb_aggregation():
    from backend.app.services import analytics_service
    res = analytics_service.pipeline_1_genre_distribution()
    assert "data" in res
    assert len(res["data"]) > 0
    assert res["query"]["database"] == "MongoDB"
    assert "$unwind" in res["query"]["query_text"]
