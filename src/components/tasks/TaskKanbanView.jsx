import React, { useState, useMemo } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { formatDate, isOverdue } from '../../utils/dateUtils';
import {
  Plus,
  MoreHorizontal,
  Play,
  TrendingUp,
  MessageSquare,
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  User,
  Star,
  Search,
  CheckSquare,
  Layers,
  Flame,
  Zap,
  Filter
} from 'lucide-react';
import QuickFollowupModal from './QuickFollowupModal';

export default function TaskKanbanView() {
  const {
    tasks,
    statuses,
    users,
    departments,
    notifications,
    changeTaskStatus,
    changeTaskPriority,
    setSelectedTaskId,
    setIsCreateModalOpen,
    startTimer,
    activeUser,
    pinnedTaskIds = [],
    togglePinTask
  } = useTaskContext();

  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [kanbanSearch, setKanbanSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState('all'); // 'all' | 'my-tasks' | 'pinned' | 'urgent' | 'overdue'
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);
  const [quickFollowupTaskId, setQuickFollowupTaskId] = useState(null);
  const [dragOverColumnId, setDragOverColumnId] = useState(null);

  // Priority cycling order
  const priorityLevels = ['Low', 'Normal', 'High', 'Urgent', 'Critical'];
  const handleCyclePriority = (e, task) => {
    e.stopPropagation();
    const currentIndex = priorityLevels.indexOf(task.priority);
    const nextIndex = (currentIndex + 1) % priorityLevels.length;
    if (changeTaskPriority) {
      changeTaskPriority(task.id, priorityLevels[nextIndex]);
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'priority-chip-critical';
      case 'Urgent':
        return 'priority-chip-urgent';
      case 'High':
        return 'priority-chip-high';
      case 'Normal':
        return 'priority-chip-normal';
      default:
        return 'priority-chip-low';
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const matchDept = selectedDept === 'All' || t.department === selectedDept;
    const matchPriority = selectedPriority === 'All' || t.priority === selectedPriority;
    const matchSearch =
      !kanbanSearch ||
      t.title.toLowerCase().includes(kanbanSearch.toLowerCase()) ||
      t.id.toLowerCase().includes(kanbanSearch.toLowerCase());

    let matchQuick = true;
    if (quickFilter === 'my-tasks') {
      matchQuick = t.assigneeId === activeUser?.id;
    } else if (quickFilter === 'pinned') {
      matchQuick = pinnedTaskIds.includes(t.id);
    } else if (quickFilter === 'urgent') {
      matchQuick = t.priority === 'Urgent' || t.priority === 'Critical';
    } else if (quickFilter === 'overdue') {
      matchQuick = isOverdue(t.dueDate, t.status);
    }

    return matchDept && matchPriority && matchSearch && matchQuick;
  });

  // Calculate executive KPI metrics
  const kanbanStats = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const urgent = tasks.filter(t => t.priority === 'Urgent' || t.priority === 'Critical').length;
    const overdue = tasks.filter(t => isOverdue(t.dueDate, t.status)).length;
    const completed = tasks.filter(t => t.status === 'Completed' || t.status === 'Approved').length;
    const pinned = tasks.filter(t => pinnedTaskIds.includes(t.id)).length;
    return { total, inProgress, urgent, overdue, completed, pinned };
  }, [tasks, pinnedTaskIds]);

  const columns = statuses.slice(0, 8);

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    if (dragOverColumnId !== colId) {
      setDragOverColumnId(colId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumnId(null);
  };

  const handleDrop = (e, targetStatusId) => {
    e.preventDefault();
    setDragOverColumnId(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) changeTaskStatus(taskId, targetStatusId);
  };

  const getProgressColor = (pct) => {
    if (pct >= 100) return '#10b981';
    if (pct >= 75) return '#06b6d4';
    if (pct >= 50) return '#3b82f6';
    if (pct >= 25) return '#f59e0b';
    return '#6366f1';
  };

  // Move task to next status quickly
  const handleAdvanceTask = (e, task) => {
    e.stopPropagation();
    const currentIdx = columns.findIndex(c => c.id === task.status);
    if (currentIdx >= 0 && currentIdx < columns.length - 1) {
      const nextStatus = columns[currentIdx + 1].id;
      changeTaskStatus(task.id, nextStatus);
    }
  };

  const recentBoardNotifs = (notifications || []).slice(0, 4);

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Board Notification & Activity Alert Banner */}
      {showNotificationBanner && recentBoardNotifs.length > 0 && (
        <div
          className="glass-panel"
          style={{
            padding: '0.75rem 1rem',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(2, 132, 199, 0.06))',
            border: '1px solid rgba(79, 70, 229, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.5rem' }}>
                <Bell style={{ width: '12px', height: '12px' }} /> Board Live Notifications
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Real-time updates on assignments, progress, and daily follow-ups
              </span>
            </div>
            <button
              onClick={() => setShowNotificationBanner(false)}
              className="btn-icon"
              style={{ padding: '0.2rem', fontSize: '0.7rem' }}
              title="Dismiss banner"
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '2px' }}>
            {recentBoardNotifs.map(n => (
              <div
                key={n.id}
                onClick={() => n.taskId && setSelectedTaskId(n.taskId)}
                style={{
                  background: 'var(--bg-card)',
                  padding: '0.4rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.72rem',
                  whiteSpace: 'nowrap',
                  cursor: n.taskId ? 'pointer' : 'default',
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: '0.8rem' }}>
                  {n.type === 'assignment' ? '📋' : n.type === 'status' ? '📊' : '💬'}
                </span>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{n.title}:</strong>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {n.message?.length > 55 ? `${n.message.slice(0, 55)}...` : n.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Visual Kanban Workflow</span>
            <span className="badge badge-cyan">Interactive Board</span>
            <span className="badge badge-brand">{filteredTasks.length} Visible</span>
            {kanbanStats.pinned > 0 && (
              <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#ca8a04', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Star style={{ width: '11px', height: '11px', fill: '#f59e0b', color: '#f59e0b' }} /> {kanbanStats.pinned} Pinned
              </span>
            )}
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Drag-and-drop workflow stages, quick priority cycling, subtask checklists, and daily follow-up logs.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', minWidth: '180px' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search board..."
              value={kanbanSearch}
              onChange={(e) => setKanbanSearch(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '32px', height: '34px', fontSize: '0.75rem' }}
            />
          </div>

          <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="select-dropdown" style={{ width: 'auto', height: '34px' }}>
            <option value="All">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>

          <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)} className="select-dropdown" style={{ width: 'auto', height: '34px' }}>
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
            <option value="Critical">Critical</option>
          </select>

          <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary" style={{ height: '34px' }}>
            <Plus style={{ width: '15px', height: '15px' }} /> Add Task
          </button>
        </div>
      </div>

      {/* 2.5 Executive KPI Metrics Strip */}
      <div className="kpi-metrics-grid">
        <div
          className={`kpi-metric-card ${quickFilter === 'all' ? 'active' : ''}`}
          onClick={() => setQuickFilter('all')}
          title="Click to view all tasks"
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Board Tasks
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '2px' }}>
              {kanbanStats.total}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Across {columns.length} workflow stages
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
            <Layers style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        <div
          className={`kpi-metric-card ${quickFilter === 'my-tasks' ? 'active' : ''}`}
          onClick={() => setQuickFilter(quickFilter === 'my-tasks' ? 'all' : 'my-tasks')}
          title="Click to filter my assigned tasks"
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Assigned to Me
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0284c7', marginTop: '2px' }}>
              {tasks.filter(t => t.assigneeId === activeUser?.id).length}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Personal workload queue
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }}>
            <Zap style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        <div
          className={`kpi-metric-card ${quickFilter === 'urgent' ? 'active' : ''}`}
          onClick={() => setQuickFilter(quickFilter === 'urgent' ? 'all' : 'urgent')}
          title="Click to filter urgent & critical tasks"
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              High & Urgent
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#f97316', marginTop: '2px' }}>
              {kanbanStats.urgent}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Top priority items
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#f97316' }}>
            <Flame style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        <div
          className={`kpi-metric-card ${quickFilter === 'overdue' ? 'active' : ''}`}
          onClick={() => setQuickFilter(quickFilter === 'overdue' ? 'all' : 'overdue')}
          title="Click to filter overdue tasks"
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Overdue
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ef4444', marginTop: '2px' }}>
              {kanbanStats.overdue}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Exceeded target deadline
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <AlertTriangle style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        <div
          className="kpi-metric-card"
          style={{ cursor: 'default' }}
          title="Completed tasks"
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Completed
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#10b981', marginTop: '2px' }}>
              {kanbanStats.completed}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Delivered successfully
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <CheckCircle2 style={{ width: '22px', height: '22px' }} />
          </div>
        </div>
      </div>

      {/* 3. Quick Filter Pills Bar */}
      <div className="quick-filters-strip">
        <button
          className={`filter-pill ${quickFilter === 'all' ? 'active' : ''}`}
          onClick={() => setQuickFilter('all')}
        >
          All Tasks <span className="pill-count">{tasks.length}</span>
        </button>
        <button
          className={`filter-pill ${quickFilter === 'my-tasks' ? 'active' : ''}`}
          onClick={() => setQuickFilter('my-tasks')}
        >
          👤 Assigned to Me <span className="pill-count">{tasks.filter(t => t.assigneeId === activeUser?.id).length}</span>
        </button>
        <button
          className={`filter-pill ${quickFilter === 'pinned' ? 'active' : ''}`}
          onClick={() => setQuickFilter('pinned')}
        >
          ⭐ Pinned Tasks <span className="pill-count">{kanbanStats.pinned}</span>
        </button>
        <button
          className={`filter-pill ${quickFilter === 'urgent' ? 'active' : ''}`}
          onClick={() => setQuickFilter('urgent')}
        >
          🔥 High & Urgent <span className="pill-count">{kanbanStats.urgent}</span>
        </button>
        <button
          className={`filter-pill ${quickFilter === 'overdue' ? 'active' : ''}`}
          onClick={() => setQuickFilter('overdue')}
        >
          ⚠️ Overdue <span className="pill-count">{kanbanStats.overdue}</span>
        </button>
        {quickFilter !== 'all' && (
          <button
            onClick={() => setQuickFilter('all')}
            style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: '0 0.5rem' }}
          >
            Reset filter
          </button>
        )}
      </div>

      {/* 4. Board Columns Grid */}
      <div className="kanban-board">
        {columns.map(col => {
          let colTasks = filteredTasks.filter(t => t.status === col.id);

          // Pinned tasks sort to the top of each column
          colTasks.sort((a, b) => {
            const aPinned = pinnedTaskIds.includes(a.id);
            const bPinned = pinnedTaskIds.includes(b.id);
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            return 0;
          });

          const isOver = dragOverColumnId === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className="kanban-column"
              style={{
                transition: 'border-color 0.2s, background-color 0.2s',
                borderColor: isOver ? 'var(--brand-primary)' : undefined,
                background: isOver ? 'rgba(79, 70, 229, 0.04)' : undefined
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: col.id === 'Completed' || col.id === 'Approved'
                        ? '#10b981'
                        : col.id === 'In Progress'
                        ? '#0284c7'
                        : col.id === 'Review'
                        ? '#7c3aed'
                        : 'var(--brand-primary)'
                    }}
                  />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-primary)', letterSpacing: '0.4px' }}>
                    {col.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span className="badge badge-brand">{colTasks.length}</span>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn-icon"
                    style={{ width: '22px', height: '22px', padding: 0 }}
                    title={`Add task to ${col.label}`}
                  >
                    <Plus style={{ width: '13px', height: '13px' }} />
                  </button>
                </div>
              </div>

              {/* Tasks List Container */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '2px' }}>
                {colTasks.length === 0 ? (
                  <div
                    style={{
                      border: isOver ? '2px dashed var(--brand-primary)' : '2px dashed var(--border-color)',
                      height: '110px',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                      fontSize: '0.72rem',
                      color: isOver ? 'var(--brand-primary)' : 'var(--text-muted)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Layers style={{ width: '18px', height: '18px', opacity: 0.4 }} />
                    <span>Drop task here</span>
                  </div>
                ) : (
                  colTasks.map(t => {
                    const assignee = users.find(u => u.id === t.assigneeId);
                    const isLate = isOverdue(t.dueDate, t.status);
                    const progressVal = Number(t.progress || 0);
                    const followups = Array.isArray(t.followups) ? t.followups : [];
                    const latestFollowup = followups[0];
                    const isPinned = pinnedTaskIds.includes(t.id);

                    // Subtask / checklist calculations
                    const checklist = Array.isArray(t.checklist) ? t.checklist : [];
                    const checklistTotal = checklist.length;
                    const checklistDone = checklist.filter(c => c.completed).length;

                    return (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id)}
                        className="glass-card glass-card-hover"
                        style={{
                          padding: '0.9rem',
                          cursor: 'grab',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.65rem',
                          borderLeft: isPinned ? '3px solid #f59e0b' : `3px solid ${getProgressColor(progressVal)}`,
                          background: isPinned ? 'rgba(245, 158, 11, 0.03)' : undefined,
                          position: 'relative'
                        }}
                      >
                        {/* Top Meta: ID, Star Pin & Priority Chip */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-light)' }}>
                            {t.id}
                          </span>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {/* Star Pin */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePinTask(t.id);
                              }}
                              className={`star-pin-btn ${isPinned ? 'pinned' : ''}`}
                              title={isPinned ? 'Unpin task' : 'Pin task to top'}
                              style={{ padding: '2px' }}
                            >
                              <Star
                                style={{
                                  width: '14px',
                                  height: '14px',
                                  fill: isPinned ? '#f59e0b' : 'none',
                                  color: isPinned ? '#f59e0b' : 'var(--text-muted)'
                                }}
                              />
                            </button>

                            {/* Priority Quick Cycler */}
                            <button
                              type="button"
                              onClick={(e) => handleCyclePriority(e, t)}
                              className={`priority-chip-toggle ${getPriorityClass(t.priority)}`}
                              title="Click to cycle priority: Low → Normal → High → Urgent → Critical"
                            >
                              {t.priority === 'Critical' && <Flame style={{ width: '11px', height: '11px' }} />}
                              {t.priority === 'Urgent' && <AlertTriangle style={{ width: '11px', height: '11px' }} />}
                              <span>{t.priority}</span>
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <h4
                          onClick={() => setSelectedTaskId(t.id)}
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            lineHeight: '1.35',
                            margin: 0
                          }}
                        >
                          {t.title}
                        </h4>

                        {/* Subtasks Progress if present */}
                        {checklistTotal > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckSquare style={{ width: '12px', height: '12px', color: checklistDone === checklistTotal ? '#10b981' : 'var(--brand-primary)' }} />
                              Subtasks: {checklistDone}/{checklistTotal}
                            </span>
                            <span style={{ fontWeight: 700, color: checklistDone === checklistTotal ? '#10b981' : 'var(--text-secondary)' }}>
                              {Math.round((checklistDone / checklistTotal) * 100)}%
                            </span>
                          </div>
                        )}

                        {/* PROGRESS BAR & PERCENTAGE */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem' }}>
                            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <TrendingUp style={{ width: '11px', height: '11px', color: getProgressColor(progressVal) }} /> Overall Progress
                            </span>
                            <span style={{ fontWeight: 800, color: getProgressColor(progressVal) }}>
                              {progressVal}%
                            </span>
                          </div>
                          <div style={{ height: '5px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.min(100, Math.max(0, progressVal))}%`,
                                background: `linear-gradient(90deg, ${getProgressColor(progressVal)}, var(--brand-primary))`,
                                borderRadius: '999px'
                              }}
                            />
                          </div>
                        </div>

                        {/* Reason Not Started Blocker Alert if progress is 0% */}
                        {progressVal === 0 && t.reasonNotStarted && (
                          <div style={{ fontSize: '0.67rem', color: '#ca8a04', background: 'rgba(245, 158, 11, 0.08)', padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                            <strong>⚠️ Not Started:</strong> {t.delayCategory ? `${t.delayCategory} • ` : ''}{t.reasonNotStarted.length > 50 ? `${t.reasonNotStarted.slice(0, 50)}...` : t.reasonNotStarted}
                          </div>
                        )}

                        {/* Expected Completion Date */}
                        {t.expectedDate && (
                          <div style={{ fontSize: '0.66rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700 }}>
                            🎯 Expected: {formatDate(t.expectedDate)}
                          </div>
                        )}

                        {/* DAILY FOLLOW-UPS CHIP & QUICK ACTION */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-input)', padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                            <MessageSquare style={{ width: '12px', height: '12px', color: 'var(--brand-primary)' }} />
                            <span><strong>{followups.length}</strong> Follow-ups</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickFollowupTaskId(t.id);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem', fontWeight: 700 }}
                            title="Log daily follow-up"
                          >
                            + Follow-up
                          </button>
                        </div>

                        {/* Latest follow-up preview if available */}
                        {latestFollowup && (
                          <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.02)', padding: '0.25rem 0.4rem', borderRadius: '4px', borderLeft: '2px solid var(--border-color)' }}>
                            <strong>Latest ({latestFollowup.date}):</strong>{' '}
                            {latestFollowup.notes?.length > 40 ? `${latestFollowup.notes.slice(0, 40)}...` : latestFollowup.notes}
                          </div>
                        )}

                        {/* ASSIGNEE & FOOTER CONTROLS */}
                        <div style={{ paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {assignee?.avatar ? (
                              <img src={assignee.avatar} alt={assignee.name} style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--brand-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.6rem' }}>
                                {(assignee?.name || 'U').slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: '1.1' }}>
                                {assignee?.name || 'Unassigned'}
                              </span>
                              <span style={{ fontSize: '0.62rem', color: isLate ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                                {isLate ? '⚠️ Overdue' : formatDate(t.dueDate)}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {/* Fast-forward to next stage */}
                            <button
                              onClick={(e) => handleAdvanceTask(e, t)}
                              className="btn-icon"
                              title="Advance to next stage"
                              style={{ width: '24px', height: '24px', padding: 0 }}
                            >
                              <ChevronRight style={{ width: '13px', height: '13px' }} />
                            </button>
                            <button
                              onClick={() => startTimer(t.id)}
                              className="btn-icon"
                              title="Start timer"
                              style={{ width: '24px', height: '24px', padding: 0 }}
                            >
                              <Play style={{ width: '12px', height: '12px' }} />
                            </button>
                            <button
                              onClick={() => setSelectedTaskId(t.id)}
                              className="btn-icon"
                              title="View details"
                              style={{ width: '24px', height: '24px', padding: 0 }}
                            >
                              <MoreHorizontal style={{ width: '12px', height: '12px' }} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Follow-up Modal */}
      {quickFollowupTaskId && (
        <QuickFollowupModal
          isOpen={!!quickFollowupTaskId}
          onClose={() => setQuickFollowupTaskId(null)}
          taskId={quickFollowupTaskId}
        />
      )}
    </div>
  );
}
