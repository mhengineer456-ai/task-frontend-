import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { X, Shield, Check, Users, UserMinus, UserCheck, Search } from 'lucide-react';

export default function StatusPrivacyModal({ isOpen: propIsOpen, onClose: propOnClose }) {
  const {
    users = [],
    activeUser,
    statusPrivacy = { privacyType: 'contacts', excludedUsers: [], allowedUsers: [] },
    saveStatusPrivacy,
    isStatusPrivacyOpen,
    setIsStatusPrivacyOpen
  } = useTaskContext();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isStatusPrivacyOpen;
  const onClose = propOnClose || (() => setIsStatusPrivacyOpen(false));

  const [selectedType, setSelectedType] = useState(statusPrivacy.privacyType || 'contacts');
  const [excludedIds, setExcludedIds] = useState(statusPrivacy.excludedUsers || []);
  const [allowedIds, setAllowedIds] = useState(statusPrivacy.allowedUsers || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const contacts = users.filter(u => String(u.id) !== String(activeUser?.id));
  const filteredContacts = contacts.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExcluded = (uid) => {
    setExcludedIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const toggleAllowed = (uid) => {
    setAllowedIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveStatusPrivacy({
        privacyType: selectedType,
        excludedUsers: selectedType === 'except' ? excludedIds : [],
        allowedUsers: selectedType === 'only' ? allowedIds : []
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 110000, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(16px)' }}>
      <div
        className="modal-container status-privacy-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--bg-card)',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-sidebar)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--brand-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
              <Shield style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Status Privacy
              </h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Who can see your status updates
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex' }}
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Radio Options */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px', borderBottom: (selectedType !== 'contacts') ? '1px solid var(--border-color)' : 'none' }}>
          {/* Option 1: My Contacts */}
          <label
            onClick={() => setSelectedType('contacts')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '12px',
              border: selectedType === 'contacts' ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-color)',
              background: selectedType === 'contacts' ? 'var(--brand-glow)' : 'var(--bg-input)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Users style={{ width: '18px', height: '18px', color: 'var(--brand-primary)' }} />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>My Contacts</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Share with all verified workspace team members</div>
              </div>
            </div>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: selectedType === 'contacts' ? '5px solid var(--brand-primary)' : '2px solid var(--border-color)', background: '#fff' }} />
          </label>

          {/* Option 2: My Contacts Except... */}
          <label
            onClick={() => setSelectedType('except')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '12px',
              border: selectedType === 'except' ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-color)',
              background: selectedType === 'except' ? 'var(--brand-glow)' : 'var(--bg-input)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <UserMinus style={{ width: '18px', height: '18px', color: '#FF3B30' }} />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  My Contacts Except...
                  {excludedIds.length > 0 && <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: '#FF3B30', fontWeight: 700 }}>({excludedIds.length} excluded)</span>}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Hide your status from selected contacts</div>
              </div>
            </div>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: selectedType === 'except' ? '5px solid var(--brand-primary)' : '2px solid var(--border-color)', background: '#fff' }} />
          </label>

          {/* Option 3: Only Share With... */}
          <label
            onClick={() => setSelectedType('only')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '12px',
              border: selectedType === 'only' ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-color)',
              background: selectedType === 'only' ? 'var(--brand-glow)' : 'var(--bg-input)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <UserCheck style={{ width: '18px', height: '18px', color: '#34C759' }} />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Only Share With...
                  {allowedIds.length > 0 && <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: '#34C759', fontWeight: 700 }}>({allowedIds.length} included)</span>}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Only selected contacts will see your status</div>
              </div>
            </div>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: selectedType === 'only' ? '5px solid var(--brand-primary)' : '2px solid var(--border-color)', background: '#fff' }} />
          </label>
        </div>

        {/* Contact Exclusion / Inclusion List */}
        {selectedType !== 'contacts' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '180px', maxHeight: '280px', overflow: 'hidden' }}>
            <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '10px', top: '9px', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder={selectedType === 'except' ? 'Search contacts to exclude...' : 'Search contacts to include...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 30px',
                    borderRadius: '10px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '8px 12px' }}>
              {filteredContacts.map(c => {
                const isSelected = selectedType === 'except'
                  ? excludedIds.includes(String(c.id))
                  : allowedIds.includes(String(c.id));

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      if (selectedType === 'except') toggleExcluded(String(c.id));
                      else toggleAllowed(String(c.id));
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--bg-input)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <img
                        src={c.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=007AFF&color=fff&size=60`}
                        alt={c.name}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.name}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                          {c.role} • {c.department || 'Team'}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        border: isSelected ? 'none' : '1.5px solid var(--border-color)',
                        background: isSelected ? (selectedType === 'except' ? '#FF3B30' : '#34C759') : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isSelected && <Check style={{ width: '13px', height: '13px', strokeWidth: 3 }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'var(--bg-sidebar)' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '7px 16px', fontSize: '0.82rem', borderRadius: '10px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary"
            style={{
              padding: '7px 20px',
              fontSize: '0.82rem',
              fontWeight: 800,
              borderRadius: '10px',
              background: 'var(--brand-primary)',
              color: '#fff'
            }}
          >
            {isSaving ? 'Saving...' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
