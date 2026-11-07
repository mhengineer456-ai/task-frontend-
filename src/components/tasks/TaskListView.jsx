import React, { useState, useMemo } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import BulkActionsBar from './BulkActionsBar';
import { formatDate, isOverdue } from '../../utils/dateUtils';
import { exportTasksToCSV, exportTasksToJSON } from '../../utils/exportUtils';
import {
  Search,
  ArrowUpDown,
  Download,
  Play,
  Plus,
  SlidersHorizontal,
  X,
  Bell,
  TrendingUp,
  MessageSquare,
  Star,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Flame,
  Zap,
  CheckSquare,
  Layers,
  ChevronDown
} from 'lucide-react';
import QuickFollowupModal from './QuickFollowupModal';

export default function TaskListView() {
  const {
    tasks,
    users,
    departments,
    statuses,
    notifications,
    setSelectedTaskId,
    setIsCreateModalOpen,
    startTimer,
    activeUser,
    pinnedTaskIds = [],
    togglePinTask,
    changeTaskStatus,
    changeTaskPriority
  } = useTaskContext();

  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState('all'); // 'all' | 'my-tasks' | 'pinned' | 'in-progress' | 'urgent' | 'overdue' | 'completed'
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false);
  const [sortField, setSortField] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [quickFollowupTaskId, setQuickFollowupTaskId] = useState(null);
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);

  // Compute executive KPI stats
  const kpiStats = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const completed = tasks.filter(t => t.status === 'Completed' || t.status === 'Approved').length;
    const urgent = tasks.filter(t => t.priority === 'Urgent' || t.priority === 'Critical').length;
    const overdue = tasks.filter(t => isOverdue(t.dueDate, t.status)).length;
    const pinned = tasks.filter(t => pinnedTaskIds.includes(t.id)).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, inProgress, completed, urgent, overdue, pinned, completionRate };
  }, [tasks, pinnedTaskIds]);

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

  // Helper status color mapping
  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed':
      case 'Approved':
        return 'status-completed';
      case 'In Progress':
        return 'status-in-progress';
      case 'Review':
        return 'status-review';
      case 'Cancelled':
        return 'status-cancelled';
      default:
        return 'status-backlog';
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
  let filtered = (tasks || []).filter(t => {
    if (!t) return false;
    const taskTitle = String(t.title || '').toLowerCase();
    const taskId = String(t.id || '').toLowerCase();
    const taskCategory = String(t.category || '').toLowerCase();
    const taskDept = String(t.department || '').toLowerCase();
    const q = String(searchQuery || '').toLowerCase().trim();

    const matchesSearch =
      !q ||
      taskTitle.includes(q) ||
      taskId.includes(q) ||
      taskCategory.includes(q) ||
      taskDept.includes(q);

    const matchesDept = filterDepartment === 'All' || t.department === filterDepartment;
    const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    const matchesOverdue = !filterOverdueOnly || isOverdue(t.dueDate, t.status);

    // Quick filter chip logic
    let matchesQuick = true;
    if (quickFilter === 'my-tasks') {
      matchesQuick = t.assigneeId === activeUser?.id;
    } else if (quickFilter === 'pinned') {
      matchesQuick = pinnedTaskIds.includes(t.id);
    } else if (quickFilter === 'in-progress') {
      matchesQuick = t.status === 'In Progress';
    } else if (quickFilter === 'urgent') {
      matchesQuick = t.priority === 'Urgent' || t.priority === 'Critical';
    } else if (quickFilter === 'overdue') {
      matchesQuick = isOverdue(t.dueDate, t.status);
    } else if (quickFilter === 'completed') {
      matchesQuick = t.status === 'Completed' || t.status === 'Approved';
    }

    return matchesSearch && matchesDept && matchesPriority && matchesStatus && matchesOverdue && matchesQuick;
  });

  // Sort with pinned items always anchored at the top
  filtered.sort((a, b) => {
    const aPinned = pinnedTaskIds.includes(a.id);
    const bPinned = pinnedTaskIds.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    let valA = a[sortField] || '';
    let valB = b[sortField] || '';

    if (sortField === 'dueDate' || sortField === 'startDate') {
      valA = new Date(valA).getTime() || 0;
      valB = new Date(valB).getTime() || 0;
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTaskIds(filtered.map(t => t.id));
    } else {
      setSelectedTaskIds([]);
    }
  };

  const toggleSelectTask = (id) => {
    setSelectedTaskIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getProgressColor = (pct) => {
    if (pct >= 100) return '#10b981';
    if (pct >= 75) return '#06b6d4';
    if (pct >= 50) return '#3b82f6';
    if (pct >= 25) return '#f59e0b';
    return '#6366f1';
  };

  const recentBoardNotifs = (notifications || []).slice(0, 4);

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Live Board Notification Strip */}
      {showNotificationBanner && recentBoardNotifs.length > 0 && (
        <div
          className="glass-panel"
          style={{
            padding: '0.75rem 1rem',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(2, 132, 199, 0.06))',
            border: '1px solid rgba(37, 99, 235, 0.25)',
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
                Real-time updates on assignments, progress logs, and daily follow-ups
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

      {/* 2. Top Executive KPI Summary Cards (Clickable for instant filtering) */}
      <div className="kpi-metrics-grid">
        <div
          className={`kpi-metric-card ${quickFilter === 'all' ? 'active' : ''}`}
          onClick={() => setQuickFilter('all')}
          title="Click to view all tasks"
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Tasks
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '2px' }}>
              {kpiStats.total}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Across {departments.length} departments
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(37, 99, 235, 0.12)', color: 'var(--brand-primary)' }}>
            <Layers style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        <div
          className={`kpi-metric-card ${quickFilter === 'in-progress' ? 'active' : ''}`}
          onClick={() => setQuickFilter(quickFilter === 'in-progress' ? 'all' : 'in-progress')}
          title="Click to filter In Progress tasks"
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              In Progress
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0284c7', marginTop: '2px' }}>
              {kpiStats.inProgress}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Active execution phase
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
            <Zap style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        <div
          className={`kpi-metric-card ${quickFilter === 'urgent' ? 'active' : ''}`}
          onClick={() => setQuickFilter(quickFilter === 'urgent' ? 'all' : 'urgent')}
          title="Click to filter Urgent & Critical tasks"
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              High & Urgent
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#f97316', marginTop: '2px' }}>
              {kpiStats.urgent}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Needs immediate focus
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(249, 115, 22, 0.12)', color: '#f97316' }}>
            <Flame style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        <div
          className={`kpi-metric-card ${quickFilter === 'overdue' ? 'active' : ''}`}
          onClick={() => setQuickFilter(quickFilter === 'overdue' ? 'all' : 'overdue')}
          title="Click to filter Overdue tasks"
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Overdue
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ef4444', marginTop: '2px' }}>
              {kpiStats.overdue}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Passed target deadline
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
            <AlertTriangle style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        <div
          className={`kpi-metric-card ${quickFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setQuickFilter(quickFilter === 'completed' ? 'all' : 'completed')}
          title="Click to filter Completed tasks"
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Completed
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#10b981', marginTop: '2px' }}>
              {kpiStats.completed} <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>({kpiStats.completionRate}%)</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Delivered successfully
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <CheckCircle2 style={{ width: '22px', height: '22px' }} />
          </div>
        </div>
      </div>

      {/* 3. Header Controls & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Task Master Grid</span>
            <span className="badge badge-brand">{filtered.length} Displayed</span>
            {kpiStats.pinned > 0 && (
              <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#ca8a04', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Star style={{ width: '11px', height: '11px', fill: '#f59e0b', color: '#f59e0b' }} /> {kpiStats.pinned} Pinned
              </span>
            )}
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Enterprise view with inline status and priority quick-tuning, star pinning, and subtask tracking.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => exportTasksToCSV(filtered)} className="btn btn-secondary">
            <Download style={{ width: '14px', height: '14px' }} /> CSV
          </button>
          <button onClick={() => exportTasksToJSON(filtered)} className="btn btn-secondary">
            <Download style={{ width: '14px', height: '14px' }} /> JSON
          </button>
          <button
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            className={`btn ${isFilterDrawerOpen ? 'btn-primary' : 'btn-secondary'}`}
          >
            <SlidersHorizontal style={{ width: '14px', height: '14px' }} /> More Filters
          </button>
          <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
            <Plus style={{ width: '16px', height: '16px' }} /> New Task
          </button>
        </div>
      </div>

      {/* 4. Quick Filter Chips Strip */}
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
          ⭐ Pinned Tasks <span className="pill-count">{kpiStats.pinned}</span>
        </button>
        <button
          className={`filter-pill ${quickFilter === 'in-progress' ? 'active' : ''}`}
          onClick={() => setQuickFilter('in-progress')}
        >
          ⚡ In Progress <span className="pill-count">{kpiStats.inProgress}</span>
        </button>
        <button
          className={`filter-pill ${quickFilter === 'urgent' ? 'active' : ''}`}
          onClick={() => setQuickFilter('urgent')}
        >
          🔥 High & Urgent <span className="pill-count">{kpiStats.urgent}</span>
        </button>
        <button
          className={`filter-pill ${quickFilter === 'overdue' ? 'active' : ''}`}
          onClick={() => setQuickFilter('overdue')}
        >
          ⚠️ Overdue <span className="pill-count">{kpiStats.overdue}</span>
        </button>
        <button
          className={`filter-pill ${quickFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setQuickFilter('completed')}
        >
          ✅ Completed <span className="pill-count">{kpiStats.completed}</span>
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

      {/* 5. Search & Advanced Filter Drawer */}
      <div className="glass-panel" style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="search-container" style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search style={{ position: 'absolute', left: '10px', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by ID, title, department, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', color: 'var(--text-muted)' }}>
                  <X style={{ width: '14px', height: '14px' }} />
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => setFilterOverdueOnly(!filterOverdueOnly)}
            className={`btn ${filterOverdueOnly ? 'btn-danger' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem' }}
          >
            <AlertTriangle style={{ width: '14px', height: '14px' }} /> Overdue Only
          </button>
        </div>

        {/* Detailed Drawer */}
        {isFilterDrawerOpen && (
          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label className="form-label">Department</label>
              <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="select-dropdown">
                <option value="All">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>

            <div>
              <label className="form-label">Priority</label>
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="select-dropdown">
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="form-label">Workflow Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="select-dropdown">
                <option value="All">All Statuses</option>
                {statuses.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 6. Main Enterprise Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '36px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedTaskIds.length > 0 && selectedTaskIds.length === filtered.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th style={{ width: '36px', textAlign: 'center' }} title="Pin task to top">⭐</th>
              <th style={{ cursor: 'pointer', width: '90px' }} onClick={() => handleSort('id')}>
                Task ID <ArrowUpDown style={{ width: '11px', height: '11px', display: 'inline' }} />
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('title')}>
                Task & Subtasks <ArrowUpDown style={{ width: '11px', height: '11px', display: 'inline' }} />
              </th>
              <th style={{ cursor: 'pointer', minWidth: '130px' }} onClick={() => handleSort('status')}>
                Status (Quick Switch) <ArrowUpDown style={{ width: '11px', height: '11px', display: 'inline' }} />
              </th>
              <th style={{ cursor: 'pointer', minWidth: '100px' }} onClick={() => handleSort('priority')}>
                Priority (Cycle) <ArrowUpDown style={{ width: '11px', height: '11px', display: 'inline' }} />
              </th>
              <th>Assignee</th>
              <th style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => handleSort('progress')}>
                Progress
              </th>
              <th style={{ textAlign: 'center' }}>Daily Follow-ups</th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('dueDate')}>
                Due Date <ArrowUpDown style={{ width: '11px', height: '11px', display: 'inline' }} />
              </th>
              <th style={{ textAlign: 'center' }}>Hours</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="12" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers style={{ width: '36px', height: '36px', opacity: 0.3 }} />
                    <span style={{ fontWeight: 600 }}>No tasks match your selected filters.</span>
                    <button
                      onClick={() => { setQuickFilter('all'); setSearchQuery(''); setFilterDepartment('All'); setFilterPriority('All'); setFilterStatus('All'); setFilterOverdueOnly(false); }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.72rem', marginTop: '0.25rem' }}
                    >
                      Clear All Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(t => {
                const assignee = users.find(u => u.id === t.assigneeId);
                const isSelected = selectedTaskIds.includes(t.id);
                const isPinned = pinnedTaskIds.includes(t.id);
                const late = isOverdue(t.dueDate, t.status);
                const progressVal = Number(t.progress || 0);
                const followups = Array.isArray(t.followups) ? t.followups : [];

                // Subtask metrics
                const checklist = Array.isArray(t.checklist) ? t.checklist : [];
                const checklistTotal = checklist.length;
                const checklistDone = checklist.filter(c => c.completed).length;

                return (
                  <tr
                    key={t.id}
                    className={isPinned ? 'table-row-pinned' : ''}
                    style={{ background: isSelected ? 'rgba(37, 99, 235, 0.1)' : undefined }}
                  >
                    {/* Checkbox */}
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectTask(t.id)}
                      />
                    </td>

                    {/* Star Pin */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinTask(t.id);
                        }}
                        className={`star-pin-btn ${isPinned ? 'pinned' : ''}`}
                        title={isPinned ? 'Unpin task' : 'Pin task to top'}
                      >
                        <Star
                          style={{
                            width: '15px',
                            height: '15px',
                            fill: isPinned ? '#f59e0b' : 'none',
                            color: isPinned ? '#f59e0b' : 'var(--text-muted)'
                          }}
                        />
                      </button>
                    </td>

                    {/* Task ID */}
                    <td style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-light)' }}>
                      <button
                        onClick={() => setSelectedTaskId(t.id)}
                        style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'inherit', fontWeight: 'inherit', fontFamily: 'inherit' }}
                      >
                        {t.id}
                      </button>
                    </td>

                    {/* Title, Category & Subtasks Progress */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <button
                          onClick={() => setSelectedTaskId(t.id)}
                          style={{
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            textAlign: 'left',
                            cursor: 'pointer',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            fontSize: '0.85rem'
                          }}
                        >
                          {t.title}
                        </button>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {t.department} • {t.category}
                          </span>
                          
                          {/* Checklist / Subtask Progress Pill */}
                          {checklistTotal > 0 && (
                            <span
                              className={`checklist-subtask-badge ${checklistDone === checklistTotal ? 'all-done' : ''}`}
                              title={`${checklistDone} of ${checklistTotal} subtasks completed`}
                            >
                              <CheckSquare style={{ width: '11px', height: '11px' }} />
                              <span>{checklistDone}/{checklistTotal}</span>
                            </span>
                          )}

                          {/* Not Started Blocker Badge */}
                          {progressVal === 0 && t.reasonNotStarted && (
                            <span
                              className="badge"
                              style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#ca8a04', fontSize: '0.65rem' }}
                              title={`Reason not started: ${t.reasonNotStarted}`}
                            >
                              ⚠️ Not Started: {t.delayCategory || t.reasonNotStarted.slice(0, 24)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Interactive In-line Status Switcher */}
                    <td>
                      <select
                        value={t.status}
                        onChange={(e) => changeTaskStatus(t.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className={`inline-badge-select ${getStatusClass(t.status)}`}
                        title="Click to switch status immediately"
                      >
                        {statuses.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Interactive In-line Priority Switcher */}
                    <td>
                      <button
                        type="button"
                        onClick={(e) => handleCyclePriority(e, t)}
                        className={`priority-chip-toggle ${getPriorityClass(t.priority)}`}
                        title="Click to cycle priority: Low → Normal → High → Urgent → Critical"
                      >
                        {t.priority === 'Critical' && <Flame style={{ width: '12px', height: '12px' }} />}
                        {t.priority === 'Urgent' && <AlertTriangle style={{ width: '12px', height: '12px' }} />}
                        <span>{t.priority}</span>
                      </button>
                    </td>

                    {/* Assignee */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {assignee?.avatar ? (
                          <img src={assignee.avatar} alt={assignee.name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--brand-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.65rem' }}>
                            {(assignee?.name || 'U').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block' }}>{assignee?.name || 'Unassigned'}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{assignee?.role || ''}</span>
                        </div>
                      </div>
                    </td>

                    {/* Progress Column */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '90px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 800 }}>
                          <span style={{ color: getProgressColor(progressVal) }}>{progressVal}%</span>
                        </div>
                        <div style={{ height: '5px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(100, Math.max(0, progressVal))}%`,
                              background: getProgressColor(progressVal),
                              borderRadius: '999px'
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Follow-ups Column */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                        <span className="badge badge-brand" style={{ fontSize: '0.68rem' }}>
                          💬 {followups.length}
                        </span>
                        <button
                          onClick={() => setQuickFollowupTaskId(t.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem', fontWeight: 700 }}
                          title="Log daily follow-up"
                        >
                          + Log
                        </button>
                      </div>
                    </td>

                    {/* Due Date & Expected Date */}
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ color: late ? 'var(--color-danger)' : 'var(--text-secondary)' }}>
                        {formatDate(t.dueDate)}
                      </div>
                      {t.expectedDate && (
                        <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '2px' }} title="Expected Date of Completion">
                          🎯 {formatDate(t.expectedDate)}
                        </div>
                      )}
                    </td>

                    {/* Hours (Actual vs Estimated) */}
                    <td style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {t.actualHours || 0} / {t.estimatedHours || 0}h
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                        <button onClick={() => startTimer(t.id)} className="btn-icon" title="Start Timer">
                          <Play style={{ width: '14px', height: '14px' }} />
                        </button>
                        <button onClick={() => setSelectedTaskId(t.id)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>
                          View
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

      {/* 7. Bulk Actions Floating Bar */}
      <BulkActionsBar selectedTaskIds={selectedTaskIds} onClearSelection={() => setSelectedTaskIds([])} />

      {/* 8. Quick Follow-up Modal */}
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
