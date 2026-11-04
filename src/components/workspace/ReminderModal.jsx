import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import {
  Bell,
  X,
  Calendar,
  Clock,
  AlertTriangle,
  Repeat,
  CheckCircle2,
  Bookmark,
  FileText
} from 'lucide-react';

export default function ReminderModal({ isOpen, onClose }) {
  const { tasks, activeUser, createReminder } = useTaskContext();

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return today;
  });
  const [dueTime, setDueTime] = useState('10:00');
  const [priority, setPriority] = useState('Normal');
  const [taskId, setTaskId] = useState('');
  const [repeatCycle, setRepeatCycle] = useState('none');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    setIsSubmitting(true);
    try {
      const selectedTask = tasks.find(t => t.id === taskId);
      await createReminder({
        userId: activeUser?.id || 'usr-1',
        userName: activeUser?.name || 'User',
        title: title.trim(),
        notes: notes.trim(),
        dueDate,
        dueTime,
        priority,
        taskId: taskId || null,
        taskTitle: selectedTask ? selectedTask.title : null,
        repeatCycle
      });

      // Reset
      setTitle('');
      setNotes('');
      setTaskId('');
      setPriority('Normal');
      onClose();
    } catch (err) {
      console.error('Failed to create reminder:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="workspace-modal-overlay" onClick={onClose}>
      <div className="workspace-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="workspace-modal-header" style={{ borderBottomColor: 'rgba(217, 70, 239, 0.2)' }}>
          <div className="workspace-modal-header-left">
            <div
              className="workspace-modal-icon-badge"
              style={{ background: 'linear-gradient(135deg, #d946ef 0%, #a21caf 100%)', color: '#fff' }}
            >
              <Bell style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h3 className="workspace-modal-title">New Reminder</h3>
              <p className="workspace-modal-subtitle">Quick to-dos that notify and keep you on track</p>
            </div>
          </div>
          <button onClick={onClose} className="workspace-modal-close-btn" type="button">
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="workspace-modal-body">
          {/* Title */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>
              What do you want to be reminded about? *
            </label>
            <input
              type="text"
              required
              autoFocus
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Follow up on QA report or call client"
              style={{ fontSize: '0.95rem', padding: '10px 14px' }}
            />
          </div>

          {/* Date & Time Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar style={{ width: '14px', height: '14px', color: '#d946ef' }} />
                Due Date *
              </label>
              <input
                type="date"
                required
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock style={{ width: '14px', height: '14px', color: '#d946ef' }} />
                Due Time
              </label>
              <input
                type="time"
                className="form-input"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          </div>

          {/* Priority Pills */}
          <div className="form-group">
            <label className="form-label">Priority</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Low', 'Normal', 'High', 'Urgent'].map((p) => {
                const isSelected = priority === p;
                const colors = {
                  Low: '#64748b',
                  Normal: '#2563eb',
                  High: '#f59e0b',
                  Urgent: '#ef4444'
                };
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className="priority-pill-btn"
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: '10px',
                      border: isSelected ? `2px solid ${colors[p]}` : '1px solid var(--border-color)',
                      background: isSelected ? `${colors[p]}15` : 'transparent',
                      color: isSelected ? colors[p] : 'var(--text-secondary)',
                      fontWeight: isSelected ? 800 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Link to Task (Optional) */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bookmark style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }} />
              Link to Task (Optional)
            </label>
            <select
              className="form-select"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
            >
              <option value="">-- No linked task (standalone reminder) --</option>
              {(tasks || []).map(t => (
                <option key={t.id} value={t.id}>
                  {t.id}: {t.title} ({t.status})
                </option>
              ))}
            </select>
          </div>

          {/* Repeat Cycle */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Repeat style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }} />
              Repeat
            </label>
            <select
              className="form-select"
              value={repeatCycle}
              onChange={(e) => setRepeatCycle(e.target.value)}
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Every day</option>
              <option value="weekly">Every week</option>
              <option value="monthly">Every month</option>
            </select>
          </div>

          {/* Additional Notes */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }} />
              Notes / Context (Optional)
            </label>
            <textarea
              className="form-textarea"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add extra context, links, or instructions..."
            />
          </div>

          {/* Actions */}
          <div className="workspace-modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #d946ef 0%, #a21caf 100%)',
                borderColor: '#d946ef',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Bell style={{ width: '16px', height: '16px' }} />
              {isSubmitting ? 'Setting Reminder...' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
