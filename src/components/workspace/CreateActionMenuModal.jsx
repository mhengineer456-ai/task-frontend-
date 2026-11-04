import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import {
  X,
  Search,
  CheckCircle2,
  Bell,
  Clock,
  FileText,
  StickyNote,
  ListOrdered,
  ArrowRight
} from 'lucide-react';

export default function CreateActionMenuModal({ isOpen, onClose }) {
  const {
    setIsCreateModalOpen,
    setIsReminderModalOpen,
    setIsTrackTimeModalOpen,
    setIsDocModalOpen,
    setIsNoteModalOpen,
    setIsListModalOpen,
    isMobileView
  } = useTaskContext();

  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Auto-focus search input on desktop open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      const timer = setTimeout(() => {
        if (searchInputRef.current && !isMobileView) {
          searchInputRef.current.focus();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMobileView]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Action Items definition matching user's reference exactly
  const actionItems = useMemo(() => [
    {
      id: 'task',
      title: 'Task',
      subtitle: 'Assignable work items you can prioritize',
      keywords: ['task', 'assign', 'work', 'ticket', 'priority', 'project', 'deadline', 'bug'],
      iconBg: '#6366f1', // Indigo / Purple
      iconBgGradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      icon: CheckCircle2,
      onSelect: () => {
        onClose();
        setIsCreateModalOpen(true);
      }
    },
    {
      id: 'reminder',
      title: 'Reminder',
      subtitle: 'Quick to-dos that help you stay on track',
      keywords: ['reminder', 'alarm', 'alert', 'todo', 'notify', 'schedule', 'followup', 'clock'],
      iconBg: '#c026d3', // Fuchsia / Purple-pink
      iconBgGradient: 'linear-gradient(135deg, #d946ef 0%, #a21caf 100%)',
      icon: Bell,
      onSelect: () => {
        onClose();
        setIsReminderModalOpen(true);
      }
    },
    {
      id: 'track-time',
      title: 'Track time',
      subtitle: 'Log the time you spend on tasks',
      keywords: ['time', 'track', 'timer', 'stopwatch', 'hours', 'timesheet', 'billable', 'clock'],
      iconBg: '#ea580c', // Orange
      iconBgGradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      icon: Clock,
      onSelect: () => {
        onClose();
        setIsTrackTimeModalOpen(true);
      }
    },
    {
      id: 'doc',
      title: 'Doc',
      subtitle: 'Collaborate & document anything',
      keywords: ['doc', 'document', 'wiki', 'notes', 'spec', 'sprint', 'write', 'knowledge', 'sop'],
      iconBg: '#0284c7', // Sky / Blue
      iconBgGradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
      icon: FileText,
      onSelect: () => {
        onClose();
        setIsDocModalOpen(true);
      }
    },
    {
      id: 'note',
      title: 'Note',
      subtitle: 'Capture your personal thoughts & ideas',
      keywords: ['note', 'scratchpad', 'idea', 'thought', 'memo', 'sticky', 'quick', 'draft'],
      iconBg: '#eab308', // Amber / Gold
      iconBgGradient: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
      icon: StickyNote,
      onSelect: () => {
        onClose();
        setIsNoteModalOpen(true);
      }
    },
    {
      id: 'list',
      title: 'List',
      subtitle: 'Organize tasks into custom lists & checklists',
      keywords: ['list', 'checklist', 'group', 'items', 'category', 'collection', 'workflow'],
      iconBg: '#64748b', // Slate Gray
      iconBgGradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
      icon: ListOrdered,
      onSelect: () => {
        onClose();
        setIsListModalOpen(true);
      }
    }
  ], [onClose, setIsCreateModalOpen, setIsReminderModalOpen, setIsTrackTimeModalOpen, setIsDocModalOpen, setIsNoteModalOpen, setIsListModalOpen]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return actionItems;
    return actionItems.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.keywords.some(k => k.toLowerCase().includes(q))
    );
  }, [actionItems, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="create-menu-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Create Action Menu"
    >
      <div
        className="create-menu-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle */}
        <div className="create-menu-drag-handle" />

        {/* Header */}
        <div className="create-menu-header">
          <div style={{ width: '32px' }} /> {/* Spacer to keep title centered */}
          <h2 className="create-menu-title">Create</h2>
          <button
            onClick={onClose}
            className="create-menu-close-btn"
            aria-label="Close Create Menu"
            type="button"
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Search Bar matching screenshot */}
        <div className="create-menu-search-row">
          <div className="create-menu-search-bar">
            <Search className="create-menu-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channels or actions"
              className="create-menu-search-input"
            />
          </div>
          <button
            type="button"
            className="create-menu-cancel-btn"
            onClick={() => {
              if (searchQuery) setSearchQuery('');
              else onClose();
            }}
          >
            Cancel
          </button>
        </div>

        {/* Action Items List */}
        <div className="create-menu-list">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.onSelect}
                  className="create-menu-item"
                  type="button"
                >
                  <div
                    className="create-menu-item-icon-box"
                    style={{ background: item.iconBgGradient }}
                  >
                    <IconComponent style={{ width: '22px', height: '22px', color: '#ffffff' }} />
                  </div>
                  <div className="create-menu-item-content">
                    <div className="create-menu-item-title">{item.title}</div>
                    <div className="create-menu-item-subtitle">{item.subtitle}</div>
                  </div>
                  <div className="create-menu-item-arrow">
                    <ArrowRight style={{ width: '16px', height: '16px' }} />
                  </div>
                </button>
              );
            })
          ) : (
            <div className="create-menu-empty">
              <p>No actions matching &ldquo;{searchQuery}&rdquo;</p>
              <span>Try searching for &quot;task&quot;, &quot;reminder&quot;, &quot;time&quot;, or &quot;doc&quot;</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
