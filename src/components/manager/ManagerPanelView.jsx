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
  Briefcase
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
    setIsCreateModalOpen
  } = useTaskContext();

  const [inspectEmployeeId, setInspectEmployeeId] = useState(null);
  const [activeTab, setActiveTab] = useState('directReports'); // directReports, approvals, workload

  // Find direct reports (employees whose manager is this active user)
  const directReports = users.filter(u => u.managerName === activeUser.name || u.id !== activeUser.id && (activeUser.role === 'Admin' || activeUser.department === u.department));

  // Direct reports' tasks
  const directReportTaskIds = directReports.map(u => u.id);
  const teamTasks = tasks.filter(t => directReportTaskIds.includes(t.assigneeId));
  const pendingTeamApprovals = teamTasks.filter(t => t.status === 'Review');

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Panel Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
            <span className="badge badge-brand" style={{ background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd' }}>
              👔 Manager Panel • Team Level Scope
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeUser.name} ({activeUser.department} Manager)</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Team Ops & Direct Reports Dashboard</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Manage direct report assignments, evaluate quarterly team KPIs/KRAs, and sign off completed tasks.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
            <Plus style={{ width: '16px', height: '16px' }} /> Delegate Task to Team
          </button>
        </div>
      </div>

      {/* Manager Summary Stats */}
      <div className="grid grid-cols-4 lg-grid-cols-2 sm-grid-cols-1" style={{ gap: '0.85rem' }}>
        <div className="glass-card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>My Direct Reports</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
            {directReports.length} Members
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{activeUser.department} Team</span>
        </div>

        <div className="glass-card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Pending Team Approvals</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-warning)', fontFamily: 'monospace' }}>
            {pendingTeamApprovals.length} Tasks
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Requires Manager Sign-off</span>
        </div>

        <div className="glass-card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Team Active Tasks</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-info)', fontFamily: 'monospace' }}>
            {teamTasks.filter(t => t.status !== 'Completed' && t.status !== 'Approved').length} Active
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Under Execution</span>
        </div>

        <div className="glass-card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Avg Team KPI Score</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)', fontFamily: 'monospace' }}>
            94.8%
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Q3 Target Exceeded</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button onClick={() => { setActiveTab('directReports'); setInspectEmployeeId(null); }} className={`btn ${activeTab === 'directReports' ? 'btn-primary' : 'btn-secondary'}`}>
          <Users style={{ width: '14px', height: '14px' }} /> Direct Reports & KPI Matrix ({directReports.length})
        </button>
        <button onClick={() => { setActiveTab('approvals'); setInspectEmployeeId(null); }} className={`btn ${activeTab === 'approvals' ? 'btn-primary' : 'btn-secondary'}`}>
          <CheckSquare style={{ width: '14px', height: '14px' }} /> Team Approval Queue ({pendingTeamApprovals.length})
        </button>
        <button onClick={() => { setActiveTab('workload'); setInspectEmployeeId(null); }} className={`btn ${activeTab === 'workload' ? 'btn-primary' : 'btn-secondary'}`}>
          <Briefcase style={{ width: '14px', height: '14px' }} /> Team Task Delegation
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
