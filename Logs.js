import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import './Accounts.css';

const Logs = () => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="accounts-container">
      <div className="panel-card">
        <div className="panel-header">
          <FileText className="panel-icon" />
          <h2>System Logs</h2>
        </div>
        <p style={{ color: '#9ca3af' }}>Logs are managed in the background. Check Chat history for interactions.</p>
      </div>
    </motion.div>
  );
};
export default Logs;
