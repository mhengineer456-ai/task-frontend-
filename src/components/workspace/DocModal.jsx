import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import {
  FileText,
  X,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  CheckSquare,
  Code,
  Quote,
  Eye,
  Edit3,
  Tag,
  Folder,
  Pin
} from 'lucide-react';

export default function DocModal({ isOpen, onClose }) {
  const { activeUser, createDocument } = useTaskContext();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Engineering');
  const [department, setDepartment] = useState('All');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [visibility, setVisibility] = useState('workspace');
  const [isPinned, setIsPinned] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Formatting helpers to insert markdown syntax at cursor or append
  const insertSyntax = (prefix, suffix = '') => {
    setContent(prev => prev + `\n${prefix} ` + suffix);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const parsedTags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await createDocument({
        userId: activeUser?.id || 'usr-1',
        authorName: activeUser?.name || 'Admin',
        title: title.trim(),
        content: content.trim(),
        category,
        department,
        tags: parsedTags,
        visibility,
        isPinned
      });

      // Reset
      setTitle('');
      setContent('');
      setTagsInput('');
      setIsPinned(false);
      onClose();
    } catch (err) {
      console.error('Failed to create document:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="workspace-modal-overlay" onClick={onClose}>
      <div className="workspace-modal-container" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="workspace-modal-header" style={{ borderBottomColor: 'rgba(2, 132, 199, 0.2)' }}>
          <div className="workspace-modal-header-left">
            <div
              className="workspace-modal-icon-badge"
              style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff' }}
            >
              <FileText style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h3 className="workspace-modal-title">Create Doc</h3>
              <p className="workspace-modal-subtitle">Collaborate, document knowledge, specifications & SOPs</p>
            </div>
          </div>
          <button onClick={onClose} className="workspace-modal-close-btn" type="button">
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="workspace-modal-body">
          {/* Doc Title */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>
              Document Title *
            </label>
            <input
              type="text"
              required
              autoFocus
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Sprint Architecture & API Specifications"
              style={{ fontSize: '1rem', fontWeight: 700 }}
            />
          </div>

          {/* Category & Department Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Folder style={{ width: '14px', height: '14px', color: '#0284c7' }} />
                Folder / Category
              </label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Engineering">Engineering & Architecture</option>
                <option value="SOP & Guidelines">SOP & Operational Guidelines</option>
                <option value="Meeting Notes">Executive Meeting Notes</option>
                <option value="Product Specs">Product & UI Specs</option>
                <option value="Onboarding">Employee Onboarding</option>
                <option value="General">General Documentation</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="form-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="All">All Workspace</option>
                <option value="Engineering">Engineering</option>
                <option value="Management">Management / Executive</option>
                <option value="Operations">Operations</option>
                <option value="HR">HR & Admin</option>
                <option value="Sales">Sales & Marketing</option>
              </select>
            </div>
          </div>

          {/* Markdown Formatting Toolbar & Mode Toggle */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 10px',
                background: 'var(--bg-input)',
                borderRadius: '10px 10px 0 0',
                border: '1px solid var(--border-color)',
                borderBottom: 'none'
              }}
            >
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => insertSyntax('#')}
                  className="btn-icon"
                  title="Heading 1"
                  style={{ padding: '5px' }}
                >
                  <Heading1 style={{ width: '15px', height: '15px' }} />
                </button>
                <button
                  type="button"
                  onClick={() => insertSyntax('##')}
                  className="btn-icon"
                  title="Heading 2"
                  style={{ padding: '5px' }}
                >
                  <Heading2 style={{ width: '15px', height: '15px' }} />
                </button>
                <button
                  type="button"
                  onClick={() => insertSyntax('**Bold Text**')}
                  className="btn-icon"
                  title="Bold"
                  style={{ padding: '5px' }}
                >
                  <Bold style={{ width: '15px', height: '15px' }} />
                </button>
                <button
                  type="button"
                  onClick={() => insertSyntax('*Italic Text*')}
                  className="btn-icon"
                  title="Italic"
                  style={{ padding: '5px' }}
                >
                  <Italic style={{ width: '15px', height: '15px' }} />
                </button>
                <button
                  type="button"
                  onClick={() => insertSyntax('-')}
                  className="btn-icon"
                  title="Bullet List"
                  style={{ padding: '5px' }}
                >
                  <List style={{ width: '15px', height: '15px' }} />
                </button>
                <button
                  type="button"
                  onClick={() => insertSyntax('- [ ]')}
                  className="btn-icon"
                  title="Checklist"
                  style={{ padding: '5px' }}
                >
                  <CheckSquare style={{ width: '15px', height: '15px' }} />
                </button>
                <button
                  type="button"
                  onClick={() => insertSyntax('```\ncode\n```')}
                  className="btn-icon"
                  title="Code Block"
                  style={{ padding: '5px' }}
                >
                  <Code style={{ width: '15px', height: '15px' }} />
                </button>
                <button
                  type="button"
                  onClick={() => insertSyntax('>')}
                  className="btn-icon"
                  title="Quote"
                  style={{ padding: '5px' }}
                >
                  <Quote style={{ width: '15px', height: '15px' }} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: previewMode ? 'var(--brand-primary)' : 'transparent',
                  color: previewMode ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {previewMode ? <Edit3 style={{ width: '13px', height: '13px' }} /> : <Eye style={{ width: '13px', height: '13px' }} />}
                {previewMode ? 'Edit Mode' : 'Preview'}
              </button>
            </div>

            {/* Content Area or Preview */}
            {!previewMode ? (
              <textarea
                className="form-textarea"
                rows={7}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write documentation, procedures, meeting outcomes, or paste markdown content..."
                style={{
                  borderRadius: '0 0 10px 10px',
                  borderTop: 'none',
                  fontFamily: 'inherit',
                  lineHeight: 1.6
                }}
              />
            ) : (
              <div
                style={{
                  minHeight: '170px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  padding: '12px',
                  borderRadius: '0 0 10px 10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  fontSize: '0.9rem'
                }}
              >
                {content ? content : <span style={{ color: 'var(--text-muted)' }}>No content written yet.</span>}
              </div>
            )}
          </div>

          {/* Tags & Pin Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Tags separated by commas (e.g. backend, auth, v2)"
                style={{ fontSize: '0.82rem', padding: '6px 10px' }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#0284c7' }}
              />
              <Pin style={{ width: '14px', height: '14px', color: isPinned ? '#0284c7' : 'inherit' }} />
              <span>Pin Doc</span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="workspace-modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                borderColor: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FileText style={{ width: '16px', height: '16px' }} />
              {isSubmitting ? 'Saving Document...' : 'Publish Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
