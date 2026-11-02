import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { Settings, Check } from 'lucide-react';

export default function SettingsView() {
  const { statuses = [], addCustomStatus, customFields = [], addCustomField } = useTaskContext();
  const [activeTab, setActiveTab] = useState('workflows');
  const [newStatusName, setNewStatusName] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');

  const handleAddStatus = () => {
    if (!newStatusName.trim()) return;
    addCustomStatus({
      id: newStatusName,
      label: newStatusName,
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      badge: 'purple',
      step: (statuses || []).length + 1
    });
    setNewStatusName('');
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    addCustomField({
      id: `cf-${Date.now()}`,
      name: newFieldName,
      type: newFieldType,
      required: false
    });
    setNewFieldName('');
  };

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings style={{ width: '20px', height: '20px', color: 'var(--brand-light)' }} />
          <span>Module Settings & Workflows</span>
        </h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customize workflow stages, custom field definitions, and role permissions.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button onClick={() => setActiveTab('workflows')} className={`btn ${activeTab === 'workflows' ? 'btn-primary' : 'btn-secondary'}`}>Workflows & Stages</button>
        <button onClick={() => setActiveTab('fields')} className={`btn ${activeTab === 'fields' ? 'btn-primary' : 'btn-secondary'}`}>Custom Fields Manager</button>
        <button onClick={() => setActiveTab('roles')} className={`btn ${activeTab === 'roles' ? 'btn-primary' : 'btn-secondary'}`}>Role Permissions Matrix</button>
      </div>

      {activeTab === 'workflows' ? (
        <div className="grid grid-cols-3 lg-grid-cols-1" style={{ gap: '1.5rem' }}>
          <div className="glass-panel" style={{ gridColumn: 'span 2', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800 }}>Active Workflow Pipeline Stages</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(statuses || []).map((s, idx) => (
                <div key={s.id} className="glass-card" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>{idx + 1}</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{s.label}</span>
                  </div>
                  <span className="badge badge-brand">{s.id}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800 }}>Add Custom Stage</h3>
            <div className="form-group">
              <label className="form-label">Stage Name</label>
              <input type="text" placeholder="e.g., Security Testing" value={newStatusName} onChange={(e) => setNewStatusName(e.target.value)} className="input-text" />
            </div>
            <button onClick={handleAddStatus} className="btn btn-primary" style={{ width: '100%' }}>Add Workflow Stage</button>
          </div>
        </div>
      ) : activeTab === 'fields' ? (
        <div className="grid grid-cols-3 lg-grid-cols-1" style={{ gap: '1.5rem' }}>
          <div className="glass-panel" style={{ gridColumn: 'span 2', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800 }}>Defined Custom Task Attributes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(customFields || []).map(cf => (
                <div key={cf.id} className="glass-card" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block' }}>{cf.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Type: {cf.type}</span>
                  </div>
                  <span className="badge badge-brand">Active Field</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800 }}>Create Custom Field</h3>
            <div className="form-group">
              <label className="form-label">Field Label</label>
              <input type="text" placeholder="e.g., Client Impact Score" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} className="input-text" />
            </div>
            <div className="form-group">
              <label className="form-label">Field Type</label>
              <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)} className="select-dropdown">
                <option value="text">Text Input</option>
                <option value="number">Numeric Value</option>
                <option value="select">Dropdown Select</option>
              </select>
            </div>
            <button onClick={handleAddField} className="btn btn-primary" style={{ width: '100%' }}>Create Field</button>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '1rem' }}>Access Control & Role Permissions Matrix</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Action</th><th style={{ textAlign: 'center' }}>Admin</th><th style={{ textAlign: 'center' }}>Manager</th><th style={{ textAlign: 'center' }}>Supervisor</th><th style={{ textAlign: 'center' }}>Employee</th></tr>
              </thead>
              <tbody>
                {[
                  { action: 'Create & Edit Tasks', admin: true, manager: true, supervisor: true, employee: true },
                  { action: 'Delete Tasks & Recycle Bin', admin: true, manager: true, supervisor: false, employee: false },
                  { action: 'Approve & Reject Completed Tasks', admin: true, manager: true, supervisor: true, employee: false },
                  { action: 'Manage Settings & Workflows', admin: true, manager: false, supervisor: false, employee: false }
                ].map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700 }}>{row.action}</td>
                    <td style={{ textAlign: 'center' }}><Check style={{ width: '16px', height: '16px', color: 'var(--color-success)', margin: '0 auto' }} /></td>
                    <td style={{ textAlign: 'center' }}>{row.manager ? <Check style={{ width: '16px', height: '16px', color: 'var(--color-success)', margin: '0 auto' }} /> : '—'}</td>
                    <td style={{ textAlign: 'center' }}>{row.supervisor ? <Check style={{ width: '16px', height: '16px', color: 'var(--color-success)', margin: '0 auto' }} /> : '—'}</td>
                    <td style={{ textAlign: 'center' }}>{row.employee ? <Check style={{ width: '16px', height: '16px', color: 'var(--color-success)', margin: '0 auto' }} /> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
