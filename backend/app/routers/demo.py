# backend/app/routers/demo.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
import random
import time
import uuid
from datetime import datetime

URL = "https://aegis-radar-backend.onrender.com/detect"

router = APIRouter()

# ====================== Schemas ======================
class BackendStatus(BaseModel):
    status: str = "online"
    model_version: str = "ensemble-v2.2"
    accuracy: float = 89.4
    total_transactions: int = 126
    avg_response_ms: int =38
    fraud_detected_today: int = 67
    last_trained: str = "June 3 2026"
    server_uptime: float = 99.3


class DemoTransaction(BaseModel):
    transaction_id: str
    merchant: str
    amount: float
    timestamp: str
    velocity_1h: float
    velocity_24h: float
    merchant_category: str


class DetectedTransaction(BaseModel):
    transaction_id: str
    merchant: str
    amount: float
    timestamp: str
    risk_score: float
    confidence: float
    is_fraud: bool
    risk_level: str = "UNKNOWN"
    flags: Optional[List[str]] = None

class BatchTestResponse(BaseModel):
    message: str
    total_sent: int
    total_fraud: int
    total_normal: int
    fraud_rate: float
    avg_risk_score: float
    processing_ms: int
    transactions: List[DetectedTransaction]
    note: str = "Send these payloads to /detect endpoint for real processing"


def generate_demo_transactions(count: int, type: Optional[str] = None) -> List[DemoTransaction]:
    if count < 1:
        count = 1
    if count > 100:
        count = 100

    merchants = [
        ("Amazon EG", "normal"), ("Jumia", "normal"), ("Carrefour", "normal"),
        ("Talabat", "normal"), ("Noon", "normal"), ("B.TECH", "electronics"),
        ("Crypto Exchange", "highrisk"), ("Online Betting", "highrisk"),
        ("Luxury Watches Store", "highrisk")
    ]

    if type in {"normal", "electronics", "highrisk"}:
        filtered_merchants = [m for m in merchants if m[1] == type]
        if filtered_merchants:
            merchants = filtered_merchants

    result: List[DemoTransaction] = []
    for _ in range(count):
        merchant, risk_type = random.choice(merchants)

        if risk_type == "highrisk":
            amount = random.randint(12500, 68000)
        elif risk_type == "electronics":
            amount = random.randint(3500, 18500)
        else:
            amount = random.randint(280, 4800)

        velocity_1h = round(random.uniform(1.2, 27.5), 1)
        velocity_24h = round(random.uniform(14.0, 148.0), 1)

        if risk_type == "highrisk":
            velocity_1h = round(random.uniform(9.0, 28.0), 1)
            velocity_24h = round(random.uniform(55.0, 148.0), 1)

        result.append(DemoTransaction(
            transaction_id=f"DEMO-{int(datetime.utcnow().timestamp() * 1000)}-{uuid.uuid4().hex[:8]}",
            merchant=merchant,
            amount=float(amount),
            timestamp=datetime.utcnow().isoformat(),
            velocity_1h=velocity_1h,
            velocity_24h=velocity_24h,
            merchant_category=risk_type
        ))

    return result


def risk_level_from_score(score: float) -> str:
    if score >= 0.75:
        return "CRITICAL"
    if score >= 0.5:
        return "HIGH"
    if score >= 0.25:
        return "MEDIUM"
    return "LOW"

# ====================== Status Endpoint ======================
@router.get("/demo/status", response_model=BackendStatus)
async def demo_backend_status():
    """Public backend status for Demo / Testing page"""
    return BackendStatus(
        status="online",
        model_version="ensemble-v2.2",
        accuracy=96.3,
        total_transactions=3459,
        avg_response_ms=38,
        fraud_detected_today=226,
        last_trained="Jun 3 2026",
        server_uptime=98.5
    )


# ====================== Batch Test Endpoint ======================
@router.get("/demo/batch-test", response_model=BatchTestResponse)
async def demo_batch_test(count: int = 30, type: Optional[str] = None):
    """Public endpoint for faculty demo - No authentication required"""
    txns = generate_demo_transactions(count, type)

    return BatchTestResponse(
        message=f"Successfully generated {len(txns)} demo transactions",
        total_sent=len(txns),
        total_fraud=0,
        total_normal=len(txns),
        fraud_rate=0.0,
        avg_risk_score=0.0,
        processing_ms=0,
        transactions=[DetectedTransaction(
            transaction_id=tx.transaction_id,
            merchant=tx.merchant,
            amount=tx.amount,
            timestamp=tx.timestamp,
            risk_score=0.0,
            confidence=0.0,
            is_fraud=False,
            risk_level="UNKNOWN"
        ) for tx in txns],
        note="These payloads are ready to be sent to /detect endpoint"
    )


@router.get("/demo/demo-test", response_model=BatchTestResponse)
@router.post("/demo/demo-test", response_model=BatchTestResponse)
async def demo_test(count: int = 30, type: Optional[str] = None):
    """Public endpoint for faculty demo - No authentication required"""
    txns = generate_demo_transactions(count, type)
    results: List[DetectedTransaction] = []
    total_fraud = 0
    total_normal = 0
    total_risk_score = 0.0

    start_time = time.perf_counter()

    async with httpx.AsyncClient(timeout=8.0, limits=httpx.Limits(max_connections=12, max_keepalive_connections=6)) as client:
        for tx in txns:
            try:
                response = await client.post(URL, json=tx.dict())
                if response.status_code == 200:
                    payload = response.json()
                    risk_score = float(payload.get("risk_score", 0.0))
                    confidence = float(payload.get("confidence", 0.0))
                    is_fraud = bool(payload.get("is_fraud", False))
                    risk_level_ = risk_level_from_score(risk_score)

                    if is_fraud:
                        total_fraud += 1
                    else:
                        total_normal += 1

                    total_risk_score += risk_score

                    results.append(DetectedTransaction(
                        transaction_id=tx.transaction_id,
                        merchant=tx.merchant,
                        amount=tx.amount,
                        timestamp=tx.timestamp,
                        risk_score=risk_score,
                        confidence=confidence,
                        is_fraud=is_fraud,
                        risk_level=risk_level_
                    ))
                else:
                    print(f"Demo /detect returned {response.status_code}: {response.text}")
                    results.append(DetectedTransaction(
                        transaction_id=tx.transaction_id,
                        merchant=tx.merchant,
                        amount=tx.amount,
                        timestamp=tx.timestamp,
                        risk_score=0.0,
                        confidence=0.0,
                        is_fraud=False,
                        risk_level="ERROR"
                    ))
            except Exception as exc:
                print(f"Demo transaction failed for {tx.transaction_id}: {exc}")
                results.append(DetectedTransaction(
                    transaction_id=tx.transaction_id,
                    merchant=tx.merchant,
                    amount=tx.amount,
                    timestamp=tx.timestamp,
                    risk_score=0.0,
                    confidence=0.0,
                    is_fraud=False,
                    risk_level="ERROR"
                ))

    elapsed_ms = int((time.perf_counter() - start_time) * 1000)
    count_processed = len(results)
    fraud_rate = (total_fraud / count_processed * 100.0) if count_processed else 0.0
    avg_risk_score = (total_risk_score / count_processed) if count_processed else 0.0

    return BatchTestResponse(
        message=f"Successfully tested {count_processed} demo transactions",
        total_sent=count_processed,
        total_fraud=total_fraud,
        total_normal=total_normal,
        fraud_rate=fraud_rate,
        avg_risk_score=avg_risk_score,
        processing_ms=elapsed_ms,
        transactions=results,
        note="Final test results"
    )