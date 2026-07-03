import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { callApi, callApiGet } from '../utils/api';
import { Landmark, CreditCard, Activity, BrainCircuit } from 'lucide-react';
import './Accounts.css';

const Loans = () => {
  const { token } = useAuth();
  const [loanForm, setLoanForm] = useState({ loan_type: 'Personal', income: '', credit_score: '' });
  const [paymentForm, setPaymentForm] = useState({ loan_id: '', amount: '' });
  const [status, setStatus] = useState('');
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creditScore, setCreditScore] = useState(null);
  const [creditScoreBreakdown, setCreditScoreBreakdown] = useState(null);

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const data = await callApiGet('/credit_score', {}, token);
        if (data.credit_score) {
          setCreditScore(data.credit_score);
          setLoanForm(prev => ({ ...prev, credit_score: data.credit_score }));
          if (data.breakdown) setCreditScoreBreakdown(data.breakdown);
        }
      } catch (e) {}
    };
    if (token) fetchScore();
  }, [token]);

  const submitLoanCheck = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('Checking real-time eligibility with Groq AI...');
    setResponseData(null);
    try {
      const data = await callApi('/eligibility', loanForm, token);
      setResponseData(data);
      setStatus(data.eligible ? 'Loan Approved!' : 'Loan Rejected.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitLoanPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('Posting loan payment...');
    try {
      const data = await callApi('/payment', paymentForm, token);
      setResponseData(data);
      setStatus('Loan payment successful.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate meter percentage (Score range 300 to 850)
  const scorePercent = creditScore ? Math.max(0, Math.min(100, ((creditScore - 300) / 550) * 100)) : 0;
  let scoreColor = '#ef4444'; // poor
  if (creditScore >= 600) scoreColor = '#f59e0b'; // fair
  if (creditScore >= 700) scoreColor = '#3b82f6'; // good
  if (creditScore >= 750) scoreColor = '#10b981'; // excellent

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="accounts-container">
      
      {creditScore && (
        <div className="panel-card account-profile-card" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ position: 'relative', width: 100, height: 100 }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              <motion.path 
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: `${scorePercent}, 100` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                fill="none" stroke={scoreColor} strokeWidth="3" 
              />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: scoreColor }}>{creditScore}</span>
            </div>
          </div>
          <div>
            <h2 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={20} color={scoreColor} /> Your Credit Score</h2>
            <p style={{ color: '#9ca3af', margin: 0, fontSize: '14px' }}>
              We've analyzed your financial history to generate this simulated credit score. A higher score unlocks better loan policies.
            </p>
          </div>
        </div>
      )}

      {creditScoreBreakdown && (
        <div className="panel-card" style={{ background: 'rgba(20,20,25,0.8)', border: '1px dashed rgba(168, 85, 247, 0.3)' }}>
          <h3 style={{color: '#c084fc', marginTop: 0}}>How is my score calculated?</h3>
          <ul style={{ color: '#e5e7eb', fontSize: '14px', lineHeight: '1.6', margin: 0, paddingLeft: '20px' }}>
            <li><strong>Base Score:</strong> {creditScoreBreakdown.base_score}</li>
            <li><strong>Balance Bonus:</strong> +{creditScoreBreakdown.balance_points} points <span style={{color:'#9ca3af'}}>(Based on your total balance of RS {creditScoreBreakdown.total_balance.toLocaleString()})</span></li>
            <li><strong>Activity Bonus:</strong> +{creditScoreBreakdown.activity_points} points <span style={{color:'#9ca3af'}}>(Based on your {creditScoreBreakdown.tx_count} recent transactions)</span></li>
          </ul>
          <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '16px', marginBottom: 0 }}>
            <em>Tip: Deposit more funds and make frequent transfers to increase your bonus points!</em>
          </p>
        </div>
      )}

      {responseData && responseData.ai_advisor && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="panel-card" style={{ background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))', border: `1px solid ${responseData.eligible ? '#10b981' : '#ef4444'}` }}>
          <div className="panel-header">
            <BrainCircuit className="panel-icon" color={responseData.eligible ? '#10b981' : '#ef4444'} />
            <h2>AI Financial Advisor</h2>
          </div>
          <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#e5e7eb' }}>{responseData.ai_advisor}</p>
          
          {responseData.eligible && (
            <div style={{ marginTop: '16px', display: 'flex', gap: '16px', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px' }}>
              <div><span style={{color:'#9ca3af', fontSize:'12px'}}>Max Amount</span><div style={{fontSize:'18px', color:'#10b981'}}>RS {responseData.max_amount.toLocaleString()}</div></div>
              <div><span style={{color:'#9ca3af', fontSize:'12px'}}>Interest Rate</span><div style={{fontSize:'18px', color:'#3b82f6'}}>{responseData.interest_rate}%</div></div>
              <div><span style={{color:'#9ca3af', fontSize:'12px'}}>Max Duration</span><div style={{fontSize:'18px', color:'#f59e0b'}}>{responseData.max_duration_months} mo</div></div>
            </div>
          )}
        </motion.div>
      )}

      <div className="panel-card">
        <div className="panel-header">
          <Landmark className="panel-icon" />
          <h2>Check Loan Eligibility</h2>
        </div>
        <form onSubmit={submitLoanCheck} className="accounts-form">
          <select value={loanForm.loan_type} onChange={e => setLoanForm({...loanForm, loan_type: e.target.value})} style={{
            width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 16px', color: '#fff', fontSize: '15px'
          }}>
            <option value="Personal">Personal Loan</option>
            <option value="Home">Home Loan</option>
            <option value="Car">Car Loan</option>
          </select>
          <input placeholder="Monthly Income" type="number" value={loanForm.income} onChange={e => setLoanForm({...loanForm, income: e.target.value})} />
          <input placeholder="Credit Score (Auto-filled)" type="number" value={loanForm.credit_score} readOnly style={{ opacity: 0.7 }} title="Your credit score is retrieved automatically" />
          <button type="submit" disabled={loading} className="primary-button">Check Eligibility</button>
        </form>
      </div>

      <div className="panel-card">
        <div className="panel-header">
          <CreditCard className="panel-icon" />
          <h2>Make Loan Payment</h2>
        </div>
        <form onSubmit={submitLoanPayment} className="accounts-form">
          <input placeholder="Loan ID" value={paymentForm.loan_id} onChange={e => setPaymentForm({...paymentForm, loan_id: e.target.value})} />
          <input placeholder="Amount" type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
          <button type="submit" disabled={loading} className="primary-button">Submit Payment</button>
        </form>
      </div>

      {status && !responseData?.ai_advisor && (
        <div className="panel-card result-panel">
          <h3>Result</h3>
          <p className="status-text">{status}</p>
        </div>
      )}
    </motion.div>
  );
};
export default Loans;
