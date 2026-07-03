import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { callApi, callApiGet } from '../utils/api';
import { ShieldAlert, Activity, Lock, Unlock, BrainCircuit } from 'lucide-react';
import './Accounts.css';

const Fraud = () => {
  const { token } = useAuth();
  const [status, setStatus] = useState('');
  const [responseData, setResponseData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState('');

  // Fetch accounts on load to get the primary account ID for locking
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await callApiGet('/my_accounts', {}, token);
        if (data.accounts && data.accounts.length > 0) {
          setAccountId(data.accounts[0].account_id);
        }
      } catch (e) {}
    };
    if (token) fetchAccounts();
  }, [token]);

  const fetchAlerts = async () => {
    setLoading(true);
    setStatus('Fetching fraud alerts & generating AI analytics...');
    setAiAnalysis('');
    try {
      // Endpoint is registered without prefix in backend __init__.py
      const data = await callApiGet('/alerts', {}, token);
      setResponseData(data);
      if (data.ai_analysis) setAiAnalysis(data.ai_analysis);
      setStatus(`Loaded ${data.alerts?.length || 0} alerts.`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleLock = async (lockState) => {
    if (!accountId) {
      setStatus('No account ID found.');
      return;
    }
    setLoading(true);
    setStatus(`Attempting to ${lockState ? 'lock' : 'unlock'} account...`);
    try {
      const data = await callApi('/lock', { account_id: accountId, lock: lockState }, token);
      setStatus(data.message);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="accounts-container">
      
      {aiAnalysis && (
        <div className="panel-card" style={{ background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.15), rgba(99, 102, 241, 0.05))', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
          <div className="panel-header">
            <BrainCircuit className="panel-icon" color="#c084fc" />
            <h2>Groq Security Analytics</h2>
          </div>
          <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#e5e7eb' }}>{aiAnalysis}</p>
        </div>
      )}

      <div className="panel-card">
        <div className="panel-header">
          <ShieldAlert className="panel-icon" color="#ef4444" />
          <h2>Fraud Monitoring</h2>
        </div>
        <div className="accounts-form">
          <p style={{ color: '#9ca3af', marginBottom: 16 }}>
            Review suspicious activity, generate AI insights, and manage your account security.
          </p>
          <div className="button-group">
            <button type="button" onClick={fetchAlerts} disabled={loading} className="primary-button">
              <Activity size={18} /> View Security Alerts
            </button>
            <button type="button" onClick={() => toggleLock(true)} disabled={loading} className="primary-button" style={{ background: '#ef4444' }}>
              <Lock size={18} /> Lock Account
            </button>
            <button type="button" onClick={() => toggleLock(false)} disabled={loading} className="secondary-button" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <Unlock size={18} /> Unlock
            </button>
          </div>
        </div>
      </div>

      {status && (
        <div className="panel-card result-panel">
          <h3>Result</h3>
          <p className="status-text">{status}</p>
          {responseData && responseData.alerts && <pre className="json-output">{JSON.stringify(responseData.alerts, null, 2)}</pre>}
        </div>
      )}
    </motion.div>
  );
};
export default Fraud;
