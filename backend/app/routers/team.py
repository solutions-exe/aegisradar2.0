from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import require_role
from app.database import User, get_db

router = APIRouter()


def normalize_email(value: str) -> str:
    return value.strip().lower()


def normalize_role(role: str) -> str:
    normalized = (role or "Analyst").strip().lower()
    if normalized == "admin":
        return "Admin"
    if normalized == "viewer":
        return "Viewer"
    return "Analyst"


# ====================== Schemas ======================

class TeamMember(BaseModel):
    id: int
    name: str
    email: str
    role: str
    status: str
    last_active: Optional[str] = None


class InviteRequest(BaseModel):
    email: str
    name: str
    role: str = "Analyst"


class RoleUpdate(BaseModel):
    role: str


# ====================== Endpoints ======================

@router.get("/team", response_model=List[TeamMember])
async def get_team_members(
    current_user: dict = Depends(require_role(["view_transactions"])),
    db: Session = Depends(get_db),
):
    """Return all team members for the current user's organization."""
    user = db.query(User).filter(User.email == current_user["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    members = (
        db.query(User)
        .filter(User.organization_id == user.organization_id)
        .order_by(User.id.asc())
        .all()
    )

    return [
        TeamMember(
            id=member.id,
            name=member.name or member.email.split("@", 1)[0],
            email=member.email,
            role=member.role,
            status=member.status,
            last_active=member.created_at.isoformat() if member.created_at else None,
        )
        for member in members
    ]


@router.post("/team/invite")
async def invite_team_member(
    invite: InviteRequest,
    current_user: dict = Depends(require_role(["Admin"])),
    db: Session = Depends(get_db),
):
    """Only Admin can invite new members."""
    admin = db.query(User).filter(User.email == current_user["email"]).first()
    if not admin or admin.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admins can invite members")

    email = normalize_email(invite.email)
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = User(
        organization_id=admin.organization_id,
        name=invite.name,
        email=email,
        role=normalize_role(invite.role),
        status="Pending",
        password_hash="pending_invite",
    )

    db.add(new_user)
    db.commit()

    return {
        "message": f"Invitation sent to {email}",
        "user_id": new_user.id,
        "role": new_user.role,
    }


@router.put("/team/{user_id}/role")
async def update_user_role(
    user_id: int,
    update: RoleUpdate,
    current_user: dict = Depends(require_role(["Admin"])),
    db: Session = Depends(get_db),
):
    """Only Admin can change roles"""
    
    admin = db.query(User).filter(User.email == current_user["email"]).first()
    if not admin or admin.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admins can change roles")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if target.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot change your own role")

    normalized_role = normalize_role(update.role)
    if normalized_role != "Admin":
        admin_count = db.query(User).filter(
            User.organization_id == admin.organization_id,
            User.role == "Admin",
        ).count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot remove the last Admin")

    target.role = normalized_role
    db.commit()

    return {"message": f"Role updated to {normalized_role} for user {user_id}"}