import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import EaFollowUpModal from './EaFollowUpModal';
import {
  ClipboardList,
  PhoneCall,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  MessageSquare,
  Search,
  User,
  ShieldAlert,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Filter
} from 'lucide-react';

export default function EaPanelView() {
  const {
    tasks,
    users,
    eaFollowUps,
    activeUser,
    sendNotification,
    setViewingUserProfile,
    setSelectedTaskId
  } = useTaskContext();

  const [selectedTaskForFollowUp, setSelectedTaskForFollowUp] = useState(null);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'overdue' | 'escalated' | 'today'
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tasks created or assigned by MD
  const mdTasks = tasks;

  const followUpLogs = eaFollowUps || [];
  const escalatedLogs = followUpLogs.filter(l => l.isEscalatedToMd || l.status === 'Escalated to MD');
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const dueTodayLogs = followUpLogs.filter(l => l.nextFollowUpDate === todayDateStr);

  const filteredTasks = mdTasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterMode === 'overdue') {
      return new Date(t.dueDate) < new Date() && t.status !== 'Completed' && t.status !== 'Approved';
    }
    if (filterMode === 'escalated') {
      return escalatedLogs.some(l => l.taskId === t.id);
    }
    return true;
  });

  const sendOneClickNudge = (task) => {
    const assignee = users.find(u => u.id === task.assigneeId);
    sendNotification(
      '🚨 EA Executive Follow-Up Reminder',
      `Rachel Green (EA to MD) requests urgent action update on task ${task.id}: "${task.title}".`,
      'approval',
      task.id
    );
  };

  return (
    <div className="view-container" style={{ padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Title & Hero */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>📋 Executive Assistant (EA) Follow-Up Portal</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', padding: '4px 12px', borderRadius: '99px' }}>
              MD Operations
            </span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Monitor MD-assigned deliverables, record assignee follow-ups, log required actions, and manage escalations.
          </p>
        </div>
      </div>

      {/* KPI Stats Gauges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #bae6fd', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>MD Active Tasks</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0c4a6e', margin: '0.25rem 0' }}>{mdTasks.length} Deliverables</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Assigned across all depts</div>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #fde68a', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase' }}>Follow-ups Due Today</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#92400e', margin: '0.25rem 0' }}>{dueTodayLogs.length} Scheduled</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Pending EA check-in</div>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #fecaca', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' }}>Escalated to MD</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#991b1b', margin: '0.25rem 0' }}>{escalatedLogs.length} Escalations</div>
          <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 700 }}>Requires MD Attention</div>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #bbf7d0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>Recorded Actions Logged</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#14532d', margin: '0.25rem 0' }}>{followUpLogs.length} Logged</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Audit trail active</div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #bae6fd' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#0284c7' }} />
          <input
            type="text"
            placeholder="Search MD tasks or assigned persons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ width: '100%', paddingLeft: '36px', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setFilterMode('all')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              background: filterMode === 'all' ? '#0284c7' : '#f0f7ff',
              color: filterMode === 'all' ? '#ffffff' : '#0369a1'
            }}
          >
            All MD Tasks ({mdTasks.length})
          </button>
          <button
            onClick={() => setFilterMode('overdue')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              background: filterMode === 'overdue' ? '#ef4444' : '#fef2f2',
              color: filterMode === 'overdue' ? '#ffffff' : '#991b1b'
            }}
          >
            Overdue Deliverables
          </button>
          <button
            onClick={() => setFilterMode('escalated')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              background: filterMode === 'escalated' ? '#991b1b' : '#fef2f2',
              color: filterMode === 'escalated' ? '#ffffff' : '#991b1b'
            }}
          >
            ⚠️ Escalated to MD ({escalatedLogs.length})
          </button>
        </div>
      </div>

      {/* Main MD Task Tracking Table */}
      <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid #bae6fd', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f0f7ff', borderBottom: '1px solid #bae6fd', fontSize: '0.75rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>
              <th style={{ padding: '1rem 1.25rem' }}>Task ID & Title</th>
              <th style={{ padding: '1rem 1.25rem' }}>Assigned Person</th>
              <th style={{ padding: '1rem 1.25rem' }}>Due Date</th>
              <th style={{ padding: '1rem 1.25rem' }}>Latest Follow-Up Notes & Promised Action</th>
              <th style={{ padding: '1rem 1.25rem' }}>Status</th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>EA Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  No tasks matching the selected filter criteria.
                </td>
              </tr>
            ) : (
              filteredTasks.map(t => {
                const assignee = users.find(u => u.id === t.assigneeId) || { name: 'Assignee', role: 'Employee', avatar: '' };
                const latestLog = followUpLogs.find(l => l.taskId === t.id);
                const isOverdue = new Date(t.dueDate) < new Date() && t.status !== 'Completed' && t.status !== 'Approved';

                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.15s ease' }} className="hover:bg-slate-50">
                    {/* Task ID & Title */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0284c7' }}>{t.id}</span>
                        {isOverdue && <span className="badge badge-rose">Late</span>}
                      </div>
                      <div
                        onClick={() => setSelectedTaskId(t.id)}
                        style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {t.title}
                      </div>
                    </td>

                    {/* Assigned Person */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div
                        onClick={() => setViewingUserProfile(assignee.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
                        title="Click to view employee KPI & profile status"
                      >
                        <img src={assignee.avatar} alt={assignee.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0f172a' }}>{assignee.name}</div>
                          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{assignee.role}</div>
                        </div>
                      </div>
                    </td>

                    {/* Due Date */}
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.8125rem', color: isOverdue ? '#ef4444' : '#334155', fontWeight: isOverdue ? 800 : 600 }}>
                      {t.dueDate?.slice(0, 10)}
                    </td>

                    {/* Latest Follow-Up Notes */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {latestLog ? (
                        <div>
                          <div style={{ fontSize: '0.78125rem', fontWeight: 700, color: '#0369a1' }}>
                            {latestLog.channel} • Next: {latestLog.nextFollowUpDate}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '2px' }}>
                            "{latestLog.actionNotes}"
                          </div>
                          {latestLog.actionRequired && (
                            <div style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                              Promised Action: {latestLog.actionRequired}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>No EA follow-up recorded yet</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {latestLog?.isEscalatedToMd ? (
                        <span className="badge badge-rose" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                          ⚠️ Escalated to MD
                        </span>
                      ) : (
                        <span className="badge badge-brand">{t.status}</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setSelectedTaskForFollowUp(t)}
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          title="Log EA follow-up conversation and required action"
                        >
                          <PhoneCall style={{ width: '14px', height: '14px' }} />
                          <span>Take Follow-up</span>
                        </button>
                        <button
                          onClick={() => sendOneClickNudge(t)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#f0f7ff', color: '#0284c7', border: '1px solid #bae6fd' }}
                          title="Send quick EA push reminder to assigned person"
                        >
                          <Send style={{ width: '14px', height: '14px' }} />
                          <span>Nudge</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Recorded EA Action Logs Timeline */}
      <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid #bae6fd', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock style={{ width: '18px', height: '18px', color: '#0284c7' }} />
          Recent EA Follow-Up Audit Log & Action Record History ({followUpLogs.length})
        </h3>

        {followUpLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No follow-up action logs recorded yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {followUpLogs.map(log => (
              <div key={log.id} style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0284c7' }}>{log.taskId}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>{log.taskTitle}</span>
                    <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      {log.channel}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#334155', marginTop: '4px' }}>
                    <strong>Assignee: {log.assigneeName}</strong> • Note: "{log.actionNotes}"
                  </div>
                  {log.actionRequired && (
                    <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                      Promised Action: {log.actionRequired}
                    </div>
                  )}
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                    Logged by {log.loggedBy} on {new Date(log.loggedAt).toLocaleString()} • Next Follow-up: {log.nextFollowUpDate}
                  </div>
                </div>

                {log.isEscalatedToMd ? (
                  <span className="badge badge-rose" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                    ⚠️ Escalated to MD
                  </span>
                ) : (
                  <span className="badge badge-emerald">{log.status}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Follow Up Modal */}
      <EaFollowUpModal
        isOpen={!!selectedTaskForFollowUp}
        onClose={() => setSelectedTaskForFollowUp(null)}
        task={selectedTaskForFollowUp}
      />
    </div>
  );
}
