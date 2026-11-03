import React from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { PriorityPieChart, DepartmentBarChart } from './AnalyticsCharts';
import { formatDate, isDueToday, isOverdue, getTimeAgo } from '../../utils/dateUtils';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Activity,
  Layers,
  Plus,
  Sparkles,
  ListTodo,
  Zap
} from 'lucide-react';

export default function DashboardView() {
  const {
    tasks,
    departments,
    auditLogs,
    setSelectedTaskId,
    setIsCreateModalOpen,
    activeUser,
    eaDailyTasks,
    eaMeetings,
    setActiveView,
    isMobileView
  } = useTaskContext();

  const dailyTasks = eaDailyTasks || [];
  const meetings = eaMeetings || [];
  const completedDailyCount = dailyTasks.filter(t => t.completed).length;
  const totalDailyCount = dailyTasks.length;
  const eaCompliancePercentage = totalDailyCount > 0 ? Math.round((completedDailyCount / totalDailyCount) * 100) : 100;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed' || t.status === 'Approved').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress' || t.status === 'Review').length;
  const dueTodayTasks = tasks.filter(t => isDueToday(t.dueDate));
  const overdueTasks = tasks.filter(t => isOverdue(t.dueDate, t.status));
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const totalActual = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

  const upcomingDeadlines = tasks
    ? [...tasks]
        .filter(t => t.status !== 'Completed' && t.status !== 'Approved' && t.status !== 'Cancelled')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5)
    : [];

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Welcome Hero Banner */}
      <div
        className="glass-panel dashboard-hero-banner"
        style={{
          position: 'relative',
          padding: '1.75rem 2rem',
          borderRadius: '22px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 48%, #0284c7 100%)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          color: '#ffffff',
          boxShadow: '0 12px 32px -4px rgba(37, 99, 235, 0.28)',
          overflow: 'hidden'
        }}
      >
        {/* Subtle decorative glowing glass bubbles */}
        <div
          style={{
            position: 'absolute',
            right: '-30px',
            top: '-40px',
            width: '220px',
            height: '220px',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, transparent 65%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '35%',
            bottom: '-60px',
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, transparent 65%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }}
        />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                background: 'rgba(255, 255, 255, 0.22)',
                color: '#ffffff',
                padding: '4px 12px',
                borderRadius: '99px',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            >
              ⚡ Executive Dashboard
            </span>
            <span style={{ fontSize: '0.78rem', color: '#e0e7ff', fontWeight: 600 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
            Welcome back, {activeUser.name || 'Workspace Leader'}! 👋
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#e0e7ff', marginTop: '0.35rem', fontWeight: 500, maxWidth: '640px', lineHeight: 1.4 }}>
            Here is your live enterprise snapshot across projects, team workloads, and routine deliverables.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn"
            style={{
              background: '#ffffff',
              color: '#2563eb',
              fontWeight: 800,
              padding: '0.65rem 1.35rem',
              borderRadius: '14px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
              border: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Plus style={{ width: '16px', height: '16px', color: '#2563eb' }} />
            <span>+ Create New Task</span>
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Quick Action Chips Bar */}
      <div className="mobile-quick-chips-bar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="quick-action-chip brand-chip"
        >
          <Plus style={{ width: '14px', height: '14px' }} />
          <span>New Task</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('chat')}
          className="quick-action-chip ai-chip"
        >
          <Sparkles style={{ width: '14px', height: '14px' }} />
          <span>Ask PulseBot</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('mytasks')}
          className="quick-action-chip neutral-chip"
        >
          <ListTodo style={{ width: '14px', height: '14px' }} />
          <span>My Tasks ({tasks.filter(t => t.assigneeId === activeUser?.id).length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('approvals')}
          className="quick-action-chip warning-chip"
        >
          <CheckCircle2 style={{ width: '14px', height: '14px' }} />
          <span>Approvals ({tasks.filter(t => t.status === 'Review').length})</span>
        </button>
      </div>

      {/* 👑 EA Daily Routine Performance & Compliance Card (MD Live Monitor - Hidden for Managers & Employees) */}
      {(activeUser?.role === 'EA' || activeUser?.role === 'MD') && (
        <div className="glass-panel" style={{ padding: '1.25rem', background: '#ffffff', border: '1px solid #bae6fd', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
                alt="Rachel Green (EA)"
                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0284c7' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    👑 EA Daily Routine Compliance Card
                  </h3>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#0284c7', color: '#ffffff', padding: '2px 8px', borderRadius: '4px' }}>
                    Rachel Green (EA)
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0 0' }}>
                  Real-time MD monitor tracking EA's daily working compliance and routine tasks execution.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0284c7' }}>
                Daily Task Progress: {completedDailyCount} / {totalDailyCount} ({eaCompliancePercentage}%)
              </span>
              <span style={{
                fontSize: '0.8125rem',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: '99px',
                background: eaCompliancePercentage >= 80 ? '#dcfce7' : '#fef3c7',
                color: eaCompliancePercentage >= 80 ? '#166534' : '#92400e'
              }}>
                {eaCompliancePercentage >= 80 ? '✅ On Track' : '⚠️ Action Pending'}
              </span>
            </div>
          </div>

          {/* Live Daily Routine Task List */}
          <div className="ea-routine-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.75rem' }}>
            {dailyTasks.map(t => (
              <div key={t.id} style={{ background: t.completed ? '#f0fdf4' : '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: t.completed ? '1px solid #bbf7d0' : '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0284c7' }}>{t.timeSlot}</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: t.completed ? '#166534' : '#d97706' }}>
                    {t.completed ? 'Done ✅' : 'Pending ⏳'}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', lineHeight: '1.25' }}>
                  {t.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6 Core Metric Cards */}
      <div className="grid grid-cols-6 lg-grid-cols-3 sm-grid-cols-2 mobile-metrics-grid" style={{ gap: '0.85rem' }}>
        {/* Total Tasks */}
        <div className="glass-card" style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '18px', borderTop: '3px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Total Tasks</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', display: 'block' }}>{totalTasks}</span>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>Across 6 depts</p>
          </div>
        </div>

        {/* Due Today */}
        <div className="glass-card" style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '18px', borderTop: '3px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Due Today</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '1px solid #bae6fd', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0284c7', letterSpacing: '-0.02em', display: 'block' }}>{dueTodayTasks.length}</span>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>Needs focus today</p>
          </div>
        </div>

        {/* Overdue */}
        <div className="glass-card" style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '18px', borderTop: '3px solid #f43f5e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Overdue</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', border: '1px solid #fecdd3', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f43f5e', letterSpacing: '-0.02em', display: 'block' }}>{overdueTasks.length}</span>
            <p style={{ fontSize: '0.72rem', color: '#f43f5e', fontWeight: 600, marginTop: '3px' }}>Action required</p>
          </div>
        </div>

        {/* In Progress */}
        <div className="glass-card" style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '18px', borderTop: '3px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>In Progress</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '1px solid #ddd6fe', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#8b5cf6', letterSpacing: '-0.02em', display: 'block' }}>{inProgressTasks}</span>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>Active execution</p>
          </div>
        </div>

        {/* Completion % */}
        <div className="glass-card" style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '18px', borderTop: '3px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Completion</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1px solid #a7f3d0', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.02em', display: 'block' }}>{completionRate}%</span>
            <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '99px', height: '6px', marginTop: '8px', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(90deg, #10b981, #06b6d4)', height: '100%', width: `${completionRate}%`, borderRadius: '99px', transition: 'width 0.5s ease' }}></div>
            </div>
          </div>
        </div>

        {/* Time Logged */}
        <div className="glass-card" style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '18px', borderTop: '3px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Time Logged</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1px solid #fde68a', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#d97706', letterSpacing: '-0.02em', display: 'block' }}>
              {(Math.round(totalActual * 10) / 10).toFixed(1)}h
            </span>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>vs {totalEstimated}h est.</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-2 lg-grid-cols-1" style={{ gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 800 }}>Priority Breakdown</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Task volume sorted by severity levels</p>
            </div>
            <span className="badge badge-brand">Live</span>
          </div>
          <PriorityPieChart tasks={tasks} />
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 800 }}>Department Workload Distribution</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Task state progress across teams</p>
            </div>
            <span className="badge badge-brand">Live</span>
          </div>
          <DepartmentBarChart tasks={tasks} departments={departments} />
        </div>
      </div>

      {/* Bottom Row: Deadlines & Activity Stream */}
      <div className="grid grid-cols-3 lg-grid-cols-1" style={{ gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 800 }}>Upcoming & Critical Deadlines</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tasks requiring immediate focus</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {upcomingDeadlines.map(t => {
              const late = isOverdue(t.dueDate, t.status);
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTaskId(t.id)}
                  className="glass-card glass-card-hover"
                  style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="badge badge-brand" style={{ fontFamily: 'monospace' }}>{t.id}</span>
                    <div>
                      <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>{t.title}</h4>
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <span>{t.department}</span>
                        <span>•</span>
                        <span>{t.status}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: late ? 'var(--color-danger)' : 'var(--text-secondary)' }}>
                      {formatDate(t.dueDate)}
                    </span>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{t.priority} Priority</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800 }}>Recent Activity</h3>
            <Activity style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '320px', overflowY: 'auto' }}>
            {auditLogs.slice(0, 7).map(log => (
              <div key={log.id} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-primary)', marginTop: '6px', flexShrink: 0 }}></div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontWeight: 500, lineHeight: '1.3' }}>{log.details}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    <span>{log.user}</span>
                    <span>•</span>
                    <span>{getTimeAgo(log.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
