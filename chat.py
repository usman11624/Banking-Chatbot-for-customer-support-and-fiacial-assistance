from flask import Blueprint, request, jsonify
from app.auth_utils import auth_required
from app.db import get_db, calculate_credit_score
from app.services.ChatBot import predict_intent_with_source
from app.services.llm import generate_response

chat_bp = Blueprint('chat', __name__)
SESSIONS = {}

@chat_bp.route('/chat', methods=['POST'])
@auth_required
def chat(current_customer):
    data = request.get_json()
    message = data.get('message', '')
    session_id = data.get('session_id', 'default')
    
    if session_id not in SESSIONS:
        SESSIONS[session_id] = {'state': 'idle'}
        
    intent, intent_source = predict_intent_with_source(message)
    
    # Fetch User Context
    conn = get_db()
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT name FROM customers WHERE customer_id = ?", (current_customer,))
        user_name = cur.fetchone()['name']
        
        cur.execute("SELECT account_id, account_type, balance, status FROM accounts WHERE customer_id = ?", (current_customer,))
        accounts = [dict(r) for r in cur.fetchall()]
        
        cur.execute('''
            SELECT transaction_type, amount, transaction_timestamp 
            FROM bank_transactions t
            JOIN accounts a ON t.account_id = a.account_id
            WHERE a.customer_id = ? ORDER BY transaction_timestamp DESC LIMIT 3
        ''', (current_customer,))
        transactions = [dict(r) for r in cur.fetchall()]
        
        cur.execute("SELECT loan_type, min_income, max_amount, interest_rate, max_duration_months, credit_score_required FROM loan_policies")
        policies = [dict(r) for r in cur.fetchall()]
        
        credit_score, breakdown = calculate_credit_score(current_customer)
        
        context = f"User Name: {user_name}. Accounts: {accounts}. Recent Transactions: {transactions}. User Credit Score: {credit_score}. Bank Loan Policies: {policies}."
        
        reply = generate_response(context, message)
        
        cur.execute("INSERT INTO query_logs (customer_id, query_text, response) VALUES (?, ?, ?)", (current_customer, message, reply))
        conn.commit()
    except Exception as e:
        print("Chat Error:", e)
        reply = "I encountered an error retrieving your account details."
    finally:
        conn.close()
    
    return jsonify({
        'response': reply,
        'intent': intent,
        'source': 'AI',
        'session_id': session_id
    })

import tempfile
import os
from app.services.audio import transcribe_audio_file

@chat_bp.route('/voice/transcribe', methods=['POST'])
@auth_required
def transcribe_voice(current_customer):
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    file = request.files['audio']
    if file.filename == '':
        return jsonify({'error': 'No audio file selected'}), 400
        
    try:
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, f"audio_{current_customer}.webm")
        file.save(temp_path)
        
        text = transcribe_audio_file(temp_path)
        
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        return jsonify({'text': text})
    except Exception as e:
        print("Transcription Error:", e)
        return jsonify({'error': str(e)}), 500
