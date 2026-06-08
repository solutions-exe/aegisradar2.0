from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db, Transaction, User
from app.auth import get_current_user, require_role

router = APIRouter()

# ====================== Response Models (matches frontend) ======================

class TransactionResponse(BaseModel):
    id: str
    time: str
    txId: str
    customerId: Optional[str] = None
    merchant: str
    amount: float
    country: Optional[str] = "EG"
    device: Optional[str] = "Desktop"
    riskScore: float
    riskLevel: str
    status: str
    ip: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    cardLast4: Optional[str] = None
    notes: Optional[str] = None


class HistoryResponse(BaseModel):
    transactions: List[TransactionResponse]
    total: int
    fraud_count: int
    review_count: int
    total_amount: float


# ====================== Protected Endpoints ======================

@router.get("/history", response_model=HistoryResponse)
async def get_history(
    current_user: dict = Depends(require_role(["view_transactions"])),  # Viewer and above allowed
    db: Session = Depends(get_db),
    limit: int = Query(500, le=1000),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None, regex="^(FRAUD|NORMAL|REVIEW)?$"),
    risk_min: Optional[float] = Query(None, ge=0, le=1),
):
    """Get transaction history with filters - protected"""

    user = db.query(User).filter(User.email == current_user["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    query = db.query(Transaction).filter(Transaction.organization_id == user.organization_id)

    # Apply filters
    if status:
        query = query.filter(Transaction.status == status)
    if risk_min is not None:
        query = query.filter(Transaction.risk_score >= risk_min)

    total = query.count()
    fraud_count = query.filter(Transaction.is_fraud == True).count()
    review_count = query.filter(Transaction.status == "REVIEW").count()
    total_amount = query.with_entities(func.sum(Transaction.amount)).scalar() or 0.0

    # Get paginated results
    transactions = query.order_by(desc(Transaction.created_at))\
                        .offset(offset).limit(limit).all()

    return {
        "transactions": [
            TransactionResponse(
                id=str(t.id),
                time=t.created_at.isoformat(),
                txId=t.tx_id,
                customerId=None,  # Can be expanded later
                merchant=t.merchant,
                amount=float(t.amount),
                country="EG",
                device="Mobile",  # Can be expanded
                riskScore=float(t.risk_score),
                riskLevel="HIGH" if t.risk_score > 0.75 else "MEDIUM" if t.risk_score > 0.45 else "LOW",
                status=t.status,
                ip=None,
                email=None,
                phone=None,
                cardLast4=None,
                notes=None
            ) for t in transactions
        ],
        "total": total,
        "fraud_count": fraud_count,
        "review_count": review_count,
        "total_amount": float(total_amount)
    }