import React, { useState, useMemo } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { formatDate, isOverdue, isDueToday } from '../../utils/dateUtils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Search,
  Sparkles,
  List,
  CalendarDays,
  User,
  ArrowRight,
  Zap
} from 'lucide-react';

export default function TaskCalendarView() {
  const { tasks, users, setSelectedTaskId, setIsCreateModalOpen } = useTaskContext();

  // Default to September 2026 where project demo dates exist, or current date
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1));
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'agenda'
  const [selectedDateString, setSelectedDateString] = useState('2026-09-23');
  const [calendarSearch, setCalendarSearch] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleJumpToToday = () => {
    // Jump to demo date month or real current date
    setCurrentDate(new Date(2026, 8, 1));
    setSelectedDateString('2026-09-23');
  };

  // Month search and filter
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const monthTasks = useMemo(() => {
    return tasks.filter(t => {
      if (!t.dueDate) return false;
      const matchesMonth = t.dueDate.startsWith(monthPrefix);
      const matchesSearch =
        !calendarSearch ||
        t.title.toLowerCase().includes(calendarSearch.toLowerCase()) ||
        t.id.toLowerCase().includes(calendarSearch.toLowerCase());
      return matchesMonth && matchesSearch;
    });
  }, [tasks, monthPrefix, calendarSearch]);

  // Compute month KPI metrics
  const monthStats = useMemo(() => {
    const total = monthTasks.length;
    const completed = monthTasks.filter(t => t.status === 'Completed' || t.status === 'Approved').length;
    const overdue = monthTasks.filter(t => isOverdue(t.dueDate, t.status)).length;
    const todayCount = monthTasks.filter(t => isDueToday(t.dueDate) || t.dueDate.slice(0, 10) === '2026-09-23').length;
    return { total, completed, overdue, todayCount };
  }, [monthTasks]);

  // Build 7-column calendar grid
  const calendarGrid = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarGrid.push({ dayNumber: null, isCurrentMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = monthTasks.filter(t => t.dueDate && t.dueDate.slice(0, 10) === formattedDate);
    calendarGrid.push({
      dayNumber: day,
      dateString: formattedDate,
      isCurrentMonth: true,
      tasks: dayTasks
    });
  }

  // Selected day tasks
  const selectedDayTasks = useMemo(() => {
    return tasks.filter(t => t.dueDate && t.dueDate.slice(0, 10) === selectedDateString);
  }, [tasks, selectedDateString]);

  // Chronological agenda grouped by date for list view
  const agendaGrouped = useMemo(() => {
    const grouped = {};
    monthTasks.forEach(t => {
      const dateKey = t.dueDate.slice(0, 10);
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(t);
    });
    return Object.keys(grouped).sort().map(d => ({
      date: d,
      tasks: grouped[d]
    }));
  }, [monthTasks]);

  const getPriorityChipClass = (priority) => {
    switch (priority) {
      case 'Critical': return 'badge-rose';
      case 'Urgent': return 'badge-amber';
      case 'High': return 'badge-amber';
      default: return 'badge-brand';
    }
  };

  const getPriorityDotColor = (priority, status) => {
    if (status === 'Completed' || status === 'Approved') return '#10b981';
    switch (priority) {
      case 'Critical': return '#ef4444';
      case 'Urgent': return '#f59e0b';
      case 'High': return '#f97316';
      default: return '#2563eb';
    }
  };

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Header Bar with Month Title, Controls & Switchers */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <CalendarIcon style={{ width: '17px', height: '17px' }} />
            </div>
            <span>Interactive Task Calendar</span>
            <span className="badge badge-brand">{monthTasks.length} Deadlines</span>
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Schedule timeline, daily deadline distribution, and deliverables agenda.
          </p>
        </div>

        {/* View Mode Toggle: Grid vs Agenda List */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div className="calendar-view-toggle">
            <button
              onClick={() => setViewMode('month')}
              className={`calendar-toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
              title="Month Grid View"
            >
              <CalendarDays style={{ width: '14px', height: '14px' }} />
              <span>Month</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`calendar-toggle-btn ${viewMode === 'agenda' ? 'active' : ''}`}
              title="Chronological Agenda List"
            >
              <List style={{ width: '14px', height: '14px' }} />
              <span>Agenda</span>
            </button>
          </div>

          <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary" style={{ height: '36px' }}>
            <Plus style={{ width: '16px', height: '16px' }} /> Add Task
          </button>
        </div>
      </div>

      {/* 2. Top Monthly KPI Summary Cards */}
      <div className="kpi-metrics-grid">
        <div className="kpi-metric-card" style={{ cursor: 'default' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Month Deadlines
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '2px' }}>
              {monthStats.total}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Scheduled in {monthNames[month]}
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
            <Layers style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        <div className="kpi-metric-card" style={{ cursor: 'default' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Due Today
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0284c7', marginTop: '2px' }}>
              {monthStats.todayCount}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Immediate delivery required
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }}>
            <Clock style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        <div className="kpi-metric-card" style={{ cursor: 'default' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Overdue
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ef4444', marginTop: '2px' }}>
              {monthStats.overdue}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Exceeded target date
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <AlertTriangle style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        <div className="kpi-metric-card" style={{ cursor: 'default' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Delivered
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#10b981', marginTop: '2px' }}>
              {monthStats.completed}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Finished this month
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <CheckCircle2 style={{ width: '22px', height: '22px' }} />
          </div>
        </div>
      </div>

      {/* 3. Controls Bar: Month Selector & Quick Search */}
      <div className="calendar-controls-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Navigation Pill Box */}
          <div className="calendar-nav-box">
            <button onClick={handlePrevMonth} className="btn-icon" title="Previous Month">
              <ChevronLeft style={{ width: '16px', height: '16px', color: 'var(--text-primary)' }} />
            </button>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, minWidth: '140px', textAlign: 'center', color: 'var(--text-primary)' }}>
              {monthNames[month]} {year}
            </span>
            <button onClick={handleNextMonth} className="btn-icon" title="Next Month">
              <ChevronRight style={{ width: '16px', height: '16px', color: 'var(--text-primary)' }} />
            </button>
          </div>

          <button
            onClick={handleJumpToToday}
            className="btn btn-secondary"
            style={{ height: '36px', padding: '0 12px', fontSize: '0.75rem' }}
          >
            Today
          </button>
        </div>

        {/* Search Input Filter */}
        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search month deadlines..."
            value={calendarSearch}
            onChange={(e) => setCalendarSearch(e.target.value)}
            className="search-input"
            style={{ paddingLeft: '32px', height: '36px', fontSize: '0.78rem' }}
          />
        </div>
      </div>

      {/* ==========================================================================
          4. MAIN VIEW CONTAINER (MONTH GRID vs AGENDA LIST)
          ========================================================================== */}
      {viewMode === 'month' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Month Calendar Panel */}
          <div className="calendar-card-panel">
            {/* 7-Day Header Grid */}
            <div className="calendar-weekdays-grid">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* 7-Column Days Grid */}
            <div className="calendar-days-grid">
              {calendarGrid.map((cell, idx) => {
                if (!cell.isCurrentMonth) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="calendar-day-cell empty"
                    />
                  );
                }

                const isToday = (cell.dayNumber === 23 && month === 8 && year === 2026) ||
                  (new Date().getDate() === cell.dayNumber && new Date().getMonth() === month && new Date().getFullYear() === year);
                const isSelected = cell.dateString === selectedDateString;
                const hasTasks = cell.tasks.length > 0;

                return (
                  <div
                    key={cell.dateString}
                    onClick={() => setSelectedDateString(cell.dateString)}
                    className={`calendar-day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                    title={`${cell.dateString}: ${cell.tasks.length} task(s)`}
                  >
                    {/* Day Top: Date Number & Count Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span className="calendar-day-num">
                        {cell.dayNumber}
                      </span>

                      {hasTasks && (
                        <span
                          className="header-label-desktop"
                          style={{
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '99px',
                            background: isToday ? '#dbeafe' : '#f1f5f9',
                            color: isToday ? '#1d4ed8' : 'var(--text-muted)'
                          }}
                        >
                          {cell.tasks.length}
                        </span>
                      )}
                    </div>

                    {/* Desktop Task Chips Preview (Visible on wide screens) */}
                    <div className="calendar-task-chips-wrap">
                      {cell.tasks.slice(0, 2).map(t => (
                        <button
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTaskId(t.id);
                          }}
                          className={`calendar-task-chip ${getPriorityChipClass(t.priority)}`}
                          title={`${t.id}: ${t.title}`}
                        >
                          {t.title}
                        </button>
                      ))}
                      {cell.tasks.length > 2 && (
                        <span style={{ fontSize: '0.62rem', color: 'var(--brand-primary)', fontWeight: 800, paddingLeft: '4px' }}>
                          +{cell.tasks.length - 2} more
                        </span>
                      )}
                    </div>

                    {/* Mobile Task Dots Indicator (Clean, thumb-friendly 5px dots on mobile) */}
                    {hasTasks && (
                      <div className="calendar-dots-indicator">
                        {cell.tasks.slice(0, 3).map((t, dotIdx) => (
                          <span
                            key={dotIdx}
                            className="calendar-dot"
                            style={{ background: getPriorityDotColor(t.priority, t.status) }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Agenda Details Drawer */}
          <div className="calendar-card-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <CalendarDays style={{ width: '18px', height: '18px', color: 'var(--brand-primary)' }} />
                  <span>Schedule for {formatDate(selectedDateString)}</span>
                  <span className="badge badge-brand">{selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'Task' : 'Tasks'}</span>
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Tap any task to view full details or log progress.
                </p>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '6px 12px' }}
              >
                <Plus style={{ width: '14px', height: '14px' }} /> Add to this date
              </button>
            </div>

            {selectedDayTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <CalendarIcon style={{ width: '38px', height: '38px', opacity: 0.3, margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>No tasks scheduled for this day</div>
                <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>Your schedule is clear! Enjoy the breathing room or plan ahead.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {selectedDayTasks.map(t => {
                  const assignee = users.find(u => u.id === t.assigneeId);
                  const isLate = isOverdue(t.dueDate, t.status);
                  const isDone = t.status === 'Completed' || t.status === 'Approved';

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTaskId(t.id)}
                      className="calendar-agenda-card"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: isDone ? 'rgba(16, 185, 129, 0.1)' : isLate ? 'rgba(239, 68, 68, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                            color: isDone ? '#10b981' : isLate ? '#ef4444' : '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            flexShrink: 0
                          }}
                        >
                          {t.id.slice(-3)}
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {t.title}
                            </span>
                            <span className={`badge ${t.priority === 'Critical' ? 'badge-rose' : t.priority === 'Urgent' ? 'badge-amber' : 'badge-brand'}`} style={{ padding: '1px 6px', fontSize: '0.62rem' }}>
                              {t.priority}
                            </span>
                            <span className={`badge ${isDone ? 'badge-emerald' : isLate ? 'badge-rose' : 'badge-cyan'}`} style={{ padding: '1px 6px', fontSize: '0.62rem' }}>
                              {t.status}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '3px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User style={{ width: '12px', height: '12px' }} />
                              {assignee?.name || 'Unassigned'}
                            </span>
                            {t.category && <span>• {t.category}</span>}
                            <span>• Due: {t.dueDate?.slice(11, 16) || 'End of day'}</span>
                          </div>
                        </div>
                      </div>

                      <ArrowRight style={{ width: '16px', height: '16px', color: 'var(--text-muted)', flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ==========================================================================
            CHRONOLOGICAL AGENDA / DEADLINE LIST VIEW
            ========================================================================== */
        <div className="calendar-card-panel" style={{ padding: '1.25rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
              Chronological Month Deadlines ({monthNames[month]} {year})
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Sequential agenda feed of all deliverables scheduled across this month.
            </p>
          </div>

          {agendaGrouped.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Layers style={{ width: '40px', height: '40px', opacity: 0.3, margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>No deliverables found in {monthNames[month]}</div>
              <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Use the "+ Add Task" button to schedule deadlines.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {agendaGrouped.map(group => (
                <div key={group.date} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {/* Date Badge Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563eb', background: 'rgba(37, 99, 235, 0.08)', padding: '3px 10px', borderRadius: '8px' }}>
                      📅 {formatDate(group.date)}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {group.tasks.length} {group.tasks.length === 1 ? 'task due' : 'tasks due'}
                    </span>
                  </div>

                  {/* Task Cards for that Date */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '0.5rem', borderLeft: '2px solid rgba(37, 99, 235, 0.2)' }}>
                    {group.tasks.map(t => {
                      const assignee = users.find(u => u.id === t.assigneeId);
                      const isLate = isOverdue(t.dueDate, t.status);
                      const isDone = t.status === 'Completed' || t.status === 'Approved';

                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTaskId(t.id)}
                          className="calendar-agenda-card"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.75rem', color: 'var(--brand-primary)' }}>
                                  {t.id}
                                </span>
                                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                  {t.title}
                                </span>
                                <span className={`badge ${getPriorityChipClass(t.priority)}`} style={{ padding: '1px 6px', fontSize: '0.62rem' }}>
                                  {t.priority}
                                </span>
                                <span className={`badge ${isDone ? 'badge-emerald' : isLate ? 'badge-rose' : 'badge-cyan'}`} style={{ padding: '1px 6px', fontSize: '0.62rem' }}>
                                  {t.status}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '3px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <User style={{ width: '12px', height: '12px' }} />
                                  {assignee?.name || 'Unassigned'}
                                </span>
                                {t.department && <span>• {t.department}</span>}
                                {t.category && <span>• {t.category}</span>}
                              </div>
                            </div>
                          </div>

                          <ArrowRight style={{ width: '16px', height: '16px', color: 'var(--text-muted)', flexShrink: 0 }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
