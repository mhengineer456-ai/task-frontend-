import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { getTimeAgo } from '../../utils/dateUtils';
import { History, RotateCcw, Search } from 'lucide-react';

export default function AuditLogsView() {
  const { auditLogs, deletedTasks, restoreTask } = useTaskContext();
  const [activeTab, setActiveTab] = useState('audit');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = auditLogs.filter(
    l => l.details.toLowerCase().includes(searchQuery.toLowerCase()) || l.user.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History style={{ width: '20px', height: '20px', color: 'var(--brand-light)' }} />
          <span>Audit Trail & Recycle Bin</span>
        </h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Immutable system event history and deleted-task recovery vault.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button onClick={() => setActiveTab('audit')} className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}>
          Security Audit Trail ({auditLogs.length})
        </button>
        <button onClick={() => setActiveTab('trash')} className={`btn ${activeTab === 'trash' ? 'btn-primary' : 'btn-secondary'}`}>
          Recycle Bin ({deletedTasks.length})
        </button>
      </div>

      {activeTab === 'audit' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="search-container">
            <Search style={{ position: 'absolute', left: '10px', top: '10px', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search audit logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Timestamp</th><th>User</th><th>Action</th><th>Category</th><th>Event Details</th></tr>
              </thead>
              <tbody>
                {filteredLogs.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{getTimeAgo(l.timestamp)}</td>
                    <td style={{ fontWeight: 700 }}>{l.user}</td>
                    <td style={{ fontWeight: 800, color: 'var(--brand-light)' }}>{l.action}</td>
                    <td><span className="badge badge-brand">{l.category || 'Task'}</span></td>
                    <td>{l.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg-grid-cols-1" style={{ gap: '1rem' }}>
          {deletedTasks.map(t => (
            <div key={t.id} className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge badge-rose" style={{ fontFamily: 'monospace' }}>{t.id}</span>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginTop: '4px' }}>{t.title}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.department}</p>
              </div>
              <button onClick={() => restoreTask(t.id)} className="btn btn-primary">
                <RotateCcw style={{ width: '14px', height: '14px' }} /> Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
