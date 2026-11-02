import React, { useState } from 'react';
import {
  X,
  Users,
  Search,
  User,
  ShieldCheck,
  MessageSquare,
  Calendar,
  FileText,
  Info,
  ExternalLink
} from 'lucide-react';

export default function GroupInfoModal({
  channel,
  onClose,
  users = [],
  activeUser,
  setViewingUserProfile,
  startDirectChat
}) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!channel) return null;

  // Resolve members from participantIds or users
  const participantIds = channel.participantIds || [];
  const memberList = users.filter(u => participantIds.includes(u.id));

  // If memberList is empty (e.g. general channel), default to all users or include channel members
  const effectiveMembers = memberList.length > 0 ? memberList : users;

  const filteredMembers = effectiveMembers.filter(m =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMemberProfileClick = (memberId) => {
    if (setViewingUserProfile) {
      setViewingUserProfile(memberId);
      onClose();
    }
  };

  const handleDirectChatClick = (member) => {
    if (startDirectChat) {
      startDirectChat(member);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #bae6fd',
          animation: 'modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* WhatsApp-Style Group Banner Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: '#ffffff',
            padding: '1.75rem 2rem',
            position: 'relative'
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
            title="Close Group Info"
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '16px',
                background: '#ffffff',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                border: '3px solid rgba(255, 255, 255, 0.8)',
                flexShrink: 0
              }}
            >
              <Users style={{ width: '36px', height: '36px' }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  background: 'rgba(255, 255, 255, 0.25)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  display: 'inline-block',
                  marginBottom: '0.35rem'
                }}
              >
                WhatsApp Team Group
              </span>
              <h2
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {channel.name}
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#d1fae5', margin: '0.2rem 0 0 0', fontWeight: 600 }}>
                {effectiveMembers.length} {effectiveMembers.length === 1 ? 'participant' : 'participants'}
              </p>
            </div>
          </div>
        </div>

        {/* Group Description Card */}
        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            <FileText style={{ width: '13px', height: '13px' }} />
            <span>Group Description</span>
          </div>
          <p style={{ fontSize: '0.88rem', color: '#334155', margin: 0, lineHeight: '1.45', fontWeight: 500 }}>
            {channel.description || 'Collaborative team group chat. Share updates, attachments, audio notes, and track real-time assignments.'}
          </p>
        </div>

        {/* Participants Search Bar */}
        <div style={{ padding: '1rem 1.75rem 0.5rem 1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
              {effectiveMembers.length} Participants
            </span>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
              🟢 Live Roster
            </span>
          </div>

          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search members by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '0.82rem',
                background: '#f8fafc',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Participants List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 1.75rem 1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filteredMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.82rem' }}>
              No members matched "{searchQuery}"
            </div>
          ) : (
            filteredMembers.map(member => {
              const isCurrentUser = member.id === activeUser?.id;
              const isGroupAdmin = channel.createdBy === member.id || member.role === 'Manager';

              return (
                <div
                  key={member.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '12px',
                    border: '1px solid #f1f5f9',
                    background: '#ffffff',
                    transition: 'all 0.15s ease'
                  }}
                  className="glass-card-hover"
                >
                  {/* Clickable user card to open profile */}
                  <div
                    onClick={() => handleMemberProfileClick(member.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      flex: 1,
                      minWidth: 0
                    }}
                    title={`Click to view ${member.name}'s profile`}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=0284c7&color=fff&size=80`;
                          }}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #bae6fd'
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#dbeafe',
                            color: '#0284c7',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '0',
                          right: '0',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: '#10b981',
                          border: '2px solid #ffffff'
                        }}
                      />
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>
                          {member.name}
                        </span>
                        {isCurrentUser && (
                          <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '6px', background: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}>
                            You
                          </span>
                        )}
                        {isGroupAdmin && (
                          <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '6px', background: '#dcfce7', color: '#166534', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <ShieldCheck style={{ width: '10px', height: '10px' }} />
                            Admin
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '2px 0 0 0' }}>
                        {member.role} • {member.department || 'Operations'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => handleMemberProfileClick(member.id)}
                      className="btn btn-secondary"
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Inspect full profile, KPIs, tasks and KRAs"
                    >
                      <User style={{ width: '12px', height: '12px' }} />
                      <span>Profile</span>
                    </button>

                    {!isCurrentUser && (
                      <button
                        type="button"
                        onClick={() => handleDirectChatClick(member)}
                        className="btn btn-primary"
                        style={{
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title={`Send direct WhatsApp message to ${member.name}`}
                      >
                        <MessageSquare style={{ width: '12px', height: '12px' }} />
                        <span>Chat</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
