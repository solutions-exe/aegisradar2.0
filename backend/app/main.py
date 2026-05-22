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
async def fraud_detection(tx: Transaction):
    """
    TEMPORARY MOCK ENDPOINT
    ML Model has been removed for security reasons during sharing/demo.
    """
    # Simple rule-based mock (no real ML)
    is_fraud = tx.amount > 7000 or "test" in (getattr(tx, 'merchant', '') or "").lower()
    
    return {
        "transaction_id": getattr(tx, "transaction_id", "TX-MOCK"),
        "risk_score": 0.88 if is_fraud else 0.15,
        "is_fraud": is_fraud,
        "confidence": 0.85 if is_fraud else 0.78,
        "model_version": "v1.0-mock",
        "message": "ML engine temporarily disabled for security reasons",
        "timestamp": datetime.utcnow().isoformat()
    }


# Include auth router if it exists
# app.include_router(auth.router, prefix="/auth", tags=["auth"])


if __name__ == "__main__":
    import uvicorn
    print("🛡️ Aegis Radar API is running on http://127.0.0.1:8000")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)