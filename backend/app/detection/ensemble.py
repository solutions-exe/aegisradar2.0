import joblib
import numpy as np
import pandas as pd
from app.core.feature_engineering import engineer_features
from datetime import datetime


# Load models 
try:
    xgboost_model = joblib.load('models/xgboost_fraud_new.pkl')
    isolation_model = joblib.load('models/isolation_forest_new.pkl')
    print("✅ Models loaded successfully")
except:
    print("⚠️ Models not found yet. Train them first.")
    xgboost_model = None
    isolation_model = None



def detect_fraud(transaction):
    # Convert single transaction to DataFrame
    df = pd.DataFrame([{
        'transaction_id': transaction.transaction_id,
        'user_id': transaction.user_id,
        'amount': transaction.amount,
        'timestamp': transaction.timestamp,
        'merchant_category': transaction.merchant_category,
        'device_type': transaction.device_type,
        'location_country': transaction.location_country,
        'velocity_1h': transaction.velocity_1h,
        'velocity_24h': transaction.velocity_24h,
        'high_risk_merchant': transaction.high_risk_merchant
    }])

    # Feature Engineering
    df = engineer_features(df)
     # Prepare features for models
    feature_cols = ['amount', 'velocity_1h', 'velocity_24h', 'high_risk_merchant', 
                        'hour', 'day_of_week', 'is_weekend', 'amount_ratio']
    X = df[feature_cols]  


    # XGBoost Prediction
class FraudEnsemble:
    """Ensemble v2.0 - Smoother and more realistic scoring"""
    
    def __init__(self, xgboost_model, isolation_model):
        self.xgboost = xgboost_model
        self.isolation = isolation_model
    
    def predict(self, tx: dict):
        """Return final risk score and fraud decision"""
        features = self._engineer_features(tx)
        
        xgb_score = 0.45
        iso_score = 0.5
        
        # XGBoost
        if self.xgboost is not None:
            try:
                xgb_score = float(self.xgboost.predict_proba(features)[0][1])
            except:
                pass
        
        # Isolation Forest
        if self.isolation is not None:
            try:
                iso_pred = self.isolation.predict(features)[0]
                iso_score = 0.88 if iso_pred == -1 else 0.22
            except:
                pass
        
        # === Ensemble v2.0 ===
        raw = (xgb_score * 0.70) + (iso_score * 0.30)
        
        # Smoothing curve + calibration
        final_risk = 0.095 + (raw ** 1.20) * 0.78
        
        # Amount-based adjustment
        amount = float(tx.get("amount", 0))
        if amount > 16000:
            final_risk = min(0.97, final_risk * 1.20)
        elif amount < 1200:
            final_risk = max(0.09, final_risk * 0.75)
        
        final_risk = max(0.09, min(0.96, final_risk))
        is_fraud = final_risk > 0.69
        
        return {
            "risk_score": final_risk,
            "is_fraud": is_fraud,
            "confidence": final_risk,
            "model_version": "v2.0-ensemble"
        }

# backend/app/detection/ensemble.py

    def _engineer_features(self, tx: dict):
        """Same as before - keep consistent"""
        amount = float(tx.get("amount", 0.0))
        velocity_1h = float(tx.get("velocity_1h", np.random.uniform(1, 22)))
        velocity_24h = float(tx.get("velocity_24h", np.random.uniform(10, 130)))
        
        merchant_lower = str(tx.get("merchant", "")).lower()
        dt = datetime.fromisoformat(tx.get("timestamp", datetime.utcnow().isoformat()).replace("Z", "+00:00"))
        
        return np.array([
            amount,
            velocity_1h,
            velocity_24h,
            1 if any(w in merchant_lower for w in ["crypto","bet","gambling","luxury","electronics"]) else 0,
            dt.hour,
            dt.weekday(),
            1 if dt.weekday() >= 5 else 0,
            amount / max(800, float(tx.get("user_avg_amount", 2800)))
        ]).reshape(1, -1)
    


       

    