import pandas as pd
import numpy as np
from datetime import datetime

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    
    # Temporal Features
    df['hour'] = pd.to_datetime(df['timestamp']).dt.hour
    df['day_of_week'] = pd.to_datetime(df['timestamp']).dt.dayofweek
    df['is_weekend'] = df['day_of_week'].isin([5,6]).astype(int)
    
    # User Behavior Features
    df['amount_ratio'] = df.groupby('user_id')['amount'].transform(lambda x: x / x.mean())
    df['high_risk_merchant'] = df['merchant_category'].isin(['gambling', 'crypto', 'electronics']).astype(int)
    
    return df
