import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  User,
  Zap,
  Bell,
  ArrowRight,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Radio,
  Sparkles
} from 'lucide-react';
import { useTaskContext } from '../../context/TaskContext';

export default function AiTaskDelegationCard({ delegatedTask, isSelf = false }) {
  const { setSelectedTaskId, setActiveView } = useTaskContext();
  const [copied, setCopied] = useState(false);

  if (!delegatedTask || !delegatedTask.id) return null;

  const {
    id: taskId,
    title,
    assignee = {},
    creator = {},
    hasEaFollowup = false,
    eaAssignedName = 'Executive Assistant',
    status = 'Assigned',
    priority = 'High',
    dueDate
  } = delegatedTask;

  const handleCopyId = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(taskId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenTask = (e) => {
    e.stopPropagation();
    if (setSelectedTaskId) {
      setSelectedTaskId(taskId);
    }
    if (setActiveView) {
      setActiveView('tasks');
    }
  };

  const handleOpenEaPanel = (e) => {
    e.stopPropagation();
    if (setActiveView) {
      setActiveView('eaPanel');
    }
  };

  const formattedDueDate = dueDate
    ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '48 Hours from now';

  // Role tag styling helper
  const getRoleBadgeStyle = (role = '') => {
    const r = role.toLowerCase();
    if (r.includes('ea') || r.includes('executive')) {
      return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
    }
    if (r.includes('manager')) {
      return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
    }
    if (r.includes('admin')) {
      return { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' };
    }
    return { bg: '#f1f5f9', text: '#334155', border: '#e2e8f0' };
  };

  const roleStyle = getRoleBadgeStyle(assignee.role);

  return (
    <div
      style={{
        margin: '12px 0 10px 0',
        borderRadius: '16px',
        background: isSelf
          ? 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)'
          : '#ffffff',
        border: hasEaFollowup
          ? (isSelf ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid #fde68a')
          : (isSelf ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid #e2e8f0'),
        boxShadow: isSelf
          ? '0 12px 30px -8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 10px 28px -6px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        overflow: 'hidden',
        color: isSelf ? '#f8fafc' : '#0f172a',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        position: 'relative'
      }}
    >
      {/* Top Accent Highlight Line */}
      <div
        style={{
          height: '3px',
          width: '100%',
          background: hasEaFollowup
            ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)'
            : 'linear-gradient(90deg, #0284c7 0%, #38bdf8 50%, #0369a1 100%)'
        }}
      />

      {/* 1. Executive Card Header */}
      <div
        style={{
          padding: '12px 18px',
          background: isSelf ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
          borderBottom: isSelf ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              background: hasEaFollowup ? '#fef3c7' : '#e0f2fe',
              color: hasEaFollowup ? '#d97706' : '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {hasEaFollowup ? <Zap style={{ width: '15px', height: '15px' }} /> : <ShieldCheck style={{ width: '15px', height: '15px' }} />}
          </div>
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: hasEaFollowup ? '#d97706' : '#0284c7',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{hasEaFollowup ? 'AI Delegation • EA Follow-Up Active' : 'AI Copilot Task Delegation'}</span>
            </div>
          </div>
        </div>

        {/* Task ID chip with Copy feedback */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleCopyId}
            title="Click to copy Task ID"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: isSelf ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
              border: isSelf ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
              borderRadius: '7px',
              padding: '3px 8px',
              color: isSelf ? '#e2e8f0' : '#334155',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{taskId}</span>
            {copied ? (
              <Check style={{ width: '12px', height: '12px', color: '#10b981' }} />
            ) : (
              <Copy style={{ width: '12px', height: '12px', opacity: 0.6 }} />
            )}
          </button>
        </div>
      </div>

      {/* 2. Main Card Body */}
      <div style={{ padding: '16px 18px' }}>
        {/* Task Title */}
        <div
          style={{
            fontSize: '15.5px',
            fontWeight: 800,
            lineHeight: '1.4',
            marginBottom: '14px',
            color: isSelf ? '#ffffff' : '#0f172a',
            letterSpacing: '-0.01em'
          }}
        >
          {title}
        </div>

        {/* Assignee & Real-Time Transmission Box */}
        <div
          style={{
            borderRadius: '12px',
            padding: '12px 14px',
            background: isSelf ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
            border: isSelf ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                fontWeight: 800,
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                flexShrink: 0
              }}
            >
              {assignee.avatar || assignee.name?.[0]?.toUpperCase() || '👤'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: isSelf ? '#ffffff' : '#0f172a' }}>
                  {assignee.name || 'Assigned Officer'}
                </span>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '1px 7px',
                    borderRadius: '5px',
                    background: isSelf ? 'rgba(255, 255, 255, 0.1)' : roleStyle.bg,
                    color: isSelf ? '#cbd5e1' : roleStyle.text,
                    border: isSelf ? '1px solid rgba(255, 255, 255, 0.15)' : `1px solid ${roleStyle.border}`
                  }}
                >
                  {assignee.role || 'Member'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: isSelf ? '#94a3b8' : '#64748b', marginTop: '2px' }}>
                {assignee.department || 'Operations'} • Delegated by <strong>{creator.name || 'Workspace User'}</strong>
              </div>
            </div>
          </div>

          {/* Real-Time Live Alert Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: isSelf ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
              border: isSelf ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #a7f3d0',
              fontSize: '11px',
              fontWeight: 700,
              color: isSelf ? '#6ee7b7' : '#047857'
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
                display: 'inline-block'
              }}
            />
            <span>Live System Alert Sent</span>
          </div>
        </div>

        {/* 3. EA Follow-up Executive Module */}
        {hasEaFollowup ? (
          <div
            style={{
              borderRadius: '12px',
              padding: '12px 14px',
              background: isSelf
                ? 'linear-gradient(145deg, rgba(245, 158, 11, 0.1) 0%, rgba(180, 83, 9, 0.05) 100%)'
                : 'linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)',
              border: isSelf ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #fde68a',
              borderLeft: '4px solid #f59e0b',
              marginBottom: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap style={{ width: '14px', height: '14px', color: '#d97706' }} />
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#b45309', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Executive Assistant Surveillance Active
                </span>
              </div>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#92400e',
                  background: 'rgba(245, 158, 11, 0.2)',
                  padding: '1px 6px',
                  borderRadius: '4px'
                }}
              >
                Supervised by {eaAssignedName}
              </span>
            </div>
            <div style={{ fontSize: '11.5px', lineHeight: '1.5', color: isSelf ? '#cbd5e1' : '#78350f' }}>
              Logged into the EA Control Center. Automatic execution checks, daily progress logging, and supervisor escalations are active.
            </div>
          </div>
        ) : (
          <div
            style={{
              borderRadius: '10px',
              padding: '8px 12px',
              background: isSelf ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
              border: isSelf ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #e2e8f0',
              marginBottom: '14px',
              fontSize: '11.5px',
              color: isSelf ? '#94a3b8' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📌</span>
            <span>Standard team delegation protocol (Follow-up managed directly within workspace).</span>
          </div>
        )}

        {/* 4. Metadata Pills Grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 9px',
              borderRadius: '6px',
              background: isSelf ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
              color: isSelf ? '#fca5a5' : '#b91c1c',
              border: isSelf ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #fecaca'
            }}
          >
            <span>🔥 {priority} Priority</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 9px',
              borderRadius: '6px',
              background: isSelf ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff',
              color: isSelf ? '#93c5fd' : '#1d4ed8',
              border: isSelf ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #bfdbfe'
            }}
          >
            <span>📋 {status}</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 9px',
              borderRadius: '6px',
              background: isSelf ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
              color: isSelf ? '#cbd5e1' : '#475569',
              border: isSelf ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0'
            }}
          >
            <Calendar style={{ width: '12px', height: '12px' }} />
            <span>Target: {formattedDueDate}</span>
          </div>
        </div>

        {/* 5. Enterprise Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleOpenTask}
            style={{
              flex: 1,
              minWidth: '140px',
              padding: '9px 14px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span>View in Task Board</span>
            <ExternalLink style={{ width: '13px', height: '13px' }} />
          </button>

          {hasEaFollowup && (
            <button
              type="button"
              onClick={handleOpenEaPanel}
              style={{
                flex: 1,
                minWidth: '140px',
                padding: '9px 14px',
                borderRadius: '9px',
                background: isSelf ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
                color: isSelf ? '#fbbf24' : '#b45309',
                border: isSelf ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid #fde68a',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span>⚡ EA Control Panel</span>
              <ArrowRight style={{ width: '13px', height: '13px' }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
