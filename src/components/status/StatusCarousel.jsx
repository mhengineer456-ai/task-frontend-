import React, { useRef } from 'react';
import { Plus, Shield, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';

export default function StatusCarousel() {
  const {
    statusFeed,
    activeUser,
    openStatusStory,
    setIsStatusCreatorOpen,
    setIsStatusPrivacyOpen,
    loadStatusFeed,
    isLoadingStatuses
  } = useTasks();

  const scrollRef = useRef(null);

  const myStatus = statusFeed?.myStatus;
  const recentUpdates = statusFeed?.recentUpdates || [];
  const viewedUpdates = statusFeed?.viewedUpdates || [];

  const hasMyStatus = Boolean(myStatus && myStatus.statuses && myStatus.statuses.length > 0);

  // Combine story groups for sequential story viewing
  const allStoryGroups = [
    ...(hasMyStatus ? [myStatus] : []),
    ...recentUpdates,
    ...viewedUpdates
  ];

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === 'left' ? -280 : 280;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const formatShortTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMins = Math.floor((now - date) / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleMyStatusClick = () => {
    if (hasMyStatus) {
      openStatusStory(myStatus, 0, allStoryGroups);
    } else {
      setIsStatusCreatorOpen(true);
    }
  };

  const handlePlusClick = (e) => {
    e.stopPropagation();
    setIsStatusCreatorOpen(true);
  };

  return (
    <div className="status-carousel-container" aria-label="Status Stories">
      {/* Section Header */}
      <div className="status-carousel-header">
        <div className="status-carousel-title-row">
          <span className="status-carousel-title">STATUS UPDATES</span>
          {(recentUpdates.length > 0 || hasMyStatus) && (
            <span className="status-badge-count">
              {recentUpdates.length + (hasMyStatus ? 1 : 0)} active
            </span>
          )}
        </div>

        <div className="status-carousel-actions">
          {/* Privacy Settings Shortcut */}
          <button
            type="button"
            className="status-action-pill-btn"
            onClick={() => setIsStatusPrivacyOpen(true)}
            title="Status Privacy Settings"
          >
            <Shield size={13} />
            <span className="status-action-btn-text">Privacy</span>
          </button>

          {/* New Status Shortcut */}
          <button
            type="button"
            className="status-action-pill-btn highlight"
            onClick={() => setIsStatusCreatorOpen(true)}
            title="Add Status"
          >
            <Plus size={14} />
            <span className="status-action-btn-text">New</span>
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div className="status-carousel-wrapper">
        {/* Scroll Left Button (Desktop) */}
        <button
          type="button"
          className="status-carousel-nav-btn prev"
          onClick={() => handleScroll('left')}
          title="Scroll Left"
          aria-label="Scroll left"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="status-carousel-track" ref={scrollRef}>
          {/* 1. MY STATUS CARD */}
          <div
            className={`status-carousel-card my-status ${hasMyStatus ? 'has-active' : 'empty'}`}
            onClick={handleMyStatusClick}
            title={hasMyStatus ? 'View my status' : 'Add a status'}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleMyStatusClick();
              }
            }}
          >
            <div className="status-avatar-ring-container">
              <div
                className={`status-avatar-ring ${hasMyStatus ? 'ring-active' : 'ring-empty'}`}
              >
                {activeUser?.avatar ? (
                  <img
                    src={activeUser.avatar}
                    alt={activeUser.name || 'My Avatar'}
                    className="status-carousel-avatar"
                  />
                ) : (
                  <div className="status-carousel-avatar avatar-fallback">
                    {(activeUser?.name || 'M')[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Plus Button Overlay */}
              <button
                type="button"
                className="status-my-plus-btn"
                onClick={handlePlusClick}
                title="Add a status update"
              >
                <Plus size={13} strokeWidth={3} />
              </button>
            </div>

            <div className="status-card-info">
              <span className="status-card-name">My Status</span>
              <span className="status-card-sub">
                {hasMyStatus
                  ? `${myStatus.statuses.length} update${myStatus.statuses.length > 1 ? 's' : ''}`
                  : 'Add a status'}
              </span>
            </div>
          </div>

          {/* Divider between My Status and Contacts */}
          {(recentUpdates.length > 0 || viewedUpdates.length > 0) && (
            <div className="status-carousel-divider" />
          )}

          {/* 2. RECENT UPDATES (Unread) */}
          {recentUpdates.map((group) => {
            const user = group.user || {};
            const ringCount = group.statuses?.length || 1;

            return (
              <div
                key={`recent-${user.id}`}
                className="status-carousel-card contact unread"
                onClick={() => openStatusStory(group, 0, allStoryGroups)}
                title={`View ${user.name}'s status`}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openStatusStory(group, 0, allStoryGroups);
                  }
                }}
              >
                <div className="status-avatar-ring-container">
                  <div className="status-avatar-ring ring-unread">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="status-carousel-avatar"
                      />
                    ) : (
                      <div className="status-carousel-avatar avatar-fallback">
                        {(user.name || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  {group.unreadCount > 1 && (
                    <span className="status-count-bubble">
                      {group.unreadCount}
                    </span>
                  )}
                </div>

                <div className="status-card-info">
                  <span className="status-card-name" title={user.name}>
                    {user.name}
                  </span>
                  <span className="status-card-sub highlight">
                    {formatShortTime(group.latestAt)}
                  </span>
                </div>
              </div>
            );
          })}

          {/* 3. VIEWED UPDATES */}
          {viewedUpdates.map((group) => {
            const user = group.user || {};

            return (
              <div
                key={`viewed-${user.id}`}
                className="status-carousel-card contact viewed"
                onClick={() => openStatusStory(group, 0, allStoryGroups)}
                title={`View ${user.name}'s status (Viewed)`}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openStatusStory(group, 0, allStoryGroups);
                  }
                }}
              >
                <div className="status-avatar-ring-container">
                  <div className="status-avatar-ring ring-viewed">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="status-carousel-avatar"
                      />
                    ) : (
                      <div className="status-carousel-avatar avatar-fallback">
                        {(user.name || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="status-card-info">
                  <span className="status-card-name" title={user.name}>
                    {user.name}
                  </span>
                  <span className="status-card-sub muted">
                    {formatShortTime(group.latestAt)}
                  </span>
                </div>
              </div>
            );
          })}

          {/* If no contacts have active statuses, show inviting hint */}
          {recentUpdates.length === 0 && viewedUpdates.length === 0 && (
            <div className="status-empty-hint">
              <Sparkles size={14} className="status-empty-icon" />
              <span>No other recent updates</span>
            </div>
          )}
        </div>

        {/* Scroll Right Button (Desktop) */}
        <button
          type="button"
          className="status-carousel-nav-btn next"
          onClick={() => handleScroll('right')}
          title="Scroll Right"
          aria-label="Scroll right"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
