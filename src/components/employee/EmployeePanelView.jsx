import React from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { formatDate, isDueToday, isOverdue } from '../../utils/dateUtils';
import {
  Inbox,
  Award,
  Target,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Check
} from 'lucide-react';

export default function EmployeePanelView() {
  const {
    tasks,
    activeUser,
    changeTaskStatus,
    startTimer,
    setSelectedTaskId
  } = useTaskContext();

  const myTasks = tasks.filter(t => t.assigneeId === activeUser.id);
  const dueToday = myTasks.filter(t => isDueToday(t.dueDate));
  const overdue = myTasks.filter(t => isOverdue(t.dueDate, t.status));
  const completed = myTasks.filter(t => t.status === 'Completed' || t.status === 'Approved');

  const kpi = activeUser.kpi || { onTimeRate: 92, avgResolutionHours: 14.5, overdueRate: 2.1, qualityScore: 96, slaCompliance: 98 };
  const kraList = activeUser.kraList || [];
  const review = activeUser.performanceReview || { rating: 4.6, evaluationPeriod: 'Q3 2026', managerFeedback: 'Great personal performance and velocity.' };

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#e0f2fe', color: '#0284c7', padding: '3px 10px', borderRadius: '99px', border: '1px solid #bae6fd' }}>
              👤 Personal Workstation
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeUser.name} ({activeUser.role} • {activeUser.department})</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Hello, {activeUser.name}! Let's crush today's goals 🎯
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Track assigned tasks, log execution time, check subtask items, and monitor personal KPIs.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '0.6rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.65rem', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles style={{ width: '16px', height: '16px' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Personal Velocity</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981' }}>{completed.length} Completed</div>
          </div>
        </div>
      </div>

      {/* Employee Top Metric Bar */}
      <div className="grid grid-cols-4 lg-grid-cols-2 sm-grid-cols-2 mobile-metrics-grid" style={{ gap: '0.85rem' }}>
        {/* Due Today */}
        <div className="glass-card" style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '18px', borderTop: '3px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Due Today</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', border: '1px solid #bae6fd', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0284c7', letterSpacing: '-0.02em', display: 'block' }}>
              {dueToday.length} Tasks
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Requires focus</span>
          </div>
        </div>

        {/* Overdue */}
        <div className="glass-card" style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '18px', borderTop: '3px solid #f43f5e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Overdue</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)', border: '1px solid #fecdd3', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f43f5e', letterSpacing: '-0.02em', display: 'block' }}>
              {overdue.length} Tasks
            </span>
            <span style={{ fontSize: '0.72rem', color: '#f43f5e', fontWeight: 600 }}>Requires action</span>
          </div>
        </div>

        {/* My On-Time Rate */}
        <div className="glass-card" style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '18px', borderTop: '3px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>On-Time Rate</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', border: '1px solid #a7f3d0', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.02em', display: 'block' }}>
              {kpi.onTimeRate}%
            </span>
            <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>Target: &gt;90%</span>
          </div>
        </div>

        {/* Manager Rating */}
        <div className="glass-card" style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '18px', borderTop: '3px solid #4f46e5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Manager Rating</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', border: '1px solid #c7d2fe', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#4f46e5', letterSpacing: '-0.02em', display: 'block' }}>
              {review.rating} / 5.0
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{review.evaluationPeriod} Score</span>
          </div>
        </div>
      </div>

      {/* Main Grid: My Active Tasks + My Personal KPI Scorecard */}
      <div className="grid grid-cols-3 lg-grid-cols-1" style={{ gap: '1.25rem' }}>
        {/* Left 2 Cols: My Active Tasks List */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Inbox style={{ width: '16px', height: '16px', color: 'var(--brand-light)' }} /> My Active Assigned Tasks ({myTasks.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {myTasks.length === 0 ? (
              <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active tasks assigned! All caught up.
              </div>
            ) : (
              myTasks.map(t => {
                const isLate = isOverdue(t.dueDate, t.status);
                const isDone = t.status === 'Completed' || t.status === 'Approved';
                return (
                  <div key={t.id} className="glass-card glass-card-hover" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-brand" style={{ fontFamily: 'monospace' }}>{t.id}</span>
                      <span className={`badge ${isLate ? 'badge-rose' : 'badge-brand'}`}>{t.status}</span>
                    </div>

                    <h4 onClick={() => setSelectedTaskId(t.id)} style={{ fontSize: '0.875rem', fontWeight: 800, cursor: 'pointer' }}>{t.title}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.description}</p>

                    <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: isLate ? 'var(--color-danger)' : 'var(--text-muted)', fontWeight: 600 }}>Due: {formatDate(t.dueDate)}</span>

                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {!isDone && (
                          <button onClick={() => startTimer(t.id)} className="btn-icon" title="Start live timer">
                            <Play style={{ width: '14px', height: '14px', color: 'var(--brand-primary)' }} />
                          </button>
                        )}
                        {!isDone ? (
                          <button onClick={() => changeTaskStatus(t.id, 'Completed')} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: 'var(--color-success)' }}>
                            <Check style={{ width: '12px', height: '12px' }} /> Mark Done
                          </button>
                        ) : (
                          <span className="badge badge-emerald">Done</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: My Personal KRAs & Evaluation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target style={{ width: '16px', height: '16px', color: 'var(--brand-primary)' }} /> My Key Result Areas (KRAs)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {kraList.map(kra => (
              <div key={kra.id} className="glass-card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78125rem', fontWeight: 800 }}>
                  <span>{kra.title}</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--brand-primary)' }}>{kra.score}/100</span>
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{kra.description}</p>
                <div style={{ width: '100%', background: 'var(--bg-input)', borderRadius: '99px', height: '5px', overflow: 'hidden', marginTop: '2px' }}>
                  <div style={{ background: kra.score >= 95 ? 'var(--color-success)' : 'var(--brand-primary)', height: '100%', width: `${kra.score}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Manager Review Notes ({review.evaluationPeriod})</span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              "{review.managerFeedback}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
