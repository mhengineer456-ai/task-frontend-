import React, { useState, useMemo } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import {
  Bell,
  Clock,
  FileText,
  StickyNote,
  ListOrdered,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Pin,
  Calendar,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  Tag,
  CheckSquare,
  AlertCircle
} from 'lucide-react';

export default function WorkspaceHubView() {
  const {
    reminders,
    toggleReminderStatus,
    deleteReminder,
    timeLogs,
    deleteTimeLog,
    documents,
    deleteDocument,
    notes,
    deleteNote,
    customLists,
    updateCustomList,
    deleteCustomList,
    setIsReminderModalOpen,
    setIsTrackTimeModalOpen,
    setIsDocModalOpen,
    setIsNoteModalOpen,
    setIsListModalOpen,
    setSelectedTaskId
  } = useTaskContext();

  const [activeTab, setActiveTab] = useState('reminders'); // 'reminders' | 'timelogs' | 'docs' | 'notes' | 'lists'
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Reminders metrics
  const pendingReminders = useMemo(() => (reminders || []).filter(r => r.status !== 'Completed'), [reminders]);
  const completedReminders = useMemo(() => (reminders || []).filter(r => r.status === 'Completed'), [reminders]);

  // Total hours logged
  const totalLoggedHours = useMemo(() => {
    return (timeLogs || []).reduce((acc, curr) => acc + (Number(curr.hours) || 0), 0).toFixed(1);
  }, [timeLogs]);

  // Filtered Docs
  const filteredDocs = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return documents || [];
    return (documents || []).filter(d =>
      d.title.toLowerCase().includes(q) ||
      (d.content && d.content.toLowerCase().includes(q)) ||
      (d.category && d.category.toLowerCase().includes(q))
    );
  }, [documents, searchFilter]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return notes || [];
    return (notes || []).filter(n =>
      n.title.toLowerCase().includes(q) ||
      (n.content && n.content.toLowerCase().includes(q))
    );
  }, [notes, searchFilter]);

  return (
    <div className="workspace-hub-container" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Top Welcome & Tab Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Layers style={{ width: '20px', height: '20px' }} />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>
              Productivity & Workspace Hub
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Centralized hub for all your Reminders, Time Logs, Docs, Scratchpad Notes & Custom Lists
          </p>
        </div>

        {/* Global Quick Create Actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {activeTab === 'reminders' && (
            <button onClick={() => setIsReminderModalOpen(true)} className="btn btn-primary" style={{ background: '#d946ef', borderColor: '#d946ef' }}>
              <Plus style={{ width: '16px', height: '16px', marginRight: '6px' }} /> New Reminder
            </button>
          )}
          {activeTab === 'timelogs' && (
            <button onClick={() => setIsTrackTimeModalOpen(true)} className="btn btn-primary" style={{ background: '#ea580c', borderColor: '#ea580c' }}>
              <Clock style={{ width: '16px', height: '16px', marginRight: '6px' }} /> Track Time
            </button>
          )}
          {activeTab === 'docs' && (
            <button onClick={() => setIsDocModalOpen(true)} className="btn btn-primary" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
              <Plus style={{ width: '16px', height: '16px', marginRight: '6px' }} /> New Doc
            </button>
          )}
          {activeTab === 'notes' && (
            <button onClick={() => setIsNoteModalOpen(true)} className="btn btn-primary" style={{ background: '#eab308', borderColor: '#eab308', color: '#fff' }}>
              <Plus style={{ width: '16px', height: '16px', marginRight: '6px' }} /> New Note
            </button>
          )}
          {activeTab === 'lists' && (
            <button onClick={() => setIsListModalOpen(true)} className="btn btn-primary" style={{ background: '#64748b', borderColor: '#64748b' }}>
              <Plus style={{ width: '16px', height: '16px', marginRight: '6px' }} /> New List
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation Header */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          overflowX: 'auto',
          paddingBottom: '2px'
        }}
      >
        <button
          onClick={() => setActiveTab('reminders')}
          className={`workspace-tab-btn ${activeTab === 'reminders' ? 'active' : ''}`}
          style={{
            borderBottomColor: activeTab === 'reminders' ? '#d946ef' : 'transparent',
            color: activeTab === 'reminders' ? '#d946ef' : 'var(--text-secondary)'
          }}
        >
          <Bell style={{ width: '16px', height: '16px' }} />
          <span>Reminders</span>
          {pendingReminders.length > 0 && (
            <span style={{ background: 'rgba(217, 70, 239, 0.15)', color: '#d946ef', padding: '2px 7px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>
              {pendingReminders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('timelogs')}
          className={`workspace-tab-btn ${activeTab === 'timelogs' ? 'active' : ''}`}
          style={{
            borderBottomColor: activeTab === 'timelogs' ? '#ea580c' : 'transparent',
            color: activeTab === 'timelogs' ? '#ea580c' : 'var(--text-secondary)'
          }}
        >
          <Clock style={{ width: '16px', height: '16px' }} />
          <span>Time Logs</span>
          <span style={{ background: 'rgba(234, 88, 12, 0.15)', color: '#ea580c', padding: '2px 7px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>
            {totalLoggedHours}h
          </span>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`workspace-tab-btn ${activeTab === 'docs' ? 'active' : ''}`}
          style={{
            borderBottomColor: activeTab === 'docs' ? '#0284c7' : 'transparent',
            color: activeTab === 'docs' ? '#0284c7' : 'var(--text-secondary)'
          }}
        >
          <FileText style={{ width: '16px', height: '16px' }} />
          <span>Docs</span>
          {(documents || []).length > 0 && (
            <span style={{ background: 'rgba(2, 132, 199, 0.15)', color: '#0284c7', padding: '2px 7px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>
              {(documents || []).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`workspace-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          style={{
            borderBottomColor: activeTab === 'notes' ? '#eab308' : 'transparent',
            color: activeTab === 'notes' ? '#eab308' : 'var(--text-secondary)'
          }}
        >
          <StickyNote style={{ width: '16px', height: '16px' }} />
          <span>Notes & Scratchpad</span>
          {(notes || []).length > 0 && (
            <span style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', padding: '2px 7px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>
              {(notes || []).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('lists')}
          className={`workspace-tab-btn ${activeTab === 'lists' ? 'active' : ''}`}
          style={{
            borderBottomColor: activeTab === 'lists' ? '#64748b' : 'transparent',
            color: activeTab === 'lists' ? '#64748b' : 'var(--text-secondary)'
          }}
        >
          <ListOrdered style={{ width: '16px', height: '16px' }} />
          <span>Custom Lists</span>
          {(customLists || []).length > 0 && (
            <span style={{ background: 'rgba(100, 116, 139, 0.15)', color: '#64748b', padding: '2px 7px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>
              {(customLists || []).length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: REMINDERS */}
      {activeTab === 'reminders' && (
        <div>
          {/* Pending Reminders List */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
              Upcoming Reminders ({pendingReminders.length})
            </h3>
            {pendingReminders.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pendingReminders.map(rem => (
                  <div
                    key={rem.id}
                    className="hub-item-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: 'var(--bg-card)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => toggleReminderStatus(rem.id, 'Completed')}
                        className="btn-icon"
                        title="Mark Complete"
                        style={{ color: '#94a3b8' }}
                      >
                        <Circle style={{ width: '20px', height: '20px' }} />
                      </button>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {rem.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar style={{ width: '13px', height: '13px', color: '#d946ef' }} />
                            Due: {rem.dueDate} at {rem.dueTime}
                          </span>
                          {rem.taskTitle && (
                            <span
                              onClick={() => rem.taskId && setSelectedTaskId(rem.taskId)}
                              style={{ color: 'var(--brand-primary)', cursor: 'pointer', fontWeight: 600 }}
                            >
                              Task: {rem.taskTitle}
                            </span>
                          )}
                          <span
                            style={{
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: rem.priority === 'Urgent' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                              color: rem.priority === 'Urgent' ? '#ef4444' : '#2563eb'
                            }}
                          >
                            {rem.priority}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteReminder(rem.id)}
                      className="btn-icon"
                      style={{ color: '#ef4444' }}
                      title="Delete Reminder"
                    >
                      <Trash2 style={{ width: '15px', height: '15px' }} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--bg-card)', borderRadius: '14px', border: '1px dashed var(--border-color)' }}>
                <Bell style={{ width: '32px', height: '32px', color: '#d946ef', margin: '0 auto 10px', opacity: 0.6 }} />
                <h4 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>No pending reminders</h4>
                <p style={{ margin: '0 0 14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  You&apos;re completely up to date! Add a reminder for your next follow-up.
                </p>
                <button onClick={() => setIsReminderModalOpen(true)} className="btn btn-secondary">
                  + Create Reminder
                </button>
              </div>
            )}
          </div>

          {/* Completed Reminders */}
          {completedReminders.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Completed ({completedReminders.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', opacity: 0.7 }}>
                {completedReminders.map(rem => (
                  <div
                    key={rem.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 14px',
                      background: 'var(--bg-card)',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => toggleReminderStatus(rem.id, 'Pending')}
                        className="btn-icon"
                        style={{ color: '#10b981' }}
                      >
                        <CheckCircle2 style={{ width: '18px', height: '18px' }} />
                      </button>
                      <span style={{ textDecoration: 'line-through', fontSize: '0.88rem' }}>{rem.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteReminder(rem.id)}
                      className="btn-icon"
                      style={{ color: '#ef4444' }}
                    >
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TIME LOGS */}
      {activeTab === 'timelogs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
              Recorded Work Sessions & Timesheets
            </h3>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Total Hours: <span style={{ color: '#ea580c', fontSize: '1.1rem' }}>{totalLoggedHours} hrs</span>
            </span>
          </div>

          {(timeLogs || []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {timeLogs.map(log => (
                <div
                  key={log.id}
                  className="hub-item-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    background: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(234, 88, 12, 0.1)',
                        color: '#ea580c',
                        fontWeight: 900,
                        fontSize: '1rem',
                        textAlign: 'center',
                        minWidth: '68px'
                      }}
                    >
                      {log.hours}h
                    </div>
                    <div>
                      <div
                        onClick={() => log.taskId && setSelectedTaskId(log.taskId)}
                        style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', cursor: 'pointer' }}
                      >
                        {log.taskTitle || 'Task'}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {log.notes || 'No description provided.'}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <span>Logged by {log.userName} on {log.date}</span>
                        {log.isBillable && <span style={{ color: '#10b981', fontWeight: 700 }}>• Billable</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteTimeLog(log.id)}
                    className="btn-icon"
                    style={{ color: '#ef4444' }}
                    title="Delete Time Log"
                  >
                    <Trash2 style={{ width: '15px', height: '15px' }} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--bg-card)', borderRadius: '14px', border: '1px dashed var(--border-color)' }}>
              <Clock style={{ width: '32px', height: '32px', color: '#ea580c', margin: '0 auto 10px', opacity: 0.6 }} />
              <h4 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>No work hours recorded yet</h4>
              <p style={{ margin: '0 0 14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Track time with the live stopwatch or enter manual hours spent on your tasks.
              </p>
              <button onClick={() => setIsTrackTimeModalOpen(true)} className="btn btn-secondary">
                + Track Time
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DOCS */}
      {activeTab === 'docs' && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '1.2rem' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0, position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search documentation by title, keyword, or category..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{ paddingLeft: '34px' }}
              />
              <Search style={{ width: '16px', height: '16px', position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {filteredDocs.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
              {filteredDocs.map(doc => (
                <div
                  key={doc.id}
                  className="hub-doc-card"
                  onClick={() => setSelectedDoc(doc)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span
                        style={{
                          background: 'rgba(2, 132, 199, 0.12)',
                          color: '#0284c7',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 800
                        }}
                      >
                        {doc.category || 'General'}
                      </span>
                      {doc.isPinned && <Pin style={{ width: '14px', height: '14px', color: '#0284c7' }} />}
                    </div>

                    <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {doc.title}
                    </h4>
                    <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {doc.content || 'Empty document.'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>By {doc.authorName}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDocument(doc.id);
                      }}
                      className="btn-icon"
                      style={{ color: '#ef4444', padding: '4px' }}
                      title="Delete Doc"
                    >
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--bg-card)', borderRadius: '14px', border: '1px dashed var(--border-color)' }}>
              <FileText style={{ width: '32px', height: '32px', color: '#0284c7', margin: '0 auto 10px', opacity: 0.6 }} />
              <h4 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>No documents found</h4>
              <p style={{ margin: '0 0 14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Publish guides, specifications, sprint goals, or SOPs for the team.
              </p>
              <button onClick={() => setIsDocModalOpen(true)} className="btn btn-secondary">
                + Create Doc
              </button>
            </div>
          )}

          {/* Doc View Drawer / Modal */}
          {selectedDoc && (
            <div className="workspace-modal-overlay" onClick={() => setSelectedDoc(null)}>
              <div className="workspace-modal-container" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
                <div className="workspace-modal-header">
                  <div className="workspace-modal-header-left">
                    <div className="workspace-modal-icon-badge" style={{ background: '#0284c7', color: '#fff' }}>
                      <FileText style={{ width: '20px', height: '20px' }} />
                    </div>
                    <div>
                      <h3 className="workspace-modal-title">{selectedDoc.title}</h3>
                      <p className="workspace-modal-subtitle">
                        {selectedDoc.category} • Author: {selectedDoc.authorName}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedDoc(null)} className="workspace-modal-close-btn">
                    <X style={{ width: '18px', height: '18px' }} />
                  </button>
                </div>
                <div className="workspace-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.95rem' }}>
                    {selectedDoc.content}
                  </div>
                </div>
                <div className="workspace-modal-footer">
                  <button onClick={() => setSelectedDoc(null)} className="btn btn-secondary">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: NOTES */}
      {activeTab === 'notes' && (
        <div>
          {filteredNotes.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {filteredNotes.map(n => {
                const isDarkNote = n.color === '#334155';
                return (
                  <div
                    key={n.id}
                    style={{
                      background: n.color || '#fef08a',
                      color: isDarkNote ? '#ffffff' : '#1e293b',
                      borderRadius: '14px',
                      padding: '16px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '160px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>{n.title}</h4>
                        {n.isPinned && <Pin style={{ width: '14px', height: '14px' }} />}
                      </div>

                      {n.content && (
                        <p style={{ margin: '0 0 10px', fontSize: '0.88rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                          {n.content}
                        </p>
                      )}

                      {/* Checklist items in note */}
                      {n.checklist && n.checklist.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                          {n.checklist.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                              <CheckSquare style={{ width: '13px', height: '13px', opacity: item.done ? 0.5 : 1 }} />
                              <span style={{ textDecoration: item.done ? 'line-through' : 'none', opacity: item.done ? 0.6 : 1 }}>
                                {item.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => deleteNote(n.id)}
                        className="btn-icon"
                        style={{ color: isDarkNote ? '#fca5a5' : '#ef4444', padding: '4px' }}
                        title="Delete Note"
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--bg-card)', borderRadius: '14px', border: '1px dashed var(--border-color)' }}>
              <StickyNote style={{ width: '32px', height: '32px', color: '#eab308', margin: '0 auto 10px', opacity: 0.6 }} />
              <h4 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>Your scratchpad is empty</h4>
              <p style={{ margin: '0 0 14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Keep quick to-dos, meeting takeaway sticky notes, and personal thoughts.
              </p>
              <button onClick={() => setIsNoteModalOpen(true)} className="btn btn-secondary">
                + Write Note
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CUSTOM LISTS */}
      {activeTab === 'lists' && (
        <div>
          {(customLists || []).length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {customLists.map(lst => {
                const totalItems = (lst.items || []).length;
                const doneItems = (lst.items || []).filter(i => i.done).length;
                const progressPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

                const handleToggleItem = (itemId) => {
                  const updatedItems = (lst.items || []).map(it => it.id === itemId ? { ...it, done: !it.done } : it);
                  updateCustomList(lst.id, { items: updatedItems });
                };

                return (
                  <div
                    key={lst.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '14px',
                      padding: '16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: lst.color || '#6366f1'
                          }}
                        />
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {lst.name}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteCustomList(lst.id)}
                        className="btn-icon"
                        style={{ color: '#ef4444', padding: '4px' }}
                        title="Delete List"
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>

                    {lst.description && (
                      <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {lst.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    {totalItems > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>{doneItems} of {totalItems} completed</span>
                          <span style={{ fontWeight: 800 }}>{progressPct}%</span>
                        </div>
                        <div style={{ height: '5px', borderRadius: '4px', background: 'var(--bg-input)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${progressPct}%`,
                              height: '100%',
                              background: lst.color || '#6366f1',
                              transition: 'width 0.2s ease'
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(lst.items || []).map(item => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleItem(item.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 8px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: item.done ? 'transparent' : 'var(--bg-input)',
                            transition: 'all 0.1s ease'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(item.done)}
                            onChange={() => handleToggleItem(item.id)}
                            style={{ accentColor: lst.color || '#6366f1' }}
                          />
                          <span
                            style={{
                              fontSize: '0.85rem',
                              textDecoration: item.done ? 'line-through' : 'none',
                              color: item.done ? 'var(--text-muted)' : 'var(--text-primary)'
                            }}
                          >
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--bg-card)', borderRadius: '14px', border: '1px dashed var(--border-color)' }}>
              <ListOrdered style={{ width: '32px', height: '32px', color: '#64748b', margin: '0 auto 10px', opacity: 0.6 }} />
              <h4 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>No custom lists created</h4>
              <p style={{ margin: '0 0 14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Organize checklists for sprints, customer onboarding, or team agendas.
              </p>
              <button onClick={() => setIsListModalOpen(true)} className="btn btn-secondary">
                + Create List
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
