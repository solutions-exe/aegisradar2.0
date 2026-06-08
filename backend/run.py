import os
import sys

from app.main import app
import uvicorn

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))   # Render requires this
    
    print("🛡️ Aegis Radar API is running")
    print(f"   Listening on port: {port}")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",      # Important: Bind to all interfaces
        port=port,
        reload=False          # Disable reload in production
    )