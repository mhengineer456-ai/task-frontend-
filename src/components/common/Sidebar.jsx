import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import {
  LayoutDashboard,
  Inbox,
  ListTodo,
  Kanban,
  Calendar,
  GanttChartSquare,
  CheckSquare,
  Users,
  Zap,
  BarChart3,
  History,
  Settings,
  Sparkles,
  MessageSquare,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sliders,
  ChevronDown,
  UserCheck
} from 'lucide-react';

export default function Sidebar() {
  const {
    activeView,
    setActiveView,
    panelMode,
    tasks,
    users,
    activeUser,
    activeUserId,
    setActiveUserId,
    logout,
    leaves,
    setViewingUserProfile,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isSidebarCollapsed,
    toggleSidebarCollapsed
  } = useTaskContext();

  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);

  const myTasksCount = tasks.filter(t => t.assigneeId === activeUser?.id && t.status !== 'Completed' && t.status !== 'Approved').length;
  const pendingApprovalsCount = tasks.filter(t => t.status === 'Review').length;
  const overdueCount = tasks.filter(t => {
    if (t.status === 'Completed' || t.status === 'Approved' || t.status === 'Cancelled') return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  const pendingLeavesCount = (leaves || []).filter(l => l.status === 'Pending').length;

  // Categorized Navigation Sections
  const navSections = [
    {
      title: 'WORKSPACE',
      items: [
        {
          id: panelMode === 'manager' ? 'managerPanel' : (panelMode === 'ea' ? 'eaPanel' : (panelMode === 'employee' ? 'employeePanel' : 'dashboard')),
          label: panelMode === 'manager' ? 'Manager Workspace' : (panelMode === 'ea' ? 'EA Operations' : (panelMode === 'employee' ? 'Personal Workstation' : 'Executive Dashboard')),
          icon: LayoutDashboard
        },
        {
          id: 'mytasks',
          label: 'My Assigned Tasks',
          icon: Inbox,
          badge: myTasksCount > 0 ? myTasksCount : null,
          badgeClass: 'badge-brand'
        },
        {
          id: 'alltasks',
          label: panelMode === 'manager' ? 'Team Tasks' : (panelMode === 'ea' ? 'MD Deliverables' : 'All Tasks'),
          icon: ListTodo,
          badge: overdueCount > 0 ? `${overdueCount} Late` : null,
          badgeClass: 'badge-rose'
        }
      ]
    },
    {
      title: 'TASK VIEWS',
      items: [
        { id: 'kanban', label: 'Workflow Board (Kanban)', icon: Kanban },
        { id: 'calendar', label: 'Schedule Calendar', icon: Calendar },
        { id: 'timeline', label: 'Gantt Timeline', icon: GanttChartSquare },
        {
          id: 'approvals',
          label: 'Approvals Queue',
          icon: CheckSquare,
          badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
          badgeClass: 'badge-amber'
        }
      ]
    },
    {
      title: 'OPERATIONS & HR',
      items: [
        { id: 'teams', label: 'Org Teams & Directory', icon: Users },
        {
          id: 'leaves',
          label: 'Leave Management',
          icon: Calendar,
          badge: pendingLeavesCount > 0 ? `${pendingLeavesCount} New` : null,
          badgeClass: 'badge-amber'
        }
      ]
    },
    {
      title: 'AI & INTELLIGENCE',
      items: [
        {
          id: 'chat',
          label: 'PulseBot AI & Messenger',
          icon: MessageSquare,
          badge: 'Live AI',
          badgeClass: 'badge-purple'
        },
        { id: 'automations', label: 'Automations Builder', icon: Zap },
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
        { id: 'audit', label: 'Audit Trail & Trash', icon: History },
        { id: 'settings', label: 'System Settings', icon: Settings }
      ]
    }
  ];

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
      case 'md':
        return { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: '#a7f3d0' };
      case 'manager':
        return { bg: 'rgba(37, 99, 235, 0.12)', text: '#2563eb', border: '#bfdbfe' };
      case 'ea':
        return { bg: 'rgba(139, 92, 246, 0.12)', text: '#8b5cf6', border: '#ddd6fe' };
      default:
        return { bg: 'rgba(2, 132, 199, 0.12)', text: '#0284c7', border: '#bae6fd' };
    }
  };

  const roleStyle = getRoleBadgeColor(activeUser?.role);

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`sidebar-mobile-backdrop ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`app-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}
        style={{
          transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Brand Header */}
        <div
          className="sidebar-header"
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
            padding: isSidebarCollapsed ? '0 0.5rem' : '0 1.25rem',
            position: 'relative'
          }}
        >
          <div
            onClick={() => setActiveView('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              cursor: 'pointer',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'var(--brand-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-glow)',
                flexShrink: 0
              }}
            >
              <Sparkles style={{ width: '20px', height: '20px', color: '#fff' }} />
            </div>

            {!isSidebarCollapsed && (
              <div style={{ overflow: 'hidden' }}>
                <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                  TaskPulse<span style={{ color: 'var(--brand-primary)' }}>.io</span>
                </h1>
                <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                  Enterprise Suite
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          {!isSidebarCollapsed && (
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="desktop-sidebar-collapse-btn"
              title="Collapse sidebar"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-input)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <ChevronLeft style={{ width: '16px', height: '16px' }} />
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="mobile-sidebar-close"
            title="Close Navigation"
            aria-label="Close Navigation"
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* When collapsed, show expand button at top of list */}
        {isSidebarCollapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0' }}>
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              title="Expand sidebar"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-input)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <ChevronRight style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        )}

        {/* Navigation Sections */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: isSidebarCollapsed ? '0.5rem 0.4rem' : '0.65rem 0.85rem' }}>
          {navSections.map((section, sIdx) => (
            <div key={section.title} style={{ marginBottom: isSidebarCollapsed ? '0.75rem' : '1.1rem' }}>
              {!isSidebarCollapsed ? (
                <div
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    letterSpacing: '0.08em',
                    padding: '0.35rem 0.75rem 0.35rem',
                    opacity: 0.85
                  }}
                >
                  {section.title}
                </div>
              ) : (
                <div style={{ height: '1px', background: 'var(--border-color)', margin: '6px 8px' }} />
              )}

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    activeView === item.id ||
                    (item.id === 'managerPanel' && activeView === 'dashboard') ||
                    (item.id === 'employeePanel' && activeView === 'dashboard') ||
                    (item.id === 'eaPanel' && activeView === 'dashboard');

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      title={item.label}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
                        padding: isSidebarCollapsed ? '0.7rem 0' : '0.65rem 0.95rem',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                        <Icon style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                        {!isSidebarCollapsed && (
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.label}
                          </span>
                        )}
                      </div>

                      {!isSidebarCollapsed && item.badge ? (
                        <span className={`badge ${item.badgeClass || 'badge-brand'}`} style={{ flexShrink: 0, marginLeft: '0.5rem', fontSize: '0.68rem' }}>
                          {item.badge}
                        </span>
                      ) : null}

                      {/* Small notification indicator dot when collapsed */}
                      {isSidebarCollapsed && item.badge ? (
                        <span
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '12px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: item.badgeClass === 'badge-rose' ? '#ef4444' : 'var(--brand-primary)',
                            boxShadow: '0 0 6px rgba(0,0,0,0.2)'
                          }}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer User Profile & Quick Switcher */}
        <div
          style={{
            padding: isSidebarCollapsed ? '0.75rem 0.4rem' : '0.85rem 1rem',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-sidebar)',
            flexShrink: 0,
            position: 'relative'
          }}
        >
          {/* User Quick Switcher Dropdown */}
          {isUserSwitcherOpen && !isSidebarCollapsed && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '10px',
                right: '10px',
                marginBottom: '8px',
                padding: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.2)',
                borderRadius: '16px',
                zIndex: 60,
                maxHeight: '260px',
                overflowY: 'auto'
              }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-primary)', padding: '4px 8px', textTransform: 'uppercase' }}>
                Switch Workspace User
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {(users || []).map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setActiveUserId(u.id);
                      setIsUserSwitcherOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      background: u.id === activeUser?.id ? 'var(--bg-hover)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%'
                    }}
                  >
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--brand-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem' }}>
                      {u.name?.charAt(0) || 'U'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{u.role} • {u.department || 'General'}</div>
                    </div>
                    {u.id === activeUser?.id && <span style={{ color: 'var(--brand-primary)', fontSize: '0.75rem', fontWeight: 800 }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              background: 'var(--bg-input)',
              padding: isSidebarCollapsed ? '0.5rem 0' : '0.65rem 0.85rem',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
              gap: '0.65rem'
            }}
          >
            <div
              onClick={() => {
                if (isSidebarCollapsed) {
                  toggleSidebarCollapsed();
                } else {
                  setIsUserSwitcherOpen(!isUserSwitcherOpen);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                flex: 1,
                minWidth: 0,
                cursor: 'pointer'
              }}
              title="Click to switch active user or profile"
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {activeUser?.avatar ? (
                  <img
                    src={activeUser.avatar}
                    alt={activeUser.name || 'User'}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeUser?.name || 'User')}&background=4f46e5&color=fff&size=64`;
                    }}
                    style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${roleStyle.text}` }}
                  />
                ) : (
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--brand-primary) 0%, #8b5cf6 100%)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}
                  >
                    {activeUser?.name ? activeUser.name.charAt(0) : 'U'}
                  </div>
                )}
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-1px',
                    right: '-1px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#10b981',
                    border: '2px solid var(--bg-card)'
                  }}
                  title="Online • Active"
                />
              </div>

              {!isSidebarCollapsed && (
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                      {activeUser?.name || 'Workspace User'}
                    </p>
                    <ChevronDown style={{ width: '12px', height: '12px', color: 'var(--text-muted)' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: roleStyle.bg,
                        color: roleStyle.text,
                        border: `1px solid ${roleStyle.border}`
                      }}
                    >
                      {activeUser?.role || 'Employee'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!isSidebarCollapsed && (
              <button
                type="button"
                onClick={logout}
                title="Logout workstation"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.background = '#fee2e2';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <LogOut style={{ width: '16px', height: '16px' }} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
