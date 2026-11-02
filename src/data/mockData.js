export const initialDepartments = [
  { id: 'dept-eng', name: 'Engineering & DevOps', code: 'ENG', icon: 'Code', lead: '' },
  { id: 'dept-prod', name: 'Product Management', code: 'PROD', icon: 'Layout', lead: '' },
  { id: 'dept-design', name: 'UI/UX Design', code: 'DES', icon: 'Palette', lead: '' },
  { id: 'dept-ops', name: 'Operations & HR', code: 'OPS', icon: 'Users', lead: '' },
  { id: 'dept-mktg', name: 'Marketing & Growth', code: 'MKT', icon: 'Megaphone', lead: '' },
  { id: 'dept-fin', name: 'Finance & Compliance', code: 'FIN', icon: 'ShieldCheck', lead: '' }
];

export const initialUsers = [];

export const taskCategories = [
  'Software Development',
  'Infrastructure & DevOps',
  'UI/UX Design',
  'Product Strategy',
  'Security & Compliance',
  'Quality Assurance',
  'Marketing Operations',
  'Executive & EA Task'
];

export const priorityLevels = ['Low', 'Normal', 'High', 'Critical'];


export const initialStatuses = [
  { id: 'Backlog', label: 'Backlog', color: 'slate', order: 0 },
  { id: 'Todo', label: 'To Do', color: 'blue', order: 1 },
  { id: 'Assigned', label: 'Assigned', color: 'indigo', order: 2 },
  { id: 'In Progress', label: 'In Progress', color: 'amber', order: 3 },
  { id: 'Review', label: 'Review / Sign-off', color: 'purple', order: 4 },
  { id: 'Approved', label: 'Approved', color: 'emerald', order: 5 },
  { id: 'Completed', label: 'Completed', color: 'emerald', order: 6 },
  { id: 'Blocked', label: 'Blocked', color: 'rose', order: 7 }
];

export const initialTaskTemplates = [
  {
    id: 'tpl-1',
    name: 'Feature Development Sprint Item',
    category: 'Software Development',
    estimatedHours: 16,
    priority: 'Normal',
    checklist: [
      { id: 'chk-1', text: 'Requirement analysis and API contract', completed: false },
      { id: 'chk-2', text: 'Unit and integration tests written', completed: false },
      { id: 'chk-3', text: 'Code review and supervisor sign-off', completed: false }
    ],
    tags: ['Feature', 'Sprint', 'Development']
  },
  {
    id: 'tpl-2',
    name: 'Bug Fix & Regression Test',
    category: 'Quality Assurance',
    estimatedHours: 4,
    priority: 'High',
    checklist: [
      { id: 'chk-4', text: 'Reproduce issue in staging environment', completed: false },
      { id: 'chk-5', text: 'Submit patch & verify fix', completed: false }
    ],
    tags: ['Bug', 'Hotfix']
  }
];

export const initialTasks = [];

export const initialAutomations = [
  {
    id: 'rule-1',
    name: 'Auto Review Trigger on Subtask Completion',
    trigger: 'All Checklist Items are Completed',
    action: 'Move Task Status from In Progress to Review',
    active: true,
    executionCount: 0
  }
];

export const initialAuditLogs = [];

export const initialNotifications = [];

export const initialChatChannels = [
  {
    id: 'chan-ai',
    name: '🤖 PulseBot AI Assistant',
    type: 'ai',
    roleBadge: 'AI Assistant',
    description: 'Ask questions about tasks, team KPIs, or restaurant orders (n8n Gemini).',
    unreadCount: 0
  },
  {
    id: 'chan-general',
    name: '# general-announcements',
    type: 'public',
    roleBadge: 'All Org Broadcast',
    description: 'Company-wide updates and announcements.',
    unreadCount: 0
  }
];

export const initialChatMessages = {
  'chan-ai': [],
  'chan-general': []
};
