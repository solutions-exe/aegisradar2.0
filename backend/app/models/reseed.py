from sqlalchemy.orm import Session
from app.database import Base, engine, get_db, Organization, User, Transaction
from datetime import datetime, timedelta
import random

from app.auth import get_password_hash

def reset_and_seed_database():
    db: Session = next(get_db())

    print("⚠️  WARNING: This will DELETE ALL existing data!")
    confirm = input("Type 'RESET' to continue: ")
    if confirm != "RESET":
        print("Aborted.")
        return

    print("🗑 Dropping all tables...")
    Base.metadata.drop_all(bind=engine)

    print("🔨 Creating all tables...")
    Base.metadata.create_all(bind=engine)

    print("🌱 Seeding fresh data...")

    # 1. Create Organization
    org = Organization(
        name="exe Egypt",
        plan="Professional"
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    print(f"✅ Organization created: {org.name} (ID: {org.id})")

    # 2. Create Users
    users = [
        {"name": "abdo rashwan", "email": "abdo@exe.com", "role": "Admin"},
        {"name": "ahmed mounir", "email": "mounir@exe.com", "role": "Analyst"},
        {"name": "yousef tarek", "email": "yousef@exe.com", "role": "Analyst"},
        {"name": "ahmed sakka", "email": "sakka@exe.com", "role": "Viewer"},
        {"name": "nader abdelaty", "email": "nader@exe.com", "role": "Viewer"},
        {"name": "ziad khaled", "email": "ziad@exe.com", "role": "Viewer"},
        {"name": "mohammed ghoniem", "email": "ghoniem@exe.com", "role": "Viewer"},
        {"name": "ahmed bahaa", "email": "bahaa@exe.com", "role": "Viewer"},
    ]

    for u in users:
            user = User(
                organization_id=org.id,
                name=u["name"],
                email=u["email"],
                password_hash=get_password_hash("1234-1234"),  # Simple password for testing
                role=u["role"],
                status="Active"
            )
            db.add(user)
     

    db.commit()
    print(f"✅ {len(users)} users created.")
    print("User credentials:")
    for u in users:(
        print(f"   - {u['name']} ({u['role']}): {u['email']}"),
        db.refresh(user)
        )
        

    

    # 3. Create Sample Transactions
    merchants = ["Jumia EG", "Noon.com", "Talabat", "Carrefour", "B.TECH", "Amazon EG", "Vodafone EG"]

    print("🌱 Creating 130 sample transactions...")
    for i in range(130):
        amount = round(random.uniform(85, 18500), 2)
        is_fraud = random.random() < 0.15  # 15% fraud rate

        tx = Transaction(
            organization_id=org.id,
            tx_id=f"TX-{datetime.utcnow().strftime('%Y%m%d%H%M')}-{10000 + i}",
            merchant=random.choice(merchants),
            amount=amount,
            risk_score=round(random.uniform(0.05, 0.96), 4),
            is_fraud=is_fraud,
            status="FRAUD" if is_fraud else random.choice(["NORMAL", "REVIEW"]),
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 45))
        )
        db.add(tx)

    db.commit()
    print("✅ Database reset and seeded successfully!")

if __name__ == "__main__":
    reset_and_seed_database()