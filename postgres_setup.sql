-- Banking chatbot PostgreSQL schema
-- Run the database creation step first, then connect to banking_bot before executing the rest.

CREATE DATABASE banking_bot;

-- In psql, connect with:
-- \c banking_bot

-- =========================
-- CORE CUSTOMER + BANKING ENTITIES
-- =========================

CREATE TABLE IF NOT EXISTS customers (
    customer_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
    account_id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_accounts_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers (customer_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_account_type
        CHECK (account_type IN ('Savings', 'Current')),
    CONSTRAINT chk_account_status
        CHECK (status IN ('Active', 'Blocked'))
);

CREATE TABLE IF NOT EXISTS bank_transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    transaction_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    receiver_account_id BIGINT NULL,
    notes TEXT NULL,
    CONSTRAINT fk_transactions_account
        FOREIGN KEY (account_id)
        REFERENCES accounts (account_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_transactions_receiver_account
        FOREIGN KEY (receiver_account_id)
        REFERENCES accounts (account_id)
        ON DELETE SET NULL,
    CONSTRAINT chk_transaction_type
        CHECK (transaction_type IN ('Deposit', 'Withdraw', 'Transfer')),
    CONSTRAINT chk_transfer_receiver
        CHECK (
            transaction_type <> 'Transfer'
            OR receiver_account_id IS NOT NULL
        )
);

CREATE TABLE IF NOT EXISTS conversations (
    chat_id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMPTZ NULL,
    CONSTRAINT fk_conversations_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers (customer_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_conversation_time
        CHECK (end_time IS NULL OR end_time >= start_time)
);

CREATE TABLE IF NOT EXISTS messages (
    message_id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    sender VARCHAR(10) NOT NULL,
    message_text TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_messages_chat
        FOREIGN KEY (chat_id)
        REFERENCES conversations (chat_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_message_sender
        CHECK (sender IN ('user', 'bot'))
);

CREATE TABLE IF NOT EXISTS auth_sessions (
    session_id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expiry_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sessions_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers (customer_id)
        ON DELETE CASCADE
);

-- Legacy chat log table kept for the existing Flask app save_chat() call.
CREATE TABLE IF NOT EXISTS chats (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NULL,
    message TEXT NOT NULL,
    intent VARCHAR(255) NOT NULL,
    response TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chats_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers (customer_id)
        ON DELETE SET NULL
);

-- =========================
-- OPTIONAL CHATBOT SUPPORT TABLES
-- =========================

CREATE TABLE IF NOT EXISTS intents (
    intent_id BIGSERIAL PRIMARY KEY,
    intent_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL
);

CREATE TABLE IF NOT EXISTS query_logs (
    log_id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NULL,
    query_text TEXT NOT NULL,
    response TEXT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_query_logs_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers (customer_id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS admins (
    admin_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- LOAN SYSTEM
-- =========================

CREATE TABLE IF NOT EXISTS loan_policies (
    policy_id BIGSERIAL PRIMARY KEY,
    loan_type VARCHAR(50) NOT NULL UNIQUE,
    min_income NUMERIC(14, 2) NOT NULL CHECK (min_income >= 0),
    max_amount NUMERIC(14, 2) NOT NULL CHECK (max_amount > 0),
    interest_rate NUMERIC(5, 2) NOT NULL CHECK (interest_rate > 0),
    max_duration_months INTEGER NOT NULL CHECK (max_duration_months > 0),
    credit_score_required INTEGER NOT NULL CHECK (credit_score_required BETWEEN 300 AND 900)
);

CREATE TABLE IF NOT EXISTS loans (
    loan_id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    loan_type VARCHAR(50) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    interest_rate NUMERIC(5, 2) NOT NULL CHECK (interest_rate > 0),
    duration_months INTEGER NOT NULL CHECK (duration_months > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_loans_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers (customer_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_loans_policy
        FOREIGN KEY (loan_type)
        REFERENCES loan_policies (loan_type)
        ON DELETE RESTRICT,
    CONSTRAINT chk_loan_status
        CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Closed'))
);

CREATE TABLE IF NOT EXISTS loan_payments (
    payment_id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL,
    amount_paid NUMERIC(14, 2) NOT NULL CHECK (amount_paid > 0),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remaining_balance NUMERIC(14, 2) NOT NULL CHECK (remaining_balance >= 0),
    CONSTRAINT fk_loan_payments_loan
        FOREIGN KEY (loan_id)
        REFERENCES loans (loan_id)
        ON DELETE CASCADE
);

-- =========================
-- FRAUD / SECURITY
-- =========================

CREATE TABLE IF NOT EXISTS login_activities (
    login_id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    ip_address INET NOT NULL,
    location VARCHAR(150) NULL,
    device VARCHAR(150) NULL,
    login_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_login_activities_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers (customer_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transaction_limits (
    limit_id BIGSERIAL PRIMARY KEY,
    account_type VARCHAR(20) NOT NULL UNIQUE,
    daily_limit NUMERIC(14, 2) NOT NULL CHECK (daily_limit > 0),
    per_transaction_limit NUMERIC(14, 2) NOT NULL CHECK (per_transaction_limit > 0),
    CONSTRAINT chk_limit_account_type
        CHECK (account_type IN ('Savings', 'Current'))
);

CREATE TABLE IF NOT EXISTS fraud_rules (
    rule_id BIGSERIAL PRIMARY KEY,
    rule_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    threshold_value NUMERIC(14, 2) NOT NULL CHECK (threshold_value >= 0),
    action VARCHAR(20) NOT NULL,
    CONSTRAINT chk_fraud_rule_action
        CHECK (action IN ('Flag', 'Block', 'Alert'))
);

CREATE TABLE IF NOT EXISTS fraud_alerts (
    alert_id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT NOT NULL,
    fraud_type VARCHAR(30) NOT NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fraud_alerts_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES bank_transactions (transaction_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_fraud_type
        CHECK (fraud_type IN ('High Amount', 'Location Change', 'Multiple Attempts')),
    CONSTRAINT chk_fraud_status
        CHECK (status IN ('Pending', 'Reviewed', 'Confirmed'))
);

-- =========================
-- INDEXES FOR FAST LOOKUPS
-- =========================

CREATE INDEX IF NOT EXISTS idx_accounts_customer_id ON accounts (customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON bank_transactions (account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver_account_id ON bank_transactions (receiver_account_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations (customer_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages (chat_id);
CREATE INDEX IF NOT EXISTS idx_sessions_customer_id ON auth_sessions (customer_id);
CREATE INDEX IF NOT EXISTS idx_loans_customer_id ON loans (customer_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON loan_payments (loan_id);
CREATE INDEX IF NOT EXISTS idx_login_activities_customer_id ON login_activities (customer_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_transaction_id ON fraud_alerts (transaction_id);

-- =========================
-- SAMPLE DATA FOR DEMO / TESTING
-- =========================

INSERT INTO intents (intent_name, description)
VALUES
    ('greeting', 'General welcome or hello message'),
    ('balance_inquiry', 'Customer wants to know account balance'),
    ('transfer', 'Customer wants to transfer money'),
    ('card_block', 'Customer wants to block a card'),
    ('loan_eligibility', 'Customer wants to check loan eligibility'),
    ('emi_check', 'Customer wants to know EMI or payment details'),
    ('fraud_check', 'Customer wants to check suspicious activity')
ON CONFLICT (intent_name) DO NOTHING;

INSERT INTO loan_policies (loan_type, min_income, max_amount, interest_rate, max_duration_months, credit_score_required)
VALUES
    ('Home', 50000, 5000000, 8.50, 240, 750),
    ('Car', 30000, 2000000, 10.25, 84, 700),
    ('Personal', 20000, 1000000, 13.75, 60, 650)
ON CONFLICT (loan_type) DO NOTHING;

INSERT INTO transaction_limits (account_type, daily_limit, per_transaction_limit)
VALUES
    ('Savings', 250000, 100000),
    ('Current', 1000000, 250000)
ON CONFLICT (account_type) DO NOTHING;

INSERT INTO fraud_rules (rule_name, description, threshold_value, action)
VALUES
    ('High Value Transfer', 'Flag transfers above the threshold amount', 100000, 'Flag'),
    ('Repeated Failed Login', 'Alert when repeated failed logins are detected', 5, 'Alert'),
    ('Suspicious Location Change', 'Block when the login location changes unusually fast', 1, 'Block')
ON CONFLICT (rule_name) DO NOTHING;

INSERT INTO admins (name, role, email)
VALUES
    ('Bank Admin', 'Super Admin', 'admin@bankingbot.local')
ON CONFLICT (email) DO NOTHING;

INSERT INTO customers (name, email, phone, password_hash)
VALUES
    ('Demo Customer', 'demo.customer@bankingbot.local', '+10000000001', '$2b$12$demo.placeholder.hash.for.testing.only')
ON CONFLICT (email) DO NOTHING;

INSERT INTO accounts (customer_id, account_type, balance, status)
SELECT customer_id, 'Savings', 25000, 'Active'
FROM customers
WHERE email = 'demo.customer@bankingbot.local'
ON CONFLICT DO NOTHING;

