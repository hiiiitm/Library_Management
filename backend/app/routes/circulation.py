from fastapi import APIRouter, Query, HTTPException, Body
from typing import Optional
from backend.app.services import loans_service, reservations_service, reviews_service

router = APIRouter(prefix="/api/circulation", tags=["Circulation"])

@router.get("/loans")
def list_loans(
    member_id: Optional[str] = Query(None),
    book_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(50)
):
    return loans_service.get_loans(
        member_id=member_id,
        book_id=book_id,
        status=status,
        skip=skip,
        limit=limit
    )

@router.post("/checkout")
def checkout_book(payload: dict = Body(...)):
    book_id = payload.get("book_id")
    member_id = payload.get("member_id")
    if not book_id or not member_id:
        raise HTTPException(status_code=400, detail="book_id and member_id are required")
    res = loans_service.checkout_book(book_id=book_id, member_id=member_id)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/return")
def return_book(payload: dict = Body(...)):
    loan_id = payload.get("loan_id")
    if not loan_id:
        raise HTTPException(status_code=400, detail="loan_id is required")
    res = loans_service.return_book(loan_id=loan_id)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/renew")
def renew_loan(payload: dict = Body(...)):
    loan_id = payload.get("loan_id")
    if not loan_id:
        raise HTTPException(status_code=400, detail="loan_id is required")
    res = loans_service.renew_loan(loan_id=loan_id)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/pay-fine")
def pay_fine(payload: dict = Body(...)):
    loan_id = payload.get("loan_id")
    if not loan_id:
        raise HTTPException(status_code=400, detail="loan_id is required")
    res = loans_service.pay_fine(loan_id=loan_id)
    return res

# Reservations
@router.get("/reservations")
def list_reservations(
    book_id: Optional[str] = Query(None),
    member_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    return reservations_service.get_reservations(book_id=book_id, member_id=member_id, status=status)

@router.post("/reservations")
def create_reservation(payload: dict = Body(...)):
    book_id = payload.get("book_id")
    member_id = payload.get("member_id")
    return reservations_service.create_reservation(book_id=book_id, member_id=member_id)

@router.delete("/reservations/{reservation_id}")
def cancel_reservation(reservation_id: str):
    return reservations_service.cancel_reservation(reservation_id=reservation_id)

# Reviews
@router.post("/reviews")
def add_review(payload: dict = Body(...)):
    book_id = payload.get("book_id")
    member_id = payload.get("member_id")
    rating = int(payload.get("rating", 5))
    comment = payload.get("comment", "")
    return reviews_service.add_review(book_id, member_id, rating, comment)
