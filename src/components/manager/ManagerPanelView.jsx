import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import EmployeeKpiDrawer from '../teams/EmployeeKpiDrawer';
import { formatDate } from '../../utils/dateUtils';
import {
  Users,
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CheckSquare,
  Sparkles,
  Eye,
  Plus,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  Zap
} from 'lucide-react';

export default function ManagerPanelView() {
  const {
    users,
    tasks,
    activeUser,
    approveTask,
    rejectTask,
    reassignTask,
    setSelectedTaskId,
    setIsCreateModalOpen,
    dispatchScheduledTaskNow
  } = useTaskContext();

  const [inspectEmployeeId, setInspectEmployeeId] = useState(null);
  const [activeTab, setActiveTab] = useState('directReports'); // directReports, approvals, workload, scheduled

  // Find direct reports (employees whose manager is this active user)
  const directReports = users.filter(u => u.managerName === activeUser.name || u.id !== activeUser.id && (activeUser.role === 'Admin' || activeUser.department === u.department));

  // Direct reports' tasks
  const directReportTaskIds = directReports.map(u => u.id);
  const teamTasks = tasks.filter(t => directReportTaskIds.includes(t.assigneeId));
  const pendingTeamApprovals = teamTasks.filter(t => t.status === 'Review');
  const scheduledTasks = tasks.filter(t => (t.status === 'Scheduled' || (t.isScheduled && !t.dispatchedAt)));

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Panel Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#e0f2fe', color: '#0284c7', padding: '3px 10px', borderRadius: '99px', border: '1px solid #bae6fd' }}>
              👔 Manager Panel • Team Scope
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeUser.name} ({activeUser.department} Manager)</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Team Operations & Direct Reports Dashboard
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Manage direct report assignments, evaluate quarterly team KPIs/KRAs, and sign off completed tasks.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary" style={{ borderRadius: '12px', fontWeight: 800 }}>
            <Plus style={{ width: '16px', height: '16px' }} /> Delegate Task to Team
          </button>
        </div>
      </div>

      {/* Manager Summary Stats */}
      <div className="grid grid-cols-4 lg-grid-cols-2 sm-grid-cols-2 mobile-metrics-grid" style={{ gap: '0.85rem' }}>
        {/* Direct Reports */}
        <div className="glass-card" style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '18px', borderTop: '3px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Direct Reports</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#2563eb', letterSpacing: '-0.02em', display: 'block' }}>
              {directReports.length} Members
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{activeUser.department} Team</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="glass-card" style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '18px', borderTop: '3px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Pending Approvals</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fde68a', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#d97706', letterSpacing: '-0.02em', display: 'block' }}>
              {pendingTeamApprovals.length} Tasks
            </span>
            <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600 }}>Sign-off Required</span>
          </div>
        </div>

        {/* Team Active Tasks */}
        <div className="glass-card" style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '18px', borderTop: '3px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Team Active</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', border: '1px solid #bae6fd', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0284c7', letterSpacing: '-0.02em', display: 'block' }}>
              {teamTasks.filter(t => t.status !== 'Completed' && t.status !== 'Approved').length} Active
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Under Execution</span>
          </div>
        </div>

        {/* Avg Team KPI */}
        <div className="glass-card" style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '18px', borderTop: '3px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Avg Team KPI</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', border: '1px solid #a7f3d0', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.02em', display: 'block' }}>
              94.8%
            </span>
            <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>Q3 Target Exceeded</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mobile-task-tabs-strip" style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        <button onClick={() => { setActiveTab('directReports'); setInspectEmployeeId(null); }} className={`btn ${activeTab === 'directReports' ? 'btn-primary' : 'btn-secondary'}`} style={{ whiteSpace: 'nowrap', flexShrink: 0, padding: '0.5rem 1rem', borderRadius: '99px' }}>
          <Users style={{ width: '14px', height: '14px' }} /> Direct Reports ({directReports.length})
        </button>
        <button onClick={() => { setActiveTab('approvals'); setInspectEmployeeId(null); }} className={`btn ${activeTab === 'approvals' ? 'btn-primary' : 'btn-secondary'}`} style={{ whiteSpace: 'nowrap', flexShrink: 0, padding: '0.5rem 1rem', borderRadius: '99px' }}>
          <CheckSquare style={{ width: '14px', height: '14px' }} /> Approvals Queue ({pendingTeamApprovals.length})
        </button>
        <button onClick={() => { setActiveTab('workload'); setInspectEmployeeId(null); }} className={`btn ${activeTab === 'workload' ? 'btn-primary' : 'btn-secondary'}`} style={{ whiteSpace: 'nowrap', flexShrink: 0, padding: '0.5rem 1rem', borderRadius: '99px' }}>
          <Briefcase style={{ width: '14px', height: '14px' }} /> Team Task Delegation
        </button>
        <button onClick={() => { setActiveTab('scheduled'); setInspectEmployeeId(null); }} className={`btn ${activeTab === 'scheduled' ? 'btn-primary' : 'btn-secondary'}`} style={{ whiteSpace: 'nowrap', flexShrink: 0, padding: '0.5rem 1rem', borderRadius: '99px' }}>
          <Zap style={{ width: '14px', height: '14px', color: '#8b5cf6' }} /> Scheduled Automations ({scheduledTasks.length})
        </button>
      </div>

      {/* TAB 1: DIRECT REPORTS */}
      {activeTab === 'directReports' && (
        <div className="grid grid-cols-2 lg-grid-cols-1" style={{ gap: '1rem' }}>
          {directReports.map(member => {
            const memberTasks = tasks.filter(t => t.assigneeId === member.id && t.status !== 'Completed' && t.status !== 'Approved');
            const kpi = member.kpi || { onTimeRate: 90, avgResolutionHours: 16, qualityScore: 95 };
            const review = member.performanceReview || { rating: 4.5 };
            return (
              <div key={member.id} className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={member.avatar} alt={member.name} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-primary)' }} />
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>{member.name}</span>
                        <span className="badge badge-brand" style={{ fontSize: '0.6rem' }}>{member.role}</span>
                      </h4>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{member.team} • {member.email}</p>
                    </div>
                  </div>

                  <span className="badge badge-emerald">{review.rating || 4.5} / 5.0 Rating</span>
                </div>

                {/* KPI Overview Pills */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: 'var(--bg-input)', padding: '0.6rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>On-Time Rate</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-success)', fontFamily: 'monospace' }}>{kpi.onTimeRate}%</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>Velocity</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>{kpi.avgResolutionHours}h</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>Quality Score</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-purple)', fontFamily: 'monospace' }}>{kpi.qualityScore}%</span>
                  </div>
                </div>

                {/* Footer & Actions */}
                <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Assigned Tasks: <strong style={{ color: 'var(--text-primary)' }}>{memberTasks.length} active</strong></span>

                  <button onClick={() => setInspectEmployeeId(member.id)} className="btn btn-primary" style={{ padding: '0.25rem 0.65rem', fontSize: '0.7rem' }}>
                    <Eye style={{ width: '12px', height: '12px' }} /> Inspect KRAs & Evaluation
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: TEAM APPROVALS QUEUE */}
      {activeTab === 'approvals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pendingTeamApprovals.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
              <CheckCircle2 style={{ width: '40px', height: '40px', color: 'var(--color-success)', margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '0.875rem', fontWeight: 800 }}>No pending team approvals!</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>All direct report submissions have been reviewed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg-grid-cols-1" style={{ gap: '1rem' }}>
              {pendingTeamApprovals.map(t => {
                const assignee = users.find(u => u.id === t.assigneeId);
                return (
                  <div key={t.id} className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid var(--brand-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-brand" style={{ fontFamily: 'monospace' }}>{t.id}</span>
                      <span className="badge badge-amber">Awaiting Manager Sign-off</span>
                    </div>

                    <h4 onClick={() => setSelectedTaskId(t.id)} style={{ fontSize: '0.875rem', fontWeight: 800, cursor: 'pointer' }}>{t.title}</h4>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Submitted by: <strong>{assignee?.name}</strong> • Est: {t.estimatedHours}h / Act: {t.actualHours}h</p>

                    <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                      <button onClick={() => approveTask(t.id, `Approved by Manager ${activeUser.name}`)} className="btn btn-primary" style={{ flex: 1, background: 'var(--color-success)' }}>
                        Approve
                      </button>
                      <button onClick={() => rejectTask(t.id, 'Manager requested revision')} className="btn btn-danger" style={{ flex: 1 }}>
                        Request Revision
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TEAM TASK DELEGATION */}
      {activeTab === 'workload' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Task ID</th><th>Title</th><th>Assignee</th><th>Status</th><th>Priority</th><th>Due Date</th><th>Reassign</th></tr>
            </thead>
            <tbody>
              {teamTasks.map(t => {
                const assignee = users.find(u => u.id === t.assigneeId);
                return (
                  <tr key={t.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-light)' }}>{t.id}</td>
                    <td style={{ fontWeight: 700 }}>{t.title}</td>
                    <td>{assignee?.name}</td>
                    <td><span className="badge badge-brand">{t.status}</span></td>
                    <td style={{ fontWeight: 800 }}>{t.priority}</td>
                    <td>{formatDate(t.dueDate)}</td>
                    <td>
                      <select
                        onChange={(e) => reassignTask(t.id, e.target.value)}
                        value={t.assigneeId}
                        className="select-dropdown"
                        style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                      >
                        {directReports.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: SCHEDULED AUTOMATIONS (ZAPIER-STYLE DISPATCH) */}
      {activeTab === 'scheduled' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08))', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '12px', padding: '1rem 1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Zapier Task Dispatch Automations</h4>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Staged tasks are held until the allotted dispatch time, then automatically delivered to the employee with real-time sound alerts.
                </p>
              </div>
            </div>
            <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }}>
              + Schedule New Task
            </button>
          </div>

          {scheduledTasks.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Clock style={{ width: '36px', height: '36px', margin: '0 auto 0.75rem', opacity: 0.4 }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>No Scheduled Tasks in Queue</h4>
              <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>When you create a task with "Automated Scheduled Dispatch", it will appear here waiting for its trigger time.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Task ID</th>
                    <th>Title</th>
                    <th>Target Assignee</th>
                    <th>Allotted Trigger Time</th>
                    <th>Priority</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledTasks.map(t => {
                    const assignee = users.find(u => u.id === t.assigneeId);
                    const isPassed = t.scheduledAt && new Date(t.scheduledAt).getTime() <= Date.now();
                    return (
                      <tr key={t.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-light)' }}>
                          <span style={{ cursor: 'pointer' }} onClick={() => setSelectedTaskId(t.id)}>{t.id}</span>
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          <span style={{ cursor: 'pointer' }} onClick={() => setSelectedTaskId(t.id)}>{t.title}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img src={assignee?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignee?.name || 'User')}`} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                            <span>{assignee?.name || t.assigneeId}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: isPassed ? '#10b981' : '#8b5cf6', fontWeight: 700 }}>
                            <Clock style={{ width: '13px', height: '13px' }} />
                            <span>{t.scheduledAt ? new Date(t.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Ready'}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${t.priority === 'Critical' ? 'badge-rose' : t.priority === 'Urgent' ? 'badge-amber' : 'badge-brand'}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => dispatchScheduledTaskNow(t.id)}
                            className="btn btn-primary"
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.25rem 0.65rem',
                              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                              border: 'none',
                              color: '#fff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <Zap style={{ width: '12px', height: '12px' }} />
                            Dispatch Now
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Employee Kpi Drawer Inspector */}
      {inspectEmployeeId && (
        <EmployeeKpiDrawer
          employeeId={inspectEmployeeId}
          onClose={() => setInspectEmployeeId(null)}
        />
      )}
    </div>
  );
}
