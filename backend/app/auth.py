from datetime import datetime, timedelta
from jose import JWTError, jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional
from app.database import  get_db ,Notification, User
from sqlalchemy.orm import Session




# ====================== CONFIG ======================
SECRET_KEY = "your-super-secret-key-change-this-in-production-2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Argon2id - Modern secure password hasher
ph = PasswordHasher()

# ====================== JWT ======================
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(email: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(email, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None:
            raise credentials_exception
        return {"email": email, "role": role}
    except JWTError:
        raise credentials_exception


def require_role(allowed_roles: list[str]):
    allowed = {role.strip().lower() for role in allowed_roles if role}
    legacy_view_permissions = {
        "view_transactions",
        "view_analytics",
        "view_posture",
        "view_settings",
        "view_history",
        "view_notifications",
    }

    async def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = (current_user.get("role") or "").strip()
        user_role_key = user_role.lower()

        # Admin always bypasses role restrictions.
        if user_role_key == "admin":
            return current_user

        # Legacy behavior used by the dashboard routers: view-only endpoints
        # were wired with permission-style names such as "view_transactions".
        if allowed & legacy_view_permissions and user_role_key in {"analyst", "viewer"}:
            return current_user

        if user_role_key in allowed:
            return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions. Required: {allowed_roles}"
        )

    return role_checker


# ====================== PASSWORD HASHING ======================
def get_password_hash(password: str) -> str:
    """Secure password hashing using Argon2id"""
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    try:
        ph.verify(hashed_password, plain_password)
        return True
    except VerifyMismatchError:
        return False
    
    # WebSocket compatible authentication
async def get_current_user_ws(websocket: WebSocket, db: Session = Depends(get_db)):
    """Simple token extraction for WebSocket connections"""
    token = None
    
    # Try query parameter first (most common for WS)
    token = websocket.query_params.get("token")
    
    # Fallback: try header
    if not token:
        token = websocket.headers.get("authorization")
        if token and token.startswith("Bearer "):
            token = token[7:]

    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return None

    try:
        # Validate JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            await websocket.close(code=4001)
            return None
    except:
        await websocket.close(code=4001, reason="Invalid token")
        return None

    user = db.query(User).filter(User.email == email).first()
    if not user:
        await websocket.close(code=4001, reason="User not found")
        return None

    return {"email": user.email, "organization_id": user.organization_id, "role": user.role}