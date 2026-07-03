import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { callApi, callApiGet } from '../utils/api';
import { User, Mail, Phone, Calendar, Clock, Monitor, MapPin, Edit2, Check } from 'lucide-react';
import './Accounts.css';

const Profile = () => {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [logins, setLogins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await callApiGet('/profile', {}, token);
        if (data.profile) {
          setProfile(data.profile);
          setEditForm({ name: data.profile.name, email: data.profile.email, phone: data.profile.phone });
          setLogins(data.logins || []);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchProfile();
  }, [token]);

  if (loading) return <div style={{ color: '#fff', padding: 24 }}>Loading profile...</div>;
  if (error) return <div style={{ color: '#ef4444', padding: 24 }}>Error: {error}</div>;
  if (!profile) return null;

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await callApi('/profile/update', editForm, token);
      setProfile(prev => ({ ...prev, ...editForm }));
      setIsEditing(false);
      setSaveStatus('Profile updated successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="accounts-container">
      
      <div className="panel-card account-profile-card">
        <div className="panel-header" style={{ justifyContent: 'space-between', display: 'flex' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <User className="panel-icon" />
            <h2>Identity Details</h2>
          </div>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} style={{ background: 'transparent', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#c084fc', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <Edit2 size={14} /> Edit
            </button>
          ) : (
            <button onClick={handleSave} style={{ background: '#10b981', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <Check size={14} /> Save
            </button>
          )}
        </div>
        
        {saveStatus && <div style={{ color: '#10b981', fontSize: '13px', marginBottom: '16px' }}>{saveStatus}</div>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <User size={18} color="#9ca3af" />
            {isEditing ? (
              <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '6px', padding: '8px', color: '#fff', width: '100%', outline: 'none' }} />
            ) : (
              <span style={{ color: '#e5e7eb', fontSize: '16px' }}>{profile.name}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Mail size={18} color="#9ca3af" />
            {isEditing ? (
              <input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '6px', padding: '8px', color: '#fff', width: '100%', outline: 'none' }} />
            ) : (
              <span style={{ color: '#e5e7eb', fontSize: '16px' }}>{profile.email}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Phone size={18} color="#9ca3af" />
            {isEditing ? (
              <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '6px', padding: '8px', color: '#fff', width: '100%', outline: 'none' }} />
            ) : (
              <span style={{ color: '#e5e7eb', fontSize: '16px' }}>{profile.phone}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calendar size={18} color="#9ca3af" />
            <span style={{ color: '#e5e7eb', fontSize: '16px' }}>Member since: {new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-header">
          <Monitor className="panel-icon" />
          <h2>Recent Login Activity</h2>
        </div>
        
        {logins.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No recent logins found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {logins.map((login, idx) => (
              <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e5e7eb' }}>
                    <MapPin size={14} color="#a855f7" />
                    <span>IP: {login.ip_address}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#9ca3af' }}>{login.device} • {login.location}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '13px' }}>
                  <Clock size={14} />
                  <span>{new Date(login.login_time).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </motion.div>
  );
};
export default Profile;
