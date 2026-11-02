import React, { useState, useRef } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import EaMeetingModal from './EaMeetingModal';
import EaFollowUpModal from './EaFollowUpModal';
import EaDailyTaskModal from './EaDailyTaskModal';
import {
  Calendar,
  Clock,
  Plus,
  CheckSquare,
  Square,
  CheckCircle2,
  AlertTriangle,
  PhoneCall,
  Send,
  Users,
  Search,
  MapPin,
  Sparkles,
  Award,
  TrendingUp,
  FileText,
  Trash2,
  Filter,
  MessageSquare,
  ListTodo,
  ShieldAlert,
  ArrowUpRight,
  Edit3,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';

export default function EaDashboardView() {
  const {
    tasks,
    users,
    eaFollowUps,
    eaMeetings,
    eaDailyTasks,
    toggleEaDailyTask,
    deleteEaDailyTask,
    sendNotification,
    setViewingUserProfile,
    setSelectedTaskId,
    setIsCreateModalOpen,
    setEditingTask,
    deleteTask,
    deleteEaMeeting
  } = useTaskContext();

  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isDailyTaskModalOpen, setIsDailyTaskModalOpen] = useState(false);
  const [selectedTaskForFollowUp, setSelectedTaskForFollowUp] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'overdue' | 'escalated'

  // Daily Routine Controls & State
  const [dailySearchQuery, setDailySearchQuery] = useState('');
  const [dailyStatusFilter, setDailyStatusFilter] = useState('all'); // 'all' | 'pending' | 'completed'
  const [dailyCategoryFilter, setDailyCategoryFilter] = useState('all');
  const [isExpandedDailyTasks, setIsExpandedDailyTasks] = useState(false);
  const dailyListRef = useRef(null);

  const meetings = eaMeetings || [];
  const dailyTasks = eaDailyTasks || [];
  const followUps = eaFollowUps || [];

  const completedDailyCount = dailyTasks.filter(t => t.completed).length;
  const totalDailyCount = dailyTasks.length;
  const dailyCompliancePercentage = totalDailyCount > 0 ? Math.round((completedDailyCount / totalDailyCount) * 100) : 0;

  // Available categories and filtered list of daily routine tasks
  const availableCategories = Array.from(new Set(dailyTasks.map(t => t.category).filter(Boolean)));

  const filteredDailyTasks = dailyTasks.filter(item => {
    const matchesSearch = !dailySearchQuery ||
      item.title.toLowerCase().includes(dailySearchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(dailySearchQuery.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(dailySearchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (dailyStatusFilter === 'pending' && item.completed) return false;
    if (dailyStatusFilter === 'completed' && !item.completed) return false;

    if (dailyCategoryFilter !== 'all' && item.category !== dailyCategoryFilter) return false;

    return true;
  });

  const mdTasks = tasks;

  // Filter tasks based on statusFilter & search
  const filteredTasks = mdTasks.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (users.find(u => u.id === t.assigneeId)?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'overdue') {
      return new Date(t.dueDate) < new Date() && t.status !== 'Completed' && t.status !== 'Approved';
    }
    if (statusFilter === 'escalated') {
      return followUps.some(f => f.taskId === t.id && (f.isEscalatedToMd || f.status === 'Escalated to MD'));
    }
    if (statusFilter === 'pending') {
      return !followUps.some(f => f.taskId === t.id) && t.status !== 'Completed' && t.status !== 'Approved';
    }
    return true;
  });

  const overdueCount = mdTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'Completed' && t.status !== 'Approved').length;
  const escalatedCount = followUps.filter(f => f.isEscalatedToMd || f.status === 'Escalated to MD').length;
  const pendingCount = mdTasks.filter(t => !followUps.some(f => f.taskId === t.id) && t.status !== 'Completed' && t.status !== 'Approved').length;

  const handleToggleDailyTask = async (taskId) => {
    if (toggleEaDailyTask) {
      await toggleEaDailyTask(taskId);
    }
  };

  const handleDeleteDailyTask = async (e, taskId) => {
    e.stopPropagation();
    if (deleteEaDailyTask) {
      await deleteEaDailyTask(taskId);
    }
  };

  const sendOneClickNudge = (task) => {
    sendNotification(
      '🚨 EA Executive Follow-Up Reminder',
      `Rachel Green (EA to MD) requests urgent action update on task ${task.id}: "${task.title}".`,
      'approval',
      task.id
    );
  };

  return (
    <div className="view-container" style={{ padding: '2rem 2.5rem 5rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Dashboard Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', padding: '3px 10px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              📋 Executive Assistant Operations
            </span>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
              🟢 Live MD Screen Monitoring Active
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>EA Operations & Follow-Up Command Center</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Maintain daily working lines, track deliverable status compliance, allot executive meetings, and enforce assignee follow-ups.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setEditingTask(null);
              setIsCreateModalOpen(true);
            }}
            className="btn btn-primary"
            style={{ fontWeight: 800, background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)' }}
            title="Create and assign a new enterprise task or delegated deliverable"
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            <span>+ Add Task / Deliverable</span>
          </button>
          <button onClick={() => setIsDailyTaskModalOpen(true)} className="btn btn-secondary" style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', fontWeight: 800 }}>
            <Plus style={{ width: '16px', height: '16px' }} />
            <span>+ Add Working Line</span>
          </button>
          <button onClick={() => setIsMeetingModalOpen(true)} className="btn btn-secondary" style={{ background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', fontWeight: 800 }}>
            <Calendar style={{ width: '16px', height: '16px' }} />
            <span>Allot Executive Meeting</span>
          </button>
        </div>
      </div>

      {/* Stats Gauges Bar */}
      <div className="grid grid-cols-4 lg-grid-cols-2 sm-grid-cols-2 mobile-metrics-grid" style={{ gap: '0.85rem' }}>
        <div className="glass-card" style={{ padding: '1rem', borderTop: '2px solid #0284c7' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--brand-light)', textTransform: 'uppercase' }}>Daily Routine Compliance</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', margin: '0.25rem 0', fontFamily: 'monospace' }}>
            {completedDailyCount} / {totalDailyCount} ({dailyCompliancePercentage}%)
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Live MD Screen Monitor</div>
        </div>

        <div className="glass-card" style={{ padding: '1rem', borderTop: '2px solid #10b981' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Allotted Executive Meetings</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', margin: '0.25rem 0', fontFamily: 'monospace' }}>{meetings.length} Scheduled</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Synced with MD Agenda</div>
        </div>

        <div className="glass-card" style={{ padding: '1rem', borderTop: '2px solid #f59e0b' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>Active Task Follow-ups</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24', margin: '0.25rem 0', fontFamily: 'monospace' }}>{followUps.length} Actions Logged</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Active assignee pings</div>
        </div>

        <div className="glass-card" style={{ padding: '1rem', borderTop: '2px solid #f43f5e' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f43f5e', textTransform: 'uppercase' }}>Escalated to MD</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f87171', margin: '0.25rem 0', fontFamily: 'monospace' }}>
            {escalatedCount} Blockers
          </div>
          <div style={{ fontSize: '0.7rem', color: '#f43f5e', fontWeight: 700 }}>Requires MD Action</div>
        </div>
      </div>

      {/* Main Grid: Executive Meetings vs EA Daily Routine Working Lines */}
      <div className="grid grid-cols-2 sm-grid-cols-1" style={{ gap: '1.5rem' }}>
        {/* Section 1: Executive Meeting Scheduler & Calendar Widget */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar style={{ width: '18px', height: '18px', color: '#0284c7' }} />
              Executive Allotted Meetings Schedule
            </h3>
            <button onClick={() => setIsMeetingModalOpen(true)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#0284c7', background: '#f0f7ff', border: '1px solid #bae6fd' }}>
              + Allot Meeting
            </button>
          </div>

          <div className="ea-scroll-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '440px', overflowY: 'auto', paddingRight: '6px' }}>
            {meetings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
                No executive meetings scheduled yet. Click "+ Allot Meeting" to schedule.
              </div>
            ) : (
              meetings.map(m => (
                <div key={m.id} style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{m.title}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-brand">{m.status}</span>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete meeting "${m.title}"?`)) {
                            deleteEaMeeting(m.id);
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '3px', borderRadius: '4px' }}
                        title="Delete this meeting"
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78125rem', color: '#0284c7', fontWeight: 700, marginBottom: '0.4rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock style={{ width: '14px', height: '14px' }} /> {m.date} at {m.time} ({m.durationMinutes} mins)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin style={{ width: '14px', height: '14px' }} /> {m.location}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78125rem', color: '#475569', marginBottom: '0.4rem' }}>
                    <strong>Host:</strong> {m.host} • <strong>Attendees:</strong> {Array.isArray(m.attendees) ? m.attendees.join(', ') : m.attendees}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    Agenda: "{m.agenda}"
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 2: EA Daily Routine Tasks / Working Lines Compliance Checklist */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckSquare style={{ width: '18px', height: '18px', color: '#0284c7' }} />
                EA Daily Routine & Working Lines Tracker
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0 0' }}>
                Operational checklist monitored live on MD Executive Screen ({completedDailyCount}/{totalDailyCount} Completed)
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: dailyCompliancePercentage >= 80 ? '#10b981' : '#d97706', background: '#f0f7ff', padding: '4px 10px', borderRadius: '99px', border: '1px solid #bae6fd' }}>
                {dailyCompliancePercentage}% Compliance
              </span>
              <button
                onClick={() => setIsExpandedDailyTasks(!isExpandedDailyTasks)}
                className="btn btn-secondary"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  background: isExpandedDailyTasks ? '#0284c7' : '#f0f9ff',
                  color: isExpandedDailyTasks ? '#ffffff' : '#0284c7',
                  border: '1px solid #bae6fd',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title={isExpandedDailyTasks ? "Collapse to compact scrollable view" : "Expand to view all 18 items without scrolling"}
              >
                {isExpandedDailyTasks ? (
                  <>
                    <Minimize2 style={{ width: '13px', height: '13px' }} />
                    <span>Compact View</span>
                  </>
                ) : (
                  <>
                    <Maximize2 style={{ width: '13px', height: '13px' }} />
                    <span>Show All ({dailyTasks.length})</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setIsDailyTaskModalOpen(true)}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#0284c7', background: '#f0f7ff', border: '1px solid #bae6fd' }}
                title="Add a new custom working routine line"
              >
                + Add Line
              </button>
            </div>
          </div>

          {/* Search & Filter Dropdowns Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', background: '#f8fafc', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: '150px' }}>
              <Search style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', width: '13px', height: '13px', color: '#0284c7' }} />
              <input
                type="text"
                placeholder="Search 18 working lines..."
                value={dailySearchQuery}
                onChange={(e) => setDailySearchQuery(e.target.value)}
                className="input-field"
                style={{ width: '100%', paddingLeft: '28px', paddingRight: '24px', fontSize: '0.75rem', height: '30px', boxSizing: 'border-box' }}
              />
              {dailySearchQuery && (
                <button
                  onClick={() => setDailySearchQuery('')}
                  style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                >
                  <X style={{ width: '12px', height: '12px' }} />
                </button>
              )}
            </div>

            {/* Status Filter Dropdown */}
            <select
              value={dailyStatusFilter}
              onChange={(e) => setDailyStatusFilter(e.target.value)}
              className="select-dropdown"
              style={{ width: 'auto', fontSize: '0.75rem', height: '30px', padding: '0 0.5rem', fontWeight: 700 }}
            >
              <option value="all">All ({dailyTasks.length})</option>
              <option value="pending">Pending ({dailyTasks.length - completedDailyCount})</option>
              <option value="completed">Completed ({completedDailyCount})</option>
            </select>

            {/* Category Filter Dropdown */}
            {availableCategories.length > 0 && (
              <select
                value={dailyCategoryFilter}
                onChange={(e) => setDailyCategoryFilter(e.target.value)}
                className="select-dropdown"
                style={{ width: 'auto', fontSize: '0.75rem', height: '30px', padding: '0 0.5rem', fontWeight: 700 }}
              >
                <option value="all">All Categories ({availableCategories.length})</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>

          {/* Routine Working Lines List */}
          <div
            ref={dailyListRef}
            className="ea-scroll-container"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              maxHeight: isExpandedDailyTasks ? 'none' : '440px',
              overflowY: isExpandedDailyTasks ? 'visible' : 'auto',
              paddingRight: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            {filteredDailyTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
                {dailyTasks.length === 0 ? (
                  'No daily routine working lines set yet. Click "+ Add Line" to add your first operational checklist item.'
                ) : (
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700 }}>No working lines match filter.</p>
                    <button
                      onClick={() => {
                        setDailySearchQuery('');
                        setDailyStatusFilter('all');
                        setDailyCategoryFilter('all');
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '3px 10px', fontSize: '0.75rem', color: '#0284c7' }}
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            ) : (
              filteredDailyTasks.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleToggleDailyTask(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    background: item.completed ? '#f0fdf4' : '#f8fafc',
                    border: item.completed ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  className="glass-card-hover"
                >
                  {item.completed ? (
                    <CheckSquare style={{ width: '20px', height: '20px', color: '#166534', flexShrink: 0 }} />
                  ) : (
                    <Square style={{ width: '20px', height: '20px', color: '#94a3b8', flexShrink: 0 }} />
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 800, color: item.completed ? '#14532d' : '#0f172a', textDecoration: item.completed ? 'line-through' : 'none' }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>
                        {item.timeSlot}
                      </span>
                      {item.category && (
                        <span style={{ fontSize: '0.62rem', background: '#f1f5f9', color: '#475569', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                          {item.category}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: item.completed ? '#15803d' : '#64748b', margin: '2px 0 0 0' }}>
                      {item.notes} {item.completedAt && `• Done at ${new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleDeleteDailyTask(e, item.id)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                    title="Delete this working line"
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                  >
                    <Trash2 style={{ width: '15px', height: '15px' }} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Bottom helper pill in compact view */}
          {!isExpandedDailyTasks && filteredDailyTasks.length > 5 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.5rem 0.75rem',
              background: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #bae6fd',
              fontSize: '0.72rem',
              color: '#0369a1'
            }}>
              <span>Showing scrollable list of {filteredDailyTasks.length} working lines</span>
              <button
                onClick={() => setIsExpandedDailyTasks(true)}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '3px 8px',
                  borderRadius: '5px',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Maximize2 style={{ width: '11px', height: '11px' }} />
                <span>Show All ({filteredDailyTasks.length})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: MD Task Follow-Up Queue Table with Filters */}
      <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid #bae6fd', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListTodo style={{ width: '20px', height: '20px', color: '#0284c7' }} />
              📋 MD Delegated Deliverables Follow-up Queue ({filteredTasks.length})
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0 0' }}>
              Enforce SLA accountability, log daily follow-up actions, and escalate blockers directly to MD.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Filter Pills */}
            <div style={{ display: 'flex', background: '#f8fafc', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0', gap: '3px' }}>
              <button
                onClick={() => setStatusFilter('all')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: statusFilter === 'all' ? '#0284c7' : 'transparent',
                  color: statusFilter === 'all' ? '#ffffff' : '#64748b'
                }}
              >
                All ({mdTasks.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: statusFilter === 'pending' ? '#0284c7' : 'transparent',
                  color: statusFilter === 'pending' ? '#ffffff' : '#64748b'
                }}
              >
                Pending Follow-up ({pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter('overdue')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: statusFilter === 'overdue' ? '#ef4444' : 'transparent',
                  color: statusFilter === 'overdue' ? '#ffffff' : '#ef4444'
                }}
              >
                Overdue ({overdueCount})
              </button>
              <button
                onClick={() => setStatusFilter('escalated')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: statusFilter === 'escalated' ? '#dc2626' : 'transparent',
                  color: statusFilter === 'escalated' ? '#ffffff' : '#dc2626'
                }}
              >
                ⚠️ Escalated to MD ({escalatedCount})
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: '#0284c7' }} />
              <input
                type="text"
                placeholder="Search deliverables or team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
                style={{ width: '100%', paddingLeft: '32px', fontSize: '0.78rem', boxSizing: 'border-box' }}
              />
            </div>

            {/* + Add Task Button */}
            <button
              onClick={() => {
                setEditingTask(null);
                setIsCreateModalOpen(true);
              }}
              className="btn btn-primary"
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)'
              }}
              title="Create a new task or deliverable directly in this queue"
            >
              <Plus style={{ width: '15px', height: '15px' }} />
              <span>+ Add Task</span>
            </button>
          </div>
        </div>

        {/* Deliverables Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f0f7ff', borderBottom: '1px solid #bae6fd', fontSize: '0.75rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Task ID & Deliverable</th>
                <th style={{ padding: '0.85rem 1rem' }}>Assigned Person</th>
                <th style={{ padding: '0.85rem 1rem' }}>Due Date & Status</th>
                <th style={{ padding: '0.85rem 1rem' }}>Latest Follow-Up Action Logged</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>EA Operations Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>No deliverables found in this queue.</p>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>Create your own tasks or deliverables right now to start tracking follow-ups and SLAs.</p>
                      <button
                        onClick={() => {
                          setEditingTask(null);
                          setIsCreateModalOpen(true);
                        }}
                        className="btn btn-primary"
                        style={{ marginTop: '0.5rem', fontWeight: 800, padding: '7px 16px', fontSize: '0.8rem', background: '#0284c7' }}
                      >
                        <Plus style={{ width: '15px', height: '15px' }} />
                        <span>+ Create Your First Task</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map(t => {
                  const assignee = users.find(u => u.id === t.assigneeId) || { name: 'Assignee', role: 'Employee', avatar: '' };
                  const latestLog = followUps.find(f => f.taskId === t.id);
                  const isOverdue = new Date(t.dueDate) < new Date() && t.status !== 'Completed' && t.status !== 'Approved';

                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0' }} className="glass-card-hover">
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0284c7', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>
                            {t.id}
                          </span>
                          <span
                            onClick={() => setSelectedTaskId(t.id)}
                            style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer', textDecoration: 'underline' }}
                            title="Click to view full task details"
                          >
                            {t.title}
                          </span>
                          {latestLog?.isEscalatedToMd && (
                            <span style={{ fontSize: '0.65rem', background: '#fee2e2', color: '#dc2626', padding: '1px 6px', borderRadius: '6px', fontWeight: 800 }}>
                              ⚠️ MD Escalation
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div onClick={() => setViewingUserProfile(assignee.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} title={`View ${assignee.name}'s profile`}>
                          {assignee.avatar ? (
                            <img src={assignee.avatar} alt={assignee.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #bae6fd' }} />
                          ) : (
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#dbeafe', color: '#0284c7', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {assignee.name?.slice(0, 2).toUpperCase() || 'EM'}
                            </div>
                          )}
                          <div>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>{assignee.name}</span>
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{assignee.role} • {assignee.department || 'Operations'}</span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: isOverdue ? '#dc2626' : '#334155' }}>
                            {t.dueDate?.slice(0, 10)} {isOverdue && '⚠️ Late'}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                            Status: <strong>{t.status}</strong>
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.78125rem', color: '#334155' }}>
                        {latestLog ? (
                          <div>
                            <div style={{ fontWeight: 700, color: '#0369a1' }}>
                              "{latestLog.actionNotes}"
                            </div>
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                              Via {latestLog.channel} • Next check-in: {latestLog.nextFollowUpDate}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                            No follow-up action logged yet
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => setSelectedTaskForFollowUp(t)}
                            className="btn btn-primary"
                            style={{ padding: '5px 12px', fontSize: '0.75rem', fontWeight: 700 }}
                            title="Log follow-up call, WhatsApp, promised deliverable and next check-in"
                          >
                            <PhoneCall style={{ width: '13px', height: '13px' }} />
                            <span>Take Follow-up</span>
                          </button>
                          <button
                            onClick={() => sendOneClickNudge(t)}
                            className="btn btn-secondary"
                            style={{ padding: '5px 10px', fontSize: '0.75rem', background: '#f0f7ff', color: '#0284c7', border: '1px solid #bae6fd', fontWeight: 700 }}
                            title="Send instant executive reminder notification"
                          >
                            <Send style={{ width: '13px', height: '13px' }} />
                            <span>Nudge</span>
                          </button>
                          <button
                            onClick={() => setEditingTask(t)}
                            style={{ padding: '5px 8px', borderRadius: '6px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title="Edit task details"
                          >
                            <Edit3 style={{ width: '13px', height: '13px' }} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete task "${t.title}" (${t.id})?`)) {
                                deleteTask(t.id);
                              }
                            }}
                            style={{ padding: '5px 8px', borderRadius: '6px', background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title="Delete this task"
                          >
                            <Trash2 style={{ width: '13px', height: '13px' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Recent Follow-up Actions Log Activity Stream */}
      {followUps.length > 0 && (
        <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid #bae6fd', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock style={{ width: '18px', height: '18px', color: '#0284c7' }} />
            Recent Follow-Up Actions & Audit History ({followUps.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {followUps.slice(0, 5).map(f => (
              <div
                key={f.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PhoneCall style={{ width: '16px', height: '16px' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{f.assigneeName}</span>
                      <span style={{ fontSize: '0.68rem', padding: '1px 6px', background: '#dcfce7', color: '#166534', borderRadius: '4px', fontWeight: 700 }}>{f.channel}</span>
                      {f.isEscalatedToMd && (
                        <span style={{ fontSize: '0.68rem', padding: '1px 6px', background: '#fee2e2', color: '#dc2626', borderRadius: '4px', fontWeight: 800 }}>⚠️ Escalated to MD</span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#334155', margin: '2px 0 0 0' }}>
                      <strong>Action:</strong> "{f.actionNotes}" • <em>Required: {f.actionRequired}</em>
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.74rem', color: '#64748b' }}>
                  <div>Next Follow-up: <strong>{f.nextFollowUpDate}</strong></div>
                  <div>Logged by: {f.loggedBy}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <EaMeetingModal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
      />

      <EaDailyTaskModal
        isOpen={isDailyTaskModalOpen}
        onClose={() => setIsDailyTaskModalOpen(false)}
      />

      <EaFollowUpModal
        isOpen={!!selectedTaskForFollowUp}
        onClose={() => setSelectedTaskForFollowUp(null)}
        task={selectedTaskForFollowUp}
      />
    </div>
  );
}
