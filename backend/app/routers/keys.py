from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import secrets
from datetime import datetime
from app.database import User, get_db, ApiKey, Organization
from app.auth import get_current_user, require_role

router = APIRouter()

class ApiKeyResponse(BaseModel):
    id: int
    key_name: str
    api_key: str
    is_active: bool
    created_at: datetime
    last_used_at: datetime | None

class CreateApiKeyRequest(BaseModel):
    key_name: str

# Generate secure API key
def generate_api_key() -> str:
    return "ak_" + secrets.token_urlsafe(32)

@router.post("/api-keys", response_model=ApiKeyResponse)
async def create_api_key(
    request: CreateApiKeyRequest,
    current_user: dict = Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == current_user["email"]).first()
    if not user:
        raise HTTPException(404, "User not found")

    new_key = ApiKey(
        organization_id=user.organization_id,
        key_name=request.key_name,
        api_key=generate_api_key(),
        is_active=True
    )

    db.add(new_key)
    db.commit()
    db.refresh(new_key)

    return new_key


@router.get("/api-keys", response_model=List[ApiKeyResponse])
async def list_api_keys(
    current_user: dict = Depends(require_role(["view_transactions"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == current_user["email"]).first()
    if not user:
        raise HTTPException(404, "User not found")

    keys = db.query(ApiKey).filter(
        ApiKey.organization_id == user.organization_id
    ).order_by(ApiKey.created_at.desc()).all()

    return keys


@router.delete("/api-keys/{key_id}")
async def revoke_api_key(
    key_id: int,
    current_user: dict = Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == current_user["email"]).first()
    key = db.query(ApiKey).filter(
        ApiKey.id == key_id,
        ApiKey.organization_id == user.organization_id
    ).first()

    if not key:
        raise HTTPException(404, "API Key not found")

    key.is_active = False
    db.commit()

    return {"message": "API Key revoked successfully"}