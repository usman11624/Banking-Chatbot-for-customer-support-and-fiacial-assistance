# Banking Chatbot - Final Project

A complete full-stack banking chatbot with **only 3 main folders** (Frontend, Backend, Database).

---

## 📁 Project Structure - ONLY 3 FOLDERS

```
banking-chatbot/
│
├── frontend/              ← React Dashboard UI
├── backend/               ← Flask API Server
└── database/              ← PostgreSQL Schema & Data Files
```

**That's it! Only these 3 folders.** ✨

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate      # Windows
# source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
python app.py
```
✅ Backend runs on `http://localhost:5000`

### Step 2: Database Setup
```bash
# Open PostgreSQL (ensure it's running)
psql -U postgres

# Create database and import schema:
CREATE DATABASE banking_bot;
\c banking_bot
\i ../database/postgres_setup.sql
```

On Windows, you can also double-click `database\setup_postgres.bat` to create/import the database automatically.

### Step 3: Configure Backend
Create `backend/.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=banking_bot
DB_USER=postgres
DB_PASSWORD=your_password
```

### Step 4: Frontend Setup
```bash
cd frontend
npm install
npm start
```
✅ Frontend opens on `http://localhost:3000`

---

## 📂 Folder Details

### `/backend` - Flask API + ML Models
- `app.py` - Main application with all endpoints
- `ChatBot.py` - NLP chatbot model
- `LLM.PY` - Language model integration
- `rag.py` - RAG (Retrieval-Augmented Generation)
- `train_nlp.py` - NLP training script
- `requirements.txt` - Python dependencies
- `tests/` - Pytest tests (6 tests, all passing ✅)
- `models/` - Trained ML models

### `/frontend` - React Dashboard
- `src/App.js` - Main React component
- `src/App.css` - Dashboard styling
- `public/index.html` - HTML entry point
- `package.json` - NPM dependencies

### `/database` - PostgreSQL Schema + Data
- `postgres_setup.sql` - Complete DB schema with seed data (312 lines)
- `*.csv` - Training & test data files (intents, transactions, identity, etc.)
- `*.text` - Text data files

---

## 🧪 Run Tests

```bash
cd backend
python -m pytest tests/ -v
```

**Status:** ✅ 6 tests passing

---

## 📊 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/register` | POST | Create new customer |
| `/login` | POST | Login and get token |
| `/balance` | GET | Check account balance (auth required) |
| `/transactions` | GET | View transaction history (auth required) |
| `/transfer` | POST | Transfer money (auth required) |
| `/loan/eligibility` | GET | Check loan eligibility (auth required) |
| `/loan/payment` | POST | Make loan payment |
| `/fraud/alert` | POST | Report fraud |
| `/fraud/alerts` | GET | View fraud alerts |
| `/query/log` | POST | Log customer query |
| `/chat` | POST | Send message to chatbot |

---

## 🔐 Authentication

- **Register:** `POST /register` with name, email, phone, password
- **Login:** `POST /login` with email, password → returns JWT token
- **Use Token:** Add to requests as: `Authorization: Bearer <token>`

---

## 💾 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, CSS3 |
| Backend | Flask, Python 3 |
| Database | PostgreSQL 12+ |
| Testing | pytest |
| Auth | JWT Tokens |
| ML | ChatBot, LLM, RAG |

---

## ✅ Features

- ✅ User registration and login with JWT authentication
- ✅ Account balance checking and transfers
- ✅ Transaction history and records
- ✅ Loan eligibility checking and payments
- ✅ Fraud detection and alerts
- ✅ NLP-powered chatbot
- ✅ Complete test suite (6 tests)
- ✅ PostgreSQL database with constraints
- ✅ Modern React dashboard UI

---

## 🐛 Troubleshooting

**"ModuleNotFoundError: No module named 'ChatBot'"**
- Activate virtual environment: `.venv\Scripts\activate`
- Install dependencies: `pip install -r requirements.txt`

**"psycopg2.OperationalError: connection refused"**
- Ensure PostgreSQL is running
- Check `.env` file has correct DB credentials
- Default: host=localhost, port=5432, user=postgres

**"Port 5000 already in use"**
- Find process: `netstat -ano | findstr :5000`
- Kill process: `taskkill /PID <pid> /F`

**Tests failing?**
- Activate venv: `.venv\Scripts\activate`
- Run: `python -m pytest tests/ -v`

---

## 📞 Project Status

- ✅ Database schema complete with all tables, constraints, and seed data
- ✅ Backend API fully implemented with 11+ endpoints
- ✅ Frontend dashboard UI complete with all operations
- ✅ Authentication and JWT tokens working
- ✅ Test suite passing (6 tests, 0 failures)
- ✅ Production-ready code

---

## 🎓 Academic Project

Final Year Project (FYP) - Banking Chatbot System
- Full-stack web application
- PostgreSQL database with 16 tables
- Flask REST API with ML/NLP integration
- React frontend dashboard

**Created:** May 2026  
**Status:** ✅ COMPLETE & TESTED
