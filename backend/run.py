import os
import sys

from app.main import app
import uvicorn

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


if __name__ == "__main__":
    print("=" * 60)
    print("🛡️  AEGIS RADAR Backend Server")
    print("🚀 Running on http://127.0.0.1:8000")
    print("=" * 60)
    
    uvicorn.run(
        "app.main:app", 
        host="127.0.0.1", 
        port=8000, 
        reload=True
    )