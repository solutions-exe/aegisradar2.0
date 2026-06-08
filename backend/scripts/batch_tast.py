# backend/scripts/batch_test.py
import requests
import time
import random
from datetime import datetime

URL = "http://127.0.0.1:8000/detect"

def generate_realistic_tx():
    # Realistic merchant pool
    merchants = [
        ("Amazon EG", "normal"),
        ("Jumia", "normal"),
        ("Carrefour", "normal"),
        ("Talabat", "normal"),
        ("Noon", "normal"),
        ("B.TECH", "electronics"),
        ("Crypto Exchange", "highrisk"),
        ("Online Betting", "highrisk"),
        ("Luxury Watches Store", "highrisk"),
        ("Unknown Electronics", "highrisk"),
    ]
    
    merchant, risk_level = random.choice(merchants)
    
    # Generate realistic amount based on risk level
    if risk_level == "highrisk":
        amount = random.randint(8500, 65000)
    elif risk_level == "electronics":
        amount = random.randint(3200, 18500)
    else:
        amount = random.randint(250, 4200)
    
    # Realistic velocities (payment gateway style)
    velocity_1h = round(random.uniform(0.8, 28.0), 1)
    velocity_24h = round(random.uniform(12.0, 145.0), 1)
    
    # Higher velocity for risky merchants
    if risk_level == "highrisk":
        velocity_1h = round(random.uniform(8.0, 28.0), 1)
        velocity_24h = round(random.uniform(45.0, 145.0), 1)
    
    return {
        "merchant": merchant,
        "amount": amount,
        "velocity_1h": velocity_1h,
        "velocity_24h": velocity_24h,
        "category": risk_level
    }


def batch_test(count=50):
    print(f"🚀 Starting Advanced Batch Test ({count} transactions)...\n")
    print(f"{'#':<3} {'Status':<8} {'Merchant':<22} {'Amount':>10} {'v1h':>6} {'v24h':>6} {'Risk Score':>12}")
    print("-" * 85)
    
    for i in range(count):
        tx = generate_realistic_tx()
        
        payload = {
            "transaction_id": f"TX-BATCH-{int(time.time()*1000)}",
            "merchant": tx["merchant"],
            "amount": tx["amount"],
            "timestamp": datetime.utcnow().isoformat(),
            "velocity_1h": tx["velocity_1h"],
            "velocity_24h": tx["velocity_24h"],
        }
        
        try:
            r = requests.post(URL, json=payload, timeout=8)
            if r.status_code == 200:
                result = r.json()
                status = "🚨 FRAUD" if result.get("is_fraud") else "✅ Normal"
                risk = result.get("risk_score", 0)
                print(f"{i+1:<3} {status:<8} {tx['merchant']:<22} {tx['amount']:>10,.0f} {tx['velocity_1h']:>6.1f} {tx['velocity_24h']:>6.1f} {risk:>12.4f}")
            else:
                print(f"{i+1:<3} ❌ HTTP {r.status_code}")
        except Exception as e:
            print(f"{i+1:<3} ❌ Connection Error")
        
        time.sleep(0.35)  # Realistic delay
    
    print("\n✅ Batch test completed!")


if __name__ == "__main__":
    batch_test(60)   # You can change this number