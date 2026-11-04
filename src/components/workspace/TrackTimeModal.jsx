import React, { useState, useEffect, useRef } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  X,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';

export default function TrackTimeModal({ isOpen, onClose }) {
  const { tasks, activeUser, createTimeLog } = useTaskContext();

  const [activeTab, setActiveTab] = useState('stopwatch'); // 'stopwatch' | 'manual'

  // Stopwatch state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const intervalRef = useRef(null);

  // Form fields
  const [taskId, setTaskId] = useState('');
  const [notes, setNotes] = useState('');
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [manualHours, setManualHours] = useState('1');
  const [manualMinutes, setManualMinutes] = useState('0');
  const [isBillable, setIsBillable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Run stopwatch ticker
  useEffect(() => {
    if (isTimerRunning) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isTimerRunning]);

  // Set default task if none selected
  useEffect(() => {
    if (isOpen && !taskId && tasks && tasks.length > 0) {
      // Pick first active task assigned to activeUser, or first task
      const userTask = tasks.find(t => t.assigneeId === activeUser?.id && t.status !== 'Completed');
      if (userTask) setTaskId(userTask.id);
      else setTaskId(tasks[0].id);
    }
  }, [isOpen, taskId, tasks, activeUser]);

  if (!isOpen) return null;

  const formatTimer = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartStopwatch = () => setIsTimerRunning(true);
  const handlePauseStopwatch = () => setIsTimerRunning(false);
  const handleResetStopwatch = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const handleSaveTimeLog = async (e) => {
    if (e) e.preventDefault();
    if (!taskId) return;

    let durationMinutes = 0;
    if (activeTab === 'stopwatch') {
      durationMinutes = Math.max(1, Math.round(timerSeconds / 60));
    } else {
      const h = Number(manualHours) || 0;
      const m = Number(manualMinutes) || 0;
      durationMinutes = Math.max(1, (h * 60) + m);
    }

    const calculatedHours = Number((durationMinutes / 60).toFixed(2));
    const selectedTask = tasks.find(t => t.id === taskId);

    setIsSubmitting(true);
    try {
      await createTimeLog({
        userId: activeUser?.id || 'usr-1',
        userName: activeUser?.name || 'User',
        taskId,
        taskTitle: selectedTask ? selectedTask.title : 'Task',
        durationMinutes,
        hours: calculatedHours,
        date: logDate,
        notes: notes.trim() || 'Work session logged.',
        isBillable
      });

      // Reset
      setIsTimerRunning(false);
      setTimerSeconds(0);
      setNotes('');
      onClose();
    } catch (err) {
      console.error('Failed to log time:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="workspace-modal-overlay" onClick={onClose}>
      <div className="workspace-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="workspace-modal-header" style={{ borderBottomColor: 'rgba(234, 88, 12, 0.2)' }}>
          <div className="workspace-modal-header-left">
            <div
              className="workspace-modal-icon-badge"
              style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: '#fff' }}
            >
              <Clock style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h3 className="workspace-modal-title">Track Time</h3>
              <p className="workspace-modal-subtitle">Log work hours or track active time with stopwatch</p>
            </div>
          </div>
          <button onClick={onClose} className="workspace-modal-close-btn" type="button">
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', padding: '12px 20px 0', borderBottom: '1px solid var(--border-color)', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('stopwatch')}
            style={{
              padding: '8px 16px',
              borderBottom: activeTab === 'stopwatch' ? '2px solid #ea580c' : '2px solid transparent',
              color: activeTab === 'stopwatch' ? '#ea580c' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer'
            }}
          >
            <Zap style={{ width: '16px', height: '16px' }} />
            Live Stopwatch
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            style={{
              padding: '8px 16px',
              borderBottom: activeTab === 'manual' ? '2px solid #ea580c' : '2px solid transparent',
              color: activeTab === 'manual' ? '#ea580c' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer'
            }}
          >
            <Calendar style={{ width: '16px', height: '16px' }} />
            Manual Entry
          </button>
        </div>

        {/* Body */}
        <div className="workspace-modal-body">
          {/* Target Task Select */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>
              Select Task to Log Against *
            </label>
            <select
              className="form-select"
              required
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              style={{ padding: '10px', fontSize: '0.92rem' }}
            >
              {(tasks || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id}: {t.title} [{t.priority}] (Actual: {t.actualHours || 0}h / Est: {t.estimatedHours || 0}h)
                </option>
              ))}
            </select>
          </div>

          {activeTab === 'stopwatch' ? (
            /* Live Stopwatch View */
            <div style={{ textAlign: 'center', padding: '1.2rem 0' }}>
              <div
                style={{
                  fontFamily: 'monospace, monospace',
                  fontSize: '2.8rem',
                  fontWeight: 900,
                  letterSpacing: '2px',
                  color: isTimerRunning ? '#ea580c' : 'var(--text-primary)',
                  background: isTimerRunning ? 'rgba(234, 88, 12, 0.08)' : 'var(--bg-input)',
                  borderRadius: '16px',
                  padding: '1.2rem 1rem',
                  border: isTimerRunning ? '2px solid #ea580c' : '1px solid var(--border-color)',
                  boxShadow: isTimerRunning ? '0 0 24px rgba(234, 88, 12, 0.25)' : 'none',
                  transition: 'all 0.2s ease',
                  marginBottom: '1.2rem'
                }}
              >
                {formatTimer(timerSeconds)}
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '1.2rem' }}>
                {!isTimerRunning ? (
                  <button
                    type="button"
                    onClick={handleStartStopwatch}
                    className="btn btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      borderColor: '#10b981',
                      padding: '10px 24px',
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Play style={{ width: '18px', height: '18px' }} />
                    {timerSeconds > 0 ? 'Resume Timer' : 'Start Timer'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePauseStopwatch}
                    className="btn"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 24px',
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Pause style={{ width: '18px', height: '18px' }} />
                    Pause Timer
                  </button>
                )}

                {timerSeconds > 0 && (
                  <button
                    type="button"
                    onClick={handleResetStopwatch}
                    className="btn btn-secondary"
                    style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Reset Stopwatch"
                  >
                    <RotateCcw style={{ width: '16px', height: '16px' }} />
                    Reset
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Manual Entry View */
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="1"
                    className="form-input"
                    value={manualHours}
                    onChange={(e) => setManualHours(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="5"
                    className="form-input"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Description of Work */}
          <div className="form-group">
            <label className="form-label">Description of Work / Log Notes</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail what technical deliverables, meetings, or bug fixes were completed..."
            />
          </div>

          {/* Billable Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
            <input
              type="checkbox"
              checked={isBillable}
              onChange={(e) => setIsBillable(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#ea580c' }}
            />
            <span>Billable Client Work</span>
          </label>

          {/* Footer Save */}
          <div className="workspace-modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveTimeLog}
              disabled={isSubmitting || !taskId || (activeTab === 'stopwatch' && timerSeconds < 1 && !notes.trim())}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                borderColor: '#ea580c',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle style={{ width: '16px', height: '16px' }} />
              {isSubmitting ? 'Logging Time...' : 'Record Time Log'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
