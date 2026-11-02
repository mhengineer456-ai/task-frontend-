import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { X, Calendar, Clock, MapPin, Users, FileText, Send, AlertCircle } from 'lucide-react';

export default function EaMeetingModal({ isOpen, onClose }) {
  const { scheduleEaMeeting, users, activeUser } = useTaskContext();

  const [title, setTitle] = useState('');
  const [host, setHost] = useState(activeUser?.name ? `${activeUser.name} (${activeUser.role})` : 'Executive Lead');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('10:30 AM');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [location, setLocation] = useState('Boardroom / Google Meet');
  const [attendees, setAttendees] = useState('');
  const [agenda, setAgenda] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !agenda.trim()) {
      setErrorMessage('Please complete meeting title and agenda summary.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await scheduleEaMeeting({
        title,
        host: host.trim() || activeUser?.name || 'Host',
        organizer: `${activeUser?.name || 'EA'} (${activeUser?.role || 'EA'})`,
        attendees: attendees ? attendees.split(',').map(a => a.trim()).filter(Boolean) : ['Team Leads'],
        date,
        time,
        durationMinutes: Number(durationMinutes),
        location,
        agenda
      });

      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage('Failed to schedule executive meeting.');
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
          maxWidth: '580px',
          maxHeight: 'min(90vh, 650px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid #bae6fd'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', padding: '1.25rem 1.75rem', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              📅 Allot & Schedule Executive Meeting
            </h3>
            <p style={{ fontSize: '0.78125rem', color: '#e0f2fe', margin: '4px 0 0 0' }}>
              Schedule executive meeting and align agendas with your team
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: '#ffffff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.15rem', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {errorMessage && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem' }}>
              {errorMessage}
            </div>
          )}

          {/* Meeting Title & Host */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
                Meeting Title <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Weekly Operations & Deliverables Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
                Host / Chair
              </label>
              <input
                type="text"
                placeholder="e.g. Executive Lead"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="input-field"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          {/* Date & Time Slot */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
                Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
                Time Slot <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="10:30 AM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="input-field"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          {/* Attendees & Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
                Attendees / Participants
              </label>
              <input
                type="text"
                placeholder="e.g. Paras Goyal, Ayush"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                className="input-field"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
                Duration (Mins)
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="input-field"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              >
                <option value={30}>30 Mins</option>
                <option value={45}>45 Mins</option>
                <option value={60}>60 Mins (1 hr)</option>
                <option value={90}>90 Mins</option>
              </select>
            </div>
          </div>

          {/* Location / Link */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
              Meeting Location / Zoom Link
            </label>
            <input
              type="text"
              placeholder="Executive Boardroom A / Zoom Link"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-field"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            />
          </div>

          {/* Agenda Summary */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
              Agenda Summary <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Outline key meeting goals and discussion items..."
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              className="input-field"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            />
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ padding: '0.5rem 1.1rem' }}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ padding: '0.5rem 1.35rem', fontWeight: 800 }}>
              <Send style={{ width: '16px', height: '16px' }} />
              <span>{isSubmitting ? 'Scheduling...' : 'Allot Meeting & Dispatch Calendar Invites'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
