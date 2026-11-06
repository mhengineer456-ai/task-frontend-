import React, { useState, useEffect } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { X, Sparkles, Plus, Trash2, FileText, Zap, Clock, Calendar } from 'lucide-react';

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
    remarks: '',
    isScheduled: false,
    scheduledAt: ''
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
          remarks: taskToEdit.remarks || '',
          isScheduled: Boolean(taskToEdit.isScheduled || taskToEdit.status === 'Scheduled'),
          scheduledAt: taskToEdit.scheduledAt || ''
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
          remarks: '',
          isScheduled: false,
          scheduledAt: ''
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

  const setQuickSchedule = (minutesFromNow) => {
    const target = new Date(Date.now() + minutesFromNow * 60 * 1000);
    const tzOffset = target.getTimezoneOffset() * 60000;
    const localISOTime = new Date(target.getTime() - tzOffset).toISOString().slice(0, 16);
    setFormData(prev => ({
      ...prev,
      isScheduled: true,
      scheduledAt: localISOTime
    }));
  };

  const setTomorrowMorningSchedule = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const tzOffset = tomorrow.getTimezoneOffset() * 60000;
    const localISOTime = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
    setFormData(prev => ({
      ...prev,
      isScheduled: true,
      scheduledAt: localISOTime
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const tagsArray = formData.tagsStr.split(',').map(s => s.trim()).filter(Boolean);
    const isScheduledTask = Boolean(formData.isScheduled);
    const finalPayload = {
      ...formData,
      tags: tagsArray,
      status: isScheduledTask ? 'Scheduled' : formData.status,
      isScheduled: isScheduledTask,
      scheduledAt: isScheduledTask ? formData.scheduledAt : null
    };

    if (taskToEdit) {
      updateTask(taskToEdit.id, finalPayload);
    } else {
      addTask(finalPayload);
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

            {/* Dispatch & Scheduling Workflow Selector */}
            <div className="form-group" style={{ marginTop: '0.25rem' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800 }}>Dispatch & Automation Mode</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Choose when the employee receives this task</span>
              </label>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                background: 'var(--bg-input, #f1f5f9)',
                padding: '4px',
                borderRadius: '10px',
                border: '1px solid var(--border-color, #e2e8f0)'
              }}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    isScheduled: false,
                    status: prev.status === 'Scheduled' ? 'Assigned' : prev.status
                  }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: !formData.isScheduled ? '#ffffff' : 'transparent',
                    color: !formData.isScheduled ? '#0f172a' : 'var(--text-secondary, #64748b)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: !formData.isScheduled ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>🚀 Direct Assignment (Immediate)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const defaultTime = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);
                    setFormData(prev => ({
                      ...prev,
                      isScheduled: true,
                      scheduledAt: prev.scheduledAt || defaultTime,
                      status: 'Scheduled'
                    }));
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: formData.isScheduled ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : 'transparent',
                    color: formData.isScheduled ? '#ffffff' : 'var(--text-secondary, #64748b)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: formData.isScheduled ? '0 2px 6px rgba(79, 70, 229, 0.25)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Clock style={{ width: '14px', height: '14px' }} />
                  <span>⚡ Scheduled Dispatch (Zapier)</span>
                </button>
              </div>
            </div>

            {/* Scheduled Dispatch Configuration Panel */}
            {formData.isScheduled && (
              <div style={{
                background: 'rgba(99, 102, 241, 0.04)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock style={{ width: '15px', height: '15px' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Allot Automatic Dispatch Date & Time
                      </span>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                        Task remains hidden from assignee until this exact allotted moment.
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-purple" style={{ background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe' }}>
                    ⚡ Zapier Automation
                  </span>
                </div>

                <div className="grid grid-cols-2 sm-grid-cols-1" style={{ gap: '0.75rem', alignItems: 'center' }}>
                  <div>
                    <input
                      type="datetime-local"
                      required={formData.isScheduled}
                      value={formData.scheduledAt}
                      onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                      className="input-text"
                      style={{ fontWeight: 700, borderColor: '#818cf8' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <button type="button" onClick={() => setQuickSchedule(15)} className="btn-secondary" style={{ fontSize: '0.68rem', padding: '0.25rem 0.5rem' }}>+15m</button>
                    <button type="button" onClick={() => setQuickSchedule(60)} className="btn-secondary" style={{ fontSize: '0.68rem', padding: '0.25rem 0.5rem' }}>+1 Hour</button>
                    <button type="button" onClick={() => setQuickSchedule(240)} className="btn-secondary" style={{ fontSize: '0.68rem', padding: '0.25rem 0.5rem' }}>+4 Hours</button>
                    <button type="button" onClick={setTomorrowMorningSchedule} className="btn-secondary" style={{ fontSize: '0.68rem', padding: '0.25rem 0.5rem' }}>Tomorrow 9 AM</button>
                  </div>
                </div>

                {formData.scheduledAt && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.74rem',
                    color: '#4338ca',
                    background: '#e0e7ff',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px'
                  }}>
                    <Calendar style={{ width: '13px', height: '13px', flexShrink: 0 }} />
                    <span>
                      Staged for dispatch on <strong>{new Date(formData.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong> to <strong>{users.find(u => u.id === formData.assigneeId)?.name || 'Assignee'}</strong> with audio alert.
                    </span>
                  </div>
                )}
              </div>
            )}
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
            <button type="submit" className="btn btn-primary" style={formData.isScheduled ? { background: 'linear-gradient(135deg, #4f46e5, #6366f1)', border: 'none', color: '#fff' } : {}}>
              {formData.isScheduled ? '⚡ Schedule & Stage Task' : (taskToEdit ? 'Save Changes' : 'Create & Assign Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
