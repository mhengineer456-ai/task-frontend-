import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import {
  StickyNote,
  X,
  Plus,
  Trash2,
  Check,
  Pin,
  ListTodo,
  FileText
} from 'lucide-react';

export default function NoteModal({ isOpen, onClose }) {
  const { activeUser, createNote } = useTaskContext();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#fef08a'); // Default canary yellow
  const [noteType, setNoteType] = useState('text'); // 'text' | 'checklist'
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, text: '', done: false }
  ]);
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const colorPalette = [
    { name: 'Yellow', hex: '#fef08a', border: '#fde047' },
    { name: 'Mint', hex: '#bbf7d0', border: '#86efac' },
    { name: 'Sky', hex: '#bae6fd', border: '#7dd3fc' },
    { name: 'Lavender', hex: '#e9d5ff', border: '#d8b4fe' },
    { name: 'Peach', hex: '#fecdd3', border: '#fda4af' },
    { name: 'Dark', hex: '#334155', border: '#475569', textWhite: true }
  ];

  const handleAddChecklistItem = () => {
    setChecklistItems(prev => [...prev, { id: Date.now(), text: '', done: false }]);
  };

  const handleUpdateChecklistItem = (id, text) => {
    setChecklistItems(prev => prev.map(item => item.id === id ? { ...item, text } : item));
  };

  const handleToggleChecklistItem = (id) => {
    setChecklistItems(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const handleRemoveChecklistItem = (id) => {
    setChecklistItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() && !content.trim() && checklistItems.every(i => !i.text.trim())) return;

    setIsSubmitting(true);
    try {
      const validChecklist = noteType === 'checklist'
        ? checklistItems.filter(i => i.text.trim().length > 0)
        : [];

      await createNote({
        userId: activeUser?.id || 'usr-1',
        title: title.trim() || 'Untitled Quick Note',
        content: content.trim(),
        color,
        checklist: validChecklist,
        isPinned
      });

      // Reset
      setTitle('');
      setContent('');
      setColor('#fef08a');
      setChecklistItems([{ id: 1, text: '', done: false }]);
      setIsPinned(false);
      onClose();
    } catch (err) {
      console.error('Failed to create note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="workspace-modal-overlay" onClick={onClose}>
      <div className="workspace-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="workspace-modal-header" style={{ borderBottomColor: 'rgba(234, 179, 8, 0.2)' }}>
          <div className="workspace-modal-header-left">
            <div
              className="workspace-modal-icon-badge"
              style={{ background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', color: '#fff' }}
            >
              <StickyNote style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h3 className="workspace-modal-title">Quick Note</h3>
              <p className="workspace-modal-subtitle">Capture thoughts, personal scratchpad & quick to-do checklists</p>
            </div>
          </div>
          <button onClick={onClose} className="workspace-modal-close-btn" type="button">
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Note Style / Color Selection */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Color:</span>
            {colorPalette.map(c => (
              <button
                key={c.name}
                type="button"
                onClick={() => setColor(c.hex)}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: c.hex,
                  border: color === c.hex ? '2px solid #000' : `1px solid ${c.border}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: color === c.hex ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.1s ease'
                }}
                title={c.name}
              >
                {color === c.hex && <Check style={{ width: '12px', height: '12px', color: c.textWhite ? '#fff' : '#000' }} />}
              </button>
            ))}
          </div>

          {/* Note Type Toggle */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setNoteType('text')}
              className="btn-icon"
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: noteType === 'text' ? 'var(--bg-card)' : 'transparent',
                border: noteType === 'text' ? '1px solid var(--border-color)' : 'none'
              }}
            >
              <FileText style={{ width: '13px', height: '13px', marginRight: '4px' }} />
              Text
            </button>
            <button
              type="button"
              onClick={() => setNoteType('checklist')}
              className="btn-icon"
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: noteType === 'checklist' ? 'var(--bg-card)' : 'transparent',
                border: noteType === 'checklist' ? '1px solid var(--border-color)' : 'none'
              }}
            >
              <ListTodo style={{ width: '13px', height: '13px', marginRight: '4px' }} />
              Checklist
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="workspace-modal-body">
          {/* Note Title */}
          <div className="form-group">
            <input
              type="text"
              autoFocus
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title (e.g. Design inspiration, Ideas)..."
              style={{ fontSize: '1rem', fontWeight: 800 }}
            />
          </div>

          {/* Text Note or Checklist */}
          {noteType === 'text' ? (
            <div className="form-group">
              <textarea
                className="form-textarea"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Jot down quick thoughts, phone numbers, meeting takeaways, or code snippets..."
                style={{
                  lineHeight: 1.6,
                  fontSize: '0.92rem'
                }}
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>
                To-Do Checklist Items:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {checklistItems.map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => handleToggleChecklistItem(item.id)}
                      style={{ width: '16px', height: '16px', accentColor: '#eab308' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={item.text}
                      onChange={(e) => handleUpdateChecklistItem(item.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddChecklistItem();
                        }
                      }}
                      placeholder={`Item #${idx + 1}...`}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        textDecoration: item.done ? 'line-through' : 'none',
                        color: item.done ? 'var(--text-muted)' : 'inherit'
                      }}
                    />
                    {checklistItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklistItem(item.id)}
                        className="btn-icon"
                        style={{ color: '#ef4444', padding: '6px' }}
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  className="btn btn-secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '6px',
                    fontSize: '0.82rem',
                    marginTop: '4px'
                  }}
                >
                  <Plus style={{ width: '14px', height: '14px' }} />
                  Add Checklist Item
                </button>
              </div>
            </div>
          )}

          {/* Pin Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#eab308' }}
              />
              <Pin style={{ width: '15px', height: '15px', color: isPinned ? '#eab308' : 'inherit' }} />
              <span>Pin to top of Notes</span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="workspace-modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!title.trim() && !content.trim() && checklistItems.every(i => !i.text.trim()))}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                borderColor: '#eab308',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ffffff'
              }}
            >
              <StickyNote style={{ width: '16px', height: '16px' }} />
              {isSubmitting ? 'Saving Note...' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
