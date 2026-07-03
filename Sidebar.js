import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Wallet, Landmark, ShieldAlert, LogOut, User } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const { token, logout } = useAuth();

  const navItems = [
    { path: '/dashboard/chat', label: 'Chat', icon: <MessageSquare size={18} /> },
    { path: '/dashboard/accounts', label: 'Accounts', icon: <Wallet size={18} /> },
    { path: '/dashboard/loans', label: 'Loans & EMI', icon: <Landmark size={18} /> },
    { path: '/dashboard/fraud', label: 'Fraud Monitoring', icon: <ShieldAlert size={18} /> },
    { path: '/dashboard/profile', label: 'Profile Settings', icon: <User size={18} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">B</div>
        <div>
          <h1>Banking Bot</h1>
          <p>Premium Dashboard</p>
        </div>
      </div>

      <nav className="nav-list">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="token-card">
        <div className="token-label">Session Active</div>
        <code>{token ? `${token.slice(0, 12)}...` : 'Not logged in'}</code>
        <button type="button" className="ghost-button logout-button" onClick={logout}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
