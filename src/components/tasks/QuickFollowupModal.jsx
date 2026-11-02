import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTaskContext } from '../../context/TaskContext';
import { formatDate } from '../../utils/dateUtils';
import {
  X,
  MessageSquare,
  TrendingUp,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  Target,
  ArrowRight,
  User,
  Sparkles,
  Info
} from 'lucide-react';

export default function QuickFollowupModal({ isOpen, onClose, taskId }) {
  const { tasks, activeUser, addDailyFollowup } = useTaskContext();

  const task = tasks.find(t => t.id === taskId);
  const [activeTab, setActiveTab] = useState('log'); // 'log' | 'history'

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    progress: 0,
    status: 'In Progress',
    reasonNotStarted: '',
    delayCategory: 'Dependencies Blocked',
    expectedDate: '',
    notes: '',
    actionRequired: '',
    nextFollowupDate: ''
  });

  const delayCategories = [
    { id: 'Dependencies Blocked', label: '🚧 Dependencies Blocked' },
    { id: 'Waiting on Client / External', label: '⏳ Waiting on Client/Vendor' },
    { id: 'Awaiting Specs / Approval', label: '📋 Awaiting Specs/Approval' },
    { id: 'Resource Crunch', label: '👥 Resource/Bandwidth Crunch' },
    { id: 'Technical Issue', label: '🔧 Technical/Environment Issue' },
    { id: 'Other Reason', label: '❓ Other Reason' }
  ];

  useEffect(() => {
    if (task) {
      const curProgress = Number(task.progress || 0);
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        progress: curProgress,
        status: curProgress === 0 ? 'Not Started' : (curProgress === 100 ? 'Completed' : 'In Progress'),
        reasonNotStarted: task.reasonNotStarted || '',
        delayCategory: task.delayCategory || 'Dependencies Blocked',
        expectedDate: task.expectedDate || task.dueDate || new Date().toISOString().slice(0, 10),
        notes: '',
        actionRequired: '',
        nextFollowupDate: ''
      });
      setActiveTab('log');
    }
  }, [task?.id, isOpen]);

  // Global Esc key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const followupsList = Array.isArray(task.followups) ? task.followups : [];
  const isZeroProgress = Number(formData.progress) === 0;

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation: if progress is 0, require reason why not started
    if (isZeroProgress && !formData.reasonNotStarted.trim()) {
      alert('Please provide the reason why this task has not started yet.');
      return;
    }

    addDailyFollowup(task.id, {
      ...formData,
      progress: Number(formData.progress),
      reasonNotStarted: isZeroProgress ? formData.reasonNotStarted.trim() : '',
      delayCategory: isZeroProgress ? formData.delayCategory : '',
      expectedDate: formData.expectedDate,
      notes: formData.notes.trim() || (isZeroProgress ? `Task Not Started: ${formData.reasonNotStarted.trim()}` : `Progress updated to ${formData.progress}%`)
    });

    onClose();
  };

  const getProgressColor = (pct) => {
    if (pct >= 100) return '#10b981';
    if (pct >= 75) return '#06b6d4';
    if (pct >= 50) return '#3b82f6';
    if (pct >= 25) return '#f59e0b';
    return '#6366f1';
  };

  const modalJSX = (
    <div
      className="modal-overlay"
      style={{
        zIndex: 999999,
        position: 'fixed',
        inset: 0,
        background: 'rgba(8, 12, 22, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55)',
          background: 'var(--bg-card)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==========================================================================
            1. MODAL HEADER
            ========================================================================== */}
        <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-header)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--brand-primary), #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
              <TrendingUp style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span className="badge badge-brand" style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
                  {task.id}
                </span>
                <span className="badge" style={{ background: 'var(--bg-input)', fontSize: '0.7rem' }}>
                  {task.priority} Priority
                </span>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.15rem 0 0 0' }}>
                {task.title}
              </h3>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon" style={{ borderRadius: '8px', padding: '6px' }} title="Close (Esc)">
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* ==========================================================================
            2. TABS STRIP (LOG UPDATE vs HISTORY)
            ========================================================================== */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.55rem 1.4rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('log')}
            className={`btn ${activeTab === 'log' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem' }}
          >
            <TrendingUp style={{ width: '14px', height: '14px' }} />
            <span>Update Progress & Details</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem' }}
          >
            <History style={{ width: '14px', height: '14px' }} />
            <span>Progress History ({followupsList.length})</span>
          </button>
        </div>

        {/* ==========================================================================
            3. TAB 1: LOG UPDATE FORM
            ========================================================================== */}
        {activeTab === 'log' && (
          <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', overflowY: 'auto' }}>
            
            {/* Row: Date/Time + Status */}
            <div className="grid grid-cols-2 sm-grid-cols-1" style={{ gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Log Date & Time</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input-text"
                    style={{ flex: 1, fontSize: '0.75rem', height: '34px' }}
                  />
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="input-text"
                    style={{ width: '90px', fontSize: '0.75rem', height: '34px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Task Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => {
                    const nextStatus = e.target.value;
                    let nextProg = formData.progress;
                    if (nextStatus === 'Not Started') nextProg = 0;
                    if (nextStatus === 'Completed') nextProg = 100;
                    setFormData({ ...formData, status: nextStatus, progress: nextProg });
                  }}
                  className="select-dropdown"
                  style={{ fontSize: '0.75rem', height: '34px' }}
                >
                  <option value="Not Started">⚪ Not Started Yet (0%)</option>
                  <option value="In Progress">🔵 In Progress</option>
                  <option value="On Track">🟢 On Track</option>
                  <option value="Blocked">🔴 Blocked / Waiting on Input</option>
                  <option value="Under Review">🟣 Under Review</option>
                  <option value="Completed">✅ Completed (100%)</option>
                </select>
              </div>
            </div>

            {/* Interactive Progress Slider */}
            <div className="form-group" style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <TrendingUp style={{ width: '15px', height: '15px', color: getProgressColor(formData.progress) }} />
                  <label className="form-label" style={{ marginBottom: 0, fontSize: '0.78rem', fontWeight: 800 }}>
                    Current Progress Level
                  </label>
                </div>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, color: getProgressColor(formData.progress), fontFamily: 'monospace' }}>
                  {formData.progress}%
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.progress}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    setFormData({
                      ...formData,
                      progress: p,
                      status: p === 0 ? 'Not Started' : (p === 100 ? 'Completed' : 'In Progress')
                    });
                  }}
                  style={{ flex: 1, accentColor: getProgressColor(formData.progress), cursor: 'pointer', height: '6px' }}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => {
                    const p = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                    setFormData({
                      ...formData,
                      progress: p,
                      status: p === 0 ? 'Not Started' : (p === 100 ? 'Completed' : 'In Progress')
                    });
                  }}
                  className="input-text"
                  style={{ width: '65px', textAlign: 'center', fontWeight: 900, fontSize: '0.85rem', padding: '0.3rem', height: '32px' }}
                />
              </div>
            </div>

            {/* ==========================================================================
                CONDITIONAL: WHY NOT STARTED YET SECTION (TRIGGERED WHEN PROGRESS === 0%)
                ========================================================================== */}
            {isZeroProgress && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(239, 68, 68, 0.06))',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  animation: 'fadeIn 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle style={{ width: '18px', height: '18px', color: '#f59e0b' }} />
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      Task is Not Started Yet (0%)
                    </h4>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                      Please specify the primary blocker or reason so managers & stakeholders stay aligned.
                    </p>
                  </div>
                </div>

                {/* Reason Category Pills */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                    Primary Blocker Category *
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                    {delayCategories.map(cat => (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setFormData({ ...formData, delayCategory: cat.id })}
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.6rem',
                          borderRadius: '999px',
                          border: formData.delayCategory === cat.id ? '1px solid #f59e0b' : '1px solid var(--border-color)',
                          background: formData.delayCategory === cat.id ? 'rgba(245, 158, 11, 0.18)' : 'var(--bg-card)',
                          color: formData.delayCategory === cat.id ? '#ca8a04' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reason Textarea (Required) */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                    Detailed Reason Why It Has Not Started Yet *
                  </label>
                  <textarea
                    rows={2}
                    required={isZeroProgress}
                    placeholder="e.g. Waiting on API credentials from the vendor, pending architectural design sign-off, or blocked by task #102..."
                    value={formData.reasonNotStarted}
                    onChange={(e) => setFormData({ ...formData, reasonNotStarted: e.target.value })}
                    className="textarea-input"
                    style={{ fontSize: '0.78rem', padding: '0.5rem', background: 'var(--bg-card)' }}
                  />
                </div>
              </div>
            )}

            {/* ==========================================================================
                EXPECTED DATE OF COMPLETION (EDC) SECTION
                ========================================================================== */}
            <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Target style={{ width: '16px', height: '16px', color: '#0284c7' }} />
                  <label className="form-label" style={{ marginBottom: 0, fontSize: '0.78rem', fontWeight: 800 }}>
                    Expected Date of Completion (EDC) *
                  </label>
                </div>
                <span className="badge" style={{ fontSize: '0.68rem', background: 'var(--bg-card)' }}>
                  Target Due: {formatDate(task.dueDate)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="date"
                  required
                  value={formData.expectedDate}
                  onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                  className="input-text"
                  style={{ flex: 1, fontSize: '0.8rem', height: '36px' }}
                />
              </div>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0 }}>
                💡 Sets a realistic delivery target for team tracking and management review.
              </p>
            </div>

            {/* General Work Remarks / Notes */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>
                Progress Notes & Remarks {!isZeroProgress && '*'}
              </label>
              <textarea
                rows={2}
                required={!isZeroProgress}
                placeholder={isZeroProgress ? "Optional extra notes on current status or dependencies..." : "Detail what milestones were accomplished, technical work finished, or next steps..."}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="textarea-input"
                style={{ fontSize: '0.8rem' }}
              />
            </div>

            {/* Next Action Required */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Next Action Required (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Code review by lead, client QA staging test..."
                value={formData.actionRequired}
                onChange={(e) => setFormData({ ...formData, actionRequired: e.target.value })}
                className="input-text"
                style={{ fontSize: '0.75rem', height: '34px' }}
              />
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" style={{ fontSize: '0.75rem' }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                Save Progress & Expected Date
              </button>
            </div>
          </form>
        )}

        {/* ==========================================================================
            4. TAB 2: PROGRESS & DELAY HISTORY TIMELINE
            ========================================================================== */}
        {activeTab === 'history' && (
          <div style={{ padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
            {followupsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <History style={{ width: '40px', height: '40px', opacity: 0.3, margin: '0 auto 0.75rem' }} />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>No Progress History Yet</h4>
                <p style={{ fontSize: '0.75rem' }}>Use the "Update Progress" tab to log your first progress update or blocker reason.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                    Chronological Progress & Delay Audit Trail
                  </span>
                  <span className="badge badge-brand">{followupsList.length} Total Logs</span>
                </div>

                {followupsList.map((item, idx) => {
                  const itemProg = Number(item.progress || 0);
                  const wasNotStarted = itemProg === 0 || !!item.reasonNotStarted;

                  return (
                    <div
                      key={item.id || idx}
                      className="glass-card"
                      style={{
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        borderLeft: `4px solid ${getProgressColor(itemProg)}`,
                        background: wasNotStarted ? 'rgba(245, 158, 11, 0.03)' : undefined
                      }}
                    >
                      {/* Timeline Header: Date/Time + Author + Progress Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {item.authorName || 'Team Contributor'}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            ({item.authorRole || 'Contributor'})
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            • {item.date} {item.time && `at ${item.time}`}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span
                            className="badge"
                            style={{
                              background: getProgressColor(itemProg),
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '0.7rem'
                            }}
                          >
                            {itemProg}% {itemProg === 0 ? 'Not Started' : itemProg === 100 ? 'Completed' : 'Progress'}
                          </span>
                          <span className="badge" style={{ background: 'var(--bg-input)', fontSize: '0.68rem' }}>
                            {item.status || 'Updated'}
                          </span>
                        </div>
                      </div>

                      {/* If Not Started: Reason Callout Box */}
                      {wasNotStarted && item.reasonNotStarted && (
                        <div
                          style={{
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '6px',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f59e0b', fontWeight: 800 }}>
                            <AlertTriangle style={{ width: '13px', height: '13px' }} />
                            <span>Reason Why Not Started: {item.delayCategory || 'Pending Kickoff'}</span>
                          </div>
                          <p style={{ margin: 0, color: 'var(--text-primary)', fontStyle: 'italic' }}>
                            "{item.reasonNotStarted}"
                          </p>
                        </div>
                      )}

                      {/* Remarks Text */}
                      {item.notes && item.notes !== item.reasonNotStarted && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.15rem 0', lineHeight: '1.45' }}>
                          {item.notes}
                        </p>
                      )}

                      {/* Footer Meta: Expected Date + Next Action */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', paddingTop: '0.35rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {item.expectedDate ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#0284c7', fontWeight: 700 }}>
                            <Target style={{ width: '12px', height: '12px' }} />
                            <span>Expected Completion: {formatDate(item.expectedDate)}</span>
                          </div>
                        ) : (
                          <span />
                        )}

                        {item.actionRequired && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <ArrowRight style={{ width: '12px', height: '12px', color: 'var(--brand-primary)' }} />
                            <span>Next: {item.actionRequired}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <button type="button" onClick={() => setActiveTab('log')} className="btn btn-primary" style={{ fontSize: '0.75rem' }}>
                <TrendingUp style={{ width: '13px', height: '13px' }} /> Log New Progress Update
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : modalJSX;
}
