"""
AEGIS RADAR - Backend Server
Easy startup script for the FastAPI backend.
"""

import os
import sys

# Add backend root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
import uvicorn

if __name__ == "__main__":
    print("=" * 70)
    print("🛡️  AEGIS RADAR - Backend Server")
    print("🚀 Starting at http://127.0.0.1:8000")
    print("🔒 ML Model has been temporarily disabled for security")
    print("=" * 70)
    
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )