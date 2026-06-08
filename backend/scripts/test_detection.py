import requests
from datetime import datetime
import time
import json

url = "http://127.0.0.1:8000/detect"

def send_test_transaction(is_fraud=False):
    tx = {
        "transaction_id": f"TX-{int(time.time()*1000)}",
        "user_id": "USER12345",
        "amount": 12450.75 if is_fraud else 320.50,
        "timestamp": datetime.utcnow().isoformat(),
        "merchant_category": "electronics" if is_fraud else "food",
        "device_type": "mobile",
        "location_country": "EG",
        "velocity_1h": 18 if is_fraud else 2,
        "velocity_24h": 45 if is_fraud else 12,
        "high_risk_merchant": 1 if is_fraud else 0
    }
    
    try:
        response = requests.post(url, json=tx, timeout=5)
        print(f"Status: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        print("-" * 70)
    except Exception as e:
        print(f"Error: {e}")

print("🛡️ Aegis Radar - Live Test Started\\n")

# Send 6 normal transactions
print("Sending Normal Transactions...")
for i in range(6):
    send_test_transaction(is_fraud=False)
    time.sleep(0.6)

# Send suspicious transactions
print("\\n🚨 Sending High-Risk Transactions...")
for i in range(4):
    send_test_transaction(is_fraud=True)
    time.sleep(1.2)

print("\\n✅ Test Completed!")
