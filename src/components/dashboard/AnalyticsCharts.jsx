import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const PRIORITY_COLORS = {
  Low: '#94a3b8',
  Normal: '#0284c7',
  High: '#f59e0b',
  Urgent: '#f97316',
  Critical: '#ef4444'
};

export function PriorityPieChart({ tasks }) {
  const counts = { Low: 0, Normal: 0, High: 0, Urgent: 0, Critical: 0 };
  tasks.forEach(t => {
    if (counts[t.priority] !== undefined) counts[t.priority]++;
  });

  const data = Object.keys(counts).map(key => ({
    name: key,
    value: counts[key],
    color: PRIORITY_COLORS[key]
  }));

  return (
    <div style={{ height: '260px', width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#d0e4ff', borderRadius: '12px', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.15)' }}
            itemStyle={{ color: '#0f172a', fontWeight: 600 }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 600 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DepartmentBarChart({ tasks, departments }) {
  const data = departments.map(d => {
    const deptTasks = tasks.filter(t => t.department === d.name);
    const completed = deptTasks.filter(t => t.status === 'Completed' || t.status === 'Approved').length;
    const inProgress = deptTasks.filter(t => t.status === 'In Progress' || t.status === 'Review').length;
    const pending = deptTasks.length - completed - inProgress;

    return {
      name: d.code,
      fullName: d.name,
      Completed: completed,
      'In Progress': inProgress,
      Pending: Math.max(0, pending)
    };
  });

  return (
    <div style={{ height: '260px', width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
          <YAxis stroke="#64748b" fontSize={11} />
          <Tooltip
            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#d0e4ff', borderRadius: '12px', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.15)' }}
            itemStyle={{ color: '#0f172a' }}
          />
          <Legend formatter={(value) => <span style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 600 }}>{value}</span>} />
          <Bar dataKey="Completed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
          <Bar dataKey="In Progress" stackId="a" fill="#0284c7" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Pending" stackId="a" fill="#93c5fd" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
