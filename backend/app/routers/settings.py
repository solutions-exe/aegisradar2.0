from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.database import get_db, Organization, User
from app.auth import get_current_user, require_role
from datetime import datetime

router = APIRouter()

# ====================== Schemas ======================

class GeneralSettings(BaseModel):
    organization_name: str
    division: str
    industry: str
    primary_email: str
    timezone: str
    country: str
    language: str

class SecuritySettings(BaseModel):
    fraud_threshold: float
    auto_block_high_risk: bool
    require_step_up_auth: bool
    block_vpn: bool
    two_factor_enabled: bool

class NotificationSettings(BaseModel):
    email_alerts: bool
    sms_alerts: bool
    in_app_alerts: bool
    slack_webhook: Optional[str] = None

class ApiSettings(BaseModel):
    webhook_url: Optional[str] = None
    webhook_secret: Optional[str] = None

class AppearanceSettings(BaseModel):
    theme: str
    density: str
    font_size: str
    date_format: str
    animations_enabled: bool

class SettingsResponse(BaseModel):
    general: GeneralSettings
    security: SecuritySettings
    notifications: NotificationSettings
    api: ApiSettings
    appearance: AppearanceSettings


# ====================== Endpoints ======================

@router.get("/settings", response_model=SettingsResponse)
async def get_settings(
    current_user: dict = Depends(require_role(["view_transactions"])),  # All roles can view
    db: Session = Depends(get_db)
):
    """Return current organization settings"""
    
    user = db.query(User).filter(User.email == current_user["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    org = db.query(Organization).filter(Organization.id == user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    return {
        "general": {
            "organization_name": org.name,
            "division": "E-Commerce Division",
            "industry": "Retail & Banking",
            "primary_email": "security@yourcompany.com.eg",
            "timezone": "Africa/Cairo",
            "country": "EG",
            "language": "en"
        },
        "security": {
            "fraud_threshold": 0.65,
            "auto_block_high_risk": True,
            "require_step_up_auth": True,
            "block_vpn": True,
            "two_factor_enabled": True
        },
        "notifications": {
            "email_alerts": True,
            "sms_alerts": False,
            "in_app_alerts": True,
            "slack_webhook": None
        },
        "api": {
            "webhook_url": "https://api.yourcompany.com.eg/webhooks/aegis",
            "webhook_secret": "whsec_live_xxxxxxxxxxxxxxxxxxxxxxxx"
        },
        "appearance": {
            "theme": "win95",
            "density": "comfortable",
            "font_size": "medium",
            "date_format": "DD/MM/YYYY",
            "animations_enabled": True
        }
    }


@router.put("/settings")
async def update_settings(
    settings: Dict[str, Any],
    current_user: dict = Depends(require_role(["Admin"])),   # Only Admin can update
    db: Session = Depends(get_db)
):
    """Update organization settings - Admin only"""
    
    user = db.query(User).filter(User.email == current_user["email"]).first()
    if not user or user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admins can modify settings")

    org = db.query(Organization).filter(Organization.id == user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Update supported fields
    if "organization_name" in settings and settings["organization_name"]:
        org.name = settings["organization_name"]

    # You can extend this to save more fields later (e.g. in a JSON settings column)

    db.commit()

    return {
        "message": "✅ Settings updated successfully",
        "updated_at": datetime.utcnow().isoformat(),
        "updated_by": user.email
    }