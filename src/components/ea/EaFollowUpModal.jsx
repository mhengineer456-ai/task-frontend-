import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { X, Phone, MessageSquare, Mail, Calendar, AlertTriangle, Send, User } from 'lucide-react';

export default function EaFollowUpModal({ isOpen, onClose, task }) {
  const { activeUser, users, addEaFollowUp } = useTaskContext();

  const [channel, setChannel] = useState('Phone Call');
  const [actionNotes, setActionNotes] = useState('');
  const [actionRequired, setActionRequired] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [isEscalatedToMd, setIsEscalatedToMd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !task) return null;

  const assignee = users.find(u => u.id === task.assigneeId) || { name: 'Assignee', role: 'Employee' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!actionNotes.trim()) {
      setErrorMessage('Please enter follow-up action notes.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await addEaFollowUp({
        taskId: task.id,
        taskTitle: task.title,
        assigneeId: task.assigneeId,
        assigneeName: assignee.name,
        channel,
        actionNotes,
        actionRequired,
        nextFollowUpDate,
        isEscalatedToMd,
        loggedBy: `${activeUser.name} (${activeUser.role})`
      });

      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage('Failed to log follow-up action.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '600px',
          maxHeight: 'min(90vh, 680px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid #bae6fd'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', padding: '1.5rem 2rem', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              📋 Log EA Follow-up & Action Details
            </h3>
            <p style={{ fontSize: '0.78125rem', color: '#e0f2fe', margin: '4px 0 0 0' }}>
              Record assignee updates for MD task tracking
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: '#ffffff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Task Banner */}
        <div style={{ padding: '1rem 2rem', background: '#f0f7ff', borderBottom: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7' }}>{task.id}</span>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0' }}>{task.title}</h4>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Assigned Person: <strong>{assignee.name}</strong> ({assignee.role})</span>
          </div>
          <span className="badge badge-rose">Due: {task.dueDate?.slice(0, 10)}</span>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.15rem', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {errorMessage && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem' }}>
              {errorMessage}
            </div>
          )}

          {/* Follow Up Channel */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
              Follow-Up Channel <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="input-field"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            >
              <option value="Phone Call">📞 Phone Call Sync</option>
              <option value="Slack / Chat">💬 Internal Chat / Slack Nudge</option>
              <option value="In-Person Sync">🤝 In-Person Workstation Sync</option>
              <option value="Email Reminder">✉️ Official Email Reminder</option>
            </select>
          </div>

          {/* Action Notes */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
              Follow-Up Conversation Notes <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Detail what discussion took place during the follow-up..."
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              className="input-field"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            />
          </div>

          {/* Employee Action Required */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
              Action Required / Specific Deliverable Promised by Assignee
            </label>
            <input
              type="text"
              placeholder="e.g., 'Draft PR ready by 5 PM', 'Awaiting API token from DevOps'"
              value={actionRequired}
              onChange={(e) => setActionRequired(e.target.value)}
              className="input-field"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            />
          </div>

          {/* Next Follow Up Date & Escalation Checkbox */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
                Next Follow-Up Date
              </label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="input-field"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem', background: '#fef2f2', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #fecaca' }}>
              <input
                type="checkbox"
                id="escalateCheckbox"
                checked={isEscalatedToMd}
                onChange={(e) => setIsEscalatedToMd(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#ef4444', cursor: 'pointer' }}
              />
              <label htmlFor="escalateCheckbox" style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#991b1b', cursor: 'pointer' }}>
                ⚠️ Escalate Blocker to MD
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ padding: '0.5rem 1.1rem' }}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ padding: '0.5rem 1.35rem', fontWeight: 800 }}>
              <Send style={{ width: '16px', height: '16px' }} />
              <span>{isSubmitting ? 'Logging Action...' : 'Save Action & Nudge Assignee'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
