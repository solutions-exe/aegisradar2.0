from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, List
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json

from app.database import get_db, Notification, User, Organization
from app.auth import get_current_user, get_current_user_ws, require_role

router = APIRouter()

# ====================== Schemas ======================
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    severity: str
    is_read: bool
    created_at: datetime

# ====================== SMTP Email Sender ======================
def send_email_notification(to_email: str, subject: str, alert_data: str):
    """Professional HTML email template"""
    try:
        sender_email = "abdulrahman.r9205@gmail.com"      # ← Change this
        app_password = "yklf toae praj ujxn"              # ← Change this

        msg = MIMEMultipart("alternative")
        msg['From'] = f"Aegis Radar <{sender_email}>"
        msg['To'] = to_email
        msg['Subject'] = subject

        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
            <div style="max-width:620px; margin:auto; background:white; border-radius:8px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.1);">
                <div style="background:#000080; color:white; padding:20px; text-align:center;">
                    <h2>🚨 AEGIS RADAR - FRAUD ALERT</h2>
                </div>
                <div style="padding:30px; line-height:1.7;">
                    <p><strong>Transaction ID:</strong> {alert_data.get('transaction_id')}</p>
                    <p><strong>Merchant:</strong> {alert_data.get('merchant')}</p>
                    <p><strong>Amount:</strong> EGP {alert_data.get('amount', 0):,.2f}</p>
                    <p><strong>Risk Score:</strong> {alert_data.get('risk_score', 0):.4f}</p>
                    <p><strong>Time:</strong> {datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")}</p>
                    
                    <hr style="border:1px solid #ddd; margin:20px 0;">
                    <p><strong>Action Recommended:</strong> Please review this transaction immediately in the dashboard.</p>
                </div>
                <div style="background:#f8f8f8; padding:20px; text-align:center;">
                    <a href="http://localhost:3000/dashboard/history" 
                     style="background:#000080; color:white; padding:12px 25px; text-decoration:none; border-radius:4px; font-weight:bold;">
                        Review in Dashboard
                    </a>
                </div>
                <div style="padding:15px; text-align:center; font-size:0.85em; color:#666;">
                    This is an automated security alert from Aegis Radar.<br>
                    © 2026 AEGIS Systems - Cairo, Egypt
                </div>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html, 'html'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, app_password)
        server.send_message(msg)
        server.quit()
        
        print(f"✅ Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Email failed: {e}")
        return False


# ====================== WebSocket Manager ======================
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}  # org_id -> list of websockets

    async def connect(self, websocket: WebSocket, org_id: int):
        await websocket.accept()
        if org_id not in self.active_connections:
            self.active_connections[org_id] = []
        self.active_connections[org_id].append(websocket)
        print(f"Client connected to org {org_id}")

    def disconnect(self, websocket: WebSocket, org_id: int):
        if org_id in self.active_connections:
            if websocket in self.active_connections[org_id]:
                self.active_connections[org_id].remove(websocket)

    async def broadcast_to_org(self, org_id: int, message: dict):
        """Send message to all connected clients in an organization"""
        if org_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[org_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    dead_connections.append(connection)
            
            # Cleanup dead connections
            for dead in dead_connections:
                self.disconnect(dead, org_id)

manager = ConnectionManager()

# ====================== Endpoints ======================

@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    current_user: dict = Depends(require_role(["view_transactions"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == current_user["email"]).first()
    if not user:
        raise HTTPException(404, "User not found")

    notifications = db.query(Notification).filter(
        Notification.organization_id == user.organization_id
    ).order_by(Notification.created_at.desc()).limit(50).all()

    return notifications


@router.post("/notifications/{notif_id}/read")
async def mark_as_read(
    notif_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if notif and notif.organization_id == current_user.get("organization_id"):
        notif.is_read = True
        db.commit()
    return {"status": "ok"}


# WebSocket Endpoint
@router.websocket("/ws/alerts")
async def websocket_endpoint(
    websocket: WebSocket,
    db: Session = Depends(get_db)
):
    """Real-time notifications - WebSocket friendly auth"""
    current_user = await get_current_user_ws(websocket, db)
    if not current_user:
        return

    org_id = current_user["organization_id"]

    await manager.connect(websocket, org_id)

    try:
        while True:
            data = await websocket.receive_text()
            if data.lower() == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, org_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, org_id)