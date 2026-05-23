from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

# Import models
from app.models.transaction import Transaction

# Import routers (if you have them)
# from app.routers import auth

app = FastAPI(
    title="AEGIS RADAR",
    description="AI-Powered Real-time Fraud Detection System",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====================== MOCK ENDPOINTS ======================

@app.get("/")
async def root():
    return {
        "message": "🛡️ Aegis Radar API is running",
        "status": "healthy",
        "ml_model": "disabled_for_security_reasons",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/detect")
async def fraud_detection(tx: dict):
    """
    Mock fraud detection - accepts any dict and returns result
    """
    amount = tx.get("amount", 0)
    is_fraud = amount > 7000

    return {
        "transaction_id": tx.get("transaction_id", f"TX-{int(datetime.utcnow().timestamp())}"),
        "merchant": tx.get("merchant", "Unknown"),
        "amount": amount,
        "risk_score": 0.88 if is_fraud else 0.22,
        "is_fraud": is_fraud,
        "confidence": 0.92 if is_fraud else 0.75,
        "model_version": "v1.0-mock",
        "message": "ML engine temporarily disabled for security",
        "timestamp": datetime.utcnow().isoformat()
    }

# Include auth router if it exists
# app.include_router(auth.router, prefix="/auth", tags=["auth"])


if __name__ == "__main__":
    import uvicorn
    print("🛡️ Aegis Radar API is running on http://127.0.0.1:8000")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)