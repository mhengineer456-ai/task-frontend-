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
  const { setSelectedTaskId, setActiveView, dispatchScheduledTaskNow } = useTaskContext();
  const [copied, setCopied] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isDispatchedEarly, setIsDispatchedEarly] = useState(false);

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
    dueDate,
    isScheduled = false,
    scheduledAt = null
  } = delegatedTask;

  const isTaskScheduled = Boolean(
    !isDispatchedEarly &&
    (
      status === 'Scheduled' ||
      String(status).toLowerCase() === 'scheduled' ||
      Boolean(isScheduled) ||
      (scheduledAt && (!delegatedTask.dispatchedAt || status === 'Scheduled'))
    )
  );

  const handleCopyId = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(taskId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenTask = (e) => {
    e.stopPropagation();
    if (setActiveView) {
      setActiveView('kanban');
    }
    if (setSelectedTaskId && taskId) {
      setTimeout(() => {
        setSelectedTaskId(taskId);
      }, 50);
    }
  };

  const handleOpenEaPanel = (e) => {
    e.stopPropagation();
    if (setActiveView) {
      setActiveView('eaPanel');
    }
  };

  const handleOpenAutomations = (e) => {
    e.stopPropagation();
    if (setActiveView) {
      setActiveView('automations');
    }
  };

  const handleDispatchNow = async (e) => {
    e.stopPropagation();
    if (isDispatching || isDispatchedEarly) return;
    setIsDispatching(true);
    try {
      if (dispatchScheduledTaskNow) {
        await dispatchScheduledTaskNow(taskId);
        setIsDispatchedEarly(true);
      }
    } catch (err) {
      console.warn('Early dispatch error:', err);
    } finally {
      setIsDispatching(false);
    }
  };

  const formattedDueDate = dueDate
    ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '48 Hours from now';

  const formattedScheduledAt = scheduledAt
    ? new Date(scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Allotted Trigger Time';

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
        border: isTaskScheduled
          ? (isSelf ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid #ddd6fe')
          : hasEaFollowup
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
          background: isTaskScheduled
            ? 'linear-gradient(90deg, #f59e0b 0%, #8b5cf6 50%, #6366f1 100%)'
            : hasEaFollowup
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
              background: isTaskScheduled
                ? '#f5f3ff'
                : hasEaFollowup
                ? '#fef3c7'
                : '#e0f2fe',
              color: isTaskScheduled
                ? '#7c3aed'
                : hasEaFollowup
                ? '#d97706'
                : '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isTaskScheduled ? (
              <Clock style={{ width: '15px', height: '15px' }} />
            ) : hasEaFollowup ? (
              <Zap style={{ width: '15px', height: '15px' }} />
            ) : (
              <ShieldCheck style={{ width: '15px', height: '15px' }} />
            )}
          </div>
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: isTaskScheduled
                  ? '#7c3aed'
                  : hasEaFollowup
                  ? '#d97706'
                  : '#0284c7',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>
                {isTaskScheduled
                  ? '⚡ Zapier Pipeline • Scheduled Dispatch Active'
                  : hasEaFollowup
                  ? 'AI Delegation • EA Follow-Up Active'
                  : 'AI Copilot Task Delegation'}
              </span>
            </div>
          </div>
        </div>

        {/* Task ID chip with Copy feedback and Staged indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isTaskScheduled && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10.5px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                background: '#fef3c7',
                color: '#b45309',
                border: '1px solid #fde68a'
              }}
            >
              <Clock style={{ width: '11px', height: '11px' }} />
              <span>STAGED</span>
            </span>
          )}

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
                flexShrink: 0,
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {assignee.avatar && (assignee.avatar.startsWith('data:') || assignee.avatar.startsWith('http') || assignee.avatar.startsWith('/')) ? (
                <img
                  src={assignee.avatar}
                  alt={assignee.name || 'avatar'}
                  style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (assignee.avatar && assignee.avatar.length <= 4) ? (
                <span>{assignee.avatar}</span>
              ) : (
                <span>{assignee.name?.[0]?.toUpperCase() || '👤'}</span>
              )}
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

          {/* Real-Time Live Alert Badge or Staged Badge */}
          {isTaskScheduled ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                fontSize: '11px',
                fontWeight: 700,
                color: '#b45309'
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#f59e0b',
                  boxShadow: '0 0 8px #f59e0b',
                  display: 'inline-block'
                }}
              />
              <span>Staged: Hidden until trigger</span>
            </div>
          ) : (
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
          )}
        </div>

        {/* 3. Zapier Automated Trigger Staging Panel (When Scheduled) */}
        {isTaskScheduled && (
          <div
            style={{
              borderRadius: '12px',
              padding: '14px 16px',
              background: isSelf
                ? 'linear-gradient(145deg, rgba(139, 92, 246, 0.12) 0%, rgba(99, 102, 241, 0.06) 100%)'
                : 'linear-gradient(145deg, #fbf7ff 0%, #f5f3ff 100%)',
              border: isSelf ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid #ddd6fe',
              borderLeft: '4px solid #8b5cf6',
              marginBottom: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap style={{ width: '15px', height: '15px', color: '#8b5cf6' }} />
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#7c3aed', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Zapier Automated Dispatch Pipeline
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#6d28d9',
                  background: 'rgba(139, 92, 246, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Clock style={{ width: '12px', height: '12px' }} />
                <span>Allotted Trigger: {formattedScheduledAt}</span>
              </span>
            </div>
            <div style={{ fontSize: '12px', lineHeight: '1.5', color: isSelf ? '#cbd5e1' : '#475569', marginBottom: '10px' }}>
              Task is securely queued in the background scheduler. At the allotted trigger time, it will automatically populate into <strong>{assignee.name || 'the employee'}</strong>'s active list with sound alert and notification.
            </div>

            {/* Inline Early Dispatch Override Action */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={isDispatching || isDispatchedEarly}
                onClick={handleDispatchNow}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: isDispatchedEarly ? '#10b981' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: isDispatching || isDispatchedEarly ? 'default' : 'pointer',
                  boxShadow: '0 2px 6px rgba(139, 92, 246, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                {isDispatchedEarly ? (
                  <>
                    <Check style={{ width: '13px', height: '13px' }} />
                    <span>Dispatched & Activated</span>
                  </>
                ) : (
                  <>
                    <Zap style={{ width: '13px', height: '13px' }} />
                    <span>{isDispatching ? 'Dispatching...' : '⚡ Dispatch Now (Trigger Immediately)'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 4. EA Follow-up Executive Module */}
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
        ) : !isTaskScheduled ? (
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
        ) : null}

        {/* 5. Metadata Pills Grid */}
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
              background: isTaskScheduled
                ? (isSelf ? 'rgba(139, 92, 246, 0.2)' : '#f5f3ff')
                : (isSelf ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff'),
              color: isTaskScheduled
                ? (isSelf ? '#c4b5fd' : '#7c3aed')
                : (isSelf ? '#93c5fd' : '#1d4ed8'),
              border: isTaskScheduled
                ? (isSelf ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid #ddd6fe')
                : (isSelf ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #bfdbfe')
            }}
          >
            <span>{isTaskScheduled ? '⚡ Scheduled Automation' : `📋 ${status}`}</span>
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

        {/* 6. Enterprise Action Buttons */}
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

          {isTaskScheduled && (
            <button
              type="button"
              onClick={handleOpenAutomations}
              style={{
                flex: 1,
                minWidth: '140px',
                padding: '9px 14px',
                borderRadius: '9px',
                background: isSelf ? 'rgba(139, 92, 246, 0.15)' : '#f5f3ff',
                color: isSelf ? '#c4b5fd' : '#7c3aed',
                border: isSelf ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid #ddd6fe',
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
              <span>⚡ View in Automations</span>
              <ArrowRight style={{ width: '13px', height: '13px' }} />
            </button>
          )}

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
