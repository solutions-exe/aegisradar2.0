from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Transaction(BaseModel):
    transaction_id: str
    user_id: str
    amount: float
    timestamp: datetime
    merchant_category: str
    device_type: str
    location_country: str
    velocity_1h: int
    velocity_24h: int
    high_risk_merchant: int = 0
    is_fraud: Optional[int] = None
