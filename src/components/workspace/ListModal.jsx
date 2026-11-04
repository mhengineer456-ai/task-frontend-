import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import {
  ListOrdered,
  X,
  Plus,
  Trash2,
  Bookmark,
  Star,
  Zap,
  Target,
  Folder,
  CheckSquare,
  Sparkles
} from 'lucide-react';

export default function ListModal({ isOpen, onClose }) {
  const { activeUser, createCustomList } = useTaskContext();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [icon, setIcon] = useState('list');
  const [items, setItems] = useState(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const colorOptions = [
    { name: 'Indigo', hex: '#6366f1' },
    { name: 'Sky', hex: '#0284c7' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Rose', hex: '#f43f5e' },
    { name: 'Purple', hex: '#8b5cf6' }
  ];

  const iconOptions = [
    { id: 'list', icon: ListOrdered },
    { id: 'check', icon: CheckSquare },
    { id: 'star', icon: Star },
    { id: 'bookmark', icon: Bookmark },
    { id: 'target', icon: Target },
    { id: 'zap', icon: Zap }
  ];

  const handleAddItem = () => {
    setItems(prev => [...prev, '']);
  };

  const handleUpdateItem = (index, val) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const validItems = items
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(text => ({ id: `itm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, text, done: false }));

      await createCustomList({
        userId: activeUser?.id || 'usr-1',
        name: name.trim(),
        color,
        icon,
        description: description.trim(),
        items: validItems
      });

      // Reset
      setName('');
      setDescription('');
      setItems(['', '']);
      onClose();
    } catch (err) {
      console.error('Failed to create custom list:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="workspace-modal-overlay" onClick={onClose}>
      <div className="workspace-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="workspace-modal-header" style={{ borderBottomColor: 'rgba(100, 116, 139, 0.2)' }}>
          <div className="workspace-modal-header-left">
            <div
              className="workspace-modal-icon-badge"
              style={{ background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)', color: '#fff' }}
            >
              <ListOrdered style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h3 className="workspace-modal-title">Create List</h3>
              <p className="workspace-modal-subtitle">Organize tasks into custom workflow lists & checklists</p>
            </div>
          </div>
          <button onClick={onClose} className="workspace-modal-close-btn" type="button">
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="workspace-modal-body">
          {/* List Name */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>
              List Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q4 Marketing Campaign, Bug Triage, Daily Standup"
              style={{ fontSize: '0.95rem', fontWeight: 700 }}
            />
          </div>

          {/* Color & Icon Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Color Theme</label>
              <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                {colorOptions.map(c => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: c.hex,
                      border: color === c.hex ? '2px solid var(--text-primary)' : '1px solid transparent',
                      cursor: 'pointer',
                      transform: color === c.hex ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.1s ease'
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Icon</label>
              <div style={{ display: 'flex', gap: '6px', paddingTop: '2px' }}>
                {iconOptions.map(item => {
                  const IconComp = item.icon;
                  const isSelected = icon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIcon(item.id)}
                      className="btn-icon"
                      style={{
                        padding: '6px',
                        borderRadius: '8px',
                        background: isSelected ? `${color}20` : 'transparent',
                        border: isSelected ? `2px solid ${color}` : '1px solid var(--border-color)',
                        color: isSelected ? color : 'var(--text-secondary)'
                      }}
                    >
                      <IconComp style={{ width: '15px', height: '15px' }} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this list used for?"
            />
          </div>

          {/* Initial Items */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>
              Initial Checklist Items:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '20px' }}>
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    className="form-input"
                    value={it}
                    onChange={(e) => handleUpdateItem(idx, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                    placeholder={`Checklist item #${idx + 1}...`}
                    style={{ flex: 1, padding: '7px 10px' }}
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
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
                onClick={handleAddItem}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px',
                  fontSize: '0.82rem',
                  marginTop: '4px'
                }}
              >
                <Plus style={{ width: '14px', height: '14px' }} />
                Add Item
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="workspace-modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="btn btn-primary"
              style={{
                background: `linear-gradient(135deg, ${color} 0%, #334155 100%)`,
                borderColor: color,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <ListOrdered style={{ width: '16px', height: '16px' }} />
              {isSubmitting ? 'Creating List...' : 'Create List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
