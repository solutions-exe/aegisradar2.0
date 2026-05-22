from fastapi import APIRouter, HTTPException
from app.models.auth import UserCreate, UserLogin, Token
from backend.app.core.auth import get_password_hash, verify_password, create_access_token, fake_users_db

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register")
async def register(user: UserCreate):
    if user.username in fake_users_db:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    fake_users_db[user.username] = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password,
        "role": user.role
    }
    
    return {"message": "User registered successfully", "role": user.role}

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    db_user = fake_users_db.get(user.username)
    if not db_user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    if not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = create_access_token(
        data={"sub": user.username, "role": db_user["role"]}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": db_user["role"]
    }
