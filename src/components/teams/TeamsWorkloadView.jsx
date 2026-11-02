import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import EmployeeKpiDrawer from './EmployeeKpiDrawer';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Award,
  ShieldCheck,
  Eye,
  Target
} from 'lucide-react';

export default function TeamsWorkloadView() {
  const { users, tasks, departments, activeUser } = useTaskContext();
  const [selectedDept, setSelectedDept] = useState('All');
  const [activeTab, setActiveTab] = useState('directory'); // directory, adminKpi
  const [inspectEmployeeId, setInspectEmployeeId] = useState(null);

  const isAdmin = activeUser.role === 'Admin';

  const usersWithCapacity = users.map(user => {
    const activeTasks = tasks.filter(
      t => t.assigneeId === user.id && t.status !== 'Completed' && t.status !== 'Approved' && t.status !== 'Cancelled'
    );
    const assignedHours = activeTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const capacityHours = user.capacityHours || 40;
    const utilizationRate = Math.round((assignedHours / capacityHours) * 100);

    return {
      ...user,
      activeTasksCount: activeTasks.length,
      assignedHours,
      capacityHours,
      utilizationRate,
      isOverloaded: assignedHours > capacityHours
    };
  });

  const filteredUsers = usersWithCapacity.filter(u => selectedDept === 'All' || u.department === selectedDept);
  const recommendedUser = [...usersWithCapacity].sort((a, b) => a.utilizationRate - b.utilizationRate)[0];

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users style={{ width: '20px', height: '20px', color: 'var(--brand-light)' }} />
            <span>Employee Directory & Capacity Planner</span>
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Monitor team capacity utilization, skill tags, and inspect detailed Admin KPI/KRA profiles.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="select-dropdown" style={{ width: 'auto' }}>
            <option value="All">All Departments ({departments.length})</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button onClick={() => { setActiveTab('directory'); setInspectEmployeeId(null); }} className={`btn ${activeTab === 'directory' ? 'btn-primary' : 'btn-secondary'}`}>
          Employee Directory ({filteredUsers.length})
        </button>
        {(isAdmin || activeUser.role === 'Manager') && (
          <button onClick={() => { setActiveTab('adminKpi'); setInspectEmployeeId(null); }} className={`btn ${activeTab === 'adminKpi' ? 'btn-primary' : 'btn-secondary'}`}>
            <Award style={{ width: '14px', height: '14px' }} /> {isAdmin ? 'Admin' : 'Manager'} KPI & KRA Matrix
          </button>
        )}
      </div>

      {/* Smart Workload Recommendation Banner */}
      {recommendedUser && activeTab === 'directory' && (
        <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', border: '1px solid var(--brand-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sparkles style={{ width: '22px', height: '22px', color: '#f59e0b' }} />
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-light)' }}>Workload-Aware Smart Recommendation</span>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Optimal Assignee: <span style={{ color: 'var(--color-success)' }}>{recommendedUser.name}</span> ({recommendedUser.department})
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Currently at only {recommendedUser.utilizationRate}% capacity ({recommendedUser.assignedHours}/{recommendedUser.capacityHours} hrs booked).</p>
            </div>
          </div>

          <span className="badge badge-emerald">High Availability</span>
        </div>
      )}

      {/* TAB 1: DIRECTORY GRID */}
      {activeTab === 'directory' ? (
        <div className="grid grid-cols-3 lg-grid-cols-2 sm-grid-cols-1" style={{ gap: '1.15rem' }}>
          {filteredUsers.map(u => (
            <div key={u.id} className="glass-card" style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', border: u.isOverloaded ? '1px solid var(--color-danger)' : '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src={u.avatar} alt={u.name} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>{u.name}</span>
                      <span className="badge badge-brand" style={{ fontSize: '0.6rem' }}>{u.role}</span>
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.department}</p>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.employeeId || 'EMP-100'}</span>
                  </div>
                </div>

                {u.isOverloaded ? <AlertTriangle style={{ width: '18px', height: '18px', color: 'var(--color-danger)' }} /> : <CheckCircle2 style={{ width: '18px', height: '18px', color: 'var(--color-success)' }} />}
              </div>

              {/* Capacity Progress Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Capacity Utilization</span>
                  <span style={{ color: u.isOverloaded ? 'var(--color-danger)' : 'var(--text-primary)', fontFamily: 'monospace' }}>{u.assignedHours}/{u.capacityHours} hrs ({u.utilizationRate}%)</span>
                </div>
                <div style={{ width: '100%', background: 'var(--bg-input)', borderRadius: '99px', height: '7px', overflow: 'hidden' }}>
                  <div style={{ background: u.isOverloaded ? 'var(--color-danger)' : 'var(--color-success)', height: '100%', width: `${Math.min(100, u.utilizationRate)}%` }}></div>
                </div>
              </div>

              {/* Skills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {(u.skills || []).map(skill => (
                  <span key={skill} className="badge badge-cyan" style={{ fontSize: '0.62rem', textTransform: 'none' }}>
                    {skill}
                  </span>
                ))}
              </div>

              {/* Footer Stat & Admin KPI Profile Inspector Button */}
              <div style={{ paddingTop: '0.65rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Active Tasks: <strong style={{ color: 'var(--text-primary)' }}>{u.activeTasksCount}</strong></span>

                {isAdmin ? (
                  <button onClick={() => setInspectEmployeeId(u.id)} className="btn btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.68rem' }}>
                    <Eye style={{ width: '12px', height: '12px' }} /> View KPI / KRA Profile
                  </button>
                ) : (
                  <span className="badge badge-brand">Employee Access</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TAB 2: ADMIN KPI & KRA DIRECTORY MATRIX */
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>On-Time Rate</th>
                <th>Avg Velocity</th>
                <th>SLA Compliance</th>
                <th>Quality Score</th>
                <th>Manager Review Rating</th>
                <th style={{ textAlign: 'right' }}>Admin Inspection</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => {
                const kpi = u.kpi || { onTimeRate: 90, avgResolutionHours: 16, overdueRate: 3, qualityScore: 95, slaCompliance: 96 };
                const rating = u.performanceReview?.rating || 4.5;
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <img src={u.avatar} alt={u.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <span style={{ fontWeight: 800, display: 'block' }}>{u.name}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.employeeId || 'EMP-100'}</span>
                        </div>
                      </div>
                    </td>
                    <td>{u.department}</td>
                    <td style={{ fontWeight: 800, color: 'var(--color-success)', fontFamily: 'monospace' }}>{kpi.onTimeRate}%</td>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{kpi.avgResolutionHours} hrs</td>
                    <td style={{ fontWeight: 800, color: '#0284c7', fontFamily: 'monospace' }}>{kpi.slaCompliance}%</td>
                    <td style={{ fontWeight: 800, color: 'var(--color-purple)', fontFamily: 'monospace' }}>{kpi.qualityScore}%</td>
                    <td>
                      <span className="badge badge-emerald" style={{ fontWeight: 800 }}>{rating} / 5.0 Rating</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => setInspectEmployeeId(u.id)} className="btn btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }}>
                        <Eye style={{ width: '12px', height: '12px' }} /> Inspect Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin KPI/KRA Profile Drawer Modal */}
      {inspectEmployeeId && (
        <EmployeeKpiDrawer
          employeeId={inspectEmployeeId}
          onClose={() => setInspectEmployeeId(null)}
        />
      )}
    </div>
  );
}
