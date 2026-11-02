import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import LeaveRequestModal from './LeaveRequestModal';
import {
  Calendar,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  AlertCircle,
  FileText,
  Building2,
  MessageSquare,
  Check,
  X
} from 'lucide-react';

export default function LeaveManagementView() {
  const {
    leaves,
    activeUser,
    users,
    approveLeaveRequest,
    rejectLeaveRequest,
    setViewingUserProfile
  } = useTaskContext();

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() =>
    activeUser.role === 'Admin' || activeUser.role === 'MD' || activeUser.role === 'Manager' ? 'queue' : 'myLeaves'
  );
  const [managerRemarkInput, setManagerRemarkInput] = useState({});

  const myLeaves = leaves.filter(l => l.userId === activeUser.id);
  const pendingQueue = leaves.filter(l => l.status === 'Pending');

  // Filter queue based on role: Managers see direct reports or department, Admins see all
  const queueList = (activeUser.role === 'Admin' || activeUser.role === 'MD')
    ? leaves
    : leaves.filter(l => l.managerId === activeUser.id || l.managerName === activeUser.name || l.department === activeUser.department);

  const pendingCount = queueList.filter(l => l.status === 'Pending').length;

  // Leave balances calculation for active user
  const approvedMyLeaves = myLeaves.filter(l => l.status === 'Approved');
  const usedCasual = approvedMyLeaves.filter(l => l.leaveType === 'Casual Leave').reduce((acc, l) => acc + (l.totalDays || 1), 0);
  const usedSick = approvedMyLeaves.filter(l => l.leaveType === 'Medical / Sick Leave').reduce((acc, l) => acc + (l.totalDays || 1), 0);
  const usedEarned = approvedMyLeaves.filter(l => l.leaveType === 'Earned / Paid Leave').reduce((acc, l) => acc + (l.totalDays || 1), 0);

  const handleApprove = async (leaveId) => {
    const remark = managerRemarkInput[leaveId] || 'Approved by Manager';
    await approveLeaveRequest(leaveId, remark);
  };

  const handleReject = async (leaveId) => {
    const remark = managerRemarkInput[leaveId] || 'Rejected by Manager';
    await rejectLeaveRequest(leaveId, remark);
  };

  return (
    <div className="view-container" style={{ padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Leave Management & Approvals
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Submit leave applications, view balances, and approve team leave requests.
          </p>
        </div>

        <button onClick={() => setIsApplyModalOpen(true)} className="btn btn-primary">
          <Plus style={{ width: '18px', height: '18px' }} />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Leave Balances Gauges Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #bae6fd', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>Casual Leave</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0c4a6e', margin: '0.25rem 0' }}>{12 - usedCasual} / 12 Days</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Used: {usedCasual} days</div>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #bbf7d0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>Medical / Sick Leave</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#14532d', margin: '0.25rem 0' }}>{10 - usedSick} / 10 Days</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Used: {usedSick} days</div>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #e9d5ff', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7e22ce', textTransform: 'uppercase' }}>Earned / Paid Leave</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#581c87', margin: '0.25rem 0' }}>{18 - usedEarned} / 18 Days</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Used: {usedEarned} days</div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '1rem' }}>
        {(activeUser.role === 'Admin' || activeUser.role === 'MD' || activeUser.role === 'Manager') && (
          <button
            onClick={() => setActiveTab('queue')}
            style={{
              padding: '0.75rem 1.25rem',
              border: 'none',
              background: 'transparent',
              fontSize: '0.9375rem',
              fontWeight: 800,
              color: activeTab === 'queue' ? '#0284c7' : '#64748b',
              borderBottom: activeTab === 'queue' ? '3px solid #0284c7' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>Team Leave Approval Queue</span>
            {pendingCount > 0 && (
              <span className="badge badge-rose" style={{ marginLeft: '0.25rem' }}>{pendingCount} Pending</span>
            )}
          </button>
        )}

        <button
          onClick={() => setActiveTab('myLeaves')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'transparent',
            fontSize: '0.9375rem',
            fontWeight: 800,
            color: activeTab === 'myLeaves' ? '#0284c7' : '#64748b',
            borderBottom: activeTab === 'myLeaves' ? '3px solid #0284c7' : '3px solid transparent',
            cursor: 'pointer'
          }}
        >
          My Submitted Leave Applications ({myLeaves.length})
        </button>
      </div>

      {/* Tab Content List */}
      <div>
        {activeTab === 'queue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {queueList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', color: '#64748b', border: '1px solid #e2e8f0' }}>
                No leave applications in team queue.
              </div>
            ) : (
              queueList.map(l => (
                <div key={l.id} style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid #bae6fd', padding: '1.25rem 1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button
                        onClick={() => setViewingUserProfile(l.userId)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                        title="Click to view full employee profile & status"
                      >
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#0284c7', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                          {l.userName?.slice(0, 2).toUpperCase()}
                        </div>
                      </button>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            onClick={() => setViewingUserProfile(l.userId)}
                            style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            {l.userName}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', background: '#f0f7ff', padding: '2px 8px', borderRadius: '4px' }}>
                            {l.department}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78125rem', color: '#64748b', marginTop: '2px' }}>
                          {l.leaveType} • <strong>{l.startDate}</strong> to <strong>{l.endDate}</strong> ({l.totalDays} Days)
                        </div>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: '99px',
                      background: l.status === 'Approved' ? '#dcfce7' : l.status === 'Rejected' ? '#fee2e2' : '#e0f2fe',
                      color: l.status === 'Approved' ? '#166534' : l.status === 'Rejected' ? '#991b1b' : '#0369a1'
                    }}>
                      {l.status}
                    </span>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: '#334155', marginBottom: '1rem' }}>
                    <strong>Reason:</strong> "{l.reason}" {l.emergencyContact ? ` • Emergency Phone: ${l.emergencyContact}` : ''}
                  </div>

                  {l.status === 'Pending' && (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Add manager sign-off remark..."
                        value={managerRemarkInput[l.id] || ''}
                        onChange={(e) => setManagerRemarkInput({ ...managerRemarkInput, [l.id]: e.target.value })}
                        className="input-field"
                        style={{ flex: 1, padding: '0.5rem 0.85rem', fontSize: '0.8125rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1' }}
                      />
                      <button onClick={() => handleApprove(l.id)} className="btn btn-emerald" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                        <Check style={{ width: '16px', height: '16px' }} />
                        <span>Approve Leave</span>
                      </button>
                      <button onClick={() => handleReject(l.id)} className="btn btn-rose" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                        <X style={{ width: '16px', height: '16px' }} />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}

                  {l.managerRemark && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.5rem' }}>
                      Manager Note: "{l.managerRemark}"
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'myLeaves' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myLeaves.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', color: '#64748b', border: '1px solid #e2e8f0' }}>
                You have not submitted any leave applications yet.
              </div>
            ) : (
              myLeaves.map(l => (
                <div key={l.id} style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid #bae6fd', padding: '1.25rem 1.5rem', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{l.leaveType} ({l.totalDays} Days)</div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '2px' }}>
                      {l.startDate} to {l.endDate} • Reason: "{l.reason}"
                    </div>
                    {l.managerRemark && (
                      <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '4px' }}>
                        Manager Remark: "{l.managerRemark}"
                      </div>
                    )}
                  </div>

                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '4px 12px',
                    borderRadius: '99px',
                    background: l.status === 'Approved' ? '#dcfce7' : l.status === 'Rejected' ? '#fee2e2' : '#e0f2fe',
                    color: l.status === 'Approved' ? '#166534' : l.status === 'Rejected' ? '#991b1b' : '#0369a1'
                  }}>
                    {l.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Leave Application Modal */}
      <LeaveRequestModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
      />
    </div>
  );
}
