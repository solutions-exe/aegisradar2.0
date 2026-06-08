from ast import Return
import token

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sympy import python



from app.auth import create_access_token, get_password_hash, verify_password
from app.database import Organization, User, get_db

router = APIRouter()

ph = PasswordHasher()

class LoginRequest(BaseModel):
    email: str
    password: str


python

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str = "Analyst"
    organization_id: Optional[int] = None   # Optional for now






class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str
    name: str
    organization_id: int | None = None


def normalize_role(role: str) -> str:
    normalized = (role or "Analyst").strip().lower()
    if normalized == "admin":
        return "Admin"
    if normalized == "viewer":
        return "Viewer"
    return "Analyst"


@router.post("/auth/login", response_model=AuthResponse)
async def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not ph.verify(user.password_hash, payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(
        {"sub": user.email, "role": user.role, "organization_id": user.organization_id}
    )

    return AuthResponse(
        access_token=token,
        role=user.role,
        email=user.email,
        name=user.name or user.email.split("@", 1)[0],
        organization_id=user.organization_id,
    )


@router.post("/auth/register")
async def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register new user with secure Argon2id hashing"""
    
    # Check if email already exists
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password using Argon2id (no need for manual truncation)
    try:
        password_hash = ph.hash(payload.password)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Password hashing failed")

    new_user = User(
        name=payload.name,
        email=payload.email,
        password_hash=password_hash,
        role=payload.role or "Analyst",
        status="Active",
        organization_id=payload.organization_id  # Change this logic later for proper multi-tenant

    )
    

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(
        {"sub": new_user.email, "role": new_user.role, "organization_id": new_user.organization_id}
    )

    return AuthResponse(
        access_token=token,
        role=new_user.role,
        email=new_user.email,
        name=new_user.name,
        organization_id=new_user.organization_id,
          )
    