import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { getTimeAgo } from '../../utils/dateUtils';
import { Bell, X, CheckCheck } from 'lucide-react';

export default function NotificationsDrawer({ isOpen, onClose }) {
  const { notifications, setNotifications, setSelectedTaskId } = useTaskContext();
  const [filter, setFilter] = useState('all');

  if (!isOpen) return null;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'mention') return n.type === 'mention';
    return true;
  });

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell style={{ width: '16px', height: '16px', color: 'var(--brand-light)' }} />
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800 }}>Notifications Center</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={markAllAsRead} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
              <CheckCheck style={{ width: '12px', height: '12px' }} /> Mark read
            </button>
            <button onClick={onClose} className="btn-icon"><X style={{ width: '16px', height: '16px' }} /></button>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', background: 'var(--bg-input)' }}>
          <button onClick={() => setFilter('all')} className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}>All</button>
          <button onClick={() => setFilter('unread')} className={`btn ${filter === 'unread' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}>Unread</button>
          <button onClick={() => setFilter('mention')} className={`btn ${filter === 'mention' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}>Mentions</button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredNotifs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>No notifications.</div>
          ) : (
            filteredNotifs.map(n => (
              <div
                key={n.id}
                onClick={() => {
                  if (n.taskId) setSelectedTaskId(n.taskId);
                  onClose();
                }}
                className="glass-card"
                style={{ padding: '0.85rem', cursor: 'pointer', opacity: n.read ? 0.7 : 1, border: n.read ? '1px solid var(--border-color)' : '1px solid var(--brand-primary)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>{n.title}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{getTimeAgo(n.timestamp)}</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{n.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
