# AEGIS RADAR
The First AI-Powered Fraud Detection Service For ONLINE Payments In Egypt And The Middle East.

**AI-Powered Real-Time Fraud Detection System**  
*Designed for Egyptian Businesses*

---

## 📋 Project Overview

Aegis Radar is a modern **B2B SaaS fraud detection platform** with a distinctive retro Windows 95 aesthetic. It provides real-time transaction monitoring, risk scoring, and intelligent alerts using an ensemble of XGBoost and Isolation Forest models.

### Key Features
- Real-time fraud detection via API
- Win95-inspired retro UI/UX
- Multi-role access (Admin, Analyst, Viewer)
- Live transaction monitoring
- Security posture dashboard
- Batch testing tools for demonstration
- Email + In-app notifications
- Merchant API key management

---

#### 🚀 Quick Start (Localhost)

1. Double-click `aegis_startup.bat` in the root folder
2. Wait for both backend and frontend to start
3. Open browser → [http://localhost:3000](http://localhost:3000)
4. Login with:
   - **Email**: `abdo@exe.com`
   - **Password**: `1234-1234`

---

##### 📁 Project Structure
aegisradar/
├── backend/                 # FastAPI + ML backend
├── frontend/aegis-radar-app/# Next.js 16 frontend
├── models/                  # Trained ML models (.pkl)
├── scripts/                 # Testing and seeding scripts
├── start_aegis.bat          # Master startup script
├── README.md                # This file
└── .env.example

---

###### 🛠 Tech Stack

**Backend**: FastAPI, SQLAlchemy, PyMySQL, XGBoost, Isolation Forest  
**Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS  
**Database**: MySQL  
**ML Models**: Ensemble (XGBoost + Isolation Forest)

---

###### 📋 Available Scripts

- `start_aegis.bat` → Start both frontend + backend
- `backend/scripts/batch_test.py` → Advanced testing
- `backend/scripts/reset_and_seed.py` → Reset + seed database

---
**Made for Academic Porpuses.**  
© 2026 BFCAI IS-Department
