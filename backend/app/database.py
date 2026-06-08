from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv()

Base = declarative_base()

# Database URL from .env or hardcoded fallback
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set!")

engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ========================== MODELS ==========================

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    plan = Column(String(50), default="Professional")          # Free, Professional, Enterprise
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="organization", cascade="all, delete-orphan")
    api_keys = relationship("ApiKey", back_populates="organization", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="organization", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"))
    
    name = Column(String(100))
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="Analyst")          # Admin, Analyst, Viewer
    status = Column(String(20), default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"))
    
    tx_id = Column(String(100), unique=True, nullable=False)
    merchant = Column(String(255))
    amount = Column(Float, nullable=False)
    risk_score = Column(Float)
    is_fraud = Column(Boolean, default=False)
    status = Column(String(20), default="NORMAL")         # NORMAL, FRAUD, REVIEW
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="transactions")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"))
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="SET NULL"))
    
    message = Column(Text)
    severity = Column(String(20))                         # LOW, MEDIUM, HIGH, CRITICAL
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="alerts")




class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    key_name = Column(String(100), nullable=False)
    api_key = Column(String(64), unique=True, nullable=False)  # Hashed or plain (we'll keep plain for simplicity in demo)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)

    organization = relationship("Organization", back_populates="api_keys")

# Add this line inside Organization class:
# api_keys = relationship("ApiKey", back_populates="organization", cascade="all, delete-orphan")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Optional: specific user
    title = Column(String(200), nullable=False)
    message = Column(String(500), nullable=False)
    type = Column(String(50), default="fraud_alert")  # fraud_alert, daily_summary, system
    severity = Column(String(20), default="high")     # low, medium, high, critical
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization")
    user = relationship("User")


# ========================== DEPENDENCY ==========================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ========================== CREATE TABLES ==========================

if __name__ == "__main__":
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully!")