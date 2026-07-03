def predict_intent_with_source(message):
    message = message.lower()
    if 'balance' in message or 'account' in message:
        return 'Check Balance', 'Rule-based'
    elif 'transfer' in message or 'send' in message or 'pay' in message:
        return 'Transfer Funds', 'Rule-based'
    elif 'loan' in message or 'credit' in message:
        return 'Loan Query', 'Rule-based'
    elif 'fraud' in message or 'suspicious' in message or 'alert' in message:
        return 'Fraud/Security', 'Rule-based'
    else:
        return 'General Chat', 'Default'
