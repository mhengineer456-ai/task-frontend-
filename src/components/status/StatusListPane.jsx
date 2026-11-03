import React, { useState } from 'react';
import {
  Plus,
  MoreVertical,
  Shield,
  CircleDot,
  RefreshCw,
  Search,
  ArrowLeft
} from 'lucide-react';
import { useTaskContext } from '../../context/TaskContext';
import StatusRingAvatar from './StatusRingAvatar';

export default function StatusListPane({ onBack }) {
  const {
    statusFeed,
    activeUser,
    openStatusStory,
    setIsStatusCreatorOpen,
    setIsStatusPrivacyOpen,
    loadStatusFeed,
    isLoadingStatuses
  } = useTaskContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const myStatus = statusFeed?.myStatus;
  const recentUpdates = statusFeed?.recentUpdates || [];
  const viewedUpdates = statusFeed?.viewedUpdates || [];

  const hasMyStatus = Boolean(myStatus && myStatus.statuses && myStatus.statuses.length > 0);

  // Combine story groups for story viewer navigation
  const allStoryGroups = [
    ...(hasMyStatus ? [myStatus] : []),
    ...recentUpdates,
    ...viewedUpdates
  ];

  // WhatsApp-style timestamp: "Today at 14:00", "Yesterday at 18:30"
  const formatWhatsAppStatusTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timePart = `${hours}:${minutes}`;

    if (isToday) {
      return `Today at ${timePart}`;
    }
    if (isYesterday) {
      return `Yesterday at ${timePart}`;
    }
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timePart}`;
  };

  const filterList = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item => {
      const name = item.user?.name || item.userName || '';
      return name.toLowerCase().includes(q);
    });
  };

  const filteredRecent = filterList(recentUpdates);
  const filteredViewed = filterList(viewedUpdates);

  const handleMyStatusClick = () => {
    if (hasMyStatus) {
      openStatusStory(myStatus, 0, allStoryGroups);
    } else {
      setIsStatusCreatorOpen(true);
    }
  };

  return (
    <div
      className="whatsapp-status-pane-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: 'var(--bg-sidebar)',
        overflow: 'hidden'
      }}
    >
      {/* 1. TOP STATUS HEADER */}
      <div
        className="whatsapp-status-top-header"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              title="Back"
              aria-label="Back"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ArrowLeft size={19} />
            </button>
          )}
          <h2
            style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0
            }}
          >
            Status
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
          {/* Add Status (+) Button */}
          <button
            type="button"
            onClick={() => setIsStatusCreatorOpen(true)}
            title="Add status update"
            aria-label="Add status update"
            className="whatsapp-icon-round-btn"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.16s ease'
            }}
          >
            <Plus size={18} />
          </button>

          {/* Three-dot (⋮) Menu Icon */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              title="Status Options"
              aria-label="Status options"
              className="whatsapp-icon-round-btn"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.16s ease'
              }}
            >
              <MoreVertical size={17} />
            </button>

            {showMenu && (
              <div
                className="whatsapp-status-dropdown-card"
                style={{
                  position: 'absolute',
                  top: '40px',
                  right: 0,
                  minWidth: '180px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                  zIndex: 60,
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setIsStatusPrivacyOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  className="whatsapp-menu-item"
                >
                  <Shield size={15} style={{ color: '#25D366' }} />
                  <span>Status privacy</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    loadStatusFeed();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  className="whatsapp-menu-item"
                >
                  <RefreshCw size={15} />
                  <span>Refresh updates</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Input Filter */}
      <div style={{ padding: '8px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            placeholder="Search status updates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 30px',
              borderRadius: '8px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* VERTICALLY SCROLLABLE STATUS LIST */}
      <div
        className="whatsapp-status-vertical-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '8px 0'
        }}
      >
        {/* =================================================================
            2. MY STATUS COMPONENT
            ================================================================= */}
        <div
          className="whatsapp-status-row my-status-row"
          onClick={handleMyStatusClick}
          style={{
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'background 0.16s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <StatusRingAvatar
              avatar={activeUser?.avatar}
              name={activeUser?.name || 'My status'}
              count={hasMyStatus ? myStatus.statuses.length : 0}
              isUnread={true}
              size={50}
              hasPlus={!hasMyStatus}
              onPlusClick={() => setIsStatusCreatorOpen(true)}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span
                style={{
                  fontSize: '0.94rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)'
                }}
              >
                My status
              </span>
              <span
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)'
                }}
              >
                {hasMyStatus
                  ? formatWhatsAppStatusTime(myStatus.latestAt || myStatus.lastUpdated)
                  : 'Click to add status update'}
              </span>
            </div>
          </div>

          {hasMyStatus && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsStatusCreatorOpen(true);
              }}
              title="Add another status update"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {/* =================================================================
            3. RECENT STATUS UPDATES (Green Ring #25D366)
            ================================================================= */}
        {filteredRecent.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            {/* Heading: "Recent" */}
            <div
              className="whatsapp-status-category-header"
              style={{
                padding: '8px 20px 6px 20px',
                fontSize: '0.74rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: 'var(--text-muted)',
                textTransform: 'uppercase'
              }}
            >
              Recent
            </div>

            {filteredRecent.map((group) => {
              const user = group.user || {
                id: group.userId,
                name: group.userName,
                avatar: group.userAvatar
              };
              const statusCount = group.statuses?.length || 1;
              const latestTime = group.latestAt || group.lastUpdated;

              return (
                <div
                  key={`recent-${user.id || group.userId}`}
                  className="whatsapp-status-row"
                  onClick={() => openStatusStory(group, 0, allStoryGroups)}
                  style={{
                    padding: '10px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    cursor: 'pointer',
                    transition: 'background 0.16s ease'
                  }}
                >
                  <StatusRingAvatar
                    avatar={user.avatar}
                    name={user.name}
                    count={statusCount}
                    isUnread={true}
                    size={50}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {user.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {formatWhatsAppStatusTime(latestTime)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =================================================================
            5. VIEWED STATUS UPDATES (Grey Ring #8696A0)
            ================================================================= */}
        {filteredViewed.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            {/* Heading: "Viewed" */}
            <div
              className="whatsapp-status-category-header"
              style={{
                padding: '8px 20px 6px 20px',
                fontSize: '0.74rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: 'var(--text-muted)',
                textTransform: 'uppercase'
              }}
            >
              Viewed
            </div>

            {filteredViewed.map((group) => {
              const user = group.user || {
                id: group.userId,
                name: group.userName,
                avatar: group.userAvatar
              };
              const statusCount = group.statuses?.length || 1;
              const latestTime = group.latestAt || group.lastUpdated;

              return (
                <div
                  key={`viewed-${user.id || group.userId}`}
                  className="whatsapp-status-row viewed"
                  onClick={() => openStatusStory(group, 0, allStoryGroups)}
                  style={{
                    padding: '10px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    cursor: 'pointer',
                    transition: 'background 0.16s ease',
                    opacity: 0.88
                  }}
                >
                  <StatusRingAvatar
                    avatar={user.avatar}
                    name={user.name}
                    count={statusCount}
                    isUnread={false}
                    size={50}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {user.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {formatWhatsAppStatusTime(latestTime)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {filteredRecent.length === 0 && filteredViewed.length === 0 && (
          <div
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'var(--bg-input)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CircleDot size={24} style={{ color: '#25D366' }} />
            </div>
            <p style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              No status updates yet
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '220px', margin: 0, lineHeight: 1.4 }}>
              When contacts share updates, you will see them here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
