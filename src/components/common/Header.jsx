import React, { useState, useEffect } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import CommandPalette from './CommandPalette';
import {
  Menu,
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  Clock,
  Pause,
  Square,
  UserPlus,
  Database,
  X,
  ListTodo,
  Sparkles,
  Palette,
  ChevronRight,
  MessageSquare,
  CheckCircle2,
  Kanban,
  Calendar,
  Layers,
  Smartphone,
  Monitor
} from 'lucide-react';

export default function Header({ onOpenNotifications }) {
  const {
    tasks,
    users,
    activeUser,
    activeUserId,
    setActiveUserId,
    panelMode,
    setPanelMode,
    activeView,
    setActiveView,
    setIsRegisterModalOpen,
    theme,
    setTheme,
    accentTheme,
    setAccentTheme,
    setIsCreateModalOpen,
    setSelectedTaskId,
    activeTimer,
    pauseTimer,
    stopTimer,
    notifications,
    setViewingUserProfile,
    isBackendConnected,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    deviceMode,
    setDeviceMode,
    toggleDeviceMode,
    isMobileView
  } = useTaskContext();

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTimerSeconds = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timerTask = activeTimer ? tasks.find(t => t.id === activeTimer.taskId) : null;

  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Executive Overview';
      case 'managerPanel': return 'Manager Workspace';
      case 'eaPanel': return 'EA Operations & Follow-Ups';
      case 'employeePanel': return 'Personal Workstation';
      case 'mytasks': return 'My Assigned Tasks';
      case 'alltasks': return 'All Tasks Directory';
      case 'kanban': return 'Workflow Kanban Board';
      case 'calendar': return 'Monthly Schedule Calendar';
      case 'timeline': return 'Gantt Chart & Deadlines';
      case 'approvals': return 'Approvals Queue';
      case 'teams': return 'Org Directory & KPIs';
      case 'leaves': return 'Leave Management';
      case 'chat': return 'PulseBot AI & Messenger';
      case 'automations': return 'Workflow Automations';
      case 'reports': return 'Analytics & Reports';
      case 'audit': return 'Audit Logs & Trash';
      case 'settings': return 'System Settings';
      default: return 'TaskPulse Pro';
    }
  };

  const accents = [
    { id: 'indigo', name: 'Electric Indigo', color: '#4f46e5' },
    { id: 'cyan', name: 'Cyan Ocean', color: '#0284c7' },
    { id: 'emerald', name: 'Emerald Mint', color: '#10b981' },
    { id: 'violet', name: 'Royal Violet', color: '#8b5cf6' }
  ];

  return (
    <>
      <header className="app-header">
        {isMobileView ? (
          /* ==========================================================================
             DEDICATED SLEEK MOBILE APP BAR (Ultra-clean, native phone aesthetics)
             ========================================================================== */
          <div className="mobile-header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '6px' }}>
            {/* Left: Avatar & View Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="mobile-avatar-btn"
                title="Toggle Navigation Menu"
                aria-label="Toggle navigation menu"
                style={{ position: 'relative', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
              >
                <img
                  src={activeUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={activeUser?.name}
                  style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-primary)', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-1px',
                    right: '-1px',
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: '#10b981',
                    border: '2px solid var(--bg-header)'
                  }}
                  title="Online"
                />
              </button>

              <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {getViewTitle()}
                </div>
                <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span>{activeUser?.name || 'User'}</span>
                  <span>•</span>
                  <span>{activeUser?.role || 'Team'}</span>
                  <span style={{ color: isBackendConnected ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                    ({isBackendConnected ? 'Online' : 'Local'})
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Switch to Web + Search + Notifications + Theme + Menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              {/* Primary Switch to Web App Toggle Button */}
              <button
                type="button"
                onClick={toggleDeviceMode}
                className="btn-mobile-mode-switch"
                title="Switch to Desktop / Web App layout"
              >
                <Monitor style={{ width: '13px', height: '13px', color: 'var(--brand-primary)' }} />
                <span>Web</span>
              </button>

              {/* Fast Search Trigger (Cmd+K) */}
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(true)}
                className="btn-icon"
                style={{ padding: '5px', borderRadius: '8px', background: 'var(--bg-input)' }}
                title="Search tasks & commands (Ctrl+K)"
              >
                <Search style={{ width: '15px', height: '15px', color: 'var(--text-primary)' }} />
              </button>

              {/* Notifications */}
              <button
                type="button"
                onClick={onOpenNotifications}
                className="btn-icon"
                style={{ position: 'relative', padding: '5px', borderRadius: '8px', background: 'var(--bg-input)' }}
                title="Notifications"
              >
                <Bell style={{ width: '15px', height: '15px', color: 'var(--text-primary)' }} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      background: '#ef4444',
                      color: '#ffffff',
                      borderRadius: '99px',
                      minWidth: '14px',
                      height: '14px',
                      fontSize: '0.58rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)'
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dark/Light Mode */}
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="btn-icon"
                style={{ padding: '5px', borderRadius: '8px', background: 'var(--bg-input)' }}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              >
                {theme === 'dark' ? (
                  <Sun style={{ width: '15px', height: '15px', color: '#f59e0b' }} />
                ) : (
                  <Moon style={{ width: '15px', height: '15px', color: 'var(--brand-primary)' }} />
                )}
              </button>

              {/* Hamburger drawer button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="btn-icon"
                style={{ padding: '5px', borderRadius: '8px', background: 'var(--bg-input)' }}
                title="Open Sidebar Navigation"
              >
                <Menu style={{ width: '16px', height: '16px', color: 'var(--brand-primary)' }} />
              </button>
            </div>
          </div>
        ) : (
          /* ==========================================================================
             DESKTOP WEB APP HEADER BAR
             ========================================================================== */
          <>
            {/* Left Section: Mobile Toggle & Command Search Bar */}
            <div className="header-left-group" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0, maxWidth: '580px' }}>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="mobile-menu-toggle"
                title="Toggle Navigation Menu"
                aria-label="Toggle navigation menu"
              >
                <Menu style={{ width: '22px', height: '22px', color: 'var(--brand-primary)' }} />
              </button>

              {/* Breadcrumb Navigation on Desktop */}
              <div className="header-breadcrumb header-label-desktop" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                <span style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setActiveView('dashboard')}>
                  TaskPulse
                </span>
                <ChevronRight style={{ width: '13px', height: '13px', opacity: 0.5 }} />
                <span style={{ color: 'var(--brand-primary)', fontWeight: 800 }}>
                  {getViewTitle()}
                </span>
              </div>

              {/* Global Command Palette Trigger Bar */}
              <div
                onClick={() => setIsCommandPaletteOpen(true)}
                className="search-container"
                style={{
                  flex: 1,
                  minWidth: 0,
                  cursor: 'pointer'
                }}
                title="Click or press Ctrl+K to open Command Palette"
              >
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--bg-input)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    padding: '0.5rem 0.85rem 0.5rem 2.4rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Search style={{ position: 'absolute', left: '10px', width: '16px', height: '16px', color: 'var(--brand-primary)' }} />
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', userSelect: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Search tasks, commands, lots...
                  </span>
                  <span
                    className="header-label-desktop"
                    style={{
                      position: 'absolute',
                      right: '8px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '6px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-muted)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    ⌘K
                  </span>
                </div>
              </div>
            </div>

        {/* Right Section: Actions & Badges */}
        <div className="header-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Active Timer Pill */}
          {activeTimer ? (
            <div
              className="badge badge-brand header-timer-pill"
              style={{
                padding: '4px 10px',
                gap: '6px',
                fontSize: '0.75rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #fecaca',
                color: '#dc2626',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                animation: 'pulse 1.8s infinite'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              <Clock style={{ width: '13px', height: '13px', color: '#dc2626', flexShrink: 0 }} />
              <span className="header-label-desktop" style={{ fontWeight: 800 }}>{timerTask?.id || activeTimer.taskId}</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, background: '#ef4444', color: '#ffffff', padding: '1px 6px', borderRadius: '4px' }}>
                {formatTimerSeconds(activeTimer.elapsedSeconds)}
              </span>
              <button onClick={pauseTimer} title="Pause timer" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><Pause style={{ width: '13px', height: '13px', color: '#dc2626' }} /></button>
              <button onClick={stopTimer} title="Stop timer" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><Square style={{ width: '13px', height: '13px', color: '#dc2626' }} /></button>
            </div>
          ) : null}

          {/* Database Live Status Badge */}
          <div
            className="header-db-badge"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: 'var(--radius-md)',
              background: isBackendConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              border: `1px solid ${isBackendConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              fontSize: '0.75rem',
              fontWeight: 700,
              color: isBackendConnected ? '#10b981' : '#f59e0b'
            }}
            title={isBackendConnected ? 'Connected to live MySQL database "taskpulse_db"' : 'Backend offline - Local storage fallback'}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: isBackendConnected ? '#10b981' : '#f59e0b',
                boxShadow: isBackendConnected ? '0 0 8px #10b981' : 'none',
                flexShrink: 0
              }}
            />
            <Database style={{ width: '13px', height: '13px', flexShrink: 0 }} />
            <span className="header-label-desktop">{isBackendConnected ? 'Live DB' : 'Local'}</span>
          </div>

          {/* Primary Switch to Mobile / Switch to Web App Button */}
          <div className="header-device-mode-switch" title="Toggle between Mobile View & Desktop Web App View">
            <button
              type="button"
              onClick={toggleDeviceMode}
              className={`btn-device-mode-toggle ${isMobileView ? 'mobile-active' : 'web-active'}`}
              aria-label={isMobileView ? "Switch to Desktop / Web App" : "Switch to Mobile View"}
            >
              <div className="toggle-icon-wrap">
                {isMobileView ? (
                  <Monitor style={{ width: '15px', height: '15px' }} />
                ) : (
                  <Smartphone style={{ width: '15px', height: '15px' }} />
                )}
              </div>
              <span className="toggle-label-text">
                {isMobileView ? 'Switch to Web App' : 'Switch to Mobile'}
              </span>
              <span className="toggle-current-badge">
                {isMobileView ? '📱 Mobile' : '💻 Web'}
              </span>
            </button>
          </div>

          {/* PulseBot AI Quick Shortcut */}
          <button
            onClick={() => setActiveView('chat')}
            className="btn btn-secondary header-btn-responsive"
            style={{
              background: activeView === 'chat' ? 'var(--brand-primary)' : 'var(--bg-input)',
              color: activeView === 'chat' ? '#ffffff' : 'var(--brand-primary)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 11px',
              borderRadius: '10px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Ask PulseBot AI assistant"
          >
            <Sparkles style={{ width: '14px', height: '14px', color: activeView === 'chat' ? '#ffffff' : 'var(--brand-primary)' }} />
            <span className="header-label-tablet">PulseBot AI</span>
          </button>

          {/* Add Member Button (Admin & Manager) */}
          {(activeUser?.role === 'Admin' || activeUser?.role === 'MD' || activeUser?.role === 'Manager') && (
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="btn btn-secondary header-btn-responsive"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '6px 10px',
                borderRadius: '10px'
              }}
              title="Register new team member or employee"
            >
              <UserPlus style={{ width: '15px', height: '15px', color: 'var(--brand-primary)' }} />
              <span className="header-label-tablet">Add User</span>
            </button>
          )}

          {/* "+ New Task" Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary header-btn-responsive"
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--brand-primary) 0%, #0284c7 100%)',
              boxShadow: '0 4px 12px var(--brand-glow)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 800
            }}
            title="Create a new task (Hotkey: C)"
          >
            <Plus style={{ width: '16px', height: '16px', color: '#ffffff' }} />
            <span className="header-label-tablet">New Task</span>
          </button>

          {/* Accent Color Palette Customizer */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="btn-icon"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                padding: '7px',
                borderRadius: '10px',
                color: 'var(--brand-primary)'
              }}
              title="Customize workspace theme accent"
            >
              <Palette style={{ width: '17px', height: '17px' }} />
            </button>

            {isThemeMenuOpen && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  marginTop: '6px',
                  padding: '10px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.2)',
                  zIndex: 80,
                  minWidth: '160px'
                }}
              >
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Theme Accents
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {accents.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        setAccentTheme(acc.id);
                        setIsThemeMenuOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        background: accentTheme === acc.id ? 'var(--bg-hover)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)'
                      }}
                    >
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: acc.color, border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{acc.name}</span>
                      {accentTheme === acc.id && <span style={{ color: acc.color }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="btn-icon"
            style={{
              position: 'relative',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '7px',
              borderRadius: '10px'
            }}
            title="Notifications"
          >
            <Bell style={{ width: '18px', height: '18px' }} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#ffffff',
                  borderRadius: '99px',
                  width: '17px',
                  height: '17px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dark/Light Mode Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="btn-icon"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              padding: '7px',
              borderRadius: '10px'
            }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun style={{ width: '18px', height: '18px', color: '#f59e0b' }} />
            ) : (
              <Moon style={{ width: '18px', height: '18px', color: 'var(--brand-primary)' }} />
            )}
          </button>
        </div>
          </>
        )}
      </header>

      {/* Global Command Palette (Ctrl+K Modal) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  );
}
