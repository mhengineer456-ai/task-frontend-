import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { X, Clock, CheckSquare, Plus, FileText, Tag } from 'lucide-react';

export default function EaDailyTaskModal({ isOpen, onClose }) {
  const { createEaDailyTask } = useTaskContext();

  const [title, setTitle] = useState('');
  const [timeSlot, setTimeSlot] = useState('02:00 PM');
  const [category, setCategory] = useState('Executive Routine');
  const [customCategory, setCustomCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please enter a title for the daily working line.');
      return;
    }

    const finalCategory = category === 'Custom Category' 
      ? (customCategory.trim() || 'General Operations')
      : category;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (createEaDailyTask) {
        await createEaDailyTask({
          title: title.trim(),
          timeSlot: timeSlot.trim() || '02:00 PM',
          category: finalCategory,
          notes: notes.trim() || 'Daily working line logged.'
        });
      }
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage('Failed to save daily routine working line.');
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
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: 'min(90vh, 600px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #bae6fd',
          animation: 'modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            padding: '1.25rem 1.75rem',
            position: 'relative',
            flexShrink: 0
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>

          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare style={{ width: '20px', height: '20px' }} />
            Add EA Routine Working Line
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#e0f2fe', margin: '4px 0 0 0' }}>
            Add a scheduled daily checklist item tracked live on MD executive screen.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {errorMessage && (
            <div style={{ padding: '0.65rem 0.85rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.78rem', fontWeight: 700 }}>
              {errorMessage}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
              Working Line / Routine Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Audit Pending Vendor Deliverables & Issue Pings"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              style={{ width: '100%', fontSize: '0.85rem', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                Time Slot
              </label>
              <input
                type="text"
                list="timeslot-suggestions"
                placeholder="e.g. 02:00 PM"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="select-dropdown"
                style={{ width: '100%', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
              <datalist id="timeslot-suggestions">
                <option value="09:30 AM" />
                <option value="11:00 AM" />
                <option value="02:00 PM" />
                <option value="04:00 PM" />
                <option value="06:00 PM" />
              </datalist>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="select-dropdown"
                style={{ width: '100%', fontSize: '0.85rem', boxSizing: 'border-box' }}
              >
                <option value="Executive Routine">Executive Routine</option>
                <option value="Store & Accessories">Store & Accessories</option>
                <option value="Production & Stitching">Production & Stitching</option>
                <option value="Knitting & Fabric">Knitting & Fabric</option>
                <option value="Dyeing & Processing">Dyeing & Processing</option>
                <option value="Embellishment & Printing">Embellishment & Printing</option>
                <option value="Finishing & Packing">Finishing & Packing</option>
                <option value="Factory & Machine Audits">Factory & Machine Audits</option>
                <option value="Task SLA Tracking">Task SLA Tracking</option>
                <option value="Operations Review">Operations Review</option>
                <option value="Custom Category">+ Custom Category...</option>
              </select>
            </div>
          </div>

          {category === 'Custom Category' && (
            <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0284c7', marginBottom: '4px' }}>
                Enter Custom Category Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Sampling & Patterns"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="select-dropdown"
                style={{ width: '100%', fontSize: '0.85rem', boxSizing: 'border-box', borderColor: '#0284c7' }}
                autoFocus
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
              Execution Notes & Instructions
            </label>
            <textarea
              rows={3}
              placeholder="Operational details, checklists, or specific contacts to ping..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
              style={{ width: '100%', fontSize: '0.82rem', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.5rem 1.1rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ fontSize: '0.82rem', padding: '0.5rem 1.35rem', fontWeight: 800 }}
            >
              {isSubmitting ? 'Saving...' : 'Add Working Line'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
