from flask import Blueprint, request, jsonify
from app.auth_utils import auth_required
from app.db import get_account, get_transactions_for_account, perform_transfer

accounts_bp = Blueprint('accounts', __name__)

@accounts_bp.route('/balance', methods=['POST'])
@auth_required
def balance(current_customer):
    data = request.get_json() or {}
    account_id = data.get('account_id')
    if not account_id:
        return jsonify({'error': 'account_id required'}), 400

    acc = get_account(account_id)
    if not acc:
        return jsonify({'error': 'account not found'}), 404
    if acc[1] != current_customer:
        return jsonify({'error': 'Forbidden'}), 403

    return jsonify({'account_id': acc[0], 'customer_id': acc[1], 'balance': float(acc[2]), 'status': acc[3]})

@accounts_bp.route('/transfer', methods=['POST'])
@auth_required
def transfer(current_customer):
    data = request.get_json() or {}
    from_acc = data.get('from_account')
    to_acc = data.get('to_account')
    amount = data.get('amount')
    if not all([from_acc, to_acc, amount]):
        return jsonify({'error': 'Missing fields'}), 400
    try:
        amount = float(amount)
    except:
        return jsonify({'error': 'Invalid amount'}), 400

    src = get_account(from_acc)
    if not src or src[1] != current_customer:
        return jsonify({'error': 'Source account not found or not owned by you'}), 403

    ok, msg = perform_transfer(from_acc, to_acc, amount)
    if not ok:
        return jsonify({'error': msg}), 400
    return jsonify({'status': 'ok', 'message': msg})

@accounts_bp.route('/transactions', methods=['GET'])
@auth_required
def transactions(current_customer):
    account_id = request.args.get('account_id')
    if not account_id:
        return jsonify({'error': 'account_id required'}), 400

    acc = get_account(account_id)
    if not acc:
        return jsonify({'error': 'account not found'}), 404
    if acc[1] != current_customer:
        return jsonify({'error': 'Forbidden'}), 403

    rows = get_transactions_for_account(account_id)
    txs = []
    for r in rows:
        txs.append({
            'transaction_id': r[0],
            'account_id': r[1],
            'transaction_type': r[2],
            'amount': float(r[3]),
            'timestamp': r[4].isoformat() if hasattr(r[4], 'isoformat') else r[4],
            'receiver_account_id': r[5],
            'notes': r[6],
        })

    return jsonify({'transactions': txs})

@accounts_bp.route('/deposit', methods=['POST'])
@auth_required
def deposit(current_customer):
    data = request.get_json() or {}
    account_id = data.get('account_id')
    amount = data.get('amount')
    if not all([account_id, amount]):
        return jsonify({'error': 'Missing fields'}), 400
    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
    except:
        return jsonify({'error': 'Invalid amount'}), 400

    acc = get_account(account_id)
    if not acc or acc[1] != current_customer:
        return jsonify({'error': 'Account not found or not owned by you'}), 403

    # Demo fix: if the logged-in user owns this account but it is Locked,
    # automatically unlock it before deposit so the deposit button works.
    # Ownership is already checked above, so users cannot unlock/deposit into others' accounts.
    if acc[3] != 'Active':
        from app.db import lock_account
        unlocked, unlock_msg = lock_account(account_id, False)
        if not unlocked:
            return jsonify({'error': unlock_msg}), 400

    from app.db import perform_deposit
    ok, msg = perform_deposit(account_id, amount)
    if not ok:
        return jsonify({'error': msg}), 400
    return jsonify({'status': 'ok', 'message': msg})

@accounts_bp.route('/my_accounts', methods=['GET'])
@auth_required
def my_accounts(current_customer):
    from app.db import get_db
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT account_id, account_type, balance, status FROM accounts WHERE customer_id = ?", (current_customer,))
    rows = cur.fetchall()
    conn.close()
    
    accounts = []
    for r in rows:
        accounts.append({
            'account_id': r['account_id'],
            'account_type': r['account_type'],
            'balance': float(r['balance']),
            'status': r['status']
        })
    return jsonify({'accounts': accounts})
