import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import {
  LayoutDashboard,
  ListTodo,
  Sparkles,
  CheckCircle2,
  MoreHorizontal,
  Plus,
  Kanban,
  Calendar,
  GanttChartSquare,
  Users,
  CalendarDays,
  FileBarChart,
  Settings,
  ShieldCheck,
  User,
  LogOut,
  X,
  Monitor,
  Smartphone,
  Layers,
  Zap,
  Briefcase
} from 'lucide-react';

export default function MobileBottomNav() {
  const {
    activeView,
    setActiveView,
    activeUser,
    tasks,
    leaves,
    setIsCreateModalOpen,
    setViewingUserProfile,
    logout,
    deviceMode,
    toggleDeviceMode
  } = useTaskContext();

  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  // Compute live badges
  const myTasksCount = (tasks || []).filter(
    t => t.assigneeId === activeUser?.id && t.status !== 'Completed' && t.status !== 'Approved'
  ).length;

  const pendingApprovalsCount = (tasks || []).filter(t => t.status === 'Review').length;
  const pendingLeavesCount = (leaves || []).filter(l => l.status === 'Pending').length;

  const isHomeActive = ['dashboard', 'managerPanel', 'eaPanel', 'employeePanel'].includes(activeView);
  const isTasksActive = ['mytasks', 'alltasks'].includes(activeView);
  const isChatActive = activeView === 'chat';
  const isActionsActive = ['approvals', 'eaPanel'].includes(activeView);

  const handleNavClick = (view) => {
    setActiveView(view);
    setIsMoreSheetOpen(false);
  };

  return (
    <>
      {/* Floating Action Button for Rapid Task Creation */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="mobile-fab"
        title="Create New Task"
        aria-label="Create New Task"
      >
        <Plus style={{ width: '24px', height: '24px', color: '#ffffff' }} />
      </button>

      {/* Main Glassmorphic Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {/* Tab 1: Home / Dashboard */}
        <button
          onClick={() => handleNavClick('dashboard')}
          className={`mobile-nav-item ${isHomeActive ? 'active' : ''}`}
          type="button"
        >
          <div className="mobile-nav-icon-wrapper">
            <LayoutDashboard className="mobile-nav-icon" />
          </div>
          <span className="mobile-nav-label">Home</span>
          {isHomeActive && <span className="mobile-nav-active-dot" />}
        </button>

        {/* Tab 2: Tasks */}
        <button
          onClick={() => handleNavClick('mytasks')}
          className={`mobile-nav-item ${isTasksActive ? 'active' : ''}`}
          type="button"
        >
          <div className="mobile-nav-icon-wrapper">
            <ListTodo className="mobile-nav-icon" />
            {myTasksCount > 0 && (
              <span className="mobile-nav-badge">{myTasksCount}</span>
            )}
          </div>
          <span className="mobile-nav-label">Tasks</span>
          {isTasksActive && <span className="mobile-nav-active-dot" />}
        </button>

        {/* Tab 3: AI Copilot & Chat */}
        <button
          onClick={() => handleNavClick('chat')}
          className={`mobile-nav-item ${isChatActive ? 'active' : ''}`}
          type="button"
        >
          <div className="mobile-nav-icon-wrapper" style={{ position: 'relative' }}>
            <div className="mobile-nav-ai-glow" />
            <Sparkles className="mobile-nav-icon" style={{ color: isChatActive ? 'var(--brand-primary)' : 'inherit' }} />
          </div>
          <span className="mobile-nav-label" style={{ fontWeight: 800 }}>PulseBot</span>
          {isChatActive && <span className="mobile-nav-active-dot" />}
        </button>

        {/* Tab 4: Actions & Approvals */}
        <button
          onClick={() => handleNavClick('approvals')}
          className={`mobile-nav-item ${isActionsActive ? 'active' : ''}`}
          type="button"
        >
          <div className="mobile-nav-icon-wrapper">
            <CheckCircle2 className="mobile-nav-icon" />
            {pendingApprovalsCount > 0 && (
              <span className="mobile-nav-badge badge-warning">{pendingApprovalsCount}</span>
            )}
          </div>
          <span className="mobile-nav-label">Actions</span>
          {isActionsActive && <span className="mobile-nav-active-dot" />}
        </button>

        {/* Tab 5: More Menu Sheet */}
        <button
          onClick={() => setIsMoreSheetOpen(true)}
          className={`mobile-nav-item ${isMoreSheetOpen ? 'active' : ''}`}
          type="button"
        >
          <div className="mobile-nav-icon-wrapper">
            <MoreHorizontal className="mobile-nav-icon" />
            {pendingLeavesCount > 0 && (
              <span className="mobile-nav-badge" style={{ background: 'var(--color-purple)' }}>{pendingLeavesCount}</span>
            )}
          </div>
          <span className="mobile-nav-label">More</span>
          {isMoreSheetOpen && <span className="mobile-nav-active-dot" />}
        </button>
      </nav>

      {/* "More" Slide-Up Bottom Sheet */}
      {isMoreSheetOpen && (
        <div className="mobile-sheet-overlay" onClick={() => setIsMoreSheetOpen(false)}>
          <div className="mobile-sheet-container" onClick={(e) => e.stopPropagation()}>
            {/* Sheet Handle */}
            <div className="mobile-sheet-drag-handle" />

            {/* Sheet Header */}
            <div className="mobile-sheet-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src={activeUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={activeUser?.name}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-primary)' }}
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{activeUser?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeUser?.role} • {activeUser?.department}</div>
                </div>
              </div>

              <button
                onClick={() => setIsMoreSheetOpen(false)}
                className="btn-icon"
                style={{ padding: '6px', borderRadius: '50%', background: 'var(--bg-input)' }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {/* Quick Switch View Mode Banner */}
            <div
              className="mobile-mode-switcher-banner"
              onClick={() => {
                toggleDeviceMode();
                setIsMoreSheetOpen(false);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="mobile-mode-icon-box">
                  {deviceMode === 'mobile' ? <Monitor style={{ width: '18px', height: '18px' }} /> : <Smartphone style={{ width: '18px', height: '18px' }} />}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                    {deviceMode === 'mobile' ? 'Switch to Desktop / Web App' : 'Switch to Mobile View'}
                  </div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>
                    {deviceMode === 'mobile' ? 'Expand to wide dashboard with full sidebar' : 'Compact thumb-friendly layout'}
                  </div>
                </div>
              </div>
              <span className="mode-pill-badge">
                {deviceMode === 'mobile' ? 'Desktop' : 'Mobile'}
              </span>
            </div>

            {/* Sheet Grid Items */}
            <div className="mobile-sheet-grid">
              <button onClick={() => handleNavClick('kanban')} className="mobile-sheet-grid-item">
                <div className="grid-icon-circle" style={{ background: 'rgba(79, 70, 229, 0.12)', color: 'var(--brand-primary)' }}>
                  <Kanban style={{ width: '20px', height: '20px' }} />
                </div>
                <span>Kanban Board</span>
              </button>

              <button onClick={() => handleNavClick('calendar')} className="mobile-sheet-grid-item">
                <div className="grid-icon-circle" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
                  <Calendar style={{ width: '20px', height: '20px' }} />
                </div>
                <span>Calendar</span>
              </button>

              <button onClick={() => handleNavClick('timeline')} className="mobile-sheet-grid-item">
                <div className="grid-icon-circle" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                  <GanttChartSquare style={{ width: '20px', height: '20px' }} />
                </div>
                <span>Timeline Gantt</span>
              </button>

              <button onClick={() => handleNavClick('leaves')} className="mobile-sheet-grid-item">
                <div className="grid-icon-circle" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                  <CalendarDays style={{ width: '20px', height: '20px' }} />
                </div>
                <span>Leaves</span>
              </button>

              <button onClick={() => handleNavClick('teams')} className="mobile-sheet-grid-item">
                <div className="grid-icon-circle" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
                  <Users style={{ width: '20px', height: '20px' }} />
                </div>
                <span>Org Directory</span>
              </button>

              <button onClick={() => handleNavClick('reports')} className="mobile-sheet-grid-item">
                <div className="grid-icon-circle" style={{ background: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e' }}>
                  <FileBarChart style={{ width: '20px', height: '20px' }} />
                </div>
                <span>Reports & KPIs</span>
              </button>

              <button onClick={() => handleNavClick('automations')} className="mobile-sheet-grid-item">
                <div className="grid-icon-circle" style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#eab308' }}>
                  <Zap style={{ width: '20px', height: '20px' }} />
                </div>
                <span>Automations</span>
              </button>

              <button onClick={() => handleNavClick('settings')} className="mobile-sheet-grid-item">
                <div className="grid-icon-circle" style={{ background: 'rgba(100, 116, 139, 0.12)', color: '#64748b' }}>
                  <Settings style={{ width: '20px', height: '20px' }} />
                </div>
                <span>Settings</span>
              </button>
            </div>

            {/* Bottom Actions: Profile & Logout */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={() => {
                  setViewingUserProfile(activeUser?.id);
                  setIsMoreSheetOpen(false);
                }}
                className="btn btn-secondary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
              >
                <User style={{ width: '16px', height: '16px' }} />
                <span>My Profile</span>
              </button>

              <button
                onClick={logout}
                className="btn btn-secondary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', color: '#f43f5e' }}
              >
                <LogOut style={{ width: '16px', height: '16px' }} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
