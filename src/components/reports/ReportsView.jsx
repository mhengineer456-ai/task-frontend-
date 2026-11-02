import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';

export default function ReportsView() {
  const { tasks, users } = useTaskContext();
  const [activeReportTab, setActiveReportTab] = useState('velocity');

  const velocityData = [
    { week: 'Week 1', Completed: 12, Created: 15 },
    { week: 'Week 2', Completed: 18, Created: 14 },
    { week: 'Week 3', Completed: 22, Created: 20 },
    { week: 'Week 4', Completed: 28, Created: 24 }
  ];

  const userTimeData = users.map(u => {
    const userTasks = tasks.filter(t => t.assigneeId === u.id);
    const est = userTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const act = userTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    return { name: u.name.split(' ')[0], Estimated: est, Actual: act };
  });

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 style={{ width: '20px', height: '20px', color: 'var(--color-info)' }} />
          <span>Executive Reports & Deep Analytics</span>
        </h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Audit completion velocity, SLA breach reasons, and productivity metrics.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button onClick={() => setActiveReportTab('velocity')} className={`btn ${activeReportTab === 'velocity' ? 'btn-primary' : 'btn-secondary'}`}>Velocity & Trend</button>
        <button onClick={() => setActiveReportTab('time')} className={`btn ${activeReportTab === 'time' ? 'btn-primary' : 'btn-secondary'}`}>Estimated vs Actual Time</button>
      </div>

      {/* Chart Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 800 }}>
          {activeReportTab === 'velocity' ? 'Weekly Task Completion Velocity' : 'Time Spent Variance by Team Member (Hours)'}
        </h3>
        <div style={{ height: '320px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            {activeReportTab === 'velocity' ? (
              <LineChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="week" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Legend />
                <Line type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={3} />
                <Line type="monotone" dataKey="Created" stroke="#6366f1" strokeWidth={3} />
              </LineChart>
            ) : (
              <BarChart data={userTimeData}>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Legend />
                <Bar dataKey="Estimated" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
