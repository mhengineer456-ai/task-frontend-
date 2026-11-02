import React from 'react';
import { useTaskContext } from '../../context/TaskContext';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';

export default function RealtimeToastContainer() {
  const {
    realtimeToasts = [],
    dismissRealtimeToast,
    setSelectedTaskId,
    setActiveView,
    setActiveChannelId
  } = useTaskContext();

  if (!realtimeToasts || realtimeToasts.length === 0) return null;

  const getToastIcon = (type) => {
    switch (type) {
      case 'assignment':
        return <Sparkles style={{ width: '18px', height: '18px', color: '#0284c7' }} />;
      case 'approval':
        return <CheckCircle2 style={{ width: '18px', height: '18px', color: '#10b981' }} />;
      case 'chat':
        return <MessageSquare style={{ width: '18px', height: '18px', color: '#8b5cf6' }} />;
      case 'status':
        return <AlertCircle style={{ width: '18px', height: '18px', color: '#f59e0b' }} />;
      default:
        return <Bell style={{ width: '18px', height: '18px', color: '#0284c7' }} />;
    }
  };

  const handleAction = (toast) => {
    if (toast.taskId) {
      setSelectedTaskId(toast.taskId);
    } else if (toast.channelId) {
      setActiveView('chat');
      if (setActiveChannelId) {
        setActiveChannelId(toast.channelId);
      }
    }
    dismissRealtimeToast(toast.id);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '24px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
        width: '100%',
        pointerEvents: 'none'
      }}
    >
      {realtimeToasts.map(toast => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'auto',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid #bae6fd',
            borderRadius: '14px',
            padding: '12px 14px',
            boxShadow: '0 12px 30px -4px rgba(2, 132, 199, 0.25), 0 4px 10px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Accent glow strip */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '4px',
              background: toast.type === 'approval' ? '#10b981' : toast.type === 'status' ? '#f59e0b' : '#0284c7'
            }}
          />

          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: '#f0f9ff',
              border: '1px solid #e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {getToastIcon(toast.type)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0f172a' }}>
                {toast.title}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#0284c7', fontWeight: 700 }}>
                REAL-TIME ⚡
              </span>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#475569', lineHeight: '1.3', marginBottom: (toast.taskId || toast.channelId) ? '8px' : '0' }}>
              {toast.message}
            </p>

            {(toast.taskId || toast.channelId) && (
              <button
                onClick={() => handleAction(toast)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#0284c7',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer'
                }}
              >
                <span>{toast.taskId ? 'View Task' : 'Open Message'}</span>
                <ArrowRight style={{ width: '12px', height: '12px' }} />
              </button>
            )}
          </div>

          <button
            onClick={() => dismissRealtimeToast(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Dismiss"
          >
            <X style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      ))}
    </div>
  );
}
