import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';

export default function TaskCalendarView() {
  const { tasks, setSelectedTaskId, setIsCreateModalOpen } = useTaskContext();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const calendarGrid = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarGrid.push({ dayNumber: null, isCurrentMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = tasks.filter(t => t.dueDate && t.dueDate.slice(0, 10) === formattedDate);
    calendarGrid.push({ dayNumber: day, dateString: formattedDate, isCurrentMonth: true, tasks: dayTasks });
  }

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarIcon style={{ width: '20px', height: '20px', color: 'var(--brand-light)' }} />
            <span>Interactive Task Calendar</span>
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>View deadline distribution across month schedule.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem' }}>
            <button onClick={handlePrevMonth} className="btn-icon"><ChevronLeft style={{ width: '16px', height: '16px' }} /></button>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, minWidth: '120px', textAlign: 'center' }}>
              {monthNames[month]} {year}
            </span>
            <button onClick={handleNextMonth} className="btn-icon"><ChevronRight style={{ width: '16px', height: '16px' }} /></button>
          </div>

          <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
            <Plus style={{ width: '16px', height: '16px' }} /> Add Task
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="glass-panel" style={{ padding: '1rem' }}>
        <div className="grid grid-cols-7" style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>

        <div className="grid grid-cols-7" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
          {calendarGrid.map((cell, idx) => {
            if (!cell.isCurrentMonth) {
              return <div key={`empty-${idx}`} style={{ height: '110px', background: 'var(--bg-input)', opacity: 0.3, borderRadius: 'var(--radius-md)' }}></div>;
            }
            const isToday = cell.dayNumber === 23 && month === 8 && year === 2026;
            return (
              <div
                key={cell.dateString}
                className="glass-card"
                style={{
                  height: '110px',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isToday ? '1px solid var(--brand-primary)' : '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, background: isToday ? 'var(--brand-primary)' : 'transparent', color: isToday ? '#fff' : 'var(--text-primary)', padding: '2px 6px', borderRadius: '50%' }}>
                    {cell.dayNumber}
                  </span>
                  {cell.tasks.length > 0 && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{cell.tasks.length} tasks</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto', maxHeight: '65px' }}>
                  {cell.tasks.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTaskId(t.id)}
                      className={`badge ${t.priority === 'Critical' ? 'badge-rose' : 'badge-brand'}`}
                      style={{ fontSize: '0.65rem', textTransform: 'none', justifyContent: 'flex-start', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {t.id}: {t.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
