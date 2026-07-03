# Banking Chatbot - Full Stack Setup Guide

A complete banking chatbot application with React frontend, Flask backend, and PostgreSQL database.

## 📋 Prerequisites

- **Python 3.13+** ([Download](https://www.python.org/downloads/))
- **Node.js 16+** ([Download](https://nodejs.org/))
- **PostgreSQL 12+** ([Download](https://www.postgresql.org/download/))
- **Git** (optional, for version control)

## 🚀 Quick Start (Windows)

### 1. Extract the zip file to your desired location

```
C:\Projects\Banking-Chatbot
```

### 2. Set up PostgreSQL Database

#### Option A: Using Windows GUI (easiest)

1. Open **pgAdmin 4** (installed with PostgreSQL)
   - URL: `http://localhost:5050` (default)
   - Login with your PostgreSQL password
2. Right-click **Databases** → **Create** → **Database**
   - Name: `banking_bot`
   - Click **Save**
3. Expand `banking_bot` → **Schemas** → **public** → **Scripts**
4. Right-click **Scripts** → **Create** → **Script**
   - Open the file: `database/postgres_setup.sql`
   - Copy all contents and paste into the script editor
   - Click **Execute**

#### Option B: Using PowerShell (command-line)

```powershell
# Connect to PostgreSQL and create database
psql -U postgres -c "CREATE DATABASE banking_bot;"

# Run the schema setup
psql -U postgres -d banking_bot -f database/postgres_setup.sql
```

**Expected output:** No errors, tables created successfully.

### 3. Start the Backend (Python / Flask)

Open PowerShell and run:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Then start the server:

```powershell
$env:DB_HOST = "localhost"
$env:DB_PORT = "5432"
$env:DB_NAME = "banking_bot"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "wahaj124"
python app.py
```

**Expected output:**
```
 * Running on http://127.0.0.1:5000
```

### 4. Start the Frontend (React)

Open a **new PowerShell window** (keep backend running) and run:

```powershell
cd frontend
npm install
npm start
```

**Expected output:**
```
Compiled successfully!
On Your Network: http://192.168.x.x:3000
```

The browser will open automatically at `http://localhost:3000` (or `http://localhost:3006` if 3000 is in use).

---

## 📱 Using the App

### Auth Panel (Sign up / Log in)

1. Click **Auth** in the sidebar
2. **Sign up:** Fill all fields (name, email, phone, password) → click **Sign up**
   - Auto-logs you in and shows your account ID
3. **Log in:** Enter email & password → click **Sign in**
   - Token is saved in browser localStorage

### Accounts Panel (Balance & Transfer)

1. After login, you're auto-switched to **Accounts** panel
2. **Check balance:**
   - Account ID is pre-filled (your primary account)
   - Click **Fetch balance** to see details
3. **Transfer funds:**
   - **From account:** Your account (pre-filled)
   - **To account:** Enter recipient account ID (e.g., 2, 3, 4)
   - **Amount:** Enter transfer amount (max 100,000)
   - Click **Send money**
   - Enter 6-digit OTP (shown in response) to confirm

### Chat Panel

1. Click **Chat** in sidebar
2. Ask banking questions:
   - "What's my balance?" → tells you to specify account
   - "Transfer 500 to Alice" → initiates transfer + OTP
   - "Loan eligibility" → shows policies & requirements
   - "Fraud alert" → creates fraud report
3. Optional: Enable **Voice mode** to use speech-to-text (Chrome/Edge only, localhost)

### Other Panels

- **Loans:** Check eligibility, make loan payments
- **Fraud:** Report suspicious transactions
- **Logs:** Keep a query log for viva/demo

---

## 🔧 Troubleshooting

### "Cannot connect to backend" error

**Solution:**
1. Ensure Flask is running on port 5000:
   ```powershell
   netstat -ano | findstr ":5000"
   ```
   If not running, restart backend (see step 3 above).
2. Ensure PostgreSQL is running:
   - Windows: Check **Services** → search for "PostgreSQL"
   - If not running, start it manually

### "Unauthorized (401)" when fetching balance

**Solution:**
1. Reload the page (Ctrl+R or F5)
2. Re-login from the Auth panel (new token will be generated)
3. Retry **Fetch balance**

### Database connection error

**Solution:**
1. Verify PostgreSQL is running (see above)
2. Confirm database credentials in `backend/app.py` (line ~75):
   ```python
   DB_HOST = os.getenv("DB_HOST", "localhost")
   DB_PORT = int(os.getenv("DB_PORT", "5432"))
   DB_NAME = os.getenv("DB_NAME", "banking_bot")
   DB_USER = os.getenv("DB_USER", "postgres")
   DB_PASSWORD = os.getenv("DB_PASSWORD", "wahaj124")
   ```
3. Ensure the database exists:
   ```powershell
   psql -U postgres -l  # lists all databases
   ```

### Port already in use (e.g., 3000, 5000)

**Solution:**
```powershell
# Find and kill process on port 5000
netstat -ano | findstr ":5000"
taskkill /PID <PID> /F

# Or use a different port
set REACT_APP_API_BASE_URL=http://127.0.0.1:5001  # if backend on 5001
npm start
```

---

## 📁 Project Structure

```
Banking Chat Bot/
├── backend/
│   ├── app.py                 # Flask server + endpoints
│   ├── ChatBot.py             # Intent classifier
│   ├── rag_llm.py             # RAG fallback
│   ├── llm.py                 # GPT integration (optional)
│   ├── requirements.txt        # Python dependencies
│   ├── models/                # Trained ML models
│   └── tests/                 # Unit tests
├── frontend/
│   ├── src/
│   │   ├── App.js             # React main component
│   │   ├── App.css            # Styling
│   │   └── index.js           # React entry point
│   ├── public/
│   ├── package.json           # Node dependencies
│   └── README.md
├── database/
│   ├── postgres_setup.sql     # Schema + sample data
│   └── *.csv                  # Training data
├── SETUP_GUIDE.md             # This file
└── README.md
```

---

## 🛠️ Development

### Running Tests (Backend)

```powershell
cd backend
python -m pytest tests/ -v
```

### Adding New Features

1. **Backend endpoint:** Edit `backend/app.py`
   - Add route: `@app.route('/new', methods=['POST'])`
   - Restart Flask server
2. **Frontend UI:** Edit `frontend/src/App.js`
   - Add state: `const [newForm, setNewForm] = useState({})`
   - Restart React with `npm start` (auto-reload)
3. **Database schema:** Edit `database/postgres_setup.sql`
   - Recreate database or run migrations

### Configuring LLM/GPT

- Set `OPENAI_API_KEY` environment variable:
  ```powershell
  $env:OPENAI_API_KEY = "sk-..."
  ```
- RAG automatically falls back if LLM unavailable

---

## 📞 Support

- **Backend logs:** Check Flask terminal for errors
- **Frontend errors:** Open DevTools (F12) → Console tab
- **Database issues:** Use `psql -U postgres -d banking_bot` to inspect tables

---

## 📄 License

FYP (Final Year Project) - Banking Chatbot 2026
