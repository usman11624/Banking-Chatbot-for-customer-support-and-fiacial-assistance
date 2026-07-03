from functools import wraps
from flask import request, jsonify
from app.db import get_db

def auth_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized'}), 401
        token = auth_header.split(' ')[1]
        
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT customer_id FROM auth_sessions WHERE token = ?", (token,))
        session = cur.fetchone()
        conn.close()
        
        if not session:
            return jsonify({'error': 'Invalid token'}), 401
            
        current_customer = session['customer_id']
        return f(current_customer, *args, **kwargs)
    return decorated
