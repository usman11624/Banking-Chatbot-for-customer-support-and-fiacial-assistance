import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { callApi, callApiGet } from '../utils/api';
import { Wallet, ArrowRightLeft, ArrowDownToLine, RefreshCcw, CreditCard, Clock, Activity } from 'lucide-react';
import './Accounts.css';

const Accounts = () => {
  const { token } = useAuth();
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [activeAction, setActiveAction] = useState(null); // 'transfer' | 'deposit' | null
  
  const [amount, setAmount] = useState('');
  const [toAccount, setToAccount] = useState('');
  
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    setStatus('');
    try {
      const data = await callApiGet('/my_accounts', {}, token);
      if (data.accounts && data.accounts.length > 0) {
        const primaryAcc = data.accounts[0];
        setAccount(primaryAcc);
        
        // Fetch transactions automatically
        const txData = await callApiGet('/transactions', { account_id: primaryAcc.account_id }, token);
        if (txData.transactions) {
          setTransactions(txData.transactions);
        }
      } else {
        setStatus("No accounts found.");
      }
    } catch (e) {
      setStatus("Failed to load account data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!amount) return;
    setLoading(true);
    setStatus('Processing deposit...');
    try {
      await callApi('/deposit', { account_id: account.account_id, amount }, token);
      setStatus('Deposit successful.');
      setAmount('');
      setActiveAction(null);
      await fetchData(); // Refresh data
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!amount || !toAccount) return;
    setLoading(true);
    setStatus('Processing transfer...');
    try {
      await callApi('/transfer', { from_account: account.account_id, to_account: toAccount, amount }, token);
      setStatus('Transfer successful.');
      setAmount('');
      setToAccount('');
      setActiveAction(null);
      await fetchData(); // Refresh data
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!account) return <div style={{color: '#fff', padding: 24}}>Loading your dashboard...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="accounts-container">
      
      {/* Virtual Card */}
      <div className="virtual-card">
        <div className="virtual-card-header">
          <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
            <CreditCard size={24} color="rgba(255,255,255,0.8)" />
            <span style={{color:'rgba(255,255,255,0.8)', fontSize:'14px', letterSpacing:'1px', textTransform:'uppercase'}}>
              {account.account_type} Account
            </span>
          </div>
          <div className={`status-badge ${account.status.toLowerCase()}`}>{account.status}</div>
        </div>
        
        <div className="virtual-card-balance">
          <span className="currency">RS</span>
          <span className="amount"> {account.balance.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
        </div>
        
        <div className="virtual-card-footer">
          <div className="account-number">
            <span style={{opacity: 0.6}}>Account ID:</span> 
            <strong style={{marginLeft: 8, letterSpacing: '2px'}}>{String(account.account_id).padStart(8, '0')}</strong>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className={`action-btn ${activeAction === 'deposit' ? 'active' : ''}`} onClick={() => setActiveAction(activeAction === 'deposit' ? null : 'deposit')}>
          <div className="icon-wrapper"><ArrowDownToLine size={20} /></div>
          <span>Deposit</span>
        </button>
        <button className={`action-btn ${activeAction === 'transfer' ? 'active' : ''}`} onClick={() => setActiveAction(activeAction === 'transfer' ? null : 'transfer')}>
          <div className="icon-wrapper"><ArrowRightLeft size={20} /></div>
          <span>Transfer</span>
        </button>
        <button className="action-btn" onClick={fetchData}>
          <div className="icon-wrapper"><RefreshCcw size={20} /></div>
          <span>Refresh</span>
        </button>
      </div>

      {status && <div className="status-message">{status}</div>}

      {/* Action Panels */}
      <AnimatePresence>
        {activeAction === 'deposit' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="action-panel">
            <h3>Deposit Funds</h3>
            <form onSubmit={handleDeposit} className="action-form">
              <input type="number" placeholder="Enter Amount" value={amount} onChange={e => setAmount(e.target.value)} required min="1" step="0.01" />
              <button type="submit" disabled={loading} className="primary-button" style={{ background: '#10b981' }}>Add Funds</button>
            </form>
          </motion.div>
        )}

        {activeAction === 'transfer' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="action-panel">
            <h3>Transfer Funds</h3>
            <form onSubmit={handleTransfer} className="action-form">
              <input type="text" placeholder="Destination Account ID" value={toAccount} onChange={e => setToAccount(e.target.value)} required />
              <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} required min="1" step="0.01" />
              <button type="submit" disabled={loading} className="primary-button">Send Money</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Transactions Feed */}
      <div className="transactions-feed">
        <div className="feed-header">
          <Activity size={20} color="#a855f7" />
          <h2>Recent Activity</h2>
        </div>
        
        {transactions.length === 0 ? (
          <div className="empty-state" style={{color: '#9ca3af', padding: '24px 0'}}>No recent transactions.</div>
        ) : (
          <div className="transaction-list">
            {transactions.map(tx => {
              const isPositive = tx.transaction_type === 'Deposit' || tx.receiver_account_id === account.account_id;
              const sign = isPositive ? '+' : '-';
              const color = isPositive ? '#10b981' : '#e5e7eb';
              
              return (
                <div key={tx.transaction_id} className="transaction-item">
                  <div className="tx-left">
                    <div className={`tx-icon ${isPositive ? 'positive' : 'negative'}`}>
                      {isPositive ? <ArrowDownToLine size={16} /> : <ArrowRightLeft size={16} />}
                    </div>
                    <div className="tx-details">
                      <span className="tx-type">{tx.transaction_type}</span>
                      <span className="tx-date">{new Date(tx.timestamp).toLocaleString(undefined, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                  <div className="tx-right" style={{ color }}>
                    {sign}RS {tx.amount.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </motion.div>
  );
};
export default Accounts;
