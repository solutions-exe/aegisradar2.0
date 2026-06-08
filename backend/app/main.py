from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from pandas import DataFrame

from app.detection.ensemble import FraudEnsemble
try:
    import joblib
except ImportError:
    joblib = None

try:
    import pandas as pd
except ImportError:
    pd = None

    
import numpy as np
from fastapi import Depends, FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.routers.notifications import send_email_notification, manager

from app.core.feature_engineering import engineer_features
from app.database import Transaction, get_db ,Notification
from app.routers import analytics, auth, posture, settings, team, history, keys, notifications, demo

import sys
import os
from pathlib import Path
import joblib
from dotenv import load_dotenv


# Add project root to path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

# Read From .env File

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")


# ====================== LOAD ML MODELS ======================
print("=== LOADING ML MODELS ===")

xgboost_fraud = None
isolation_forest = None
fraud_ensemble = None

model_dir = BASE_DIR / "models"

# Try new trained models first
try:
    xgb_new_path = model_dir / "xgboost_fraud_new.pkl"
    iso_new_path = model_dir / "isolation_forest_new.pkl"

    if xgb_new_path.exists():
        xgboost_fraud = joblib.load(xgb_new_path)
        print(f"✅ Loaded NEW XGBoost model: {xgb_new_path.name}")
          
    else:
        # Fallback to old model
        xgb_old_path = model_dir / "xgboost_fraud.pkl"
        if xgb_old_path.exists():
            xgboost_fraud = joblib.load(xgb_old_path)
            print(f"✅ Loaded OLD XGBoost model: {xgb_old_path.name}")

    if iso_new_path.exists():
        isolation_forest = joblib.load(iso_new_path)
        print(f"✅ Loaded NEW Isolation Forest model: {iso_new_path.name}")
    else:
        iso_old_path = model_dir / "isolation_forest.pkl"
        if iso_old_path.exists():
            isolation_forest = joblib.load(iso_old_path)
            print(f"✅ Loaded OLD Isolation Forest model: {iso_old_path.name}")

except Exception as e:
    print(f"❌ Error loading models: {e}")

print(f"Final Status → XGBoost: {'Loaded' if xgboost_fraud is not None else 'NOT loaded'}")
print(f"Final Status → Isolation Forest: {'Loaded' if isolation_forest is not None else 'NOT loaded'}")
print("==================================================")

print("=========================")
fraud_ensemble = None
if xgboost_fraud is not None or isolation_forest is not None:
    fraud_ensemble = FraudEnsemble(xgboost_fraud, isolation_forest)
    print("✅ Ensemble v2.0 initialized")
    
app = FastAPI(
    title="Aegis Radar",
    description="AI-Powered Fraud Detection System",
    version="3.3.3"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://aegis-radar.vercel.app/", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(posture.router, prefix="/api")
app.include_router(team.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(keys.router, prefix="/api", tags=["keys"])
app.include_router(notifications.router, prefix="/api", tags=["notifications"])
app.include_router(demo.router, prefix="/api", tags=["demo"])
FEATURE_COLUMNS = [
    "amount",
    "velocity_1h",
    "velocity_24h",
    "high_risk_merchant",
    "hour",
    "day_of_week",
    "is_weekend",
    "amount_ratio",
]

MODEL_VERSION = "ensemble_v1.0"
MODEL_CONFIG = {
    "fraud_threshold": 0.75,
    "xgb_weight": 0.65,
    "isolation_weight": 0.35,
    "fallback_message": "ML models unavailable; using safe heuristic fallback",
}



class DetectionRequest(BaseModel):
    transaction_id: Optional[str] = Field(default=None, min_length=1)
    user_id: Optional[str] = Field(default=None, min_length=1)
    amount: float = Field(default=0.0, ge=0)
    timestamp: Optional[str] = None
    merchant: Optional[str] = None
    merchant_category: Optional[str] = None
    device_type: Optional[str] = None
    location_country: Optional[str] = None
    velocity_1h: float = Field(default=0.0, ge=0)
    velocity_24h: float = Field(default=0.0, ge=0)
    high_risk_merchant: Optional[int] = Field(default=None, ge=0, le=1)
    customer_id: Optional[str] = None
    organization_id: Optional[int] = None

    @field_validator("timestamp")
    @classmethod
    def validate_timestamp(cls, value: Optional[str]) -> Optional[str]:
        if not value:
            return None
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return parsed.isoformat()
        except ValueError:
            return None


def load_models():
    bundle = {
        "xgboost": None,
        "isolation_forest": None,
        "status": "missing",
    }

    if joblib is None:
        print("⚠️ ML models unavailable: joblib is not installed")
        return bundle

    try:
        bundle["xgboost"] = joblib.load("models/xgboost_fraud.pkl")
        bundle["isolation_forest"] = joblib.load("models/isolation_forest.pkl")
        bundle["status"] = "ready"
        print("✅ ML models loaded successfully")
    except Exception as exc:
        print(f"⚠️ ML models unavailable: {exc}")

    return bundle


MODEL_BUNDLE = load_models()


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(microsecond=0)


def normalize_timestamp(value: Optional[str]) -> datetime:
    if not value:
        return utc_now()

    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except Exception:
        return utc_now()


def infer_merchant_category(merchant: Optional[str], merchant_category: Optional[str]) -> str:
    if merchant_category:
        return merchant_category.strip().lower() or "other"

    if not merchant:
        return "other"

    lowered = merchant.lower()
    if any(word in lowered for word in ["crypto", "bitcoin", "wallet", "gambling"]):
        return "crypto"
    if any(word in lowered for word in ["electronics", "phone", "laptop", "tablet", "camera"]):
        return "electronics"
    if any(word in lowered for word in ["food", "restaurant", "cafe", "delivery", "talabat"]):
        return "food"
    return "other"


def normalize_device(device_type: Optional[str]) -> str:
    if not device_type:
        return "Desktop"

    lowered = device_type.lower()
    if lowered in {"mobile", "phone"}:
        return "Mobile"
    if lowered == "tablet":
        return "Tablet"
    if lowered in {"pos", "point of sale", "terminal"}:
        return "POS"
    return device_type


def build_prediction_payload(req: DetectionRequest) -> dict:
    timestamp = normalize_timestamp(req.timestamp)
    merchant = (req.merchant or "Unknown").strip() or "Unknown"
    merchant_category = infer_merchant_category(merchant, req.merchant_category)

    user_id = req.user_id or req.customer_id or f"anon-{req.transaction_id or 'unknown'}"

    high_risk_merchant = req.high_risk_merchant
    if high_risk_merchant is None:
        high_risk_merchant = 1 if merchant_category in {"crypto", "electronics", "gambling"} else 0

    return {
        "transaction_id": req.transaction_id or f"TX-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "user_id": user_id,
        "amount": float(req.amount),
        "timestamp": timestamp.isoformat(),
        "merchant_category": merchant_category,
        "device_type": normalize_device(req.device_type),
        "location_country": req.location_country or "EG",
        "velocity_1h": float(req.velocity_1h),
        "velocity_24h": float(req.velocity_24h),
        "high_risk_merchant": int(high_risk_merchant),
        "merchant": merchant,
        "organization_id": req.organization_id if req.organization_id is not None else 1,
    }


def heuristic_prediction(payload: dict) -> dict:
    amount = float(payload["amount"])
    velocity_1h = float(payload["velocity_1h"])
    velocity_24h = float(payload["velocity_24h"])
    merchant_category = payload["merchant_category"]
    device_type = payload["device_type"]

    heuristic = 0.15

    if amount >= 5000:
        heuristic += 0.25
    if amount >= 10000:
        heuristic += 0.15
    if payload["high_risk_merchant"]:
        heuristic += 0.25
    if velocity_1h >= 8:
        heuristic += 0.10
    if velocity_24h >= 20:
        heuristic += 0.10
    if device_type == "Mobile" and amount >= 1000:
        heuristic += 0.05
    if merchant_category == "food" and amount < 100:
        heuristic -= 0.05

    risk_score = min(1.0, max(0.0, heuristic))
    is_fraud = risk_score >= MODEL_CONFIG["fraud_threshold"]

    return {
        "risk_score": round(float(risk_score), 4),
        "is_fraud": bool(is_fraud),
        "confidence": round(float(risk_score), 4),
        "model_version": "fallback_heuristic",
        "status": "FRAUD" if is_fraud else "NORMAL",
        "message": MODEL_CONFIG["fallback_message"],
    }


def predict_with_models(payload: dict) -> dict:
    xgb_model = MODEL_BUNDLE["xgboost"]
    iso_model = MODEL_BUNDLE["isolation_forest"]

    if xgb_model is None or iso_model is None:
        return heuristic_prediction(payload)

    if pd is None:
        print("⚠️ pandas is not installed; using heuristic fallback")
        return heuristic_prediction(payload)

    feature_df = pd.DataFrame([payload])
    feature_df = engineer_features(feature_df)
    feature_matrix = feature_df[FEATURE_COLUMNS]

    xgb_probability = float(xgb_model.predict_proba(feature_matrix)[0][1])
    anomaly_score = float(iso_model.decision_function(feature_matrix)[0])
    anomaly_probability = (1 - (anomaly_score + 1) / 2)

    risk_score = float(
        (MODEL_CONFIG["xgb_weight"] * xgb_probability)
        + (MODEL_CONFIG["isolation_weight"] * anomaly_probability)
    )

    is_fraud = risk_score >= MODEL_CONFIG["fraud_threshold"]

    return {
        "risk_score": round(risk_score, 4),
        "is_fraud": bool(is_fraud),
        "confidence": round(risk_score, 4),
        "model_version": MODEL_VERSION,
        "status": "FRAUD" if is_fraud else "NORMAL",
        "message": "Real ML prediction (XGBoost + Isolation Forest)",
    }


@app.get("/")
async def root():
    return {
        "message": "🛡️ Aegis Radar API is running",
        "status": "healthy",
        "database": "connected",
        "timestamp": utc_now().isoformat(),
    }

# ====================== Feature Engineering Helper ======================
def engineer_features_for_prediction(tx: dict):
    """More realistic feature engineering matching the trained model exactly"""
    amount = float(tx.get("amount", 0.0))
    
    # Use real velocities from frontend if provided, otherwise realistic simulation
    velocity_1h = float(tx.get("velocity_1h", np.random.uniform(0.5, 22.0)))
    velocity_24h = float(tx.get("velocity_24h", np.random.uniform(8.0, 135.0)))
    
    timestamp = tx.get("timestamp", datetime.utcnow().isoformat())
    try:
        dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    except:
        dt = datetime.utcnow()
    
    merchant_lower = str(tx.get("merchant", "")).lower()
    
    # More intelligent high_risk_merchant detection
    high_risk_keywords = ["crypto", "bet", "gambling", "luxury", "electronics", "jewelry", 
                         "watch", "iphone", "gold", "forex", "investment"]
    high_risk_merchant = 1 if any(word in merchant_lower for word in high_risk_keywords) else 0
    
    # Realistic amount_ratio (how unusual this amount is compared to user's history)
    user_avg_amount = float(tx.get("user_avg_amount", 2850.0))
    amount_ratio = amount / max(800.0, user_avg_amount)
    
    features = [
        amount,                    # 1. amount
        velocity_1h,               # 2. velocity_1h (from frontend)
        velocity_24h,              # 3. velocity_24h (from frontend)
        high_risk_merchant,        # 4. high_risk_merchant
        dt.hour,                   # 5. hour
        dt.weekday(),              # 6. day_of_week
        1 if dt.weekday() >= 5 else 0,  # 7. is_weekend
        min(4.5, amount_ratio)     # 8. amount_ratio (capped)
    ]
    
    print(f"Features → Amt:{amount:,.0f} | v1h:{velocity_1h:.1f} | v24h:{velocity_24h:.1f} | "
          f"HRM:{high_risk_merchant} | Ratio:{amount_ratio:.2f} | Hour:{dt.hour}")
    
    return np.array(features).reshape(1, -1)


@app.post("/detect")
async def fraud_detection(
    tx: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Improved calibration for smoother, more realistic scores"""
    try:
        features = engineer_features_for_prediction(tx)

        xgb_score = 0.45
        iso_score = 0.5

        if xgboost_fraud is not None:
            try:
                xgb_score = float(xgboost_fraud.predict_proba(features)[0][1])
            except:
                pass

        if isolation_forest is not None:
            try:
                iso_pred = isolation_forest.predict(features)[0]
                iso_score = 0.88 if iso_pred == -1 else 0.22
            except:
                pass

        # === Better Ensemble + Calibration ===
        raw = (xgb_score * 0.7) + (iso_score * 0.3)
        
        # Smoothing + non-linear calibration
        final_risk = 0.085 + (raw ** 1.22) * 0.78

                # Use Ensemble v2.0
        if fraud_ensemble is not None:
            result = fraud_ensemble.predict(tx)
            risk_score = result["risk_score"]
            is_fraud = result["is_fraud"]
            print(f"Ensemble v2.0 → Risk: {risk_score:.4f} | Fraud: {is_fraud}")
            print("==================ENSEMBLE_V2.0==========================")
        else:
            risk_score = 0.45
            is_fraud = False
            print("====================fallback=====================")
        
        # Amount-based boost
        amount = float(tx.get("amount", 0))
        if amount > 15000:
            final_risk = min(0.97, final_risk * 1.18)
        elif amount < 1200:
            final_risk = max(0.09, final_risk * 0.72)

        final_risk = max(0.08, min(0.96, final_risk))
        is_fraud = final_risk > 0.69

        print(f"FINAL RISK → {final_risk:.4f} | Fraud: {is_fraud} | Raw: {raw:.4f} | Amount: {amount:.0f}")
        print("==================Risk_Boosting=========================")

        # Save transaction (rest remains the same)
        tx_id = tx.get("transaction_id") or f"TX-{int(datetime.utcnow().timestamp() * 1000)}"

        

        new_tx = Transaction(
            organization_id=1,
            tx_id=tx_id,
            merchant=tx.get("merchant", "Unknown"),
            amount=amount,
            risk_score=final_risk,
            is_fraud=is_fraud,
            status="FRAUD" if is_fraud else "NORMAL"
        )
        db.add(new_tx)
        db.commit()
        db.refresh(new_tx)

        
        # Notification logic (keep as is)...
         # === Notifications ===
        if is_fraud:
            notif = Notification(
                organization_id=1,
                title="🚨 High-Risk Transaction Detected",
                message=f"{new_tx.merchant} - EGP {new_tx.amount:.2f} (Risk {final_risk:.3f})",
                type="fraud_alert",
                severity="high"
            )
            db.add(notif)
            db.commit()

            background_tasks.add_task(
                send_email_notification,
                "abdulrahman.r9205@gmail.com",   # ← Change to your real email
                "Aegis Radar - Fraud Alert",
                {
                    "transaction_id": new_tx.tx_id,
                    "merchant": new_tx.merchant,
                    "amount": new_tx.amount,
                    "risk_score": final_risk
                }
            )

            await manager.broadcast_to_org(1, {
                "type": "fraud_alert",
                "transaction_id": new_tx.tx_id,
                "merchant": new_tx.merchant,
                "amount": new_tx.amount,
                "risk_score": final_risk,
                "is_fraud": True,
            })
        

        return {
            "transaction_id": new_tx.tx_id,
            "risk_score": round(final_risk, 4),
            "is_fraud": is_fraud,
            "confidence": round(final_risk, 4),
            "model_version": "v1.0-tuned",
            "status": "processed"
        }

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Detection failed")

@app.get("/transactions")
async def get_transactions(limit: int = 200, db: Session = Depends(get_db)):
    transactions = (
        db.query(Transaction)
        .order_by(Transaction.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "transaction_id": tx.tx_id,
            "merchant": tx.merchant,
            "amount": tx.amount,
            "risk_score": tx.risk_score,
            "is_fraud": tx.is_fraud,
            "status": tx.status,
            "confidence": round(tx.risk_score, 4),
            "model_version": MODEL_VERSION,
            "timestamp": tx.created_at.isoformat() if tx.created_at else None,
        }
        for tx in transactions
    ]




if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000)