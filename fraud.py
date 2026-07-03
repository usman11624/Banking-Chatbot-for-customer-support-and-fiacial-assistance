from flask import Blueprint, request, jsonify
from app.auth_utils import auth_required
from app.db import get_db, lock_account
from app.services.llm import generate_response

fraud_bp = Blueprint('fraud', __name__)

@fraud_bp.route('/alerts', methods=['GET'])
@auth_required
def get_alerts(current_customer):
    conn = get_db()
    cur = conn.cursor()
    cur.execute('''
        SELECT f.alert_id, f.transaction_id, f.fraud_type, f.risk_score, f.status 
        FROM fraud_alerts f
        JOIN bank_transactions t ON f.transaction_id = t.transaction_id
        JOIN accounts a ON t.account_id = a.account_id
        WHERE a.customer_id = ?
    ''', (current_customer,))
    alerts = [dict(r) for r in cur.fetchall()]
    
    # Fetch recent transactions to provide context
    cur.execute('''
        SELECT transaction_type, amount, transaction_timestamp 
        FROM bank_transactions t
        JOIN accounts a ON t.account_id = a.account_id
        WHERE a.customer_id = ? ORDER BY transaction_timestamp DESC LIMIT 5
    ''', (current_customer,))
    txs = [dict(r) for r in cur.fetchall()]
    # Fetch user name
    cur.execute("SELECT name FROM customers WHERE customer_id = ?", (current_customer,))
    user_row = cur.fetchone()
    user_name = user_row['name'] if user_row else "User"
    
    conn.close()
    
    # Generate AI Analytics via Groq
    context = f"User: {user_name}\nRecent Fraud Alerts: {alerts}\nRecent Transactions: {txs}"
    prompt = "Analyze this banking data. Give a concise, professional 3-sentence security summary for the user. Address the user by their name. In your response, briefly explain how you continuously monitor for malicious activity (e.g. tracking unusual locations, high-value transfers, and rapid transactions). Do not include markdown or bold text, just plain text. IMPORTANT: ALWAYS use 'RS' (Pakistani Rupees) for any currency amount. NEVER use the dollar sign ($)."
    ai_analysis = generate_response(context, prompt)
    
    return jsonify({'alerts': alerts, 'ai_analysis': ai_analysis})

@fraud_bp.route('/lock', methods=['POST'])
@auth_required
def lock_account_route(current_customer):
    data = request.get_json() or {}
    account_id = data.get('account_id')
    lock_status = data.get('lock', True)
    
    if not account_id:
        return jsonify({'error': 'account_id required'}), 400
        
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT customer_id FROM accounts WHERE account_id = ?", (account_id,))
    acc = cur.fetchone()
    conn.close()
    
    if not acc or acc['customer_id'] != current_customer:
        return jsonify({'error': 'Account not found or not owned by you'}), 403
        
    ok, msg = lock_account(account_id, lock_status)
    if not ok:
        return jsonify({'error': msg}), 400
        
    return jsonify({'status': 'ok', 'message': msg})
