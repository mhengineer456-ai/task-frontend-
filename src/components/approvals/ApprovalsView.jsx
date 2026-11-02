import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { CheckSquare, CheckCircle2, XCircle } from 'lucide-react';

export default function ApprovalsView() {
  const { tasks, users, approveTask, rejectTask, setSelectedTaskId, activeUser } = useTaskContext();

  const [rejectingTaskId, setRejectingTaskId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const pendingApprovals = tasks.filter(t => t.status === 'Review');
  const decisionHistory = tasks.filter(t => t.status === 'Approved' || t.status === 'Rejected');

  const handleConfirmReject = () => {
    if (!rejectingTaskId) return;
    rejectTask(rejectingTaskId, rejectReason || 'Requires revision before signoff');
    setRejectingTaskId(null);
    setRejectReason('');
  };

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckSquare style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
            <span>Supervisor Approval Hub</span>
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Review completed work, verify sign-offs, and maintain compliance standards.</p>
        </div>

        <div className="glass-panel" style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Review Owner: </span>
          <span style={{ fontWeight: 800, color: '#f59e0b' }}>{activeUser.name}</span>
        </div>
      </div>

      {/* Review Queue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Pending Review Queue</span>
          <span className="badge badge-amber">{pendingApprovals.length} Items</span>
        </h3>

        {pendingApprovals.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <CheckCircle2 style={{ width: '40px', height: '40px', color: 'var(--color-success)', margin: '0 auto 0.75rem' }} />
            <h4 style={{ fontSize: '0.875rem', fontWeight: 800 }}>No pending approvals!</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>All submitted tasks have been signed off.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg-grid-cols-1" style={{ gap: '1rem' }}>
            {pendingApprovals.map(t => {
              const assignee = users.find(u => u.id === t.assigneeId);
              return (
                <div key={t.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(245,158,11,0.4)' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="badge badge-brand" style={{ fontFamily: 'monospace' }}>{t.id}</span>
                      <span className="badge badge-amber">Awaiting Approval</span>
                    </div>

                    <h4 onClick={() => setSelectedTaskId(t.id)} style={{ fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer' }}>{t.title}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>{t.description}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                    <button onClick={() => approveTask(t.id, `Approved by ${activeUser.name}`)} className="btn btn-primary" style={{ flex: 1, background: 'var(--color-success)' }}>
                      <CheckCircle2 style={{ width: '16px', height: '16px' }} /> Approve
                    </button>
                    <button onClick={() => setRejectingTaskId(t.id)} className="btn btn-danger" style={{ flex: 1 }}>
                      <XCircle style={{ width: '16px', height: '16px' }} /> Reject / Revision
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decision Audit History */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase' }}>Recent Sign-Off History</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Task ID</th><th>Title</th><th>Decision</th><th>Remarks / Reason</th></tr>
            </thead>
            <tbody>
              {decisionHistory.map(t => (
                <tr key={t.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-light)' }}>{t.id}</td>
                  <td style={{ fontWeight: 700 }}>{t.title}</td>
                  <td><span className={`badge ${t.status === 'Approved' ? 'badge-emerald' : 'badge-rose'}`}>{t.status}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{t.remarks || 'None'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectingTaskId && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-danger)' }}>Reject Task / Request Changes</h3>
            <div className="form-group">
              <label className="form-label">Mandatory Rejection Reason:</label>
              <textarea
                rows="3"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this task is being rejected..."
                className="textarea-input"
              ></textarea>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={() => setRejectingTaskId(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleConfirmReject} className="btn btn-danger">Submit Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
