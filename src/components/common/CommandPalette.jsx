import React, { useState, useEffect, useRef } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import {
  Search,
  Plus,
  Kanban,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Moon,
  Sun,
  LayoutDashboard,
  MessageSquare,
  ListTodo,
  Users,
  Settings,
  Sparkles,
  ArrowRight,
  Zap,
  FolderGit2
} from 'lucide-react';

export default function CommandPalette({ isOpen, onClose }) {
  const {
    tasks,
    setActiveView,
    setIsCreateModalOpen,
    setSelectedTaskId,
    theme,
    setTheme,
    accentTheme,
    setAccentTheme
  } = useTaskContext();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Static quick actions
  const quickActions = [
    {
      id: 'act-new-task',
      title: 'Create New Task',
      subtitle: 'Open task creation modal',
      icon: Plus,
      badge: 'Action',
      badgeClass: 'badge-brand',
      action: () => {
        setIsCreateModalOpen(true);
        onClose();
      }
    },
    {
      id: 'act-view-kanban',
      title: 'Go to Kanban Board',
      subtitle: 'View drag-and-drop workflow board',
      icon: Kanban,
      badge: 'View',
      badgeClass: 'badge-purple',
      action: () => {
        setActiveView('kanban');
        onClose();
      }
    },
    {
      id: 'act-view-list',
      title: 'Go to All Tasks (List View)',
      subtitle: 'Table of tasks with batch controls',
      icon: ListTodo,
      badge: 'View',
      badgeClass: 'badge-brand',
      action: () => {
        setActiveView('alltasks');
        onClose();
      }
    },
    {
      id: 'act-view-calendar',
      title: 'Go to Calendar View',
      subtitle: 'Monthly deadlines schedule',
      icon: Calendar,
      badge: 'View',
      badgeClass: 'badge-cyan',
      action: () => {
        setActiveView('calendar');
        onClose();
      }
    },
    {
      id: 'act-view-chat',
      title: 'Chat with PulseBot AI Assistant',
      subtitle: 'Ask about live production lots, KPIs, and status',
      icon: MessageSquare,
      badge: 'AI Copilot',
      badgeClass: 'badge-rose',
      action: () => {
        setActiveView('chat');
        onClose();
      }
    },
    {
      id: 'act-toggle-theme',
      title: theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      subtitle: 'Toggle workspace visual mode',
      icon: theme === 'dark' ? Sun : Moon,
      badge: 'Preference',
      badgeClass: 'badge-amber',
      action: () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        onClose();
      }
    }
  ];

  // Matching tasks
  const matchedTasks = query.trim()
    ? tasks.filter(t =>
        t.title?.toLowerCase().includes(query.toLowerCase()) ||
        t.id?.toLowerCase().includes(query.toLowerCase()) ||
        t.category?.toLowerCase().includes(query.toLowerCase()) ||
        t.priority?.toLowerCase().includes(query.toLowerCase()) ||
        t.status?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8).map(t => ({
        id: `task-${t.id}`,
        title: `${t.id} • ${t.title}`,
        subtitle: `${t.status} • ${t.priority} • Due: ${t.dueDate ? t.dueDate.slice(0, 10) : 'No Date'}`,
        icon: t.status === 'Completed' ? CheckCircle2 : (t.priority === 'Urgent' ? AlertTriangle : Clock),
        badge: t.priority,
        badgeClass: t.priority === 'Urgent' ? 'badge-rose' : (t.priority === 'High' ? 'badge-amber' : 'badge-brand'),
        action: () => {
          setSelectedTaskId(t.id);
          onClose();
        }
      }))
    : [];

  const filteredActions = query.trim()
    ? quickActions.filter(a =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.subtitle.toLowerCase().includes(query.toLowerCase())
      )
    : quickActions;

  const allItems = [...matchedTasks, ...filteredActions];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, allItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allItems.length) % Math.max(1, allItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="command-palette-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        animation: 'fadeIn 0.15s ease'
      }}
    >
      <div
        className="command-palette-modal glass-panel"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '620px',
          background: 'var(--bg-card)',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-input)'
          }}
        >
          <Search style={{ width: '20px', height: '20px', color: 'var(--brand-primary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, task title, lot number, or view..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}
          />
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)'
            }}
          >
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          style={{
            maxHeight: '380px',
            overflowY: 'auto',
            padding: '0.65rem'
          }}
        >
          {allItems.length === 0 ? (
            <div
              style={{
                padding: '2.5rem 1rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.875rem'
              }}
            >
              No matching tasks or commands found for "{query}".
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {matchedTasks.length > 0 && (
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--brand-primary)',
                    letterSpacing: '0.05em',
                    padding: '6px 12px 2px'
                  }}
                >
                  Matching Tasks ({matchedTasks.length})
                </div>
              )}
              {allItems.map((item, idx) => {
                const IconComponent = item.icon || Sparkles;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '12px',
                      background: isSelected ? 'var(--bg-hover)' : 'transparent',
                      border: isSelected ? '1px solid var(--border-color)' : '1px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.12s ease',
                      width: '100%'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isSelected ? 'var(--brand-primary)' : 'var(--bg-input)',
                          color: isSelected ? '#ffffff' : 'var(--brand-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.12s ease'
                        }}
                      >
                        <IconComponent style={{ width: '16px', height: '16px' }} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.title}
                        </div>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {item.badge && (
                        <span className={`badge ${item.badgeClass}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                          {item.badge}
                        </span>
                      )}
                      <ArrowRight
                        style={{
                          width: '14px',
                          height: '14px',
                          color: isSelected ? 'var(--brand-primary)' : 'transparent',
                          transition: 'color 0.12s ease'
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div
          style={{
            padding: '0.65rem 1.25rem',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-input)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: 'var(--text-muted)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span><kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>↑↓</kbd> Navigate</span>
            <span><kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>↵</kbd> Select</span>
            <span><kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>ESC</kbd> Close</span>
          </div>
          <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>TaskPulse Command Palette</span>
        </div>
      </div>
    </div>
  );
}
