import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import joblib
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier
from sklearn.ensemble import IsolationForest

print("🚀 Starting model retraining with better data...")

# ========================== GENERATE BETTER DATA ==========================
np.random.seed(42)
n_samples = 120000

data = pd.DataFrame({
    'amount': np.random.lognormal(7, 1.5, n_samples).clip(100, 150000),
    'velocity_1h': np.random.uniform(0, 25, n_samples),
    'velocity_24h': np.random.uniform(5, 150, n_samples),
    'high_risk_merchant': np.random.binomial(1, 0.12, n_samples),
    'hour': np.random.randint(0, 24, n_samples),
    'day_of_week': np.random.randint(0, 7, n_samples),
    'is_weekend': np.random.binomial(1, 0.28, n_samples),
    'amount_ratio': np.random.beta(2, 5, n_samples) * 3
})

# Create realistic fraud labels
data['is_fraud'] = 0

# Fraud conditions
high_amount = data['amount'] > 12000
high_velocity = (data['velocity_1h'] > 18) | (data['velocity_24h'] > 95)
risky_merchant = data['high_risk_merchant'] == 1
suspicious_ratio = data['amount_ratio'] > 2.2

data.loc[high_amount & (high_velocity | risky_merchant | suspicious_ratio), 'is_fraud'] = 1

print(f"Generated {n_samples} samples | Fraud rate: {data['is_fraud'].mean():.2%}")

# ========================== TRAIN NEW MODELS ==========================
X = data.drop('is_fraud', axis=1)
y = data['is_fraud']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# XGBoost
xgb = XGBClassifier(
    n_estimators=180,
    max_depth=6,
    learning_rate=0.08,
    subsample=0.85,
    colsample_bytree=0.85,
    random_state=42
)
xgb.fit(X_train, y_train)

# Isolation Forest
iso = IsolationForest(contamination=0.08, random_state=42)
iso.fit(X_train)

# ========================== SAVE ==========================
joblib.dump(xgb, "models/xgboost_fraud_new.pkl")
joblib.dump(iso, "models/isolation_forest_new.pkl")

print("✅ New models trained and saved successfully!")
print("   Files: xgboost_fraud_new.pkl + isolation_forest_new.pkl")