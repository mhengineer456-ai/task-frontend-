import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { GanttChartSquare, Plus, GitCommit } from 'lucide-react';

export default function TaskGanttView() {
  const { tasks, setSelectedTaskId, setIsCreateModalOpen } = useTaskContext();
  const [zoomLevel, setZoomLevel] = useState('Days');

  const startDateWindow = new Date(2026, 8, 15);
  const totalDaysWindow = 25;

  const datesHeader = [];
  for (let i = 0; i < totalDaysWindow; i++) {
    const d = new Date(startDateWindow);
    d.setDate(d.getDate() + i);
    datesHeader.push(d);
  }

  const getTaskBarStyle = (task) => {
    const taskStart = new Date(task.startDate || '2026-09-20');
    const taskEnd = new Date(task.dueDate || '2026-09-25');

    const diffStartDays = (taskStart - startDateWindow) / (1000 * 60 * 60 * 24);
    const durationDays = Math.max(1, (taskEnd - taskStart) / (1000 * 60 * 60 * 24));

    const leftPercent = Math.max(0, (diffStartDays / totalDaysWindow) * 100);
    const widthPercent = Math.min(100 - leftPercent, (durationDays / totalDaysWindow) * 100);

    return {
      left: `${leftPercent}%`,
      width: `${Math.max(5, widthPercent)}%`
    };
  };

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GanttChartSquare style={{ width: '20px', height: '20px', color: 'var(--brand-light)' }} />
            <span>Project Timeline & Gantt Chart</span>
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Visualize schedule overlaps, milestones, and task dependency chains.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="glass-panel" style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem' }}>
            <button onClick={() => setZoomLevel('Days')} className={`btn ${zoomLevel === 'Days' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem' }}>Days</button>
            <button onClick={() => setZoomLevel('Weeks')} className={`btn ${zoomLevel === 'Weeks' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem' }}>Weeks</button>
          </div>

          <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
            <Plus style={{ width: '16px', height: '16px' }} /> Add Task
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="glass-panel" style={{ padding: '1rem', overflowX: 'auto' }}>
        <div style={{ minWidth: '950px' }}>
          {/* Header Row */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontWeight: 800, fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            <div style={{ width: '300px', flexShrink: 0 }}>Task Details & Dependencies</div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
              {datesHeader.map((date, idx) => (
                <div key={idx} style={{ flex: 1, textAlign: 'center', fontFamily: 'monospace', fontSize: '0.65rem' }}>
                  <div>{date.toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
                  <div style={{ fontWeight: 800 }}>{date.getDate()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Task Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tasks.map(t => {
              const barStyle = getTaskBarStyle(t);
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '300px', flexShrink: 0, paddingRight: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => setSelectedTaskId(t.id)} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.id}: {t.title}
                    </button>
                    {(t.dependencies || []).length > 0 && (
                      <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}><GitCommit style={{ width: '12px', height: '12px' }} /> {t.dependencies.length}</span>
                    )}
                  </div>

                  <div style={{ flex: 1, position: 'relative', height: '36px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                    <div
                      onClick={() => setSelectedTaskId(t.id)}
                      className="glass-card"
                      style={{
                        position: 'absolute',
                        height: '24px',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        color: '#fff',
                        cursor: 'pointer',
                        background: t.status === 'Completed' || t.status === 'Approved' ? 'var(--color-success)' : 'var(--brand-primary)',
                        ...barStyle
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                      <span style={{ fontFamily: 'monospace', opacity: 0.8, marginLeft: '4px' }}>{t.actualHours || 0}/{t.estimatedHours || 0}h</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
