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

            {/* Zapier-Style Scheduled Task Dispatch Automation */}
            <div style={{
              background: formData.isScheduled ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08))' : 'var(--bg-sidebar)',
              border: formData.isScheduled ? '1.5px solid #8b5cf6' : '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              transition: 'all 0.2s ease',
              marginTop: '0.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: formData.isScheduled ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: formData.isScheduled ? '0 2px 10px rgba(139, 92, 246, 0.35)' : 'none'
                  }}>
                    <Zap style={{ width: '17px', height: '17px' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Automated Scheduled Dispatch
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: '#8b5cf6',
                        border: '1px solid rgba(139, 92, 246, 0.3)'
                      }}>
                        ⚡ Zapier Automation
                      </span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                      Allot dispatch time. The task stays hidden from the employee until that allotted time, then automatically triggers into their task list with an audio alert.
                    </p>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.isScheduled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        isScheduled: enabled,
                        scheduledAt: enabled && !prev.scheduledAt ? new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16) : prev.scheduledAt
                      }));
                    }}
                    style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: formData.isScheduled ? '#8b5cf6' : 'var(--text-secondary)' }}>
                    {formData.isScheduled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>

              {formData.isScheduled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingTop: '0.65rem', borderTop: '1px dashed rgba(139, 92, 246, 0.35)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center' }}>
                    <div style={{ flex: '1 1 230px' }}>
                      <label className="form-label" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#8b5cf6', fontWeight: 700 }}>
                        <Clock style={{ width: '13px', height: '13px' }} />
                        Dispatch Trigger Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        required={formData.isScheduled}
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                        className="input-text"
                        style={{ borderColor: '#8b5cf6', fontWeight: 700 }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: '2 1 290px' }}>
                      <label className="form-label" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Quick Time Presets
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        <button type="button" onClick={() => setQuickSchedule(15)} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}>+15 Mins</button>
                        <button type="button" onClick={() => setQuickSchedule(60)} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}>+1 Hour</button>
                        <button type="button" onClick={() => setQuickSchedule(240)} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}>+4 Hours</button>
                        <button type="button" onClick={setTomorrowMorningSchedule} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}>Tomorrow 9 AM</button>
                      </div>
                    </div>
                  </div>

                  {formData.scheduledAt && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontSize: '0.75rem',
                      color: '#6366f1',
                      background: 'rgba(99, 102, 241, 0.09)',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}>
                      <Calendar style={{ width: '13px', height: '13px' }} />
                      <span>
                        Auto-dispatch scheduled for: <strong>{new Date(formData.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong>
                      </span>
                    </div>
                  )}
                </div>
              )}
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
