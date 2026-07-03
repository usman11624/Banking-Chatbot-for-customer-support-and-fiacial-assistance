Deposit fix applied
===================

Problem:
Deposit was failing with: Account invalid or blocked.
Reason:
The account status was Locked, and backend perform_deposit only allows Active accounts.

Fix applied:
1. Existing demo accounts in banking_bot.db are set to Active.
2. /deposit route now auto-unlocks the logged-in user's own account before deposit.
3. Added unlock_all_accounts.py for manual unlock if needed.

How to run:
cd backend
python run.py

Manual unlock if needed:
cd backend
python unlock_all_accounts.py
