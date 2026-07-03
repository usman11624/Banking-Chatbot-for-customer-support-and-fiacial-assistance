import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'banking_bot.db')

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    try:
        if not os.path.exists(DB_PATH):
            conn = get_db()
            sql_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'sqlite_setup.sql')
            if os.path.exists(sql_path):
                with open(sql_path, 'r') as f:
                    conn.executescript(f.read())
                conn.commit()
                print("SQLite Database initialized.")
            conn.close()
        else:
            print("SQLite Database already exists.")
    except Exception as e:
        print("DB INIT ERROR:", e)

def get_account(account_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT account_id, customer_id, balance, status FROM accounts WHERE account_id = ?", (account_id,))
    row = cur.fetchone()
    conn.close()
    return row

def get_transactions_for_account(account_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT transaction_id, account_id, transaction_type, amount, transaction_timestamp, receiver_account_id, notes FROM bank_transactions WHERE account_id = ? ORDER BY transaction_timestamp DESC", (account_id,))
    rows = cur.fetchall()
    conn.close()
    return rows

def perform_transfer(from_acc, to_acc, amount):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("BEGIN TRANSACTION")
        
        cur.execute("SELECT balance, status FROM accounts WHERE account_id = ?", (from_acc,))
        src = cur.fetchone()
        if not src or src['status'] != 'Active':
            conn.rollback()
            return False, "Source account invalid or blocked"
        if src['balance'] < amount:
            conn.rollback()
            return False, "Insufficient funds"
            
        cur.execute("SELECT status FROM accounts WHERE account_id = ?", (to_acc,))
        dst = cur.fetchone()
        if not dst or dst['status'] != 'Active':
            conn.rollback()
            return False, "Destination account invalid or blocked"
            
        cur.execute("UPDATE accounts SET balance = balance - ? WHERE account_id = ?", (amount, from_acc))
        cur.execute("UPDATE accounts SET balance = balance + ? WHERE account_id = ?", (amount, to_acc))
        
        cur.execute("INSERT INTO bank_transactions (account_id, transaction_type, amount, receiver_account_id) VALUES (?, 'Transfer', ?, ?)", (from_acc, amount, to_acc))
        cur.execute("SELECT last_insert_rowid() AS tx_id")
        tx_id = cur.fetchone()['tx_id']

        cur.execute("INSERT INTO bank_transactions (account_id, transaction_type, amount, receiver_account_id) VALUES (?, 'Deposit', ?, NULL)", (to_acc, amount))
        
        if amount >= 10000:
            cur.execute("INSERT INTO fraud_alerts (transaction_id, fraud_type, risk_score, status) VALUES (?, 'High Value Transfer', 85, 'Pending')", (tx_id,))
        
        conn.commit()
        return True, "Transfer successful"
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        conn.close()

def perform_deposit(account_id, amount):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("BEGIN TRANSACTION")
        
        cur.execute("SELECT status FROM accounts WHERE account_id = ?", (account_id,))
        acc = cur.fetchone()
        if not acc or acc['status'] != 'Active':
            conn.rollback()
            return False, "Account invalid or blocked"
            
        cur.execute("UPDATE accounts SET balance = balance + ? WHERE account_id = ?", (amount, account_id))
        
        cur.execute("INSERT INTO bank_transactions (account_id, transaction_type, amount, receiver_account_id) VALUES (?, 'Deposit', ?, NULL)", (account_id, amount))
        
        conn.commit()
        return True, "Deposit successful"
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        conn.close()

def lock_account(account_id, lock):
    conn = get_db()
    cur = conn.cursor()
    try:
        new_status = 'Locked' if lock else 'Active'
        cur.execute("UPDATE accounts SET status = ? WHERE account_id = ?", (new_status, account_id))
        conn.commit()
        return True, f"Account {new_status}"
    except Exception as e:
        return False, str(e)
    finally:
        conn.close()

def calculate_credit_score(customer_id):
    """
    Calculates a dynamic credit score based on:
    - Base score: 600
    - Total Balance across accounts: up to +100 points
    - Transaction count: up to +150 points
    Returns: (score, breakdown_dict)
    """
    base_score = 600
    balance_points = 0
    activity_points = 0
    
    conn = get_db()
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT SUM(balance) as total_balance FROM accounts WHERE customer_id = ?", (customer_id,))
        row = cur.fetchone()
        total_balance = row['total_balance'] if row and row['total_balance'] else 0
        
        # Earn 1 point per 1000 RS, max 100 points
        balance_points = min(100, int(total_balance / 1000))
        
        cur.execute('''
            SELECT COUNT(*) as tx_count FROM bank_transactions t
            JOIN accounts a ON t.account_id = a.account_id
            WHERE a.customer_id = ?
        ''', (customer_id,))
        row = cur.fetchone()
        tx_count = row['tx_count'] if row and row['tx_count'] else 0
        
        # Earn 5 points per transaction, max 150 points
        activity_points = min(150, tx_count * 5)
        
        total_score = min(850, base_score + balance_points + activity_points)
        
        breakdown = {
            'base_score': base_score,
            'balance_points': balance_points,
            'activity_points': activity_points,
            'total_score': total_score,
            'total_balance': total_balance,
            'tx_count': tx_count
        }
        return total_score, breakdown
    except Exception as e:
        print("Error calculating credit score:", e)
        return base_score, {'base_score': base_score, 'balance_points': 0, 'activity_points': 0, 'total_score': base_score}
    finally:
        conn.close()
