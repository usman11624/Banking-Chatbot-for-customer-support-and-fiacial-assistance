from flask import Blueprint, request, jsonify
from app.auth_utils import auth_required
from app.db import get_db, calculate_credit_score
from app.services.llm import generate_response

loans_bp = Blueprint('loans', __name__)

@loans_bp.route('/credit_score', methods=['GET'])
@auth_required
def get_credit_score(current_customer):
    score, breakdown = calculate_credit_score(current_customer)
    return jsonify({
        'credit_score': score,
        'breakdown': breakdown
    })

@loans_bp.route('/eligibility', methods=['POST'])
@auth_required
def check_eligibility(current_customer):
    data = request.get_json() or {}
    loan_type = data.get('loan_type', 'Personal')
    try:
        income = float(data.get('income', 0))
        credit_score = int(data.get('credit_score', 0))
    except:
        return jsonify({'error': 'Invalid numeric data'}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM loan_policies WHERE loan_type = ?", (loan_type,))
    policy = cur.fetchone()
    conn.close()

    if not policy:
        return jsonify({'error': 'Invalid loan type requested'}), 400

    is_eligible = True
    reason = ""

    if income < policy['min_income']:
        is_eligible = False
        reason += f"Income ${income} is below the required ${policy['min_income']}. "
    if credit_score < policy['credit_score_required']:
        is_eligible = False
        reason += f"Credit score {credit_score} is below the required {policy['credit_score_required']}. "

    context = f"Loan Type: {loan_type}, User Income: ${income}, User Credit Score: {credit_score}, Policy Min Income: ${policy['min_income']}, Policy Min Credit: {policy['credit_score_required']}."
    
    if is_eligible:
        prompt = "The user is approved for this loan. Act as a professional AI banking advisor and congratulate them, giving a brief 1-2 sentence recommendation on managing their new loan responsibly. No markdown formatting. IMPORTANT: ALWAYS use 'RS' (Pakistani Rupees) for any currency amount, never use the dollar sign ($)."
        ai_advisor = generate_response(context, prompt)
        return jsonify({
            'eligible': True, 
            'max_amount': policy['max_amount'], 
            'interest_rate': policy['interest_rate'],
            'max_duration_months': policy['max_duration_months'],
            'ai_advisor': ai_advisor
        })
    else:
        prompt = f"The user is rejected for this loan because: {reason}. Act as a professional AI banking advisor. Gently explain why they were rejected and give a 1-2 sentence tip on how they can improve their eligibility (e.g. build credit, increase income). No markdown formatting. IMPORTANT: ALWAYS use 'RS' (Pakistani Rupees) for any currency amount, never use the dollar sign ($)."
        ai_advisor = generate_response(context, prompt)
        return jsonify({
            'eligible': False, 
            'reason': reason,
            'ai_advisor': ai_advisor
        })

@loans_bp.route('/payment', methods=['POST'])
@auth_required
def make_payment(current_customer):
    data = request.get_json()
    loan_id = data.get('loan_id')
    amount = data.get('amount')
    
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT customer_id, amount, status FROM loans WHERE loan_id = ?", (loan_id,))
        loan = cur.fetchone()
        if not loan or loan['customer_id'] != current_customer:
            return jsonify({'error': 'Invalid loan'}), 403
            
        cur.execute("INSERT INTO loan_payments (loan_id, amount_paid, remaining_balance) VALUES (?, ?, ?)", (loan_id, amount, loan['amount'] - amount))
        conn.commit()
        return jsonify({'status': 'ok'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()
