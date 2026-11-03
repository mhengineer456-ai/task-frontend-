import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import {
  Settings,
  Check,
  Palette,
  Sun,
  Moon,
  Laptop,
  User,
  Bell,
  MessageSquare,
  Shield,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function SettingsView() {
  const {
    theme = 'system',
    setTheme,
    effectiveTheme = 'light',
    accentTheme = 'sapphire',
    setAccentTheme,
    activeUser,
    setViewingUserProfile,
    statuses = [],
    addCustomStatus,
    customFields = [],
    addCustomField
  } = useTaskContext();

  const [activeTab, setActiveTab] = useState('appearance');
  const [newStatusName, setNewStatusName] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');

  // Chat & Notification local toggles (simulated state)
  const [enterToSend, setEnterToSend] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [showReadReceipts, setShowReadReceipts] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleAddStatus = () => {
    if (!newStatusName.trim()) return;
    addCustomStatus({
      id: newStatusName,
      label: newStatusName,
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      badge: 'purple',
      step: (statuses || []).length + 1
    });
    setNewStatusName('');
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    addCustomField({
      id: `cf-${Date.now()}`,
      name: newFieldName,
      type: newFieldType,
      required: false
    });
    setNewFieldName('');
  };

  const handleSavePreferences = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2400);
  };

  const accents = [
    { id: 'sapphire', name: 'Apple Blue', color: '#007AFF' },
    { id: 'indigo', name: 'Electric Indigo', color: '#5856D6' },
    { id: 'cyan', name: 'Cyan Ocean', color: '#32ADE6' },
    { id: 'emerald', name: 'Emerald Mint', color: '#34C759' },
    { id: 'violet', name: 'Royal Violet', color: '#AF52DE' }
  ];

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Apple Settings Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            <Settings style={{ width: '22px', height: '22px', color: 'var(--brand-primary)' }} />
            <span>Settings & Preferences</span>
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Configure visual themes, AI behavior, user profile, and workspace workflows.
          </p>
        </div>

        {savedNotice && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '6px 14px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
            <CheckCircle2 style={{ width: '16px', height: '16px' }} />
            <span>Preferences saved</span>
          </div>
        )}
      </div>

      {/* Apple-Style Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '4px',
          borderBottom: '1px solid var(--border-color)',
          scrollbarWidth: 'none'
        }}
      >
        {[
          { id: 'appearance', label: 'Appearance & Theme', icon: Palette },
          { id: 'account', label: 'Account & Profile', icon: User },
          { id: 'chat', label: 'Chat & AI Preferences', icon: MessageSquare },
          { id: 'workflows', label: 'Workflows & Stages', icon: Layers },
          { id: 'fields', label: 'Custom Fields', icon: Sliders },
          { id: 'roles', label: 'Permissions Matrix', icon: Shield }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: 'none',
                background: isActive ? 'var(--brand-primary)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <Icon style={{ width: '15px', height: '15px' }} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: APPEARANCE & THEME (Apple 3-Card Switcher) */}
      {activeTab === 'appearance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Interface Theme</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Select between Light, Dark, or automatically match your system's appearance.
              </p>
            </div>

            {/* Apple 3-Card Theme Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              {/* Option 1: Light Mode */}
              <div
                onClick={() => setTheme('light')}
                style={{
                  border: theme === 'light' ? '2px solid var(--brand-primary)' : '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '14px',
                  cursor: 'pointer',
                  background: 'var(--bg-card)',
                  boxShadow: theme === 'light' ? '0 4px 16px var(--brand-glow)' : 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {/* Visual Preview Miniature */}
                <div style={{ height: '90px', borderRadius: '10px', background: '#FFFFFF', border: '1px solid #EAEAEA', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ width: '38px', height: '6px', background: '#EAEAEA', borderRadius: '4px' }} />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#007AFF' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ width: '60%', height: '14px', background: '#F1F1F1', borderRadius: '6px 6px 6px 2px' }} />
                    <div style={{ width: '70%', height: '14px', background: '#007AFF', alignSelf: 'flex-end', borderRadius: '6px 6px 2px 6px' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sun style={{ width: '18px', height: '18px', color: '#FF9500' }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>Light Mode</span>
                  </div>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: theme === 'light' ? '5px solid var(--brand-primary)' : '2px solid var(--border-color)', background: '#FFFFFF' }} />
                </div>
              </div>

              {/* Option 2: Dark Mode */}
              <div
                onClick={() => setTheme('dark')}
                style={{
                  border: theme === 'dark' ? '2px solid var(--brand-primary)' : '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '14px',
                  cursor: 'pointer',
                  background: 'var(--bg-card)',
                  boxShadow: theme === 'dark' ? '0 4px 16px var(--brand-glow)' : 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {/* Visual Preview Miniature */}
                <div style={{ height: '90px', borderRadius: '10px', background: '#09090B', border: '1px solid #27272A', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ width: '38px', height: '6px', background: '#27272A', borderRadius: '4px' }} />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0A84FF' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ width: '60%', height: '14px', background: '#252529', borderRadius: '6px 6px 6px 2px' }} />
                    <div style={{ width: '70%', height: '14px', background: '#0A84FF', alignSelf: 'flex-end', borderRadius: '6px 6px 2px 6px' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Moon style={{ width: '18px', height: '18px', color: '#0A84FF' }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>Dark Mode</span>
                  </div>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: theme === 'dark' ? '5px solid var(--brand-primary)' : '2px solid var(--border-color)', background: '#FFFFFF' }} />
                </div>
              </div>

              {/* Option 3: System Default */}
              <div
                onClick={() => setTheme('system')}
                style={{
                  border: theme === 'system' ? '2px solid var(--brand-primary)' : '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '14px',
                  cursor: 'pointer',
                  background: 'var(--bg-card)',
                  boxShadow: theme === 'system' ? '0 4px 16px var(--brand-glow)' : 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {/* Visual Preview Miniature Split */}
                <div style={{ height: '90px', borderRadius: '10px', background: 'linear-gradient(90deg, #FFFFFF 50%, #09090B 50%)', border: '1px solid var(--border-color)', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ width: '30px', height: '6px', background: '#EAEAEA', borderRadius: '4px' }} />
                    <div style={{ width: '30px', height: '6px', background: '#27272A', borderRadius: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '14px', background: '#F1F1F1', borderRadius: '4px' }} />
                    <div style={{ width: '40px', height: '14px', background: '#0A84FF', borderRadius: '4px' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Laptop style={{ width: '18px', height: '18px', color: 'var(--text-secondary)' }} />
                    <div>
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>System Default</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Currently: {effectiveTheme}</span>
                    </div>
                  </div>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: theme === 'system' ? '5px solid var(--brand-primary)' : '2px solid var(--border-color)', background: '#FFFFFF' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Accent Color Palette Selection */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Accent Tint</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Personalize outgoing chat bubbles, highlights, and primary buttons.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {accents.map(acc => {
                const isSelected = accentTheme === acc.id;
                return (
                  <button
                    key={acc.id}
                    onClick={() => setAccentTheme(acc.id)}
                    type="button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      borderRadius: '12px',
                      border: isSelected ? `2px solid ${acc.color}` : '1px solid var(--border-color)',
                      background: isSelected ? 'var(--bg-input)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: acc.color, border: '2px solid rgba(255,255,255,0.6)' }} />
                    <span>{acc.name}</span>
                    {isSelected && <Check style={{ width: '14px', height: '14px', color: acc.color }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACCOUNT & USER PROFILE */}
      {activeTab === 'account' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src={activeUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={activeUser?.name}
                  style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--brand-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{activeUser?.name || 'Workspace User'}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{activeUser?.email || 'user@company.com'}</p>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      Role: {activeUser?.role || 'Employee'}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                      Active Online
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingUserProfile(activeUser?.id || 'emp-current')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  background: 'var(--brand-primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px var(--brand-glow)'
                }}
              >
                <span>Open Full Profile & KRA</span>
                <ExternalLink style={{ width: '14px', height: '14px' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '0.5rem' }}>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Department</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{activeUser?.department || 'Executive Operations'}</p>
              </div>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Employee ID</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{activeUser?.employeeCode || `EMP-${activeUser?.id || '101'}`}</p>
              </div>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Workstation Security</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '2px' }}>Encrypted & Verified</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CHAT & AI PREFERENCES */}
      {activeTab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Chat & Composer Behavior</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Control keyboard shortcuts and messaging responsiveness.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Option 1: Enter to send */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>Press Enter to Send Message</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>When active, pressing Enter immediately sends the message. Shift+Enter creates a new line.</span>
                </div>
                <input
                  type="checkbox"
                  checked={enterToSend}
                  onChange={(e) => {
                    setEnterToSend(e.target.checked);
                    handleSavePreferences();
                  }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
                />
              </div>

              {/* Option 2: Sound alerts */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>Audio Notification Chimes</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Play subtle Apple notification chimes when receiving direct messages or AI completions.</span>
                </div>
                <input
                  type="checkbox"
                  checked={soundAlerts}
                  onChange={(e) => {
                    setSoundAlerts(e.target.checked);
                    handleSavePreferences();
                  }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
                />
              </div>

              {/* Option 3: Read receipts */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>Double-Checkmark Read Receipts</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Show delivered and read status indicators in peer-to-peer conversations.</span>
                </div>
                <input
                  type="checkbox"
                  checked={showReadReceipts}
                  onChange={(e) => {
                    setShowReadReceipts(e.target.checked);
                    handleSavePreferences();
                  }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WORKFLOWS & STAGES (Preserved Original) */}
      {activeTab === 'workflows' && (
        <div className="grid grid-cols-3 lg-grid-cols-1" style={{ gap: '1.5rem' }}>
          <div className="glass-panel" style={{ gridColumn: 'span 2', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800 }}>Active Workflow Pipeline Stages</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(statuses || []).map((s, idx) => (
                <div key={s.id} className="glass-card" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>{idx + 1}</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{s.label}</span>
                  </div>
                  <span className="badge badge-brand">{s.id}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800 }}>Add Custom Stage</h3>
            <div className="form-group">
              <label className="form-label">Stage Name</label>
              <input type="text" placeholder="e.g., Security Testing" value={newStatusName} onChange={(e) => setNewStatusName(e.target.value)} className="input-text" />
            </div>
            <button onClick={handleAddStatus} className="btn btn-primary" style={{ width: '100%' }}>Add Workflow Stage</button>
          </div>
        </div>
      )}

      {/* TAB 5: CUSTOM FIELDS (Preserved Original) */}
      {activeTab === 'fields' && (
        <div className="grid grid-cols-3 lg-grid-cols-1" style={{ gap: '1.5rem' }}>
          <div className="glass-panel" style={{ gridColumn: 'span 2', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800 }}>Defined Custom Task Attributes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(customFields || []).map(cf => (
                <div key={cf.id} className="glass-card" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block' }}>{cf.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Type: {cf.type}</span>
                  </div>
                  <span className="badge badge-brand">Active Field</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800 }}>Create Custom Field</h3>
            <div className="form-group">
              <label className="form-label">Field Label</label>
              <input type="text" placeholder="e.g., Client Impact Score" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} className="input-text" />
            </div>
            <div className="form-group">
              <label className="form-label">Field Type</label>
              <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)} className="select-dropdown">
                <option value="text">Text Input</option>
                <option value="number">Numeric Value</option>
                <option value="select">Dropdown Select</option>
              </select>
            </div>
            <button onClick={handleAddField} className="btn btn-primary" style={{ width: '100%' }}>Create Field</button>
          </div>
        </div>
      )}

      {/* TAB 6: ROLES PERMISSIONS MATRIX (Preserved Original) */}
      {activeTab === 'roles' && (
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '1rem' }}>Access Control & Role Permissions Matrix</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Action</th><th style={{ textAlign: 'center' }}>Admin</th><th style={{ textAlign: 'center' }}>Manager</th><th style={{ textAlign: 'center' }}>Supervisor</th><th style={{ textAlign: 'center' }}>Employee</th></tr>
              </thead>
              <tbody>
                {[
                  { action: 'Create & Edit Tasks', admin: true, manager: true, supervisor: true, employee: true },
                  { action: 'Delete Tasks & Recycle Bin', admin: true, manager: true, supervisor: false, employee: false },
                  { action: 'Approve & Reject Completed Tasks', admin: true, manager: true, supervisor: true, employee: false },
                  { action: 'Manage Settings & Workflows', admin: true, manager: false, supervisor: false, employee: false }
                ].map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700 }}>{row.action}</td>
                    <td style={{ textAlign: 'center' }}><Check style={{ width: '16px', height: '16px', color: 'var(--color-success)', margin: '0 auto' }} /></td>
                    <td style={{ textAlign: 'center' }}>{row.manager ? <Check style={{ width: '16px', height: '16px', color: 'var(--color-success)', margin: '0 auto' }} /> : '—'}</td>
                    <td style={{ textAlign: 'center' }}>{row.supervisor ? <Check style={{ width: '16px', height: '16px', color: 'var(--color-success)', margin: '0 auto' }} /> : '—'}</td>
                    <td style={{ textAlign: 'center' }}>{row.employee ? <Check style={{ width: '16px', height: '16px', color: 'var(--color-success)', margin: '0 auto' }} /> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
