from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from backend.app.services import members_service

router = APIRouter(prefix="/api/members", tags=["Members"])

@router.get("")
def list_members(
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(50)
):
    return members_service.get_members(
        search=search,
        role=role,
        status=status,
        skip=skip,
        limit=limit
    )

@router.get("/{member_id}")
def get_member(member_id: str):
    res = members_service.get_member_by_id(member_id)
    if not res.get("member"):
        raise HTTPException(status_code=404, detail="Member not found")
    return res

@router.post("")
def create_member(member_data: dict):
    return members_service.create_member(member_data)

@router.put("/{member_id}")
def update_member(member_id: str, fields: dict):
    return members_service.update_member(member_id, fields)
