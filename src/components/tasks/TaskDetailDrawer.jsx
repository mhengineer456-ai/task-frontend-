import React, { useState, useEffect } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { formatDate, isOverdue } from '../../utils/dateUtils';
import {
  X,
  Play,
  Edit,
  Trash2,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Plus,
  ChevronRight,
  UserCheck,
  Target,
  AlertTriangle
} from 'lucide-react';

export default function TaskDetailDrawer({ taskId, onClose }) {
  const {
    tasks,
    users,
    statuses,
    changeTaskStatus,
    startTimer,
    logTime,
    addComment,
    addChecklistItem,
    toggleChecklistItem,
    deleteTask,
    setEditingTask,
    setIsCreateModalOpen,
    activeUser,
    addDailyFollowup,
    updateTaskProgress
  } = useTaskContext();

  const [activeTab, setActiveTab] = useState('overview');
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [manualHours, setManualHours] = useState('2');
  const [manualTimeComment, setManualTimeComment] = useState('');

  // Task Progress & Follow-up State
  const [localProgress, setLocalProgress] = useState(0);
  const [progressNote, setProgressNote] = useState('');
  const [followupForm, setFollowupForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    progress: 0,
    notes: '',
    actionRequired: '',
    nextFollowupDate: '',
    status: 'On Track'
  });

  if (!taskId) return null;
  const task = tasks.find(t => t.id === taskId);
  if (!task) return null;

  const assignee = users.find(u => u.id === task.assigneeId);
  const creator = users.find(u => u.id === task.creatorId);
  const approvalOwner = users.find(u => u.id === task.approvalOwnerId);

  const completedChecklistCount = (task.checklist || []).filter(c => c.completed).length;
  const totalChecklistCount = (task.checklist || []).length;
  const isLate = isOverdue(task.dueDate, task.status);
  const followupsList = Array.isArray(task.followups) ? task.followups : [];

  useEffect(() => {
    if (task) {
      setLocalProgress(task.progress || 0);
      setFollowupForm(prev => ({
        ...prev,
        progress: task.progress || 0
      }));
    }
  }, [task?.id, task?.progress]);

  const handleSendComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(task.id, commentText, isInternalComment);
    setCommentText('');
  };

  const handleAddChecklist = (e) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    addChecklistItem(task.id, newChecklistText);
    setNewChecklistText('');
  };

  const handleManualTimeSubmit = (e) => {
    e.preventDefault();
    if (!manualHours || Number(manualHours) <= 0) return;
    logTime(task.id, Number(manualHours), manualTimeComment, 'Manual Entry');
    setManualTimeComment('');
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete task ${task.id}?`)) {
      deleteTask(task.id);
      onClose();
    }
  };

  const handleSaveProgress = (e) => {
    e.preventDefault();
    updateTaskProgress(task.id, localProgress, progressNote);
    setProgressNote('');
  };

  const handleQuickProgress = (val) => {
    setLocalProgress(val);
    updateTaskProgress(task.id, val, `Set to ${val}% via quick button`);
  };

  const handleAddFollowup = (e) => {
    e.preventDefault();
    if (!followupForm.notes.trim()) return;

    addDailyFollowup(task.id, {
      ...followupForm,
      progress: Number(followupForm.progress)
    });

    // Reset follow-up form notes
    setFollowupForm({
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      progress: followupForm.progress,
      notes: '',
      actionRequired: '',
      nextFollowupDate: '',
      status: followupForm.status || 'On Track'
    });
  };

  const getProgressColor = (pct) => {
    if (pct >= 100) return '#10b981';
    if (pct >= 75) return '#06b6d4';
    if (pct >= 50) return '#3b82f6';
    if (pct >= 25) return '#f59e0b';
    return '#6366f1';
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-sidebar)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-brand" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{task.id}</span>
            <span className={`badge ${task.priority === 'Critical' ? 'badge-rose' : 'badge-brand'}`}>{task.priority}</span>
            <span
              className="badge"
              style={{
                background: `${getProgressColor(task.progress || 0)}20`,
                color: getProgressColor(task.progress || 0),
                border: `1px solid ${getProgressColor(task.progress || 0)}40`,
                fontWeight: 800
              }}
            >
              {task.progress || 0}% Progress
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={() => { setEditingTask(task); setIsCreateModalOpen(true); }} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}><Edit style={{ width: '14px', height: '14px' }} /> Edit</button>
            <button onClick={handleDelete} className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}><Trash2 style={{ width: '14px', height: '14px' }} /></button>
            <button onClick={onClose} className="btn-icon"><X style={{ width: '18px', height: '18px' }} /></button>
          </div>
        </div>

        {/* Status Pipeline Picker Bar */}
        <div style={{ padding: '0.75rem 1.25rem', background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
          {statuses.map(s => (
            <button
              key={s.id}
              onClick={() => changeTaskStatus(task.id, s.id)}
              className={`btn ${task.status === s.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', whiteSpace: 'nowrap' }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Title */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{task.title}</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{task.department} • {task.category}</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1.25rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-input)', overflowX: 'auto' }}>
          <button onClick={() => setActiveTab('overview')} className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem', whiteSpace: 'nowrap' }}>Overview</button>
          <button onClick={() => setActiveTab('followups')} className={`btn ${activeTab === 'followups' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
            <span>Daily Follow-ups</span>
            <span className="badge badge-brand" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>{followupsList.length}</span>
          </button>
          <button onClick={() => setActiveTab('checklist')} className={`btn ${activeTab === 'checklist' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem', whiteSpace: 'nowrap' }}>Checklist ({completedChecklistCount}/{totalChecklistCount})</button>
          <button onClick={() => setActiveTab('time')} className={`btn ${activeTab === 'time' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem', whiteSpace: 'nowrap' }}>Time Logs ({task.actualHours || 0}h)</button>
          <button onClick={() => setActiveTab('comments')} className={`btn ${activeTab === 'comments' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem', whiteSpace: 'nowrap' }}>Discussion ({(task.comments || []).length})</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.8125rem' }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Task Progress Controller */}
              <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: `4px solid ${getProgressColor(task.progress || 0)}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp style={{ width: '16px', height: '16px', color: getProgressColor(task.progress || 0) }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-primary)' }}>Task Progress Tracker</span>
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: getProgressColor(task.progress || 0) }}>
                    {task.progress || 0}% Complete
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(0, task.progress || 0))}%`,
                      background: `linear-gradient(90deg, ${getProgressColor(task.progress || 0)}, #6366f1)`,
                      borderRadius: '999px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>

                {/* Quick Progress Buttons */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {[0, 25, 50, 75, 100].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickProgress(val)}
                      className="btn"
                      style={{
                        flex: 1,
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: (task.progress || 0) === val ? 'var(--brand-primary)' : 'var(--bg-input)',
                        color: (task.progress || 0) === val ? '#fff' : 'var(--text-primary)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      {val}%
                    </button>
                  ))}
                </div>

                {/* Detailed Progress Slider & Save */}
                <form onSubmit={handleSaveProgress} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={localProgress}
                      onChange={(e) => setLocalProgress(Number(e.target.value))}
                      style={{ flex: 1, accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
                    />
                    <span style={{ width: '45px', textAlign: 'right', fontWeight: 800, fontSize: '0.85rem' }}>{localProgress}%</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Add brief note for this progress update (optional)..."
                      value={progressNote}
                      onChange={(e) => setProgressNote(e.target.value)}
                      className="input-text"
                      style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem', fontWeight: 700 }}>
                      Update Progress
                    </button>
                  </div>
                </form>
              </div>

              {/* Description */}
              <div className="glass-panel" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description</span>
                <p style={{ marginTop: '0.35rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{task.description || 'No description provided.'}</p>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2" style={{ gap: '0.75rem' }}>
                <div className="glass-card" style={{ padding: '0.75rem' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Primary Assignee</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '6px' }}>
                    {assignee?.avatar ? (
                      <img src={assignee.avatar} alt={assignee.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--brand-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                        {(assignee?.name || 'U').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{assignee?.name || 'Unassigned'}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{assignee?.role || 'Team Member'} • {assignee?.department || task.department}</div>
                    </div>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '0.75rem' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Due Date & Status</span>
                  <div style={{ marginTop: '6px' }}>
                    <span style={{ display: 'block', fontWeight: 800, color: isLate ? 'var(--color-danger)' : 'var(--text-primary)' }}>{formatDate(task.dueDate)}</span>
                    {task.expectedDate && (
                      <span style={{ display: 'block', fontSize: '0.7rem', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                        🎯 Expected: {formatDate(task.expectedDate)}
                      </span>
                    )}
                    <span style={{ fontSize: '0.65rem', color: isLate ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                      {isLate ? '⚠️ Overdue' : `Status: ${task.status}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Not Started Blocker Alert if present */}
              {Number(task.progress || 0) === 0 && task.reasonNotStarted && (
                <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f59e0b', fontWeight: 800, fontSize: '0.75rem' }}>
                    <AlertTriangle style={{ width: '14px', height: '14px' }} />
                    <span>Reason Task Has Not Started Yet ({task.delayCategory || 'Pending Kickoff'}):</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-primary)', fontStyle: 'italic', fontSize: '0.75rem', lineHeight: '1.4' }}>
                    "{task.reasonNotStarted}"
                  </p>
                </div>
              )}

              {/* Latest Daily Follow-up Sneak Peek */}
              {followupsList.length > 0 && (
                <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock style={{ width: '14px', height: '14px', color: 'var(--brand-light)' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Latest Daily Follow-up</span>
                    </div>
                    <button onClick={() => setActiveTab('followups')} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }}>
                      View All ({followupsList.length}) <ChevronRight style={{ width: '12px', height: '12px', display: 'inline' }} />
                    </button>
                  </div>
                  <div style={{ padding: '0.6rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 800 }}>{followupsList[0].authorName} ({followupsList[0].date})</span>
                      <span className="badge badge-brand">{followupsList[0].status || 'On Track'}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{followupsList[0].notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DAILY FOLLOW-UPS (Multiple Daily Follow-up Logs) */}
          {activeTab === 'followups' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Add New Daily Follow-up Form */}
              <form onSubmit={handleAddFollowup} className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus style={{ width: '16px', height: '16px', color: 'var(--brand-primary)' }} />
                    <h4 style={{ fontWeight: 800, fontSize: '0.85rem' }}>Log Daily Follow-Up</h4>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Logging as: <strong style={{ color: 'var(--brand-light)' }}>{activeUser?.name || 'User'}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-3 sm-grid-cols-1" style={{ gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Follow-up Date</label>
                    <input
                      type="date"
                      required
                      value={followupForm.date}
                      onChange={(e) => setFollowupForm({ ...followupForm, date: e.target.value })}
                      className="input-text"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Current Status</label>
                    <select
                      value={followupForm.status}
                      onChange={(e) => setFollowupForm({ ...followupForm, status: e.target.value })}
                      className="select-dropdown"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
                    >
                      <option value="On Track">🟢 On Track</option>
                      <option value="In Progress">🔵 In Progress</option>
                      <option value="Blocked">🔴 Blocked / Need Help</option>
                      <option value="Under Review">🟣 Under Review</option>
                      <option value="Completed">✅ Completed</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: 0 }}>Progress Update</label>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-light)' }}>{followupForm.progress}%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={followupForm.progress}
                        onChange={(e) => setFollowupForm({ ...followupForm, progress: Number(e.target.value) })}
                        style={{ flex: 1, accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={followupForm.progress}
                        onChange={(e) => setFollowupForm({ ...followupForm, progress: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                        className="input-text"
                        style={{ width: '50px', textAlign: 'center', fontSize: '0.75rem', padding: '0.25rem' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Daily Accomplishments & Discussion Notes *</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Mention today's progress, work completed, challenges faced, or updates from team member..."
                    value={followupForm.notes}
                    onChange={(e) => setFollowupForm({ ...followupForm, notes: e.target.value })}
                    className="textarea-input"
                    style={{ fontSize: '0.75rem' }}
                  />
                </div>

                <div className="grid grid-cols-2 sm-grid-cols-1" style={{ gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Action Required / Next Steps (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Need code review from Paras, or deploy build"
                      value={followupForm.actionRequired}
                      onChange={(e) => setFollowupForm({ ...followupForm, actionRequired: e.target.value })}
                      className="input-text"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Next Follow-up Date (Optional)</label>
                    <input
                      type="date"
                      value={followupForm.nextFollowupDate}
                      onChange={(e) => setFollowupForm({ ...followupForm, nextFollowupDate: e.target.value })}
                      className="input-text"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: 800 }}>
                    <Plus style={{ width: '14px', height: '14px' }} /> Save Daily Follow-Up
                  </button>
                </div>
              </form>

              {/* Follow-ups Chronological History */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Daily Follow-up History ({followupsList.length})
                  </h4>
                </div>

                {followupsList.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                    <MessageSquare style={{ width: '28px', height: '28px', margin: '0 auto 0.5rem', opacity: 0.5 }} />
                    <p style={{ fontWeight: 700, fontSize: '0.8rem' }}>No daily follow-ups logged yet.</p>
                    <p style={{ fontSize: '0.7rem', marginTop: '4px' }}>Keep the board and team updated by adding regular daily follow-ups above.</p>
                  </div>
                ) : (
                  followupsList.map((fol, index) => (
                    <div
                      key={fol.id || index}
                      className="glass-card"
                      style={{
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem',
                        borderLeft: `4px solid ${
                          fol.status === 'Blocked' ? '#f43f5e' :
                          fol.status === 'Completed' ? '#10b981' :
                          fol.status === 'In Progress' ? '#3b82f6' : '#06b6d4'
                        }`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--brand-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.65rem' }}>
                            {(fol.authorName || 'U').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{fol.authorName}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                              ({fol.authorRole || 'Team Member'})
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className={`badge ${
                            fol.status === 'Blocked' ? 'badge-rose' :
                            fol.status === 'Completed' ? 'badge-emerald' :
                            fol.status === 'In Progress' ? 'badge-cyan' : 'badge-brand'
                          }`}>
                            {fol.status || 'On Track'}
                          </span>
                          {fol.progress !== undefined && (
                            <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--brand-light)', fontWeight: 800 }}>
                              {fol.progress}% Progress
                            </span>
                          )}
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {fol.date} {fol.time ? `• ${fol.time}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* If Not Started: Reason Callout Box */}
                      {fol.reasonNotStarted && (
                        <div
                          style={{
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '6px',
                            padding: '0.45rem 0.65rem',
                            fontSize: '0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem'
                          }}
                        >
                          <strong style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <AlertTriangle style={{ width: '13px', height: '13px' }} />
                            <span>Reason Why Not Started: {fol.delayCategory || 'Pending Kickoff'}</span>
                          </strong>
                          <p style={{ margin: 0, color: 'var(--text-primary)', fontStyle: 'italic' }}>
                            "{fol.reasonNotStarted}"
                          </p>
                        </div>
                      )}

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>
                        {fol.notes}
                      </div>

                      {(fol.actionRequired || fol.nextFollowupDate || fol.expectedDate) && (
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)', fontSize: '0.7rem' }}>
                          {fol.expectedDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0284c7', fontWeight: 700 }}>
                              <Target style={{ width: '12px', height: '12px' }} />
                              <span>Expected Completion: {formatDate(fol.expectedDate)}</span>
                            </div>
                          )}
                          {fol.actionRequired && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--brand-light)' }}>
                              <strong>Action:</strong> <span>{fol.actionRequired}</span>
                            </div>
                          )}
                          {fol.nextFollowupDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                              <Calendar style={{ width: '12px', height: '12px' }} />
                              <span>Next follow-up: {fol.nextFollowupDate}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CHECKLIST */}
          {activeTab === 'checklist' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(task.checklist || []).map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklistItem(task.id, item.id)}
                  className="glass-card"
                  style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                >
                  <input type="checkbox" checked={item.completed} readOnly />
                  <span style={{ textDecoration: item.completed ? 'line-through' : 'none', opacity: item.completed ? 0.6 : 1 }}>{item.text}</span>
                </div>
              ))}

              <form onSubmit={handleAddChecklist} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input type="text" placeholder="Add new subtask item..." value={newChecklistText} onChange={(e) => setNewChecklistText(e.target.value)} className="input-text" style={{ flex: 1 }} />
                <button type="submit" className="btn btn-primary">Add</button>
              </form>
            </div>
          )}

          {/* TAB 4: TIME LOGS */}
          {activeTab === 'time' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Total Time Logged</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace' }}>{task.actualHours || 0} / {task.estimatedHours || 0} Hours</div>
                </div>
                <button onClick={() => startTimer(task.id)} className="btn btn-primary"><Play style={{ width: '14px', height: '14px' }} /> Start Timer</button>
              </div>

              <form onSubmit={handleManualTimeSubmit} className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ fontWeight: 800 }}>Manual Time Entry</h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="number" step="0.5" value={manualHours} onChange={(e) => setManualHours(e.target.value)} className="input-text" style={{ width: '80px' }} />
                  <input type="text" placeholder="Summary..." value={manualTimeComment} onChange={(e) => setManualTimeComment(e.target.value)} className="input-text" style={{ flex: 1 }} />
                  <button type="submit" className="btn btn-secondary">Log</button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: COMMENTS / DISCUSSION */}
          {activeTab === 'comments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto' }}>
                {(task.comments || []).map(cmt => (
                  <div key={cmt.id} className="glass-card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{cmt.userName}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{formatDate(cmt.timestamp)}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{cmt.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendComment} style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <input type="text" placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="input-text" style={{ flex: 1 }} />
                <button type="submit" className="btn btn-primary"><Send style={{ width: '14px', height: '14px' }} /></button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
