import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { Users, X, Search, Check, AlertCircle, Plus } from 'lucide-react';

export default function CreateGroupModal({ isOpen, onClose }) {
  const { users = [], activeUser, createGroupChat } = useTaskContext();

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Filter out activeUser from selectable members (creator is automatically in the group)
  const availableMembers = users.filter(u => u.id !== activeUser?.id);
  const filteredMembers = availableMembers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.role && u.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleMember = (userId) => {
    setError('');
    setSelectedMemberIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedMemberIds(filteredMembers.map(u => u.id));
  };

  const handleClearAll = () => {
    setSelectedMemberIds([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Please provide a group name.');
      return;
    }
    if (selectedMemberIds.length === 0) {
      setError('Please select at least 1 other team member for the group.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await createGroupChat({
        name: groupName.trim(),
        description: description.trim(),
        memberIds: selectedMemberIds
      });

      // Reset and close
      setGroupName('');
      setDescription('');
      setSelectedMemberIds([]);
      setSearchQuery('');
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error('Group creation error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create group. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 100000,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          animation: 'modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users style={{ width: '20px', height: '20px', color: '#ffffff' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>Create New Group</h3>
              <p style={{ fontSize: '0.75rem', color: '#e0f2fe' }}>Group chat with multiple team members</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 0.85rem',
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '0.8125rem',
                fontWeight: 600
              }}
            >
              <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Group Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Group Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Frontend Sprint, Marketing Core, Operations Alpha"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="input-text"
              style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.875rem' }}
              autoFocus
            />
          </div>

          {/* Group Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Description / Topic (Optional)
            </label>
            <input
              type="text"
              placeholder="Brief topic or purpose of this team group"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-text"
              style={{ width: '100%', padding: '0.55rem 0.85rem', fontSize: '0.8125rem' }}
            />
          </div>

          {/* Selected Member Chips */}
          {selectedMemberIds.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7' }}>
                  Selected Members ({selectedMemberIds.length})
                </span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Clear All
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '70px', overflowY: 'auto', padding: '4px 0' }}>
                {selectedMemberIds.map(uid => {
                  const userObj = users.find(u => u.id === uid);
                  if (!userObj) return null;
                  return (
                    <span
                      key={uid}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 8px',
                        borderRadius: '16px',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        border: '1px solid #bae6fd',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      <span>{userObj.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleMember(uid)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0369a1', padding: '0', display: 'flex', alignItems: 'center' }}
                      >
                        <X style={{ width: '12px', height: '12px' }} />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Member Search & Selection */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Select Team Members <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Select All ({filteredMembers.length})
              </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <Search style={{ position: 'absolute', left: '10px', top: '10px', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search team members by name, role, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                style={{ width: '100%', paddingLeft: '2.1rem', fontSize: '0.8125rem', padding: '0.5rem 0.75rem 0.5rem 2.1rem' }}
              />
            </div>

            {/* Member List Checklist */}
            <div
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                background: 'var(--bg-main)'
              }}
            >
              {filteredMembers.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No team members matching your search.
                </div>
              ) : (
                filteredMembers.map(member => {
                  const isSelected = selectedMemberIds.includes(member.id);
                  return (
                    <div
                      key={member.id}
                      onClick={() => toggleMember(member.id)}
                      style={{
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderRadius: '8px',
                        background: isSelected ? '#e0f2fe' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#bae6fd', color: '#0284c7', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {member.name}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {member.role} • {member.department || 'Team'}
                          </div>
                        </div>
                      </div>

                      {/* Checkbox Icon */}
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          border: isSelected ? '1px solid #0284c7' : '1px solid var(--border-color)',
                          background: isSelected ? '#0284c7' : 'var(--bg-card)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {isSelected && <Check style={{ width: '13px', height: '13px' }} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '0.6rem 1.1rem' }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              disabled={isSubmitting || !groupName.trim() || selectedMemberIds.length === 0}
            >
              <Users style={{ width: '16px', height: '16px' }} />
              <span>{isSubmitting ? 'Creating Group...' : `Create Group (${selectedMemberIds.length + 1})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
