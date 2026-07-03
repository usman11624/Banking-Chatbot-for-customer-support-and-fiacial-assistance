import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chatbot from './components/Chatbot';
import Accounts from './components/Accounts';
import Loans from './components/Loans';
import Fraud from './components/Fraud';
import Logs from './components/Logs';
import Profile from './components/Profile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Navigate to="chat" replace />} />
            <Route path="chat" element={<Chatbot />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="loans" element={<Loans />} />
            <Route path="fraud" element={<Fraud />} />
            <Route path="logs" element={<Logs />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
