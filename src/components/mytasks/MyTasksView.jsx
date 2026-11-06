import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { formatDate, isDueToday, isOverdue } from '../../utils/dateUtils';
import {
  CheckCircle2,
  Clock,
  Play,
  Check,
  Inbox,
  Sparkles,
  Star,
  CheckSquare,
  TrendingUp,
  Flame,
  AlertTriangle,
  Target,
  History,
  ArrowRight,
  MessageSquare,
  Calendar,
  Layers,
  Zap
} from 'lucide-react';
import QuickFollowupModal from '../tasks/QuickFollowupModal';

export default function MyTasksView() {
  const {
    tasks,
    users = [],
    activeUser,
    changeTaskStatus,
    changeTaskPriority,
    startTimer,
    setSelectedTaskId,
    pinnedTaskIds = [],
    togglePinTask,
    dispatchScheduledTaskNow
  } = useTaskContext();

  const [activeTab, setActiveTab] = useState('assigned');
  const [progressModalTaskId, setProgressModalTaskId] = useState(null);

  const assignedToMe = tasks.filter(t => t.assigneeId === activeUser?.id && t.status !== 'Scheduled' && !(t.isScheduled && !t.dispatchedAt));
  const createdByMe = tasks.filter(t => t.creatorId === activeUser?.id);
  const followingMe = tasks.filter(t => (t.watchers || []).includes(activeUser?.id));
  const waitingApproval = tasks.filter(t => t.approvalOwnerId === activeUser?.id && t.status === 'Review');
  const todayTasks = assignedToMe.filter(t => isDueToday(t.dueDate));
  const overdueTasks = assignedToMe.filter(t => isOverdue(t.dueDate, t.status));
  const completedTasks = assignedToMe.filter(t => t.status === 'Completed' || t.status === 'Approved');
  const pinnedTasks = assignedToMe.filter(t => pinnedTaskIds.includes(t.id));
  const scheduledTasks = tasks.filter(t => (t.status === 'Scheduled' || (t.isScheduled && !t.dispatchedAt)) && (t.creatorId === activeUser?.id || activeUser?.role === 'Manager' || activeUser?.role === 'Admin'));

  let filteredTasks = assignedToMe;
  if (activeTab === 'pinned') filteredTasks = pinnedTasks;
  else if (activeTab === 'today') filteredTasks = todayTasks;
  else if (activeTab === 'upcoming') filteredTasks = assignedToMe.filter(t => new Date(t.dueDate) > new Date() && !isDueToday(t.dueDate));
  else if (activeTab === 'overdue') filteredTasks = overdueTasks;
  else if (activeTab === 'scheduled') filteredTasks = scheduledTasks;
  else if (activeTab === 'created') filteredTasks = createdByMe;
  else if (activeTab === 'following') filteredTasks = followingMe;
  else if (activeTab === 'approval') filteredTasks = waitingApproval;
  else if (activeTab === 'completed') filteredTasks = completedTasks;

  // Sort pinned tasks first
  filteredTasks.sort((a, b) => {
    const aPinned = pinnedTaskIds.includes(a.id);
    const bPinned = pinnedTaskIds.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  const tabs = [
    { id: 'assigned', label: 'Assigned to Me', count: assignedToMe.length },
    ...(scheduledTasks.length > 0 || activeUser?.role === 'Manager' || activeUser?.role === 'Admin' ? [
      { id: 'scheduled', label: '⚡ Scheduled Automations', count: scheduledTasks.length, badgeClass: 'badge-purple' }
    ] : []),
    { id: 'pinned', label: '⭐ Pinned', count: pinnedTasks.length, badgeClass: 'badge-amber' },
    { id: 'today', label: 'Due Today', count: todayTasks.length, badgeClass: 'badge-brand' },
    { id: 'overdue', label: 'Overdue', count: overdueTasks.length, badgeClass: 'badge-rose' },
    { id: 'approval', label: 'Approval Queue', count: waitingApproval.length, badgeClass: 'badge-amber' },
    { id: 'created', label: 'Created by Me', count: createdByMe.length },
    { id: 'following', label: 'Following', count: followingMe.length },
    { id: 'completed', label: 'Completed', count: completedTasks.length }
  ];

  const getProgressColor = (pct) => {
    if (pct >= 100) return '#10b981';
    if (pct >= 75) return '#06b6d4';
    if (pct >= 50) return '#3b82f6';
    if (pct >= 25) return '#f59e0b';
    return '#6366f1';
  };

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Inbox style={{ width: '22px', height: '22px', color: 'var(--brand-primary)' }} />
            <span>Personal Command Hub</span>
            <span className="badge badge-brand">{filteredTasks.length} Visible</span>
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Focus workstation for {activeUser?.name} ({activeUser?.role || 'Team Member'})
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem', borderRadius: 'var(--radius-md)' }}>
          <Sparkles style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Personal Velocity:</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981' }}>{completedTasks.length} Completed</span>
        </div>
      </div>

      {/* 1.5 Personal KPI Metric Cards Strip */}
      <div className="kpi-metrics-grid">
        <div
          className={`kpi-metric-card ${activeTab === 'assigned' ? 'active' : ''}`}
          onClick={() => setActiveTab('assigned')}
          title="Click to view assigned tasks"
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Assigned To Me
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '2px' }}>
              {assignedToMe.length}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Active deliverable queue
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
            <Layers style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        <div
          className={`kpi-metric-card ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
          title="Click to view tasks due today"
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Due Today
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0284c7', marginTop: '2px' }}>
              {todayTasks.length}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Target deadline today
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }}>
            <Calendar style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        <div
          className={`kpi-metric-card ${activeTab === 'overdue' ? 'active' : ''}`}
          onClick={() => setActiveTab('overdue')}
          title="Click to view overdue tasks"
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Overdue
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ef4444', marginTop: '2px' }}>
              {overdueTasks.length}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Requires immediate action
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <AlertTriangle style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        <div
          className={`kpi-metric-card ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
          title="Click to view completed tasks"
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Completed
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#10b981', marginTop: '2px' }}>
              {completedTasks.length}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Delivered successfully
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <CheckCircle2 style={{ width: '22px', height: '22px' }} />
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="mobile-task-tabs-strip" style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`btn ${activeTab === t.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '0.45rem 0.95rem', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}
          >
            <span>{t.label}</span>
            <span className={`badge ${t.badgeClass || 'badge-brand'}`} style={{ padding: '1px 7px', fontSize: '0.65rem' }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* 3. Cards Grid */}
      <div className="grid grid-cols-3 lg-grid-cols-2 sm-grid-cols-1" style={{ gap: '1.25rem' }}>
        {filteredTasks.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center', gridColumn: '1 / -1' }}>
            <Inbox style={{ width: '44px', height: '44px', color: 'var(--text-muted)', margin: '0 auto 1rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>No tasks in this category</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>All caught up! Check back or browse other tabs.</p>
          </div>
        ) : (
          filteredTasks.map(t => {
            const isLate = isOverdue(t.dueDate, t.status);
            const isDone = t.status === 'Completed' || t.status === 'Approved';
            const isPinned = pinnedTaskIds.includes(t.id);
            const progressVal = Number(t.progress || 0);
            const isNotStarted = progressVal === 0;

            const checklist = Array.isArray(t.checklist) ? t.checklist : [];
            const checklistTotal = checklist.length;
            const checklistDone = checklist.filter(c => c.completed).length;

            const followups = Array.isArray(t.followups) ? t.followups : [];

            return (
              <div
                key={t.id}
                className="glass-card glass-card-hover"
                style={{
                  padding: '1.2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.85rem',
                  borderLeft: isPinned ? '3px solid #f59e0b' : `3px solid ${getProgressColor(progressVal)}`,
                  background: isPinned ? 'rgba(245, 158, 11, 0.03)' : undefined,
                  position: 'relative'
                }}
              >
                <div>
                  {/* Top Meta: ID, Star Pin, Priority & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="badge badge-brand" style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
                        {t.id}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinTask(t.id);
                        }}
                        className={`star-pin-btn ${isPinned ? 'pinned' : ''}`}
                        title={isPinned ? 'Unpin task' : 'Pin task to top'}
                      >
                        <Star
                          style={{
                            width: '14px',
                            height: '14px',
                            fill: isPinned ? '#f59e0b' : 'none',
                            color: isPinned ? '#f59e0b' : 'var(--text-muted)'
                          }}
                        />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span className={`badge ${t.priority === 'Critical' ? 'badge-rose' : t.priority === 'Urgent' ? 'badge-amber' : 'badge-brand'}`}>
                        {t.priority}
                      </span>
                      <span className={`badge ${t.status === 'Scheduled' ? 'badge-purple' : isDone ? 'badge-emerald' : isLate ? 'badge-rose' : 'badge-cyan'}`} style={t.status === 'Scheduled' ? { background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.3)' } : {}}>
                        {t.status === 'Scheduled' ? '⚡ Scheduled' : t.status}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => setSelectedTaskId(t.id)}
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      lineHeight: '1.35',
                      margin: '0 0 0.35rem 0'
                    }}
                  >
                    {t.title}
                  </h3>

                  {/* Description preview */}
                  {t.description && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {t.description}
                    </p>
                  )}

                  {/* Subtask / Checklist pill if present */}
                  {checklistTotal > 0 && (
                    <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckSquare style={{ width: '12px', height: '12px', color: checklistDone === checklistTotal ? '#10b981' : 'var(--brand-primary)' }} />
                        Subtasks: {checklistDone}/{checklistTotal}
                      </span>
                      <span style={{ fontWeight: 700, color: checklistDone === checklistTotal ? '#10b981' : 'var(--text-secondary)' }}>
                        {Math.round((checklistDone / checklistTotal) * 100)}%
                      </span>
                    </div>
                  )}

                  {/* Scheduled Automation Banner */}
                  {(t.status === 'Scheduled' || (t.isScheduled && !t.dispatchedAt)) && (
                    <div style={{
                      marginTop: '0.65rem',
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(99, 102, 241, 0.08))',
                      border: '1px solid rgba(139, 92, 246, 0.28)',
                      borderRadius: '8px',
                      padding: '0.55rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: '#8b5cf6' }}>
                        <Zap style={{ width: '14px', height: '14px', color: '#8b5cf6', flexShrink: 0 }} />
                        <span>
                          <strong>Zapier Automation:</strong> Dispatches at {t.scheduledAt ? new Date(t.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Allotted Time'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (dispatchScheduledTaskNow) dispatchScheduledTaskNow(t.id);
                        }}
                        className="btn btn-primary"
                        style={{
                          fontSize: '0.68rem',
                          padding: '0.22rem 0.6rem',
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          cursor: 'pointer'
                        }}
                        title="Force immediate trigger to employee"
                      >
                        <Zap style={{ width: '11px', height: '11px' }} />
                        Dispatch Now
                      </button>
                    </div>
                  )}

                  {/* Progress Bar & Percentage */}
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <TrendingUp style={{ width: '12px', height: '12px', color: getProgressColor(progressVal) }} />
                        {isNotStarted ? 'Not Started (0%)' : isDone ? 'Completed (100%)' : `Progress (${progressVal}%)`}
                      </span>
                      <span style={{ fontWeight: 800, color: getProgressColor(progressVal), fontFamily: 'monospace' }}>
                        {progressVal}%
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, Math.max(0, progressVal))}%`,
                          background: getProgressColor(progressVal),
                          borderRadius: '999px'
                        }}
                      />
                    </div>
                  </div>

                  {/* ==========================================================================
                      IF NOT STARTED: REASON CHIP / CALLOUT
                      ========================================================================== */}
                  {isNotStarted && t.reasonNotStarted && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '6px',
                        padding: '0.45rem 0.65rem',
                        fontSize: '0.72rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#f59e0b', fontWeight: 800 }}>
                        <AlertTriangle style={{ width: '12px', height: '12px' }} />
                        <span>Not Started: {t.delayCategory || 'Pending Kickoff'}</span>
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.7rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        "{t.reasonNotStarted}"
                      </p>
                    </div>
                  )}

                  {/* Expected Date of Completion Badge if present */}
                  {t.expectedDate && (
                    <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: '#0284c7', background: 'rgba(2, 132, 199, 0.08)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(2, 132, 199, 0.25)' }}>
                      <Target style={{ width: '12px', height: '12px' }} />
                      <span><strong>Expected Completion:</strong> {formatDate(t.expectedDate)}</span>
                    </div>
                  )}
                </div>

                {/* ==========================================================================
                    CARD FOOTER: PROGRESS UPDATE BUTTON, HISTORY & ACTIONS
                    ========================================================================== */}
                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                    <div style={{ color: isLate ? 'var(--color-danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                      <Clock style={{ width: '13px', height: '13px' }} />
                      <span>{isLate ? '⚠️ Overdue' : formatDate(t.dueDate)}</span>
                    </div>

                    {/* Followup logs counter */}
                    <button
                      type="button"
                      onClick={() => setProgressModalTaskId(t.id)}
                      className="btn btn-secondary"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.68rem', fontWeight: 700, gap: '0.25rem' }}
                      title="View all historical progress updates and reasons"
                    >
                      <History style={{ width: '11px', height: '11px' }} />
                      <span>History ({followups.length})</span>
                    </button>
                  </div>

                  {/* Primary Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', paddingTop: '0.35rem' }}>
                    {/* + Update Progress Button */}
                    <button
                      type="button"
                      onClick={() => setProgressModalTaskId(t.id)}
                      className="btn btn-primary"
                      style={{ padding: '0.45rem 0.85rem', minHeight: '38px', fontSize: '0.78rem', fontWeight: 800, flex: 1, gap: '0.35rem' }}
                      title="Update progress, set expected date, or log reason if not started"
                    >
                      <TrendingUp style={{ width: '14px', height: '14px' }} />
                      <span>+ Update Progress</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {!isDone && (
                        <button onClick={() => startTimer(t.id)} className="btn-icon" style={{ minWidth: '38px', minHeight: '38px' }} title="Start timer">
                          <Play style={{ width: '14px', height: '14px', color: 'var(--brand-primary)' }} />
                        </button>
                      )}

                      {!isDone ? (
                        <button
                          onClick={() => changeTaskStatus(t.id, 'Completed')}
                          className="btn btn-secondary"
                          style={{ padding: '0.45rem 0.75rem', minHeight: '38px', fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}
                          title="Mark task as complete"
                        >
                          <Check style={{ width: '14px', height: '14px' }} /> Done
                        </button>
                      ) : (
                        <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '6px 10px' }}>
                          <CheckCircle2 style={{ width: '14px', height: '14px' }} /> Done
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ==========================================================================
          PROGRESS & REASON-FOR-DELAY MODAL WITH FULL HISTORY TIMELINE
          ========================================================================== */}
      {progressModalTaskId && (
        <QuickFollowupModal
          isOpen={!!progressModalTaskId}
          onClose={() => setProgressModalTaskId(null)}
          taskId={progressModalTaskId}
        />
      )}
    </div>
  );
}
