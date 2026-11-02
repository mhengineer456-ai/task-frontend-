import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { X, Calendar, FileText, Phone, Send, AlertCircle } from 'lucide-react';

export default function LeaveRequestModal({ isOpen, onClose }) {
  const { activeUser, users, addLeaveRequest } = useTaskContext();

  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const manager = users.find(u => u.name === activeUser.managerName || u.role === 'Admin' || u.role === 'Manager') || users[0];

  const calculateDays = () => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffTime = Math.max(0, e - s);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) ? 1 : diffDays;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage('Please provide a brief reason for your leave request.');
      return;
    }

    const totalDays = calculateDays();
    if (totalDays <= 0) {
      setErrorMessage('End date must be on or after start date.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await addLeaveRequest({
        userId: activeUser.id,
        userName: activeUser.name,
        userRole: activeUser.role,
        department: activeUser.department,
        managerId: manager.id,
        managerName: manager.name,
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason,
        emergencyContact
      });
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage('Failed to submit leave request to backend API.');
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
          maxWidth: '560px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid #bae6fd'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', padding: '1.5rem 2rem', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Apply for Leave</h3>
            <p style={{ fontSize: '0.78125rem', color: '#e0f2fe', margin: '4px 0 0 0' }}>Request approval from Manager ({manager.name})</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: '#ffffff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {errorMessage && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Leave Type Select */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
              Leave Type <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="input-field"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            >
              <option value="Casual Leave">Casual Leave (Personal / Family)</option>
              <option value="Medical / Sick Leave">Medical / Sick Leave</option>
              <option value="Earned / Paid Leave">Earned / Paid Annual Leave</option>
              <option value="Emergency Leave">Emergency Leave</option>
            </select>
          </div>

          {/* Start & End Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
                Start Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
                End Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div style={{ fontSize: '0.78125rem', color: '#0284c7', fontWeight: 700, background: '#f0f7ff', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #bae6fd' }}>
            Total Days Requested: <strong>{calculateDays()} Day(s)</strong>
          </div>

          {/* Reason textarea */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
              Reason for Leave <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              rows={3}
              placeholder="State the reason for your leave request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            />
          </div>

          {/* Emergency Contact */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
              Emergency Contact (Optional)
            </label>
            <input
              type="text"
              placeholder="+1 555-0192 or family member phone"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              className="input-field"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            />
          </div>

          {/* Form Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              <Send style={{ width: '16px', height: '16px' }} />
              <span>{isSubmitting ? 'Submitting REST API...' : 'Submit Leave Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
