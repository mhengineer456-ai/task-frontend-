import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { exportTasksToCSV } from '../../utils/exportUtils';
import { Trash2, Download, X } from 'lucide-react';

export default function BulkActionsBar({ selectedTaskIds, onClearSelection }) {
  const {
    tasks,
    statuses,
    bulkUpdateStatus,
    bulkDeleteTasks,
    reassignTask,
    changeTaskPriority
  } = useTaskContext();

  const [targetStatus, setTargetStatus] = useState('');
  const [targetPriority, setTargetPriority] = useState('');

  if (selectedTaskIds.length === 0) return null;

  const selectedTasks = tasks.filter(t => selectedTaskIds.includes(t.id));

  const handleApplyStatus = () => {
    if (!targetStatus) return;
    bulkUpdateStatus(selectedTaskIds, targetStatus);
    onClearSelection();
  };

  const handleApplyPriority = () => {
    if (!targetPriority) return;
    selectedTaskIds.forEach(id => changeTaskPriority(id, targetPriority));
    onClearSelection();
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedTaskIds.length} tasks?`)) {
      bulkDeleteTasks(selectedTaskIds);
      onClearSelection();
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        padding: '12px 20px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        border: '1px solid var(--brand-primary)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRight: '1px solid var(--border-color)', paddingRight: '1rem' }}>
        <span style={{ background: 'var(--brand-primary)', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
          {selectedTaskIds.length}
        </span>
        <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Tasks Selected</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <select value={targetStatus} onChange={(e) => setTargetStatus(e.target.value)} className="select-dropdown" style={{ width: 'auto', padding: '0.35rem 0.6rem' }}>
          <option value="">Set Status...</option>
          {statuses.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        {targetStatus && <button onClick={handleApplyStatus} className="btn btn-primary" style={{ padding: '0.35rem 0.65rem' }}>Apply</button>}
      </div>

      <div style={{ display: 'flex', items: 'center', gap: '0.5rem' }}>
        <select value={targetPriority} onChange={(e) => setTargetPriority(e.target.value)} className="select-dropdown" style={{ width: 'auto', padding: '0.35rem 0.6rem' }}>
          <option value="">Set Priority...</option>
          <option value="Low">Low</option>
          <option value="Normal">Normal</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
          <option value="Critical">Critical</option>
        </select>
        {targetPriority && <button onClick={handleApplyPriority} className="btn btn-primary" style={{ padding: '0.35rem 0.65rem' }}>Apply</button>}
      </div>

      <button onClick={() => exportTasksToCSV(selectedTasks)} className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem' }}>
        <Download style={{ width: '14px', height: '14px' }} /> Export CSV
      </button>

      <button onClick={handleDelete} className="btn btn-danger" style={{ padding: '0.35rem 0.65rem' }}>
        <Trash2 style={{ width: '14px', height: '14px' }} /> Delete
      </button>

      <button onClick={onClearSelection} className="btn-icon">
        <X style={{ width: '16px', height: '16px' }} />
      </button>
    </div>
  );
}
