"""Unlock all demo accounts in banking_bot.db.
Run from backend folder: python unlock_all_accounts.py
"""
import sqlite3
from pathlib import Path

db_path = Path(__file__).with_name("banking_bot.db")
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("UPDATE accounts SET status = 'Active' WHERE status != 'Active'")
conn.commit()
print(f"Unlocked {cur.rowcount} account(s). Database: {db_path}")
conn.close()
