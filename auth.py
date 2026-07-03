from flask import Blueprint, request, jsonify
import bcrypt
import uuid
from datetime import datetime, timedelta
from app.db import get_db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    password = data.get('password')
    
    if not all([name, email, phone, password]):
        return jsonify({'error': 'Missing fields'}), 400
        
    pwd_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO customers (name, email, phone, password_hash) VALUES (?, ?, ?, ?)", (name, email, phone, pwd_hash))
        customer_id = cur.lastrowid
        cur.execute("INSERT INTO accounts (customer_id, account_type, balance) VALUES (?, 'Savings', 0)", (customer_id,))
        conn.commit()
        return jsonify({'status': 'ok', 'message': 'Registered successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT customer_id, password_hash FROM customers WHERE email = ?", (email,))
    user = cur.fetchone()
    
    if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        token = str(uuid.uuid4())
        expiry = (datetime.now() + timedelta(days=1)).isoformat()
        cur.execute("INSERT INTO auth_sessions (customer_id, token, expiry_time) VALUES (?, ?, ?)", (user['customer_id'], token, expiry))
        
        ip_addr = request.remote_addr or 'Unknown'
        cur.execute("INSERT INTO login_activities (customer_id, ip_address, location, device) VALUES (?, ?, 'Unknown', 'Web Browser')", (user['customer_id'], ip_addr))
        
        conn.commit()
        conn.close()
        return jsonify({'status': 'ok', 'token': token, 'customer_id': user['customer_id']})
    
    conn.close()
    return jsonify({'error': 'Invalid credentials'}), 401

from app.auth_utils import auth_required

@auth_bp.route('/profile', methods=['GET'])
@auth_required
def get_profile(current_customer):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT name, email, phone, created_at FROM customers WHERE customer_id = ?", (current_customer,))
    profile = cur.fetchone()
    
    cur.execute("SELECT ip_address, location, device, login_time FROM login_activities WHERE customer_id = ? ORDER BY login_time DESC LIMIT 10", (current_customer,))
    logins = [dict(r) for r in cur.fetchall()]
    
    conn.close()
    if profile:
        return jsonify({'profile': dict(profile), 'logins': logins})
    return jsonify({'error': 'Profile not found'}), 404

@auth_bp.route('/profile/update', methods=['POST'])
@auth_required
def update_profile(current_customer):
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')

    if not all([name, email, phone]):
        return jsonify({'error': 'Missing fields'}), 400

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("UPDATE customers SET name = ?, email = ?, phone = ? WHERE customer_id = ?", (name, email, phone, current_customer))
        conn.commit()
        return jsonify({'status': 'ok', 'message': 'Profile updated successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()
