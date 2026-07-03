import os
import sqlite3

def force_init():
    if os.path.exists('banking_bot.db'):
        os.remove('banking_bot.db')
    
    conn = sqlite3.connect('banking_bot.db')
    sql_path = os.path.join('database', 'sqlite_setup.sql')
    with open(sql_path, 'r') as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
    print("Database forcefully recreated and initialized.")

if __name__ == '__main__':
    try:
        force_init()
    except Exception as e:
        print("Error:", e)
