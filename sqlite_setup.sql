CREATE TABLE IF NOT EXISTS customers (
    customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
    account_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    balance REAL NOT NULL DEFAULT 0 CHECK (balance >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (customer_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bank_transactions (
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    transaction_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    receiver_account_id INTEGER NULL,
    notes TEXT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts (account_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_account_id) REFERENCES accounts (account_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS conversations (
    chat_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME NULL,
    FOREIGN KEY (customer_id) REFERENCES customers (customer_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    sender VARCHAR(10) NOT NULL,
    message_text TEXT NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES conversations (chat_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS auth_sessions (
    session_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expiry_time DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (customer_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NULL,
    message TEXT NOT NULL,
    intent VARCHAR(255) NOT NULL,
    response TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (customer_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS intents (
    intent_id INTEGER PRIMARY KEY AUTOINCREMENT,
    intent_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL
);

CREATE TABLE IF NOT EXISTS query_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NULL,
    query_text TEXT NOT NULL,
    response TEXT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (customer_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS admins (
    admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loan_policies (
    policy_id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_type VARCHAR(50) NOT NULL UNIQUE,
    min_income REAL NOT NULL CHECK (min_income >= 0),
    max_amount REAL NOT NULL CHECK (max_amount > 0),
    interest_rate REAL NOT NULL CHECK (interest_rate > 0),
    max_duration_months INTEGER NOT NULL CHECK (max_duration_months > 0),
    credit_score_required INTEGER NOT NULL CHECK (credit_score_required BETWEEN 300 AND 900)
);

CREATE TABLE IF NOT EXISTS loans (
    loan_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    loan_type VARCHAR(50) NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    interest_rate REAL NOT NULL CHECK (interest_rate > 0),
    duration_months INTEGER NOT NULL CHECK (duration_months > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (customer_id) ON DELETE CASCADE,
    FOREIGN KEY (loan_type) REFERENCES loan_policies (loan_type) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS loan_payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    amount_paid REAL NOT NULL CHECK (amount_paid > 0),
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remaining_balance REAL NOT NULL CHECK (remaining_balance >= 0),
    FOREIGN KEY (loan_id) REFERENCES loans (loan_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS login_activities (
    login_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    ip_address VARCHAR(50) NOT NULL,
    location VARCHAR(150) NULL,
    device VARCHAR(150) NULL,
    login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (customer_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transaction_limits (
    limit_id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_type VARCHAR(20) NOT NULL UNIQUE,
    daily_limit REAL NOT NULL CHECK (daily_limit > 0),
    per_transaction_limit REAL NOT NULL CHECK (per_transaction_limit > 0)
);

CREATE TABLE IF NOT EXISTS fraud_rules (
    rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    threshold_value REAL NOT NULL CHECK (threshold_value >= 0),
    action VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS fraud_alerts (
    alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    fraud_type VARCHAR(30) NOT NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES bank_transactions (transaction_id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO intents (intent_name, description) VALUES
    ('greeting', 'General welcome or hello message'),
    ('balance_inquiry', 'Customer wants to know account balance'),
    ('transfer', 'Customer wants to transfer money'),
    ('card_block', 'Customer wants to block a card'),
    ('loan_eligibility', 'Customer wants to check loan eligibility'),
    ('emi_check', 'Customer wants to know EMI or payment details'),
    ('fraud_check', 'Customer wants to check suspicious activity');

INSERT OR IGNORE INTO loan_policies (loan_type, min_income, max_amount, interest_rate, max_duration_months, credit_score_required) VALUES
    ('Home', 50000, 5000000, 8.50, 240, 750),
    ('Car', 30000, 2000000, 10.25, 84, 700),
    ('Personal', 20000, 1000000, 13.75, 60, 650);

INSERT OR IGNORE INTO transaction_limits (account_type, daily_limit, per_transaction_limit) VALUES
    ('Savings', 250000, 100000),
    ('Current', 1000000, 250000);

INSERT OR IGNORE INTO fraud_rules (rule_name, description, threshold_value, action) VALUES
    ('High Value Transfer', 'Flag transfers above the threshold amount', 100000, 'Flag'),
    ('Repeated Failed Login', 'Alert when repeated failed logins are detected', 5, 'Alert'),
    ('Suspicious Location Change', 'Block when the login location changes unusually fast', 1, 'Block');

INSERT OR IGNORE INTO admins (name, role, email) VALUES
    ('Bank Admin', 'Super Admin', 'admin@bankingbot.local');

INSERT OR IGNORE INTO customers (name, email, phone, password_hash) VALUES
    ('Demo Customer', 'demo.customer@bankingbot.local', '+10000000001', '$2b$12$demo.placeholder.hash.for.testing.only');

INSERT OR IGNORE INTO accounts (customer_id, account_type, balance, status)
SELECT customer_id, 'Savings', 25000, 'Active'
FROM customers
WHERE email = 'demo.customer@bankingbot.local';
