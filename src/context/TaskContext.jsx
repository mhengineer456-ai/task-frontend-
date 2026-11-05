import React, { createContext, useContext, useState, useEffect } from 'react';
import { taskService } from '../api/taskService';
import { leaveService } from '../api/leaveService';
import { eaService } from '../api/eaService';
import { userService } from '../api/userService';
import { authService } from '../api/authService';
import { chatService } from '../api/chatService';
import { statusService } from '../api/statusService';
import { workspaceService } from '../api/workspaceService';
import { BASE_URL } from '../api/apiClient';
import { initSocket, getSocket, joinUser, joinChannel, leaveChannel, sendTypingStatus } from '../api/socket';
import {
  initialTasks,
  initialUsers,
  initialDepartments,
  initialStatuses,
  initialAutomations,
  initialAuditLogs,
  initialNotifications,
  initialTaskTemplates,
  taskCategories,
  initialChatChannels,
  initialChatMessages
} from '../data/mockData';

const TaskContext = createContext();

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};

export const useTasks = useTaskContext;

// Safe LocalStorage setter helper to prevent QuotaExceededError
const safeSetLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch (error) {
    console.warn(`LocalStorage quota error on key "${key}":`, error);
    try {
      if (Array.isArray(value)) {
        // Truncate array to last 20 items to free up quota
        localStorage.setItem(key, JSON.stringify(value.slice(0, 20)));
      }
    } catch (retryError) {
      console.error('Failed to save to localStorage even after truncating:', retryError);
    }
  }
};

const safeGetLocalStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved || saved === 'undefined' || saved === 'null') return fallback;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(fallback) && !Array.isArray(parsed)) {
        return fallback;
      }
      return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch (parseErr) {
      if (typeof fallback === 'string') return saved;
      return fallback;
    }
  } catch (e) {
    return fallback;
  }
};

export const TaskProvider = ({ children }) => {
  // LocalStorage state initialization with safe fallbacks
  const [tasks, setTasks] = useState(() => safeGetLocalStorage('taskpulse_tasks', []));
  const [deletedTasks, setDeletedTasks] = useState(() => safeGetLocalStorage('taskpulse_deleted_tasks', []));
  const [users, setUsers] = useState(() => safeGetLocalStorage('taskpulse_users', []));
  const [departments, setDepartments] = useState(() => safeGetLocalStorage('taskpulse_departments', initialDepartments));
  const [statuses, setStatuses] = useState(() => safeGetLocalStorage('taskpulse_statuses', initialStatuses));
  const [automations, setAutomations] = useState(() => safeGetLocalStorage('taskpulse_automations', initialAutomations));
  const [auditLogs, setAuditLogs] = useState(() => safeGetLocalStorage('taskpulse_audit_logs', []));
  const [notifications, setNotifications] = useState(() => safeGetLocalStorage('taskpulse_notifications', []));
  const [templates, setTemplates] = useState(initialTaskTemplates);

  const [customFields, setCustomFields] = useState([
    { id: 'cf-1', name: 'Billing Code', type: 'text', required: false },
    { id: 'cf-2', name: 'Risk Level', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
    { id: 'cf-3', name: 'Environment', type: 'select', options: ['Development', 'Staging', 'Production', 'Design Workspace'] }
  ]);

  const [activeUserId, setActiveUserId] = useState(() => safeGetLocalStorage('taskpulse_active_user_id', ''));
  const activeUser = users.find(u => u.id === activeUserId) || (users.length > 0 ? users[0] : {
    id: '',
    name: 'Workspace User',
    email: '',
    role: 'Employee',
    department: 'General'
  });

  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('taskpulse_theme');
      if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
      return 'system';
    } catch (e) {
      return 'system';
    }
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemPrefersDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const effectiveTheme = theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme;

  const setTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light' || newTheme === 'system') {
      setThemeState(newTheme);
    } else {
      setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('taskpulse_theme', theme);
    } catch (e) {}

    const isDark = effectiveTheme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [theme, effectiveTheme]);

  const [activeView, setActiveView] = useState(() => {
    const savedMode = safeGetLocalStorage('taskpulse_panel_mode', 'admin');
    if (savedMode === 'manager') return 'managerPanel';
    if (savedMode === 'ea') return 'eaPanel';
    if (savedMode === 'employee') return 'employeePanel';
    return 'dashboard';
  });
  const [panelMode, setPanelMode] = useState(() => safeGetLocalStorage('taskpulse_panel_mode', 'admin')); // 'admin' | 'manager' | 'ea' | 'employee'
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Universal Create Action Hub & Workspace Modals
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isTrackTimeModalOpen, setIsTrackTimeModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  // Workspace Data Collections
  const [reminders, setReminders] = useState(() => safeGetLocalStorage('taskpulse_reminders', []));
  const [timeLogs, setTimeLogs] = useState(() => safeGetLocalStorage('taskpulse_time_logs', []));
  const [documents, setDocuments] = useState(() => safeGetLocalStorage('taskpulse_documents', []));
  const [notes, setNotes] = useState(() => safeGetLocalStorage('taskpulse_notes', []));
  const [customLists, setCustomLists] = useState(() => safeGetLocalStorage('taskpulse_custom_lists', []));

  // Device Mode: 'mobile' vs 'web'
  const [deviceMode, setDeviceModeState] = useState(() => {
    try {
      const saved = localStorage.getItem('taskpulse_device_mode');
      if (saved === 'mobile' || saved === 'web') return saved;
      return typeof window !== 'undefined' && window.innerWidth <= 768 ? 'mobile' : 'web';
    } catch (e) {
      return 'web';
    }
  });

  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setDeviceMode = (mode) => {
    setDeviceModeState(mode);
    try {
      localStorage.setItem('taskpulse_device_mode', mode);
    } catch (e) {}
  };

  const toggleDeviceMode = () => {
    setDeviceMode(deviceMode === 'mobile' ? 'web' : 'mobile');
  };

  const isMobileView = (typeof window !== 'undefined' && window.innerWidth <= 768) || windowWidth <= 768 || deviceMode === 'mobile';

  useEffect(() => {
    if (activeUser && activeUser.id) {
      if (activeUser.role === 'Admin' || activeUser.role === 'MD') {
        setPanelMode('admin');
      } else if (activeUser.role === 'EA') {
        setPanelMode('ea');
        if (activeView === 'managerPanel' || activeView === 'employeePanel' || activeView === 'dashboard') {
          setActiveView('eaPanel');
        }
      } else if (activeUser.role === 'Manager') {
        setPanelMode('manager');
        if (activeView === 'eaPanel' || activeView === 'dashboard') {
          setActiveView('managerPanel');
        }
      } else {
        setPanelMode('employee');
        if (activeView === 'eaPanel' || activeView === 'dashboard') {
          setActiveView('employeePanel');
        }
      }
    }
  }, [activeUserId]);

  // Enforce access control: Managers and Employees never see EA dashboard
  useEffect(() => {
    if (activeUser && activeUser.role === 'Manager' && (activeView === 'eaPanel' || activeView === 'dashboard')) {
      setActiveView('managerPanel');
    } else if (activeUser && activeUser.role === 'Employee' && (activeView === 'eaPanel' || activeView === 'dashboard')) {
      setActiveView('employeePanel');
    } else if (activeUser && activeUser.role === 'EA' && activeView === 'dashboard') {
      setActiveView('eaPanel');
    }
  }, [activeUser?.role, activeView]);

  const [isAuthenticated, setIsAuthenticated] = useState(() => safeGetLocalStorage('taskpulse_is_authenticated', false));
  const [pendingUsers, setPendingUsers] = useState(() => safeGetLocalStorage('taskpulse_pending_users', []));
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const [leaves, setLeaves] = useState(() => safeGetLocalStorage('taskpulse_leaves', []));
  const [eaFollowUps, setEaFollowUps] = useState(() => safeGetLocalStorage('taskpulse_ea_followups', []));
  const [eaMeetings, setEaMeetings] = useState(() => safeGetLocalStorage('taskpulse_ea_meetings', []));
  const [eaDailyTasks, setEaDailyTasks] = useState(() => safeGetLocalStorage('taskpulse_ea_daily_tasks', []));
  const [viewingUserProfile, setViewingUserProfile] = useState(null);

  // Task Pinning (Favorites ⭐), Accent Theme & Desktop Sidebar Collapse
  const [pinnedTaskIds, setPinnedTaskIds] = useState(() => safeGetLocalStorage('taskpulse_pinned_tasks', []));
  const [accentTheme, setAccentTheme] = useState(() => safeGetLocalStorage('taskpulse_accent_theme', 'indigo'));
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => safeGetLocalStorage('taskpulse_sidebar_collapsed', false));

  const togglePinTask = (taskId) => {
    setPinnedTaskIds(prev => {
      const next = prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId];
      safeSetLocalStorage('taskpulse_pinned_tasks', next);
      return next;
    });
  };

  const updateAccentTheme = (accent) => {
    setAccentTheme(accent);
    safeSetLocalStorage('taskpulse_accent_theme', accent);
    document.documentElement.setAttribute('data-accent', accent);
  };

  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      safeSetLocalStorage('taskpulse_sidebar_collapsed', next);
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accentTheme);
  }, [accentTheme]);

  // AI Query Data Mode ('auto' | 'production' | 'accessory')
  const [aiQueryMode, setAiQueryMode] = useState(() => safeGetLocalStorage('pulsebot_ai_mode', 'auto'));

  const changeAiQueryMode = (mode) => {
    setAiQueryMode(mode);
    safeSetLocalStorage('pulsebot_ai_mode', mode);
  };

  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    // Health check & MySQL connection verification
    fetch(`${BASE_URL}/health`)
      .then(res => res.json())
      .then(data => {
        if (data.database && data.database.includes('MySQL Connected')) {
          setIsBackendConnected(true);
        }
      })
      .catch(() => setIsBackendConnected(false));

    userService.getUsers()
      .then(data => {
        if (data && data.success && Array.isArray(data.users)) {
          setUsers(data.users);
        }
      })
      .catch(err => console.log('REST Users fetch notice:', err));

    taskService.getAllTasks()
      .then(data => {
        if (data && data.success && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
          setIsBackendConnected(true);
        }
      })
      .catch(err => console.log('REST Tasks API fallback:', err));

    leaveService.getAllLeaves()
      .then(data => {
        if (data && data.success && Array.isArray(data.leaves)) {
          setLeaves(data.leaves);
        }
      })
      .catch(err => console.log('REST Leaves API fallback:', err));

    eaService.getFollowUps()
      .then(data => {
        if (data && data.success && Array.isArray(data.followUps)) {
          setEaFollowUps(data.followUps);
        }
      })
      .catch(err => console.log('EA Follow-ups REST API fallback:', err));

    eaService.getMeetings()
      .then(data => {
        if (data && data.success && Array.isArray(data.meetings)) {
          setEaMeetings(data.meetings);
        }
      })
      .catch(err => console.log('EA Meetings REST fallback:', err));

    eaService.getDailyTasks()
      .then(data => {
        if (data && data.success && Array.isArray(data.dailyTasks)) {
          setEaDailyTasks(data.dailyTasks);
        }
      })
      .catch(err => console.log('EA Daily Tasks REST fallback:', err));

    chatService.getChannels(activeUserId)
      .then(data => {
        if (data && data.success && Array.isArray(data.channels) && data.channels.length > 0) {
          const personalized = data.channels.map(c => {
            if (c.type === 'direct' || (c.id && c.id.startsWith('dm-'))) {
              const parts = c.id.replace('dm-', '').split('-');
              const otherId = (c.participantIds || parts).find(pid => String(pid) !== String(activeUserId));
              const otherUser = users.find(u => String(u.id) === String(otherId));
              if (otherUser) {
                return {
                  ...c,
                  name: otherUser.name,
                  avatar: otherUser.avatar,
                  roleBadge: `${otherUser.role} • ${otherUser.department || 'Team'}`,
                  targetUser: otherUser
                };
              }
            }
            return c;
          });
          setChatChannels(personalized);

          const userAiChan = personalized.find(c => c.type === 'ai' || (activeUserId && c.id === `chan-ai-${activeUserId}`));
          if (userAiChan) {
            setActiveChannelId(prev => (!prev || prev === 'chan-ai' || prev.startsWith('chan-ai-')) ? userAiChan.id : prev);
          }
        }
      })
      .catch(err => console.log('Chat channels REST fallback:', err));

    if (activeUserId) {
      loadStatusFeed(activeUserId);
      statusService.getStatusPrivacy(activeUserId)
        .then(data => {
          if (data && data.success && data.privacy) {
            setStatusPrivacy(data.privacy);
            safeSetLocalStorage('taskpulse_status_privacy', data.privacy);
          }
        })
        .catch(() => {});

      // Fetch Workspace collections
      workspaceService.getReminders(activeUserId)
        .then(res => {
          if (res?.success && Array.isArray(res.reminders)) {
            setReminders(res.reminders);
            safeSetLocalStorage('taskpulse_reminders', res.reminders);
          }
        })
        .catch(() => {});

      workspaceService.getTimeLogs({ userId: activeUserId })
        .then(res => {
          if (res?.success && Array.isArray(res.timeLogs)) {
            setTimeLogs(res.timeLogs);
            safeSetLocalStorage('taskpulse_time_logs', res.timeLogs);
          }
        })
        .catch(() => {});

      workspaceService.getDocuments()
        .then(res => {
          if (res?.success && Array.isArray(res.documents)) {
            setDocuments(res.documents);
            safeSetLocalStorage('taskpulse_documents', res.documents);
          }
        })
        .catch(() => {});

      workspaceService.getNotes(activeUserId)
        .then(res => {
          if (res?.success && Array.isArray(res.notes)) {
            setNotes(res.notes);
            safeSetLocalStorage('taskpulse_notes', res.notes);
          }
        })
        .catch(() => {});

      workspaceService.getLists(activeUserId)
        .then(res => {
          if (res?.success && Array.isArray(res.lists)) {
            setCustomLists(res.lists);
            safeSetLocalStorage('taskpulse_custom_lists', res.lists);
          }
        })
        .catch(() => {});
    }
  }, [activeUserId]);

  useEffect(() => {
    safeSetLocalStorage('taskpulse_reminders', reminders);
  }, [reminders]);

  useEffect(() => {
    safeSetLocalStorage('taskpulse_time_logs', timeLogs);
  }, [timeLogs]);

  useEffect(() => {
    safeSetLocalStorage('taskpulse_documents', documents);
  }, [documents]);

  useEffect(() => {
    safeSetLocalStorage('taskpulse_notes', notes);
  }, [notes]);

  useEffect(() => {
    safeSetLocalStorage('taskpulse_custom_lists', customLists);
  }, [customLists]);

  useEffect(() => {
    safeSetLocalStorage('taskpulse_leaves', leaves);
  }, [leaves]);

  useEffect(() => {
    safeSetLocalStorage('taskpulse_ea_followups', eaFollowUps);
  }, [eaFollowUps]);

  useEffect(() => {
    safeSetLocalStorage('taskpulse_ea_meetings', eaMeetings);
  }, [eaMeetings]);

  useEffect(() => {
    safeSetLocalStorage('taskpulse_ea_daily_tasks', eaDailyTasks);
  }, [eaDailyTasks]);

  const [chatChannels, setChatChannels] = useState(() => safeGetLocalStorage('taskpulse_chat_channels', initialChatChannels));
  const [chatMessages, setChatMessages] = useState(() => safeGetLocalStorage('taskpulse_chat_messages', initialChatMessages));
  const [activeChannelId, setActiveChannelId] = useState('chan-ai');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [realtimeToasts, setRealtimeToasts] = useState([]);
  const [chatPagination, setChatPagination] = useState({}); // { [channelId]: { hasMore, isLoadingMore, oldestTimestamp } }

  // WhatsApp-Style Status & Stories State
  const [statusFeed, setStatusFeed] = useState(() => safeGetLocalStorage('taskpulse_status_feed', { myStatus: null, recentUpdates: [], viewedUpdates: [] }));
  const [statusPrivacy, setStatusPrivacy] = useState(() => safeGetLocalStorage('taskpulse_status_privacy', { privacyType: 'contacts', excludedUsers: [], allowedUsers: [] }));
  const [activeStatusStory, setActiveStatusStory] = useState(null); // { userGroup, startIndex, allGroups }
  const [isStatusCreatorOpen, setIsStatusCreatorOpen] = useState(false);
  const [isStatusPrivacyOpen, setIsStatusPrivacyOpen] = useState(false);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);

  const normalizeStatusItem = (s) => {
    if (!s) return null;
    return {
      ...s,
      content: s.content || s.text || '',
      text: s.content || s.text || '',
      caption: s.caption || (s.type !== 'text' ? (s.content || '') : ''),
      mediaUrl: s.mediaUrl || s.media_url || null,
      media_url: s.media_url || s.mediaUrl || null,
      backgroundColor: s.backgroundColor || s.background_color || '#007AFF',
      background_color: s.background_color || s.backgroundColor || '#007AFF',
      textColor: s.textColor || s.text_color || '#FFFFFF',
      text_color: s.text_color || s.textColor || '#FFFFFF',
      typographyStyle: s.typographyStyle || s.fontStyle || s.font_style || 'sans',
      fontStyle: s.fontStyle || s.typographyStyle || s.font_style || 'sans',
      font_style: s.font_style || s.fontStyle || 'sans',
      createdAt: s.createdAt || s.created_at,
      created_at: s.created_at || s.createdAt,
      expiresAt: s.expiresAt || s.expires_at,
      expires_at: s.expires_at || s.expiresAt,
      viewCount: s.viewCount ?? s.viewsCount ?? s.views_count ?? 0,
      views_count: s.views_count ?? s.viewCount ?? 0,
      hasViewed: Boolean(s.hasViewed ?? s.has_viewed),
      has_viewed: Boolean(s.has_viewed ?? s.hasViewed)
    };
  };

  const normalizeStatusGroup = (g) => {
    if (!g) return null;
    const u = g.user || {
      id: g.userId,
      name: g.userName,
      avatar: g.userAvatar
    };
    return {
      ...g,
      user: u,
      userId: g.userId || u.id,
      userName: g.userName || u.name,
      userAvatar: g.userAvatar || u.avatar,
      statuses: (g.statuses || []).map(normalizeStatusItem).filter(Boolean),
      latestAt: g.latestAt || g.lastUpdated,
      lastUpdated: g.lastUpdated || g.latestAt,
      hasUnread: Boolean(g.hasUnread ?? g.hasUnviewed),
      unreadCount: g.unreadCount || 0
    };
  };

  const loadStatusFeed = async (uid = activeUserId) => {
    if (!uid) return;
    setIsLoadingStatuses(true);
    try {
      const data = await statusService.getStatusFeed(uid);
      if (data && data.success) {
        const feed = {
          myStatus: normalizeStatusGroup(data.myStatus),
          recentUpdates: (data.recentUpdates || []).map(normalizeStatusGroup).filter(Boolean),
          viewedUpdates: (data.viewedUpdates || []).map(normalizeStatusGroup).filter(Boolean)
        };
        setStatusFeed(feed);
        safeSetLocalStorage('taskpulse_status_feed', feed);
      }
    } catch (e) {
      console.warn('Status feed fetch notice:', e);
    } finally {
      setIsLoadingStatuses(false);
    }
  };

  // Synthesize pleasant sound chime for live events using Web Audio API
  const playChime = (type = 'info') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      const freq = type === 'approval' ? 784 : type === 'assignment' ? 659.25 : 523.25;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.12);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  const triggerRealtimeToast = ({ id, title, message, type = 'info', taskId = null, channelId = null }) => {
    const toastId = id || `toast-${Date.now()}-${Math.random()}`;
    const newToast = { id: toastId, title, message, type, taskId, channelId, timestamp: new Date().toISOString() };
    setRealtimeToasts(prev => [newToast, ...prev.filter(t => t.id !== toastId)].slice(0, 5));
    playChime(type);
    setTimeout(() => {
      setRealtimeToasts(prev => prev.filter(t => t.id !== toastId));
    }, 4500);
  };

  const dismissRealtimeToast = (toastId) => {
    setRealtimeToasts(prev => prev.filter(t => t.id !== toastId));
  };

  // Real-time WebSockets connection and event subscriptions
  useEffect(() => {
    const s = initSocket(activeUser?.id);

    const handleTaskCreated = (newTask) => {
      if (!newTask || !newTask.id) return;
      setTasks(prev => {
        const exists = prev.some(t => t.id === newTask.id);
        if (exists) return prev.map(t => t.id === newTask.id ? { ...t, ...newTask } : t);
        return [newTask, ...prev];
      });

      if (newTask.creatorId !== activeUser?.id || newTask.assigneeId === activeUser?.id) {
        triggerRealtimeToast({
          title: 'New Task Created',
          message: `📋 "${newTask.title}" (${newTask.id}) assigned to ${newTask.assigneeName || 'team'}.`,
          type: 'assignment',
          taskId: newTask.id
        });
      }
    };

    const handleTaskUpdated = (updatedTask) => {
      if (!updatedTask || !updatedTask.id) return;
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
    };

    const handleTaskDeleted = ({ id }) => {
      if (!id) return;
      setTasks(prev => prev.filter(t => t.id !== id));
    };

    const handleTaskFollowup = ({ taskId, followup, progress }) => {
      if (!taskId || !followup) return;
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          const existing = t.followups || [];
          const already = existing.some(f => f.id === followup.id);
          return {
            ...t,
            followups: already ? existing : [followup, ...existing],
            progress: progress !== undefined ? progress : t.progress
          };
        }
        return t;
      }));

      if (followup.authorId !== activeUser?.id) {
        triggerRealtimeToast({
          title: 'Daily Follow-up Logged',
          message: `💬 ${followup.authorName || 'Team member'} logged follow-up on ${taskId}: "${followup.notes?.slice(0, 50)}..."`,
          type: 'info',
          taskId
        });
      }
    };

    const handleChatMessage = (msg) => {
      if (!msg || !msg.channelId) return;

      // PulseBot AI channel isolation guard:
      // If message is in an AI channel, only accept if it belongs to this activeUser!
      if (msg.channelId.startsWith('chan-ai-') && activeUser?.id && msg.channelId !== `chan-ai-${activeUser.id}`) {
        return;
      }

      setChatMessages(prev => {
        const list = prev[msg.channelId] || [];
        
        // 1. Direct ID match -> update existing message instead of duplicating
        const existsIndex = list.findIndex(m => m.id === msg.id);
        if (existsIndex !== -1) {
          const updated = [...list];
          updated[existsIndex] = { ...updated[existsIndex], ...msg };
          return { ...prev, [msg.channelId]: updated };
        }

        // 2. Sender optimistic twin match -> if sender already posted optimistically within 15 seconds
        if (msg.senderId && activeUser?.id && String(msg.senderId) === String(activeUser.id)) {
          const twinIndex = list.findIndex(m =>
            String(m.senderId) === String(activeUser.id) &&
            (m.text || '').trim() === (msg.text || '').trim() &&
            (m.imageUrl || null) === (msg.imageUrl || null) &&
            (m.audioUrl || null) === (msg.audioUrl || null) &&
            Math.abs(new Date(m.timestamp || 0).getTime() - new Date(msg.timestamp || 0).getTime()) < 15000
          );
          if (twinIndex !== -1) {
            const updated = [...list];
            updated[twinIndex] = { ...updated[twinIndex], ...msg };
            return { ...prev, [msg.channelId]: updated };
          }
        }

        return {
          ...prev,
          [msg.channelId]: [...list, msg]
        };
      });

      if (msg.senderId !== activeUser?.id) {
        setChatChannels(prev => prev.map(c => {
          if (c.id === msg.channelId && activeChannelId !== msg.channelId) {
            return { ...c, unreadCount: (c.unreadCount || 0) + 1 };
          }
          return c;
        }));

        triggerRealtimeToast({
          title: `New Message • ${msg.senderName}`,
          message: msg.text ? msg.text.slice(0, 60) : '📎 Attachment shared',
          type: 'chat',
          channelId: msg.channelId
        });
      }
    };

    const handleChatTyping = ({ channelId, user, isTyping }) => {
      if (!user || user === activeUser?.name) return;
      setTypingUsers(prev => {
        const list = prev[channelId] || [];
        if (isTyping) {
          if (!list.includes(user)) return { ...prev, [channelId]: [...list, user] };
          return prev;
        } else {
          return { ...prev, [channelId]: list.filter(u => u !== user) };
        }
      });
    };

    const handleNotificationNew = (notif) => {
      if (!notif || !notif.id) return;
      setNotifications(prev => {
        if (prev.some(n => n.id === notif.id)) return prev;
        return [notif, ...prev].slice(0, 50);
      });
      triggerRealtimeToast({
        id: notif.id,
        title: notif.title || 'Live Alert',
        message: notif.message,
        type: notif.type || 'info',
        taskId: notif.taskId
      });
    };

    const handleLeaveUpdated = (leave) => {
      if (!leave || !leave.id) return;
      setLeaves(prev => {
        const exists = prev.some(l => l.id === leave.id);
        if (exists) return prev.map(l => l.id === leave.id ? { ...l, ...leave } : l);
        return [leave, ...prev];
      });
    };

    const handleChatReaction = ({ messageId, channelId, reactions }) => {
      setChatMessages(prev => {
        const list = prev[channelId] || [];
        return {
          ...prev,
          [channelId]: list.map(m => m.id === messageId ? { ...m, reactions } : m)
        };
      });
    };

    const handleChannelCreated = (newChannel) => {
      if (!newChannel || !newChannel.id) return;
      setChatChannels(prev => {
        if (prev.some(c => c.id === newChannel.id)) return prev;
        return [newChannel, ...prev];
      });
      triggerRealtimeToast({
        title: 'New Group Created',
        message: `👥 "${newChannel.name}" group created with ${newChannel.participantIds?.length || 0} members.`,
        type: 'chat',
        channelId: newChannel.id
      });
    };

    const handleStatusCreated = () => {
      loadStatusFeed(activeUser?.id);
    };

    const handleStatusViewed = (data) => {
      if (!data) return;
      if (data.ownerId === activeUser?.id) {
        setStatusFeed(prev => {
          if (!prev || !prev.myStatus) return prev;
          const updatedStatuses = (prev.myStatus.statuses || []).map(s => {
            if (s.id === data.statusId) {
              return { ...s, views_count: data.viewsCount };
            }
            return s;
          });
          return {
            ...prev,
            myStatus: { ...prev.myStatus, statuses: updatedStatuses }
          };
        });
      }
    };

    const handleStatusDeleted = () => {
      loadStatusFeed(activeUser?.id);
    };

    const handleChatMessageDeleted = ({ messageId, channelId }) => {
      setChatMessages(prev => {
        if (!channelId) {
          const updated = { ...prev };
          Object.keys(updated).forEach(cid => {
            updated[cid] = (updated[cid] || []).filter(m => m.id !== messageId);
          });
          return updated;
        }
        const list = prev[channelId] || [];
        return {
          ...prev,
          [channelId]: list.filter(m => m.id !== messageId)
        };
      });
    };

    const handleChatCleared = ({ channelId }) => {
      if (!channelId) return;
      setChatMessages(prev => ({
        ...prev,
        [channelId]: []
      }));
    };

    const handleChannelDeleted = ({ channelId }) => {
      if (!channelId) return;
      setChatChannels(prev => prev.filter(c => c.id !== channelId));
      setChatMessages(prev => {
        const next = { ...prev };
        delete next[channelId];
        return next;
      });
    };

    s.on('task:created', handleTaskCreated);
    s.on('task:updated', handleTaskUpdated);
    s.on('task:deleted', handleTaskDeleted);
    s.on('task:followup', handleTaskFollowup);
    s.on('chat:message', handleChatMessage);
    s.on('chat:typing', handleChatTyping);
    s.on('chat:reaction', handleChatReaction);
    s.on('chat:channel_created', handleChannelCreated);
    s.on('chat:message_deleted', handleChatMessageDeleted);
    s.on('chat:cleared', handleChatCleared);
    s.on('chat:channel_deleted', handleChannelDeleted);
    s.on('notification:new', handleNotificationNew);
    s.on('leave:updated', handleLeaveUpdated);
    s.on('status:created', handleStatusCreated);
    s.on('status:viewed', handleStatusViewed);
    s.on('status:deleted', handleStatusDeleted);

    return () => {
      s.off('task:created', handleTaskCreated);
      s.off('task:updated', handleTaskUpdated);
      s.off('task:deleted', handleTaskDeleted);
      s.off('task:followup', handleTaskFollowup);
      s.off('chat:message', handleChatMessage);
      s.off('chat:typing', handleChatTyping);
      s.off('chat:reaction', handleChatReaction);
      s.off('chat:channel_created', handleChannelCreated);
      s.off('chat:message_deleted', handleChatMessageDeleted);
      s.off('chat:cleared', handleChatCleared);
      s.off('chat:channel_deleted', handleChannelDeleted);
      s.off('notification:new', handleNotificationNew);
      s.off('leave:updated', handleLeaveUpdated);
      s.off('status:created', handleStatusCreated);
      s.off('status:viewed', handleStatusViewed);
      s.off('status:deleted', handleStatusDeleted);
    };
  }, [activeUserId, activeChannelId]);

  // Join channel room
  useEffect(() => {
    if (activeChannelId) {
      joinChannel(activeChannelId);
      // Mark channel unread count as 0
      setChatChannels(prev => prev.map(c => c.id === activeChannelId ? { ...c, unreadCount: 0 } : c));
    }
  }, [activeChannelId]);

  // Load chat messages when active channel or active user changes (Default: Last 3 Days like WhatsApp)
  useEffect(() => {
    if (activeChannelId) {
      chatService.getMessages(activeChannelId, { days: 3, limit: 30, userId: activeUser?.id })
        .then(res => {
          if (res && res.success && Array.isArray(res.messages)) {
            setChatMessages(prev => ({
              ...prev,
              [activeChannelId]: res.messages
            }));
            setChatPagination(prev => ({
              ...prev,
              [activeChannelId]: {
                hasMore: Boolean(res.hasMore),
                isLoadingMore: false,
                oldestTimestamp: res.oldestTimestamp || (res.messages[0]?.timestamp)
              }
            }));
          }
        })
        .catch(err => console.log('Fetch channel messages fallback:', err));
    }
  }, [activeChannelId, activeUser?.id]);

  // Reverse scroll pagination: Loads older messages before the oldest rendered message
  const loadMoreMessages = async (channelId) => {
    const targetChannel = channelId || activeChannelId;
    if (!targetChannel) return false;

    const currentPagination = chatPagination[targetChannel] || {};
    if (currentPagination.isLoadingMore || currentPagination.hasMore === false) {
      return false;
    }

    const currentList = chatMessages[targetChannel] || [];
    const oldest = currentList[0];
    const beforeTimestamp = oldest?.timestamp || currentPagination.oldestTimestamp;
    if (!beforeTimestamp) return false;

    setChatPagination(prev => ({
      ...prev,
      [targetChannel]: { ...prev[targetChannel], isLoadingMore: true }
    }));

    try {
      const res = await chatService.getMessages(targetChannel, {
        before: beforeTimestamp,
        limit: 30
      });

      if (res && res.success && Array.isArray(res.messages) && res.messages.length > 0) {
        setChatMessages(prev => {
          const existing = prev[targetChannel] || [];
          const existingIds = new Set(existing.map(m => m.id));
          const newOlder = res.messages.filter(m => !existingIds.has(m.id));
          return {
            ...prev,
            [targetChannel]: [...newOlder, ...existing]
          };
        });

        setChatPagination(prev => ({
          ...prev,
          [targetChannel]: {
            hasMore: Boolean(res.hasMore),
            isLoadingMore: false,
            oldestTimestamp: res.oldestTimestamp || (res.messages[0]?.timestamp)
          }
        }));
        return true;
      } else {
        setChatPagination(prev => ({
          ...prev,
          [targetChannel]: {
            ...prev[targetChannel],
            hasMore: false,
            isLoadingMore: false
          }
        }));
        return false;
      }
    } catch (err) {
      console.error('Error loading earlier messages:', err);
      setChatPagination(prev => ({
        ...prev,
        [targetChannel]: { ...prev[targetChannel], isLoadingMore: false }
      }));
      return false;
    }
  };

  // Sync isAuthenticated to LocalStorage safely
  useEffect(() => {
    safeSetLocalStorage('taskpulse_is_authenticated', isAuthenticated);
  }, [isAuthenticated]);

  // Sync panelMode to LocalStorage safely
  useEffect(() => {
    safeSetLocalStorage('taskpulse_panel_mode', panelMode);
  }, [panelMode]);

  useEffect(() => {
    safeSetLocalStorage('taskpulse_pending_users', pendingUsers);
  }, [pendingUsers]);

  useEffect(() => {
    safeSetLocalStorage('taskpulse_chat_channels', chatChannels);
  }, [chatChannels]);

  useEffect(() => {
    safeSetLocalStorage('taskpulse_chat_messages', chatMessages);
  }, [chatMessages]);

  // Live Timer State
  const [activeTimer, setActiveTimer] = useState(null);

  // Sync state to LocalStorage safely
  useEffect(() => {
    safeSetLocalStorage('taskpulse_tasks', tasks);
  }, [tasks]);

  useEffect(() => {
    safeSetLocalStorage('taskpulse_deleted_tasks', deletedTasks);
  }, [deletedTasks]);

  useEffect(() => {
    safeSetLocalStorage('taskpulse_users', users);
  }, [users]);

  useEffect(() => {
    safeSetLocalStorage('taskpulse_statuses', statuses);
  }, [statuses]);

  useEffect(() => {
    safeSetLocalStorage('taskpulse_automations', automations);
  }, [automations]);

  useEffect(() => {
    safeSetLocalStorage('taskpulse_audit_logs', auditLogs);
  }, [auditLogs]);

  useEffect(() => {
    safeSetLocalStorage('taskpulse_notifications', notifications);
  }, [notifications]);

  useEffect(() => {
    safeSetLocalStorage('taskpulse_theme', theme);
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [theme, effectiveTheme]);

  // Timer Tick Effect
  useEffect(() => {
    let interval = null;
    if (activeTimer && activeTimer.isRunning) {
      interval = setInterval(() => {
        setActiveTimer(prev => prev ? { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 } : null);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  // Helper Audit Logger (capped at 50 recent items)
  const addAuditLog = (action, details, category = 'Task') => {
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: activeUser.name,
      action,
      details,
      category
    };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  // Helper Notification Sender (capped at 50 recent items)
  const sendNotification = (title, message, type = 'info', taskId = null) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: new Date().toISOString(),
      type,
      read: false,
      taskId
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
  };

  // Task Management Actions
  const addTask = (taskData) => {
    const nextIdNum = tasks.length + deletedTasks.length + 1008;
    const assignedUser = users.find(u => u.id === taskData.assigneeId) || users[0] || activeUser;
    const newTask = {
      id: taskData.id || `TSK-${nextIdNum}`,
      title: taskData.title,
      description: taskData.description || '',
      category: taskData.category || 'Software Development',
      department: taskData.department || activeUser?.department || 'Engineering & DevOps',
      project: taskData.project || 'General Project',
      assigneeId: taskData.assigneeId || assignedUser?.id || activeUser?.id,
      coAssignees: taskData.coAssignees || [],
      creatorId: activeUser?.id,
      approvalOwnerId: taskData.approvalOwnerId || activeUser?.id,
      backupPersonId: taskData.backupPersonId || '',
      watchers: taskData.watchers || [activeUser?.id],
      priority: taskData.priority || 'Normal',
      status: taskData.status || 'Assigned',
      startDate: taskData.startDate || new Date().toISOString().slice(0, 16),
      dueDate: taskData.dueDate || new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
      estimatedHours: Number(taskData.estimatedHours) || 8,
      actualHours: 0,
      delayReason: '',
      recurring: taskData.recurring || { isRecurring: false, frequency: 'None' },
      tags: taskData.tags || [],
      customFields: taskData.customFields || {},
      checklist: taskData.checklist || [],
      dependencies: taskData.dependencies || [],
      attachments: taskData.attachments || [],
      remarks: taskData.remarks || '',
      comments: [],
      progress: Math.max(0, Math.min(100, Number(taskData.progress || 0))),
      followups: taskData.followups || [],
      activityLog: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: activeUser?.id,
          action: `Task created by ${activeUser?.name || 'User'} and assigned to ${assignedUser?.name || 'Assignee'}`
        }
      ]
    };

    setTasks(prev => [newTask, ...prev]);
    taskService.createTask(newTask)
      .then(res => {
        if (res && res.task) {
          setTasks(prev => prev.map(t => t.id === newTask.id ? { ...t, ...res.task } : t));
        }
      })
      .catch(err => console.warn('Task create API sync warning:', err));
    addAuditLog('TASK_CREATE', `Created task ${newTask.id}: "${newTask.title}"`);
    sendNotification(
      'New Task Assigned',
      `📋 Task "${newTask.title}" (${newTask.id}) assigned to ${assignedUser?.name || 'Assignee'}`,
      'assignment',
      newTask.id
    );

    checkAutomationsOnTaskCreate(newTask);
  };

  const addDailyFollowup = (taskId, followupData) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const newProgress = followupData.progress !== undefined 
      ? Math.max(0, Math.min(100, Number(followupData.progress))) 
      : (targetTask.progress || 0);

    const newFollowup = {
      id: `fol-${Date.now()}`,
      date: followupData.date || new Date().toISOString().slice(0, 10),
      time: followupData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      authorId: activeUser?.id || 'usr-1',
      authorName: activeUser?.name || 'Team Member',
      authorRole: activeUser?.role || 'Employee',
      progress: newProgress,
      notes: followupData.notes || '',
      reasonNotStarted: followupData.reasonNotStarted || '',
      delayCategory: followupData.delayCategory || '',
      expectedDate: followupData.expectedDate || followupData.expectedCompletionDate || targetTask.expectedDate || '',
      actionRequired: followupData.actionRequired || '',
      nextFollowupDate: followupData.nextFollowupDate || '',
      status: followupData.status || (newProgress === 0 ? 'Not Started' : (newProgress === 100 ? 'Completed' : 'In Progress')),
      createdAt: new Date().toISOString()
    };

    const updatedFollowups = [newFollowup, ...(targetTask.followups || [])];
    
    // Auto status progression if applicable
    let updatedStatus = targetTask.status;
    if (newProgress === 100 && targetTask.status !== 'Completed' && targetTask.status !== 'Approved') {
      updatedStatus = 'Completed';
    } else if (newProgress > 0 && targetTask.status === 'Assigned') {
      updatedStatus = 'In Progress';
    }

    const logText = newProgress === 0 && followupData.reasonNotStarted
      ? `Reported Not Started (0%) by ${activeUser?.name || 'User'} - Reason: ${followupData.reasonNotStarted}`
      : `Progress updated to ${newProgress}% by ${activeUser?.name || 'User'}${newFollowup.expectedDate ? ` (Expected: ${newFollowup.expectedDate})` : ''}: ${(newFollowup.notes || '').slice(0, 50)}`;

    const logEntry = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser?.id || 'usr-1',
      action: logText
    };

    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            followups: updatedFollowups,
            progress: newProgress,
            status: updatedStatus,
            expectedDate: newFollowup.expectedDate,
            reasonNotStarted: newProgress === 0 ? (followupData.reasonNotStarted || followupData.notes) : null,
            delayCategory: newProgress === 0 ? followupData.delayCategory : null,
            activityLog: [logEntry, ...(task.activityLog || [])]
          };
        }
        return task;
      })
    );

    taskService.addFollowup(taskId, {
      ...newFollowup,
      progress: newProgress,
      expectedDate: newFollowup.expectedDate,
      reasonNotStarted: newProgress === 0 ? followupData.reasonNotStarted : null
    }).catch(err => console.warn('Follow-up API sync warning:', err));

    addAuditLog('TASK_FOLLOWUP', `Added follow-up on ${taskId}: ${logText.slice(0, 60)}`);

    sendNotification(
      'Daily Progress Logged',
      `💬 ${activeUser?.name || 'Team member'} logged follow-up on "${targetTask.title}" (${newProgress}%${newFollowup.expectedDate ? ` • Expected: ${newFollowup.expectedDate}` : ''})`,
      'info',
      taskId
    );
  };

  const updateTaskProgress = (taskId, progress, note = '') => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const numProgress = Math.max(0, Math.min(100, Number(progress) || 0));
    const updates = { progress: numProgress };

    if (numProgress === 100 && targetTask.status === 'Assigned') {
      updates.status = 'Completed';
    } else if (numProgress > 0 && targetTask.status === 'Assigned') {
      updates.status = 'In Progress';
    }

    const logEntry = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser?.id || 'usr-1',
      action: `Progress updated to ${numProgress}%${note ? ` (${note})` : ''} by ${activeUser?.name || 'User'}`
    };

    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            ...updates,
            activityLog: [logEntry, ...(task.activityLog || [])]
          };
        }
        return task;
      })
    );

    taskService.updateTask(taskId, updates)
      .catch(err => console.warn('Progress update API sync warning:', err));

    addAuditLog('PROGRESS_UPDATE', `Updated progress of ${taskId} to ${numProgress}%`);

    sendNotification(
      'Task Progress Updated',
      `📊 ${activeUser?.name || 'Team member'} updated "${targetTask.title}" progress to ${numProgress}%`,
      'status',
      taskId
    );
  };

  const updateTask = (taskId, updates) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const updated = { ...task, ...updates };
          const logEntry = {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: activeUser.id,
            action: `Task updated by ${activeUser.name}`
          };
          updated.activityLog = [logEntry, ...(updated.activityLog || [])];
          return updated;
        }
        return task;
      })
    );
    taskService.updateTask(taskId, updates)
      .catch(err => console.warn('Task update API sync warning:', err));
    addAuditLog('TASK_UPDATE', `Updated task ${taskId}`);
  };

  const deleteTask = (taskId) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (taskToDelete) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setDeletedTasks(prev => [taskToDelete, ...prev].slice(0, 30));
      taskService.deleteTask(taskId)
        .catch(err => console.warn('Task delete API sync warning:', err));
      if (selectedTaskId === taskId) setSelectedTaskId(null);
      addAuditLog('TASK_DELETE', `Deleted task ${taskId}: "${taskToDelete.title}"`);
    }
  };

  const restoreTask = (taskId) => {
    const taskToRestore = deletedTasks.find(t => t.id === taskId);
    if (taskToRestore) {
      setDeletedTasks(prev => prev.filter(t => t.id !== taskId));
      setTasks(prev => [taskToRestore, ...prev]);
      taskService.createTask(taskToRestore)
        .catch(err => console.warn('Task restore API sync warning:', err));
      addAuditLog('TASK_RESTORE', `Restored task ${taskId} from recycle bin`);
    }
  };

  const changeTaskStatus = (taskId, newStatus, remark = '') => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const oldStatus = task.status;
          const updated = {
            ...task,
            status: newStatus,
            remarks: remark ? `${task.remarks ? task.remarks + ' | ' : ''}${remark}` : task.remarks
          };

          const logEntry = {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: activeUser.id,
            action: `Status changed from ${oldStatus} to ${newStatus}`
          };
          updated.activityLog = [logEntry, ...(updated.activityLog || [])];
          return updated;
        }
        return task;
      })
    );

    addAuditLog('STATUS_CHANGE', `Changed task ${taskId} status to ${newStatus}`);
    sendNotification(
      'Status Changed',
      `Task ${taskId} moved to ${newStatus}`,
      newStatus === 'Review' ? 'approval' : 'status',
      taskId
    );
  };

  const changeTaskPriority = (taskId, newPriority) => {
    updateTask(taskId, { priority: newPriority });
    addAuditLog('PRIORITY_CHANGE', `Changed task ${taskId} priority to ${newPriority}`);
  };

  const reassignTask = (taskId, newAssigneeId) => {
    const newAssignee = users.find(u => u.id === newAssigneeId);
    updateTask(taskId, { assigneeId: newAssigneeId });
    addAuditLog('TASK_REASSIGN', `Reassigned task ${taskId} to ${newAssignee?.name || newAssigneeId}`);
    sendNotification(
      'Task Reassigned',
      `You have been assigned task ${taskId}`,
      'assignment',
      taskId
    );
  };

  const bulkUpdateStatus = (taskIds, newStatus) => {
    taskIds.forEach(id => changeTaskStatus(id, newStatus));
  };

  const bulkDeleteTasks = (taskIds) => {
    taskIds.forEach(id => deleteTask(id));
  };

  const startTimer = (taskId) => {
    if (activeTimer && activeTimer.isRunning) {
      pauseTimer();
    }
    setActiveTimer({
      taskId,
      startTime: Date.now(),
      elapsedSeconds: 0,
      isRunning: true
    });
    addAuditLog('TIMER_START', `Started timer for task ${taskId}`);
  };

  const pauseTimer = () => {
    if (activeTimer) {
      setActiveTimer(prev => prev ? { ...prev, isRunning: false } : null);
    }
  };

  const stopTimer = () => {
    if (activeTimer) {
      const hoursLogged = Math.max(0.1, Math.round((activeTimer.elapsedSeconds / 3600) * 100) / 100);
      logTime(activeTimer.taskId, hoursLogged, 'Live Timer Logged Session', 'General Work');
      setActiveTimer(null);
    }
  };

  const logTime = (taskId, hours, comment = '', category = 'Development') => {
    let updatedActual = 0;
    let updatedLog = [];
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          updatedActual = (task.actualHours || 0) + Number(hours);
          const logEntry = {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: activeUser.id,
            action: `Logged ${hours} hrs (${category}). ${comment ? '"' + comment + '"' : ''}`
          };
          updatedLog = [logEntry, ...(task.activityLog || [])];
          return {
            ...task,
            actualHours: updatedActual,
            activityLog: updatedLog
          };
        }
        return task;
      })
    );
    taskService.updateTask(taskId, { actualHours: updatedActual, activityLog: updatedLog })
      .catch(err => console.warn('Log time API sync warning:', err));
    addAuditLog('TIME_LOGGED', `Logged ${hours} hours on task ${taskId}`, 'Time');
  };

  const addComment = (taskId, text, isInternal = false) => {
    if (!text.trim()) return;
    const newComment = {
      id: `cmt-${Date.now()}`,
      userId: activeUser.id,
      userName: activeUser.name,
      userAvatar: activeUser.avatar,
      text,
      timestamp: new Date().toISOString(),
      isInternal
    };

    let updatedComments = [];
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          updatedComments = [...(task.comments || []), newComment];
          return {
            ...task,
            comments: updatedComments
          };
        }
        return task;
      })
    );
    taskService.updateTask(taskId, { comments: updatedComments })
      .catch(err => console.warn('Add comment API sync warning:', err));

    addAuditLog('COMMENT_ADDED', `Added comment to task ${taskId}`);
    if (text.includes('@')) {
      sendNotification(
        'Mention in Comment',
        `${activeUser.name} mentioned team members in task ${taskId}`,
        'mention',
        taskId
      );
    }
  };

  const addChecklistItem = (taskId, text) => {
    if (!text.trim()) return;
    const newItem = { id: `ck-${Date.now()}`, text, completed: false };
    let updatedChecklist = [];
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          updatedChecklist = [...(task.checklist || []), newItem];
          return { ...task, checklist: updatedChecklist };
        }
        return task;
      })
    );
    taskService.updateTask(taskId, { checklist: updatedChecklist })
      .catch(err => console.warn('Add checklist item API sync warning:', err));
  };

  const toggleChecklistItem = (taskId, checkId) => {
    let finalChecklist = [];
    let nextStatus = null;
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const checklist = (task.checklist || []).map(item => {
            if (item.id === checkId) {
              return { ...item, completed: !item.completed };
            }
            return item;
          });
          finalChecklist = checklist;

          const allCompleted = checklist.length > 0 && checklist.every(i => i.completed);
          let updatedTask = { ...task, checklist };
          if (allCompleted && task.status === 'In Progress') {
            updatedTask.status = 'Review';
            nextStatus = 'Review';
            sendNotification('Auto Review Triggered', `All checklist items complete for ${taskId}. Moved to Review queue.`, 'approval', taskId);
          }
          return updatedTask;
        }
        return task;
      })
    );
    taskService.updateTask(taskId, nextStatus ? { checklist: finalChecklist, status: nextStatus } : { checklist: finalChecklist })
      .catch(err => console.warn('Toggle checklist API sync warning:', err));
  };

  const approveTask = (taskId, remark = 'Approved by supervisor') => {
    changeTaskStatus(taskId, 'Approved', remark);
    sendNotification('Task Approved', `Task ${taskId} was approved by ${activeUser.name}`, 'approval', taskId);
  };

  const rejectTask = (taskId, reason = 'Changes requested') => {
    changeTaskStatus(taskId, 'Rejected', `Rejection Reason: ${reason}`);
    sendNotification('Task Rejected', `Task ${taskId} was rejected. Reason: ${reason}`, 'approval', taskId);
  };

  const addCustomStatus = (statusObj) => {
    setStatuses(prev => [...prev, statusObj]);
    addAuditLog('WORKFLOW_UPDATE', `Added custom workflow stage: ${statusObj.label}`);
  };

  const addCustomField = (fieldObj) => {
    setCustomFields(prev => [...prev, fieldObj]);
    addAuditLog('SETTINGS_UPDATE', `Added custom field: ${fieldObj.name}`);
  };

  const addAutomation = (automationObj) => {
    setAutomations(prev => [...prev, automationObj]);
    addAuditLog('AUTOMATION_ADDED', `Created automation rule: ${automationObj.name}`);
  };

  const updateUserKraAndKpi = (userId, newKpi, newKraList, review) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            kpi: newKpi || u.kpi,
            kraList: newKraList || u.kraList,
            performanceReview: review || u.performanceReview
          };
        }
        return u;
      })
    );
    addAuditLog('USER_UPDATE', `Updated KPI/KRA profile for user ${userId}`);
  };

  const updateUserProfile = async (targetUserId, updates) => {
    try {
      const res = await userService.updateProfile(targetUserId, updates);

      setUsers(prev =>
        prev.map(u => {
          if (String(u.id) === String(targetUserId)) {
            return { ...u, ...updates, ...(res?.user || {}) };
          }
          return u;
        })
      );

      if (activeUser && String(activeUser.id) === String(targetUserId)) {
        const updated = { ...activeUser, ...updates, ...(res?.user || {}) };
        safeSetLocalStorage('taskpulse_active_user', updated);
      }

      addAuditLog('USER_UPDATE', `Updated profile and avatar for user ${targetUserId}`);
      sendNotification('Profile Updated', 'Profile photo & details updated successfully!', 'success');
      return { success: true, user: res?.user };
    } catch (err) {
      console.warn('Profile update fallback notice:', err);
      setUsers(prev =>
        prev.map(u => {
          if (String(u.id) === String(targetUserId)) {
            return { ...u, ...updates };
          }
          return u;
        })
      );
      if (activeUser && String(activeUser.id) === String(targetUserId)) {
        safeSetLocalStorage('taskpulse_active_user', { ...activeUser, ...updates });
      }
      return { success: true };
    }
  };

  const registerUser = async (regData) => {
    try {
      const res = await authService.register(regData);
      if (res && res.success && res.user) {
        const newUser = res.user;
        setUsers(prev => [newUser, ...prev.filter(u => u.id !== newUser.id)]);

        // Only switch session if no user was currently logged in
        if (!isAuthenticated) {
          setActiveUserId(newUser.id);
          setIsAuthenticated(true);
          safeSetLocalStorage('taskpulse_active_user_id', newUser.id);
          safeSetLocalStorage('taskpulse_is_authenticated', true);

          const role = newUser.role;
          if (role === 'Admin' || role === 'MD') {
            setPanelMode('admin');
            setActiveView('dashboard');
          } else if (role === 'EA') {
            setPanelMode('ea');
            setActiveView('eaPanel');
          } else if (role === 'Manager') {
            setPanelMode('manager');
            setActiveView('managerPanel');
          } else {
            setPanelMode('employee');
            setActiveView('employeePanel');
          }
        }

        addAuditLog(
          'USER_REGISTER',
          `Registered user account: ${newUser.name} (${newUser.role} • ${newUser.department})`
        );
        sendNotification(
          'Member Added',
          `New member ${newUser.name} added successfully!`,
          'success'
        );

        return { success: true, user: newUser, pendingUser: newUser };
      }
      return { success: false, error: res?.error || 'Registration failed' };
    } catch (e) {
      console.warn('API register error:', e);
      const errText = e.response?.data?.error || e.message || 'Registration failed';
      return { success: false, error: errText };
    }
  };

  const resendManagerOtp = async () => ({ success: true, message: 'OTP disabled' });
  const verifyManagerOtp = async () => ({ success: true, message: 'OTP disabled' });


  const addLeaveRequest = async (leaveData) => {
    const newLeave = {
      id: `lev-${Date.now()}`,
      ...leaveData,
      status: 'Pending',
      appliedDate: new Date().toISOString(),
      managerRemark: ''
    };

    setLeaves(prev => [newLeave, ...prev]);

    try {
      await leaveService.applyLeave(leaveData);
    } catch (e) {
      console.warn('API sync warning:', e);
    }

    addAuditLog('LEAVE_APPLY', `Applied for ${newLeave.leaveType} (${newLeave.totalDays} Days)`);
    sendNotification('Leave Request Submitted', `${newLeave.userName} applied for ${newLeave.leaveType} (${newLeave.startDate} to ${newLeave.endDate})`, 'approval');
  };

  const approveLeaveRequest = async (leaveId, remark) => {
    setLeaves(prev =>
      prev.map(l => l.id === leaveId ? { ...l, status: 'Approved', managerRemark: remark || 'Approved by Manager' } : l)
    );

    try {
      await leaveService.approveLeave(leaveId, remark, activeUser.name);
    } catch (e) {
      console.warn('API sync warning:', e);
    }

    const leave = leaves.find(l => l.id === leaveId);
    addAuditLog('LEAVE_APPROVE', `Approved leave request ${leaveId} for ${leave?.userName || 'Employee'}`);
    sendNotification('Leave Approved', `Your leave request (${leave?.leaveType || 'Leave'}) was approved by ${activeUser.name}`, 'approval');
  };

  const rejectLeaveRequest = async (leaveId, remark) => {
    setLeaves(prev =>
      prev.map(l => l.id === leaveId ? { ...l, status: 'Rejected', managerRemark: remark || 'Rejected by Manager' } : l)
    );

    try {
      await leaveService.rejectLeave(leaveId, remark, activeUser.name);
    } catch (e) {
      console.warn('API sync warning:', e);
    }

    const leave = leaves.find(l => l.id === leaveId);
    addAuditLog('LEAVE_REJECT', `Rejected leave request ${leaveId} for ${leave?.userName || 'Employee'}`);
    sendNotification('Leave Rejected', `Your leave request (${leave?.leaveType || 'Leave'}) was rejected. Reason: ${remark}`, 'approval');
  };

  const addEaFollowUp = async (followUpData) => {
    const newLog = {
      id: `fa-${Date.now()}`,
      ...followUpData,
      loggedAt: new Date().toISOString()
    };

    setEaFollowUps(prev => [newLog, ...prev]);

    try {
      await eaService.logFollowUp(followUpData);
    } catch (e) {
      console.warn('API sync warning:', e);
    }

    addAuditLog('EA_FOLLOWUP_LOG', `EA logged follow-up on ${newLog.taskId}: "${newLog.actionNotes}"`);
    sendNotification(
      '📋 EA Follow-Up Update',
      `${activeUser?.name || 'EA'} logged follow-up for task ${newLog.taskId}. Action required: "${newLog.actionRequired}"`,
      newLog.isEscalatedToMd ? 'approval' : 'info',
      newLog.taskId
    );
  };

  const scheduleEaMeeting = async (meetingData) => {
    const newMeeting = {
      id: `mtg-${Date.now()}`,
      ...meetingData,
      status: 'Scheduled',
      createdAt: new Date().toISOString()
    };

    setEaMeetings(prev => [newMeeting, ...prev]);

    try {
      await eaService.scheduleMeeting(meetingData);
    } catch (e) {
      console.warn('API sync warning:', e);
    }

    addAuditLog('EA_MEETING_SCHEDULED', `EA scheduled executive meeting: "${newMeeting.title}" for ${newMeeting.date} at ${newMeeting.time}`);
    sendNotification('📅 New Executive Meeting Allotted', `${activeUser?.name || 'EA'} allotted meeting "${newMeeting.title}" for ${newMeeting.date} at ${newMeeting.time}`, 'info');
  };

  const deleteEaMeeting = async (meetingId) => {
    setEaMeetings(prev => prev.filter(m => m.id !== meetingId));

    try {
      await eaService.deleteMeeting(meetingId);
    } catch (e) {
      console.warn('API sync warning:', e);
    }

    addAuditLog('EA_MEETING_DELETED', `Executive meeting "${meetingId}" deleted`);
  };

  const toggleEaDailyTask = async (taskId) => {
    setEaDailyTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const isCompleted = !t.completed;
          return {
            ...t,
            completed: isCompleted,
            completedAt: isCompleted ? new Date().toISOString() : null
          };
        }
        return t;
      })
    );

    try {
      await eaService.toggleDailyTask(taskId);
    } catch (e) {
      console.warn('API sync warning:', e);
    }

    const taskItem = eaDailyTasks.find(t => t.id === taskId);
    addAuditLog('EA_DAILY_TASK_TOGGLE', `EA toggled daily routine task "${taskItem?.title || taskId}"`);
  };

  const createEaDailyTask = async ({ title, timeSlot, notes, category }) => {
    const newTask = {
      id: `ead-${Date.now()}`,
      title,
      timeSlot: timeSlot || '09:00 AM',
      category: category || 'Executive Routine',
      completed: false,
      completedAt: null,
      notes: notes || 'Daily working line logged.'
    };

    setEaDailyTasks(prev => [...prev, newTask]);

    try {
      await eaService.createDailyTask(newTask);
    } catch (e) {
      console.warn('API sync warning:', e);
    }

    addAuditLog('EA_DAILY_TASK_CREATED', `EA added daily routine working line "${newTask.title}"`);
    return newTask;
  };

  const deleteEaDailyTask = async (taskId) => {
    setEaDailyTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      await eaService.deleteDailyTask(taskId);
    } catch (e) {
      console.warn('API sync warning:', e);
    }

    addAuditLog('EA_DAILY_TASK_DELETED', `EA deleted daily routine task "${taskId}"`);
  };

  // ==========================================
  // WORKSPACE PRODUCTIVITY ACTION HANDLERS
  // ==========================================

  const createReminder = async (reminderData) => {
    const tempReminder = {
      id: `rem-${Date.now()}`,
      userId: activeUser?.id || 'usr-1',
      userName: activeUser?.name || 'User',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      ...reminderData
    };
    setReminders(prev => [tempReminder, ...prev]);

    triggerRealtimeToast({
      title: '⏰ Reminder Set',
      message: `${tempReminder.title} (Due: ${tempReminder.dueDate} at ${tempReminder.dueTime || '09:00'})`,
      type: 'info'
    });

    try {
      const res = await workspaceService.createReminder(reminderData);
      if (res?.success && res.reminder) {
        setReminders(prev => prev.map(r => r.id === tempReminder.id ? res.reminder : r));
      }
    } catch (e) {
      console.warn('API create reminder fallback:', e);
    }
  };

  const toggleReminderStatus = async (id, status) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    try {
      await workspaceService.toggleReminderStatus(id, status);
    } catch (e) {
      console.warn('API toggle reminder status fallback:', e);
    }
  };

  const deleteReminder = async (id) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    try {
      await workspaceService.deleteReminder(id);
    } catch (e) {
      console.warn('API delete reminder fallback:', e);
    }
  };

  const createTimeLog = async (logData) => {
    const tempLog = {
      id: `tim-${Date.now()}`,
      userId: activeUser?.id || 'usr-1',
      userName: activeUser?.name || 'User',
      createdAt: new Date().toISOString(),
      ...logData
    };
    setTimeLogs(prev => [tempLog, ...prev]);

    // Update actual_hours on local task state immediately
    if (logData.taskId && logData.hours) {
      setTasks(prev => prev.map(t => {
        if (t.id === logData.taskId) {
          const newActual = Number(((Number(t.actualHours) || 0) + Number(logData.hours)).toFixed(2));
          return { ...t, actualHours: newActual };
        }
        return t;
      }));
    }

    triggerRealtimeToast({
      title: '⏱️ Time Recorded',
      message: `Logged ${logData.hours}h on "${logData.taskTitle || 'Task'}"`,
      type: 'success'
    });

    try {
      const res = await workspaceService.createTimeLog(logData);
      if (res?.success && res.timeLog) {
        setTimeLogs(prev => prev.map(l => l.id === tempLog.id ? res.timeLog : l));
      }
    } catch (e) {
      console.warn('API create time log fallback:', e);
    }
  };

  const deleteTimeLog = async (id) => {
    setTimeLogs(prev => prev.filter(l => l.id !== id));
    try {
      await workspaceService.deleteTimeLog(id);
    } catch (e) {
      console.warn('API delete time log fallback:', e);
    }
  };

  const createDocument = async (docData) => {
    const tempDoc = {
      id: `doc-${Date.now()}`,
      userId: activeUser?.id || 'usr-1',
      authorName: activeUser?.name || 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...docData
    };
    setDocuments(prev => [tempDoc, ...prev]);

    triggerRealtimeToast({
      title: '📄 Document Published',
      message: `"${tempDoc.title}" published in ${tempDoc.category}`,
      type: 'success'
    });

    try {
      const res = await workspaceService.createDocument(docData);
      if (res?.success && res.document) {
        setDocuments(prev => prev.map(d => d.id === tempDoc.id ? res.document : d));
      }
    } catch (e) {
      console.warn('API create document fallback:', e);
    }
  };

  const updateDocument = async (id, updates) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d));
    try {
      await workspaceService.updateDocument(id, updates);
    } catch (e) {
      console.warn('API update document fallback:', e);
    }
  };

  const deleteDocument = async (id) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    try {
      await workspaceService.deleteDocument(id);
    } catch (e) {
      console.warn('API delete document fallback:', e);
    }
  };

  const createNote = async (noteData) => {
    const tempNote = {
      id: `not-${Date.now()}`,
      userId: activeUser?.id || 'usr-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...noteData
    };
    setNotes(prev => [tempNote, ...prev]);

    triggerRealtimeToast({
      title: '📝 Note Saved',
      message: `"${tempNote.title}" saved to your scratchpad`,
      type: 'info'
    });

    try {
      const res = await workspaceService.createNote(noteData);
      if (res?.success && res.note) {
        setNotes(prev => prev.map(n => n.id === tempNote.id ? res.note : n));
      }
    } catch (e) {
      console.warn('API create note fallback:', e);
    }
  };

  const updateNote = async (id, updates) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n));
    try {
      await workspaceService.updateNote(id, updates);
    } catch (e) {
      console.warn('API update note fallback:', e);
    }
  };

  const deleteNote = async (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    try {
      await workspaceService.deleteNote(id);
    } catch (e) {
      console.warn('API delete note fallback:', e);
    }
  };

  const createCustomList = async (listData) => {
    const tempList = {
      id: `lst-${Date.now()}`,
      userId: activeUser?.id || 'usr-1',
      createdAt: new Date().toISOString(),
      ...listData
    };
    setCustomLists(prev => [tempList, ...prev]);

    triggerRealtimeToast({
      title: '📋 Custom List Created',
      message: `"${tempList.name}" is ready`,
      type: 'success'
    });

    try {
      const res = await workspaceService.createList(listData);
      if (res?.success && res.list) {
        setCustomLists(prev => prev.map(l => l.id === tempList.id ? res.list : l));
      }
    } catch (e) {
      console.warn('API create list fallback:', e);
    }
  };

  const updateCustomList = async (id, updates) => {
    setCustomLists(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    try {
      await workspaceService.updateList(id, updates);
    } catch (e) {
      console.warn('API update list fallback:', e);
    }
  };

  const deleteCustomList = async (id) => {
    setCustomLists(prev => prev.filter(l => l.id !== id));
    try {
      await workspaceService.deleteList(id);
    } catch (e) {
      console.warn('API delete list fallback:', e);
    }
  };


  const login = async (email, password, quickUserId = null) => {
    try {
      const res = await authService.login(email, password, quickUserId);
      if (res && res.success && res.user) {
        const targetUser = res.user;
        setActiveUserId(targetUser.id);
        setIsAuthenticated(true);
        safeSetLocalStorage('taskpulse_active_user_id', targetUser.id);
        safeSetLocalStorage('taskpulse_is_authenticated', true);

        setUsers(prev => {
          const exists = prev.some(u => u.id === targetUser.id);
          return exists ? prev.map(u => u.id === targetUser.id ? targetUser : u) : [targetUser, ...prev];
        });

        if (targetUser.role === 'Admin' || targetUser.role === 'MD') {
          setPanelMode('admin');
          setActiveView('dashboard');
        } else if (targetUser.role === 'EA') {
          setPanelMode('ea');
          setActiveView('eaPanel');
        } else if (targetUser.role === 'Manager') {
          setPanelMode('manager');
          setActiveView('managerPanel');
        } else {
          setPanelMode('employee');
          setActiveView('employeePanel');
        }

        addAuditLog('USER_LOGIN', `User ${targetUser.name} (${targetUser.role}) logged in.`);
        sendNotification('Session Started', `Welcome back, ${targetUser.name}!`, 'info');

        return { success: true, user: targetUser };
      }
      return { success: false, error: res?.error || 'Invalid credentials' };
    } catch (err) {
      console.warn('Login request error:', err);
      const msg = err.response?.data?.error || err.message || 'Login failed. Please check your email and password.';
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    if (activeUser?.name) {
      addAuditLog('USER_LOGOUT', `User ${activeUser.name} logged out.`);
    }
    setIsAuthenticated(false);
    setActiveUserId('');
    safeSetLocalStorage('taskpulse_is_authenticated', false);
    safeSetLocalStorage('taskpulse_active_user_id', '');
  };

  const sendChatMessage = (
    channelId,
    text = '',
    taskAttachment = null,
    imageUrl = null,
    audioUrl = null,
    fileAttachment = null,
    taggedUserId = null,
    requireEaFollowup = false,
    overrideAiMode = null
  ) => {
    if (!text?.trim() && !taskAttachment && !imageUrl && !audioUrl && !fileAttachment && !taggedUserId) return;

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newMsg = {
      id: messageId,
      channelId,
      senderId: activeUser.id,
      senderName: activeUser.name,
      senderRole: activeUser.role,
      senderAvatar: activeUser.avatar,
      text: (text || '').trim(),
      imageUrl: imageUrl || null,
      audioUrl: audioUrl || null,
      fileAttachment: fileAttachment || null,
      taggedUserId: taggedUserId || null,
      requireEaFollowup: Boolean(requireEaFollowup),
      reactions: {},
      timestamp: new Date().toISOString(),
      taskAttachment: taskAttachment || null,
      status: 'sending'
    };

    setChatMessages(prev => ({
      ...prev,
      [channelId]: [...(prev[channelId] || []), newMsg]
    }));

    setChatChannels(prev =>
      prev.map(c => c.id === channelId ? { ...c, unreadCount: 0 } : c)
    );

    chatService.sendMessage({
      id: messageId,
      channelId,
      senderId: activeUser.id,
      senderName: activeUser.name,
      senderRole: activeUser.role,
      senderAvatar: activeUser.avatar,
      text: (text || '').trim(),
      imageUrl: imageUrl || null,
      audioUrl: audioUrl || null,
      fileAttachment: fileAttachment || null,
      taskAttachment,
      isAi: false
    }).then(res => {
      if (res && res.success && res.message) {
        const confirmed = res.message;
        setChatMessages(prev => {
          const list = prev[channelId] || [];
          const idx = list.findIndex(m => m.id === messageId || m.id === confirmed.id);
          if (idx !== -1) {
            const updated = [...list];
            updated[idx] = { ...updated[idx], ...confirmed, status: 'sent' };
            return { ...prev, [channelId]: updated };
          }
          return prev;
        });
      }
    }).catch(err => console.warn('Chat send message warning:', err));

    const isAiTarget = channelId === 'chan-ai' || channelId.startsWith('chan-ai-');
    if (isAiTarget && (text || imageUrl || taggedUserId)) {
      setTimeout(() => {
        const promptText = (text || '').trim() || (imageUrl ? 'Please check this image and identify the Lot Number and production details.' : '');
        generatePulseBotAiReply(promptText, imageUrl, taggedUserId, requireEaFollowup, channelId, overrideAiMode || aiQueryMode);
      }, 600);
    }
  };

  const reactToMessage = (messageId, channelId, emoji) => {
    setChatMessages(prev => {
      const list = prev[channelId] || [];
      return {
        ...prev,
        [channelId]: list.map(m => {
          if (m.id === messageId) {
            const reactions = { ...(m.reactions || {}) };
            const users = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];
            const exists = users.includes(activeUser.name);
            if (exists) {
              reactions[emoji] = users.filter(u => u !== activeUser.name);
              if (reactions[emoji].length === 0) delete reactions[emoji];
            } else {
              reactions[emoji] = [...users, activeUser.name];
            }
            return { ...m, reactions };
          }
          return m;
        })
      };
    });

    chatService.toggleReaction(messageId, emoji, activeUser.id, activeUser.name)
      .catch(err => console.warn('Reaction sync notice:', err));
  };

  const deleteChatMessage = async (messageId, channelId) => {
    if (!messageId) return;
    setChatMessages(prev => {
      if (!channelId) {
        const updated = { ...prev };
        Object.keys(updated).forEach(cid => {
          updated[cid] = (updated[cid] || []).filter(m => m.id !== messageId);
        });
        return updated;
      }
      return {
        ...prev,
        [channelId]: (prev[channelId] || []).filter(m => m.id !== messageId)
      };
    });

    try {
      await chatService.deleteMessage(messageId, channelId);
    } catch (err) {
      console.warn('Delete chat message warning:', err);
    }
  };

  const clearChat = async (channelId) => {
    if (!channelId) return;
    setChatMessages(prev => ({
      ...prev,
      [channelId]: []
    }));

    try {
      await chatService.clearChannelMessages(channelId);
      triggerRealtimeToast({
        title: 'Chat Cleared',
        message: 'All messages in this conversation have been cleared.',
        type: 'info'
      });
    } catch (err) {
      console.warn('Clear chat warning:', err);
    }
  };

  const deleteChatChannel = async (channelId) => {
    if (!channelId) return;
    setChatChannels(prev => prev.filter(c => c.id !== channelId));
    setChatMessages(prev => {
      const next = { ...prev };
      delete next[channelId];
      return next;
    });

    try {
      await chatService.deleteChannel(channelId);
      triggerRealtimeToast({
        title: 'Conversation Deleted',
        message: 'Chat conversation has been deleted successfully.',
        type: 'info'
      });
    } catch (err) {
      console.warn('Delete channel warning:', err);
    }
  };

  const startDirectChat = async (targetUser) => {
    if (!targetUser || !targetUser.id || !activeUser?.id) return;
    const sorted = [activeUser.id, targetUser.id].sort();
    const channelId = `dm-${sorted.join('-')}`;

    const dmChannel = {
      id: channelId,
      name: targetUser.name,
      type: 'direct',
      roleBadge: `${targetUser.role} • ${targetUser.department || 'Team'}`,
      avatar: targetUser.avatar,
      participantIds: [activeUser.id, targetUser.id],
      isPrivate: true,
      targetUser,
      unreadCount: 0
    };

    setChatChannels(prev => {
      const existsIndex = prev.findIndex(c => c.id === channelId);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = {
          ...updated[existsIndex],
          name: targetUser.name,
          roleBadge: `${targetUser.role} • ${targetUser.department || 'Team'}`,
          avatar: targetUser.avatar,
          targetUser
        };
        return updated;
      }
      return [dmChannel, ...prev];
    });

    chatService.createOrGetDirectChannel(activeUser.id, targetUser.id)
      .catch(err => console.warn('Direct channel API sync warning:', err));

    setActiveChannelId(channelId);
    if (typeof setActiveView === 'function') {
      setActiveView('chat');
    }
  };

  const createGroupChat = async ({ name, description = '', memberIds = [] }) => {
    try {
      const res = await chatService.createGroupChannel({
        name,
        description,
        memberIds,
        creatorId: activeUser?.id,
        creatorName: activeUser?.name
      });
      if (res && (res.channel || res.data?.channel)) {
        const newChan = res.channel || res.data.channel;
        setChatChannels(prev => {
          if (prev.some(c => c.id === newChan.id)) return prev;
          return [newChan, ...prev];
        });
        setActiveChannelId(newChan.id);
        return newChan;
      }
    } catch (err) {
      console.error('Failed to create group chat:', err);
      throw err;
    }
  };

  const publishStatus = async ({ type, content, mediaUrl, backgroundColor, textColor, fontStyle, privacyType, privacyUsers }) => {
    try {
      const pType = privacyType || statusPrivacy.privacyType || 'contacts';
      const pUsers = privacyUsers || (pType === 'except' ? statusPrivacy.excludedUsers : pType === 'only' ? statusPrivacy.allowedUsers : []);

      const res = await statusService.createStatus({
        userId: activeUser.id,
        userName: activeUser.name,
        userAvatar: activeUser.avatar || '',
        type,
        content,
        mediaUrl,
        backgroundColor,
        textColor,
        fontStyle,
        privacyType: pType,
        privacyUsers: pUsers
      });

      if (res && res.success && res.status) {
        await loadStatusFeed(activeUser.id);
        triggerRealtimeToast({
          title: 'Status Published',
          message: 'Your status is now live for 24 hours.',
          type: 'info'
        });
        return res.status;
      }
    } catch (error) {
      console.error('Failed to publish status:', error);
      throw error;
    }
  };

  const viewStatus = async (statusId) => {
    if (!statusId || !activeUser?.id) return;
    try {
      setStatusFeed(prev => {
        if (!prev) return prev;
        const markStatusInList = (list) => (list || []).map(group => {
          const updatedStatuses = group.statuses.map(s => s.id === statusId ? { ...s, has_viewed: true } : s);
          const hasUnviewed = updatedStatuses.some(s => !s.has_viewed);
          return { ...group, statuses: updatedStatuses, hasUnviewed };
        });

        const updatedRecent = markStatusInList(prev.recentUpdates || []);
        const newlyViewedGroups = updatedRecent.filter(g => !g.hasUnviewed);
        const remainingRecent = updatedRecent.filter(g => g.hasUnviewed);
        const updatedViewed = [...(prev.viewedUpdates || []), ...newlyViewedGroups];

        return {
          ...prev,
          recentUpdates: remainingRecent,
          viewedUpdates: updatedViewed
        };
      });

      await statusService.recordStatusView(statusId, {
        viewerId: activeUser.id,
        viewerName: activeUser.name,
        viewerAvatar: activeUser.avatar || ''
      });
    } catch (e) {
      console.warn('Record status view notice:', e);
    }
  };

  const fetchStatusViews = async (statusId) => {
    if (!statusId || !activeUser?.id) return { views: [], totalViews: 0 };
    try {
      const res = await statusService.getStatusViews(statusId, activeUser.id);
      if (res && res.success) {
        return {
          views: res.views || [],
          totalViews: res.totalViews || 0
        };
      }
      return { views: [], totalViews: 0 };
    } catch (e) {
      console.error('Failed to fetch status views:', e);
      return { views: [], totalViews: 0 };
    }
  };

  const removeStatus = async (statusId) => {
    if (!statusId || !activeUser?.id) return;
    try {
      await statusService.deleteStatus(statusId, activeUser.id);
      await loadStatusFeed(activeUser.id);
      triggerRealtimeToast({
        title: 'Status Deleted',
        message: 'Your status update was removed.',
        type: 'info'
      });
    } catch (e) {
      console.error('Failed to delete status:', e);
      throw e;
    }
  };

  const saveStatusPrivacy = async (settings) => {
    if (!activeUser?.id) return;
    try {
      await statusService.updateStatusPrivacy(activeUser.id, settings);
      setStatusPrivacy(settings);
      safeSetLocalStorage('taskpulse_status_privacy', settings);
      triggerRealtimeToast({
        title: 'Privacy Updated',
        message: 'Status privacy preferences saved.',
        type: 'info'
      });
    } catch (e) {
      console.error('Failed to update status privacy:', e);
      throw e;
    }
  };

  const sendStatusReply = async (statusId, text, contactUser = null) => {
    if (!statusId || !text || !activeUser?.id) return;
    try {
      const res = await statusService.replyToStatus(statusId, {
        senderId: activeUser.id,
        senderName: activeUser.name,
        senderRole: activeUser.role,
        senderAvatar: activeUser.avatar || '',
        text
      });
      if (res && res.success) {
        if (res.channelId && res.message) {
          setChatMessages(prev => {
            const list = prev[res.channelId] || [];
            if (list.some(m => m.id === res.message.id)) return prev;
            return {
              ...prev,
              [res.channelId]: [...list, res.message]
            };
          });

          const target = contactUser || res.targetUser;
          if (target && target.id) {
            setChatChannels(prev => {
              if (prev.some(c => c.id === res.channelId)) return prev;
              const newDmChannel = {
                id: res.channelId,
                name: target.name || 'Contact',
                type: 'direct',
                roleBadge: `${target.role || 'Team Member'} • ${target.department || 'Team'}`,
                avatar: target.avatar || '',
                participantIds: [activeUser.id, target.id],
                isPrivate: true,
                targetUser: target,
                unreadCount: 0,
                last_message_at: new Date().toISOString()
              };
              return [newDmChannel, ...prev];
            });
          }
        }

        triggerRealtimeToast({
          title: 'Reply Sent',
          message: `Your reply was delivered to ${contactUser?.name || 'chat'}.`,
          type: 'chat',
          channelId: res.channelId
        });
        return res;
      }
    } catch (e) {
      console.error('Failed to send status reply:', e);
      throw e;
    }
  };

  const openStatusStory = (userGroup, startIndex = 0, allGroups = []) => {
    setActiveStatusStory({ userGroup, startIndex, allGroups });
  };

  const closeStatusStory = () => {
    setActiveStatusStory(null);
  };

  const generatePulseBotAiReply = async (userPrompt, imageUrl = null, taggedUserId = null, requireEaFollowup = false, targetChannelId = null, overrideAiMode = null) => {
    setIsAiTyping(true);
    const resolvedChannelId = targetChannelId || (activeUser?.id ? `chan-ai-${activeUser.id}` : 'chan-ai');
    const selectedMode = overrideAiMode || aiQueryMode || 'auto';
    let replyText = '';
    let isN8n = false;
    let pdfAttachment = null;
    let imageAttachment = null;
    let imageGallery = null;
    let trackingData = null;
    let delegatedTask = null;

    let returnedMessage = null;

    try {
      const res = await chatService.askAiAssistant({
        message: userPrompt,
        imageUrl,
        sessionId: `user-${activeUser?.id || 'usr-1'}`,
        channelId: resolvedChannelId,
        userId: activeUser?.id || 'usr-1',
        taggedUserId,
        requireEaFollowup,
        aiMode: selectedMode
      });

      if (res && res.success && res.message) {
        returnedMessage = res.message;
        replyText = res.message.text;
        isN8n = Boolean(res.message.isN8nConnected);
        pdfAttachment = res.message.pdfAttachment || null;
        imageAttachment = res.message.imageAttachment || null;
        imageGallery = res.message.imageGallery || null;
        trackingData = res.message.trackingData || null;
        delegatedTask = res.message.delegatedTask || null;

        // Automatically sync newly delegated task into tasks state if not already present
        if (delegatedTask && delegatedTask.id) {
          setTasks(prev => {
            if (prev.some(t => t.id === delegatedTask.id)) return prev;
            return [{
              id: delegatedTask.id,
              title: delegatedTask.title,
              description: delegatedTask.description || '',
              category: 'Production & Operations',
              department: delegatedTask.assignee?.department || activeUser?.department || 'Operations',
              project: 'Factory Suite Pro',
              assigneeId: delegatedTask.assignee?.id,
              coAssignees: [],
              creatorId: delegatedTask.creator?.id || activeUser?.id,
              approvalOwnerId: activeUser?.id,
              priority: delegatedTask.priority || 'High',
              status: delegatedTask.status || 'Assigned',
              startDate: new Date().toISOString().slice(0, 16),
              dueDate: delegatedTask.dueDate || new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
              tags: ['AI-Delegated', ...(delegatedTask.hasEaFollowup ? ['EA-Followup'] : [])],
              checklist: [],
              comments: [],
              activityLog: [
                {
                  id: `act-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  userId: activeUser?.id,
                  action: `Task created via AI Copilot by ${activeUser?.name} and assigned to ${delegatedTask.assignee?.name}`
                }
              ],
              progress: 0,
              followups: []
            }, ...prev];
          });
        }
      }
    } catch (err) {
      console.warn('AI Assistant service call error:', err);
    } finally {
      setIsAiTyping(false);
    }

    if (!replyText) {
      const promptLower = (userPrompt || '').toLowerCase();
      if (promptLower.includes('overdue') || promptLower.includes('late')) {
        const overdue = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Approved' && new Date(t.dueDate) < new Date());
        if (overdue.length === 0) {
          replyText = "🎉 Excellent news! There are currently 0 overdue tasks across all departments.";
        } else {
          const listStr = overdue.map(t => `• ${t.id}: "${t.title}" (Due: ${t.dueDate.slice(0,10)}, Assignee: ${users.find(u => u.id === t.assigneeId)?.name || 'Team'})`).join('\n');
          replyText = `⚠️ I found ${overdue.length} overdue task(s) requiring immediate focus:\n\n${listStr}`;
        }
      } else if (promptLower.includes('kpi') || promptLower.includes('rating') || promptLower.includes('score') || promptLower.includes('performer')) {
        const topPerformers = [...users].sort((a, b) => (b.kpi?.onTimeRate || 0) - (a.kpi?.onTimeRate || 0)).slice(0, 3);
        const perfList = topPerformers.map(u => `• ${u.name} (${u.role}): ${u.kpi?.onTimeRate || 90}% On-Time Delivery`).join('\n');
        replyText = `📊 Top KPI Performers Matrix:\n\n${perfList}\n\nOrg Average On-Time Rate: 94.8%. All team targets are on track!`;
      } else if (promptLower.includes('approval') || promptLower.includes('review') || promptLower.includes('pending')) {
        const reviews = tasks.filter(t => t.status === 'Review');
        if (reviews.length === 0) {
          replyText = "✅ No pending supervisor reviews right now. All team submissions are signed off!";
        } else {
          const revList = reviews.map(t => `• ${t.id}: "${t.title}" (Est: ${t.estimatedHours}h / Act: ${t.actualHours}h)`).join('\n');
          replyText = `📋 Tasks Awaiting Supervisor Sign-off (${reviews.length}):\n\n${revList}`;
        }
      } else if (promptLower.includes('task') || promptLower.includes('summary') || promptLower.includes('status') || promptLower.includes('count')) {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'Completed' || t.status === 'Approved').length;
        const inProg = tasks.filter(t => t.status === 'In Progress' || t.status === 'Review').length;
        replyText = `📈 Current System Task Summary:\n• Total Active Tasks: ${total}\n• Completed / Approved: ${completed} (${Math.round((completed/total)*100)}%)\n• In Progress / Review: ${inProg}\n\nLet me know if you would like me to inspect a specific team or department!`;
      } else {
        replyText = `🤖 Hello ${activeUser?.name || 'User'}! I am PulseBot AI, powered by your live n8n AI Agent workflow. Ask me any questions and I will process them through the connected workflow!`;
      }
    }

    const aiMsg = returnedMessage || {
      id: `msg-ai-${Date.now()}`,
      channelId: resolvedChannelId,
      senderId: 'pulse-bot',
      senderName: isN8n ? 'PulseBot AI (Gemini)' : 'PulseBot AI',
      senderAvatar: '🤖',
      senderRole: 'AI Assistant',
      text: replyText,
      timestamp: new Date().toISOString(),
      isAi: true,
      pdfAttachment,
      imageAttachment,
      imageGallery,
      trackingData,
      delegatedTask
    };

    setChatMessages(prev => {
      const list = prev[resolvedChannelId] || [];
      if (list.some(m => m.id === aiMsg.id)) return prev;
      return {
        ...prev,
        [resolvedChannelId]: [...list, aiMsg]
      };
    });
  };


  const toggleAutomation = (ruleId) => {
    setAutomations(prev =>
      prev.map(rule => rule.id === ruleId ? { ...rule, active: !rule.active } : rule)
    );
  };

  const checkAutomationsOnTaskCreate = (task) => {
    automations.forEach(rule => {
      if (rule.active && rule.id === 'rule-2' && task.category === 'Infrastructure & DevOps') {
        reassignTask(task.id, 'usr-1');
        rule.executionCount = (rule.executionCount || 0) + 1;
      }
    });
  };

  const resetToMockData = () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('LocalStorage clear warning:', e);
    }
    setTasks([]);
    setDeletedTasks([]);
    setUsers([]);
    setDepartments(initialDepartments);
    setStatuses(initialStatuses);
    setAutomations(initialAutomations);
    setAuditLogs([]);
    setNotifications([]);
    setLeaves([]);
    setEaFollowUps([]);
    setEaMeetings([]);
    setEaDailyTasks([]);
    setTheme('light');
    safeSetLocalStorage('taskpulse_theme', 'light');
    setActiveUserId('');
    setIsAuthenticated(false);
  };


  return (
    <TaskContext.Provider
      value={{
        tasks,
        deletedTasks,
        users,
        departments,
        statuses,
        automations,
        auditLogs,
        notifications,
        templates,
        taskCategories,
        customFields,
        activeUser,
        currentUser: activeUser,
        activeUserId,
        setActiveUserId,
        updateUserKraAndKpi,
        theme,
        effectiveTheme,
        setTheme,
        panelMode,
        setPanelMode,
        chatChannels,
        setChatChannels,
        chatMessages,
        chatPagination,
        loadMoreMessages,
        activeChannelId,
        setActiveChannelId,
        sendChatMessage,
        deleteChatMessage,
        clearChat,
        deleteChatChannel,
        activeView,
        setActiveView,
        selectedTaskId,
        setSelectedTaskId,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isAuthenticated,
        setIsAuthenticated,
        login,
        logout,
        pendingUsers,
        isRegisterModalOpen,
        setIsRegisterModalOpen,
        registerUser,
        resendManagerOtp,
        verifyManagerOtp,
        editingTask,
        setEditingTask,
        activeTimer,
        startTimer,
        pauseTimer,
        stopTimer,
        addTask,
        updateTask,
        deleteTask,
        restoreTask,
        changeTaskStatus,
        changeTaskPriority,
        reassignTask,
        addDailyFollowup,
        updateTaskProgress,
        sendNotification,
        bulkUpdateStatus,
        bulkDeleteTasks,
        logTime,
        addComment,
        addChecklistItem,
        toggleChecklistItem,
        approveTask,
        rejectTask,
        addCustomStatus,
        addCustomField,
        addAutomation,
        toggleAutomation,
        setNotifications,
        resetToMockData,
        leaves,
        viewingUserProfile,
        setViewingUserProfile,
        addLeaveRequest,
        approveLeaveRequest,
        rejectLeaveRequest,
        eaFollowUps,
        addEaFollowUp,
        eaMeetings,
        eaDailyTasks,
        scheduleEaMeeting,
        deleteEaMeeting,
        toggleEaDailyTask,
        createEaDailyTask,
        deleteEaDailyTask,
        isBackendConnected,
        isAiTyping,
        aiQueryMode,
        changeAiQueryMode,
        setAiQueryMode,
        realtimeToasts,
        dismissRealtimeToast,
        triggerRealtimeToast,
        typingUsers,
        sendTypingStatus,
        startDirectChat,
        createGroupChat,
        reactToMessage,
        updateUserProfile,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        pinnedTaskIds,
        togglePinTask,
        accentTheme,
        setAccentTheme: updateAccentTheme,
        isSidebarCollapsed,
        toggleSidebarCollapsed,
        deviceMode,
        setDeviceMode,
        toggleDeviceMode,
        isMobileView,
        statusFeed,
        statusPrivacy,
        activeStatusStory,
        isStatusCreatorOpen,
        setIsStatusCreatorOpen,
        isStatusPrivacyOpen,
        setIsStatusPrivacyOpen,
        isLoadingStatuses,
        loadStatusFeed,
        publishStatus,
        viewStatus,
        fetchStatusViews,
        removeStatus,
        saveStatusPrivacy,
        sendStatusReply,
        openStatusStory,
        closeStatusStory,
        // Universal Create Hub & Workspace Modals
        isCreateMenuOpen,
        setIsCreateMenuOpen,
        isReminderModalOpen,
        setIsReminderModalOpen,
        isTrackTimeModalOpen,
        setIsTrackTimeModalOpen,
        isDocModalOpen,
        setIsDocModalOpen,
        isNoteModalOpen,
        setIsNoteModalOpen,
        isListModalOpen,
        setIsListModalOpen,
        // Workspace Collections & Handlers
        reminders,
        timeLogs,
        documents,
        notes,
        customLists,
        createReminder,
        toggleReminderStatus,
        deleteReminder,
        createTimeLog,
        deleteTimeLog,
        createDocument,
        updateDocument,
        deleteDocument,
        createNote,
        updateNote,
        deleteNote,
        createCustomList,
        updateCustomList,
        deleteCustomList
      }}


    >
      {children}
    </TaskContext.Provider>
  );
};
