import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { priorityLevels } from '../../data/mockData';
import { Zap, Plus, ShieldAlert } from 'lucide-react';

export default function AutomationsView() {
  const { automations, toggleAutomation, addAutomation } = useTaskContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleTrigger, setRuleTrigger] = useState('Task is Overdue by 24+ Hours');
  const [ruleAction, setRuleAction] = useState('Escalate Priority to Critical');

  const handleCreateRule = () => {
    if (!ruleName.trim()) return;
    addAutomation({
      id: `rule-${Date.now()}`,
      name: ruleName,
      trigger: ruleTrigger,
      action: ruleAction,
      active: true,
      executionCount: 0
    });
    setRuleName('');
    setIsModalOpen(false);
  };

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
            <span>Workflow Automation & SLA Rules Engine</span>
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Configure automated background rules, escalation triggers, and recurring task schedules.</p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus style={{ width: '16px', height: '16px' }} /> Create Automation Rule
        </button>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-2 lg-grid-cols-1" style={{ gap: '1rem' }}>
        {automations.map(rule => (
          <div key={rule.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', opacity: rule.active ? 1 : 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-brand" style={{ fontFamily: 'monospace' }}>{rule.id}</span>
              <button onClick={() => toggleAutomation(rule.id)} className={`badge ${rule.active ? 'badge-emerald' : 'badge-rose'}`} style={{ cursor: 'pointer' }}>
                {rule.active ? 'ACTIVE' : 'PAUSED'}
              </button>
            </div>

            <h4 style={{ fontSize: '0.875rem', fontWeight: 800 }}>{rule.name}</h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
              <div style={{ background: 'var(--bg-input)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
                <strong style={{ color: 'var(--text-muted)' }}>WHEN: </strong>{rule.trigger}
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
                <strong style={{ color: '#f59e0b' }}>THEN: </strong>{rule.action}
              </div>
            </div>

            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Trigger Executions</span>
              <span className="badge badge-brand">{rule.executionCount || 0} times</span>
            </div>
          </div>
        ))}
      </div>

      {/* SLA Matrix */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert style={{ width: '16px', height: '16px', color: 'var(--color-danger)' }} />
          <span>SLA Target Matrix & Escalation Thresholds</span>
        </h3>

        <div className="grid grid-cols-5 lg-grid-cols-2" style={{ gap: '0.75rem' }}>
          {Object.entries(priorityLevels).map(([level, details]) => (
            <div key={level} className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-light)' }}>{level}</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0', fontFamily: 'monospace' }}>{details.slaHours}h</div>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Max SLA Window</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Create Automation Rule</h3>

            <div className="form-group">
              <label className="form-label">Rule Name</label>
              <input type="text" value={ruleName} onChange={(e) => setRuleName(e.target.value)} className="input-text" />
            </div>

            <div className="form-group">
              <label className="form-label">Trigger Condition (WHEN)</label>
              <select value={ruleTrigger} onChange={(e) => setRuleTrigger(e.target.value)} className="select-dropdown">
                <option>Task is Overdue by 24+ Hours</option>
                <option>Category is Infrastructure & DevOps</option>
                <option>All Checklist Items are Completed</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Automated Action (THEN)</label>
              <select value={ruleAction} onChange={(e) => setRuleAction(e.target.value)} className="select-dropdown">
                <option>Escalate Priority to Critical & Notify Manager</option>
                <option>Assign to Engineering Lead (Alex Morgan)</option>
                <option>Move Task Status from In Progress to Review</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleCreateRule} className="btn btn-primary">Save Rule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
