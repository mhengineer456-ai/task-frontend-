import React, { useState, useEffect } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { X, Sparkles, Plus, Trash2, FileText } from 'lucide-react';

export default function TaskFormModal({ isOpen, onClose, taskToEdit = null }) {
  const {
    tasks = [],
    users = [],
    departments = [],
    statuses = [],
    templates = [],
    taskCategories = [],
    addTask,
    updateTask,
    activeUser
  } = useTaskContext();

  const defaultAssigneeId = users[0]?.id || activeUser?.id || '';
  const defaultApprovalOwnerId = activeUser?.id || users[0]?.id || '';
  const defaultBackupPersonId = users[1]?.id || users[0]?.id || '';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Software Development',
    department: 'Engineering & DevOps',
    project: 'Core Architecture',
    assigneeId: defaultAssigneeId,
    coAssignees: [],
    approvalOwnerId: defaultApprovalOwnerId,
    backupPersonId: defaultBackupPersonId,
    priority: 'Normal',
    status: 'Assigned',
    progress: 0,
    startDate: new Date().toISOString().slice(0, 16),
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
    estimatedHours: 16,
    tagsStr: 'Backend, Feature',
    checklist: [
      { id: 'ck-1', text: 'Define requirements and specifications', completed: false },
      { id: 'ck-2', text: 'Implement core functionality', completed: false }
    ],
    dependencies: [],
    remarks: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setFormData({
          title: taskToEdit.title || '',
          description: taskToEdit.description || '',
          category: taskToEdit.category || 'Software Development',
          department: taskToEdit.department || 'Engineering & DevOps',
          project: taskToEdit.project || '',
          assigneeId: taskToEdit.assigneeId || defaultAssigneeId,
          coAssignees: taskToEdit.coAssignees || [],
          approvalOwnerId: taskToEdit.approvalOwnerId || defaultApprovalOwnerId,
          backupPersonId: taskToEdit.backupPersonId || '',
          priority: taskToEdit.priority || 'Normal',
          status: taskToEdit.status || 'Assigned',
          progress: Number(taskToEdit.progress || 0),
          startDate: taskToEdit.startDate || '',
          dueDate: taskToEdit.dueDate || '',
          estimatedHours: taskToEdit.estimatedHours || 8,
          tagsStr: (taskToEdit.tags || []).join(', '),
          checklist: taskToEdit.checklist || [],
          dependencies: taskToEdit.dependencies || [],
          remarks: taskToEdit.remarks || ''
        });
      } else {
        setFormData({
          title: '',
          description: '',
          category: 'Software Development',
          department: activeUser?.department || 'Engineering & DevOps',
          project: '',
          assigneeId: defaultAssigneeId,
          coAssignees: [],
          approvalOwnerId: defaultApprovalOwnerId,
          backupPersonId: defaultBackupPersonId,
          priority: 'Normal',
          status: 'Assigned',
          progress: 0,
          startDate: new Date().toISOString().slice(0, 16),
          dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
          estimatedHours: 8,
          tagsStr: '',
          checklist: [
            { id: 'ck-1', text: 'Define requirements and specifications', completed: false },
            { id: 'ck-2', text: 'Implement deliverables and milestones', completed: false }
          ],
          dependencies: [],
          remarks: ''
        });
      }
    }
  }, [isOpen, taskToEdit, users]);

  if (!isOpen) return null;

  const handleApplyTemplate = (templateId) => {
    const tpl = templates.find(t => t.id === templateId);
    if (tpl) {
      setFormData(prev => ({
        ...prev,
        title: tpl.name,
        description: tpl.description,
        category: tpl.category,
        department: tpl.department,
        priority: tpl.priority,
        estimatedHours: tpl.estimatedHours,
        checklist: tpl.checklist.map((c, i) => ({ id: `ck-tpl-${i}`, text: c.text, completed: false })),
        tagsStr: (tpl.tags || []).join(', ')
      }));
    }
  };

  const handleAddChecklist = () => {
    setFormData(prev => ({
      ...prev,
      checklist: [...prev.checklist, { id: `ck-${Date.now()}`, text: '', completed: false }]
    }));
  };

  const handleRemoveChecklist = (id) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== id)
    }));
  };

  const handleChecklistTextChange = (id, text) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => item.id === id ? { ...item, text } : item)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const tagsArray = formData.tagsStr.split(',').map(s => s.trim()).filter(Boolean);

    if (taskToEdit) {
      updateTask(taskToEdit.id, { ...formData, tags: tagsArray });
    } else {
      addTask({ ...formData, tags: tagsArray });
    }

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-sidebar)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText style={{ width: '20px', height: '20px', color: 'var(--brand-primary)' }} />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{taskToEdit ? `Edit Task ${taskToEdit.id}` : 'Create New Enterprise Task'}</h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Specify assignment, workflow parameters, and subtask rules.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {!taskToEdit && (
              <select onChange={(e) => handleApplyTemplate(e.target.value)} defaultValue="" className="select-dropdown" style={{ width: 'auto', padding: '0.35rem 0.6rem' }}>
                <option value="" disabled>Load Blueprint Template...</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
            <button onClick={onClose} className="btn-icon"><X style={{ width: '18px', height: '18px' }} /></button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Section 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-light)', textTransform: 'uppercase' }}>1. Core Information</h4>
            <div className="form-group">
              <label className="form-label">Task Title *</label>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input-text" style={{ fontSize: '0.9rem', fontWeight: 700 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="textarea-input"></textarea>
            </div>

            <div className="grid grid-cols-3 sm-grid-cols-1" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="select-dropdown">
                  {taskCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="select-dropdown">
                  {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input type="text" value={formData.project} onChange={(e) => setFormData({ ...formData, project: e.target.value })} className="input-text" />
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-light)', textTransform: 'uppercase' }}>2. Ownership & Schedules</h4>
            <div className="grid grid-cols-3 sm-grid-cols-1" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Primary Assignee *</label>
                <select value={formData.assigneeId} onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })} className="select-dropdown">
                  {users.length === 0 ? (
                    <option value="">No members registered</option>
                  ) : (
                    users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.role} ({u.department || 'General'})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Approval Owner</label>
                <select value={formData.approvalOwnerId} onChange={(e) => setFormData({ ...formData, approvalOwnerId: e.target.value })} className="select-dropdown">
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="select-dropdown" style={{ fontWeight: 800 }}>
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 sm-grid-cols-1" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Due Date & Time</label>
                <input type="datetime-local" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="input-text" />
              </div>
              <div className="form-group">
                <label className="form-label">Estimated Hours</label>
                <input type="number" min="1" value={formData.estimatedHours} onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })} className="input-text" />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Progress</label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-light)' }}>{formData.progress}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                    style={{ flex: 1, accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                    className="input-text"
                    style={{ width: '60px', textAlign: 'center', fontWeight: 800, padding: '0.3rem' }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tags (Comma Separated)</label>
              <input type="text" value={formData.tagsStr} onChange={(e) => setFormData({ ...formData, tagsStr: e.target.value })} className="input-text" />
            </div>
          </div>

          {/* Subtasks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-light)', textTransform: 'uppercase' }}>3. Checklist Subtasks</h4>
              <button type="button" onClick={handleAddChecklist} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}><Plus style={{ width: '12px', height: '12px' }} /> Add Step</button>
            </div>
            {formData.checklist.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" value={item.text} onChange={(e) => handleChecklistTextChange(item.id, e.target.value)} className="input-text" style={{ flex: 1 }} />
                <button type="button" onClick={() => handleRemoveChecklist(item.id)} className="btn-icon" style={{ color: 'var(--color-danger)' }}><Trash2 style={{ width: '14px', height: '14px' }} /></button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">{taskToEdit ? 'Save Changes' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
