import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Volume2,
  VolumeX,
  MoreVertical,
  Send,
  Heart,
  Smile,
  Shield,
  Clock,
  Sparkles,
  Share2,
  MessageSquare,
  Check,
  ExternalLink
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import StatusViewerBottomSheet from './StatusViewerBottomSheet';

const QUICK_REACTIONS = ['❤️', '🔥', '😂', '😮', '😢', '👏', '🙏', '👍'];

export default function StatusViewerModal() {
  const {
    activeStatusStory,
    closeStatusStory,
    currentUser,
    activeUser,
    viewStatus,
    removeStatus,
    sendStatusReply,
    startDirectChat,
    setActiveView
  } = useTasks();

  const [groupIndex, setGroupIndex] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isMuted, setIsMuted] = useState(false);
  const [isViewerListOpen, setIsViewerListOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyFeedback, setReplyFeedback] = useState(null);

  // Swipe-down to close gestures
  const [touchStartY, setTouchStartY] = useState(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const videoRef = useRef(null);
  const progressAnimRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Extract current story group and status
  const allGroups = activeStatusStory?.allGroups || [];
  const currentGroup = allGroups[groupIndex] || activeStatusStory?.userGroup;
  const statuses = currentGroup?.statuses || [];
  const currentStatus = statuses[statusIndex] || null;

  const currentUserId = String(activeUser?.id || currentUser?.id || '');
  const groupUser = currentGroup?.user || {
    id: currentGroup?.userId,
    name: currentGroup?.userName,
    avatar: currentGroup?.userAvatar
  };

  const isOwnStory = Boolean(
    (groupUser?.id && String(groupUser.id) === currentUserId) ||
    (currentGroup?.userId && String(currentGroup.userId) === currentUserId) ||
    (currentStatus?.user_id && String(currentStatus.user_id) === currentUserId) ||
    groupUser?.id === 'usr-me'
  );

  // Defensively normalized status attributes
  const statusType = currentStatus?.type || 'text';
  const textBody = currentStatus?.content || currentStatus?.text || '';
  const mediaUrl = currentStatus?.mediaUrl || currentStatus?.media_url || '';
  const backgroundColor = currentStatus?.backgroundColor || currentStatus?.background_color || 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)';
  const textColor = currentStatus?.textColor || currentStatus?.text_color || '#FFFFFF';
  const typographyStyle = currentStatus?.typographyStyle || currentStatus?.fontStyle || currentStatus?.font_style || 'sans';
  const caption = currentStatus?.caption || (statusType !== 'text' ? (currentStatus?.content || '') : '');
  const createdAt = currentStatus?.createdAt || currentStatus?.created_at;
  const expiresAt = currentStatus?.expiresAt || currentStatus?.expires_at;
  const viewCount = currentStatus?.viewCount ?? currentStatus?.views_count ?? 0;

  // Initialize group and status index when modal opens
  useEffect(() => {
    if (!activeStatusStory) return;
    const initialGroup = activeStatusStory.userGroup;
    let foundGroupIdx = 0;
    if (activeStatusStory.allGroups && activeStatusStory.allGroups.length > 0) {
      const idx = activeStatusStory.allGroups.findIndex(
        g => g.user?.id === initialGroup?.user?.id
      );
      if (idx !== -1) foundGroupIdx = idx;
    }
    setGroupIndex(foundGroupIdx);
    setStatusIndex(activeStatusStory.startIndex || 0);
    setProgress(0);
    setIsPaused(false);
    setIsViewerListOpen(false);
    setShowMenu(false);
    setReplyText('');
    setDragY(0);
  }, [activeStatusStory]);

  // Mark status as viewed (genuine unique authenticated view)
  useEffect(() => {
    if (!currentStatus || isOwnStory) return;
    if (!currentStatus.has_viewed) {
      viewStatus(currentStatus.id);
    }
  }, [currentStatus?.id, isOwnStory, viewStatus]);

  // Auto-progression logic
  const DURATION = currentStatus?.type === 'video' ? 12000 : 5000; // ms

  const handleNext = useCallback(() => {
    if (statusIndex < statuses.length - 1) {
      setStatusIndex(prev => prev + 1);
      setProgress(0);
    } else {
      // Move to next user's story
      if (groupIndex < allGroups.length - 1) {
        setGroupIndex(prev => prev + 1);
        setStatusIndex(0);
        setProgress(0);
      } else {
        closeStatusStory();
      }
    }
  }, [statusIndex, statuses.length, groupIndex, allGroups.length, closeStatusStory]);

  const handlePrev = useCallback(() => {
    if (statusIndex > 0) {
      setStatusIndex(prev => prev - 1);
      setProgress(0);
    } else {
      // Move to previous user's story
      if (groupIndex > 0) {
        const prevGroup = allGroups[groupIndex - 1];
        setGroupIndex(prev => prev - 1);
        setStatusIndex(Math.max(0, (prevGroup?.statuses?.length || 1) - 1));
        setProgress(0);
      } else {
        setProgress(0);
      }
    }
  }, [statusIndex, groupIndex, allGroups]);

  // Handle video progression if current status is video
  useEffect(() => {
    if (currentStatus?.type === 'video' && videoRef.current) {
      const v = videoRef.current;
      v.currentTime = 0;
      if (!isPaused && !isViewerListOpen) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    }
  }, [currentStatus?.id, isPaused, isViewerListOpen]);

  // Animation frame loop for smooth progress
  useEffect(() => {
    if (!activeStatusStory || isPaused || isViewerListOpen || showMenu) {
      lastTimeRef.current = null;
      return;
    }

    let running = true;

    const tick = (now) => {
      if (!running) return;
      if (!lastTimeRef.current) {
        lastTimeRef.current = now;
      }

      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // If video, calculate progress from actual video playback
      if (currentStatus?.type === 'video' && videoRef.current && videoRef.current.duration) {
        const vid = videoRef.current;
        const currentProgress = (vid.currentTime / vid.duration) * 100;
        setProgress(Math.min(100, currentProgress));
        if (vid.ended || currentProgress >= 99.5) {
          handleNext();
          return;
        }
      } else {
        setProgress(prev => {
          const nextVal = prev + (delta / DURATION) * 100;
          if (nextVal >= 100) {
            handleNext();
            return 0;
          }
          return nextVal;
        });
      }

      progressAnimRef.current = requestAnimationFrame(tick);
    };

    progressAnimRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      if (progressAnimRef.current) {
        cancelAnimationFrame(progressAnimRef.current);
      }
    };
  }, [activeStatusStory, isPaused, isViewerListOpen, showMenu, currentStatus?.type, DURATION, handleNext]);

  // Pause when browser tab loses focus / is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!activeStatusStory) return;
      // Do not intercept keystrokes if the user is typing inside the reply input
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'Escape') {
        if (isViewerListOpen) setIsViewerListOpen(false);
        else closeStatusStory();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStatusStory, isViewerListOpen, handleNext, handlePrev, closeStatusStory]);

  if (!activeStatusStory || !currentStatus) return null;

  // Touch and drag swipe-down gesture
  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
    setIsPaused(true);
  };

  const handleTouchMove = (e) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 0) {
      setDragY(diff);
      setIsDragging(true);
    }
  };

  const handleTouchEnd = () => {
    if (dragY > 100) {
      closeStatusStory();
    } else {
      setDragY(0);
      setIsDragging(false);
    }
    setTouchStartY(null);
    setIsPaused(false);
  };

  // Tap navigation zones (left 35% prev, right 65% next)
  const handleScreenClick = (e) => {
    // Prevent if clicked on interactive controls
    if (e.target.closest('button, input, textarea, .status-interactive-zone, .status-reply-feedback-toast')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width * 0.35) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  // Reply handlers
  const handleSendTextReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || isSendingReply) return;

    setIsSendingReply(true);
    try {
      const res = await sendStatusReply(currentStatus.id, replyText.trim(), groupUser);
      setReplyText('');
      setReplyFeedback({
        text: `Reply sent to ${groupUser?.name || 'chat'}`,
        contactUser: groupUser,
        channelId: res?.channelId
      });
      setTimeout(() => setReplyFeedback(null), 4000);
    } catch (err) {
      console.error('Error replying to status:', err);
    } finally {
      setIsSendingReply(false);
      setIsPaused(false);
    }
  };

  const handleSendQuickReaction = async (emoji) => {
    try {
      const res = await sendStatusReply(currentStatus.id, emoji, groupUser);
      setReplyFeedback({
        text: `Reacted with ${emoji} to ${groupUser?.name || 'status'}`,
        contactUser: groupUser,
        channelId: res?.channelId
      });
      setTimeout(() => setReplyFeedback(null), 3500);
    } catch (err) {
      console.error('Error sending quick reaction:', err);
    }
  };

  const handleOpenChat = (targetUser) => {
    if (targetUser) {
      startDirectChat(targetUser);
    }
    if (typeof setActiveView === 'function') {
      setActiveView('chat');
    }
    closeStatusStory();
  };

  const handleDeleteCurrentStatus = async () => {
    if (!window.confirm('Delete this status update?')) return;
    try {
      await removeStatus(currentStatus.id);
      if (statuses.length <= 1) {
        closeStatusStory();
      } else {
        setStatusIndex(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting status:', err);
    }
  };

  // Calculate formatted relative time and expiry
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMins = Math.floor((now - date) / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const calculateHoursRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    if (diffMs <= 0) return 'Expired';
    const hours = Math.ceil(diffMs / (1000 * 60 * 60));
    return `${hours}h left`;
  };

  // Determine font styling for text statuses
  const getTypographyStyle = (style) => {
    switch (style) {
      case 'serif':
        return { fontFamily: 'Georgia, "New York", serif' };
      case 'mono':
        return { fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' };
      case 'handwriting':
        return { fontFamily: '"Caveat", "Dancing Script", cursive, sans-serif' };
      default:
        return { fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' };
    }
  };

  return (
    <div
      className="status-viewer-backdrop"
      style={{
        opacity: isDragging ? Math.max(0.4, 1 - dragY / 300) : 1,
        transition: isDragging ? 'none' : 'opacity 0.25s ease'
      }}
    >
      {/* Background Dim / Overlay */}
      <div
        className="status-viewer-container"
        style={{
          transform: `translateY(${dragY}px) scale(${isDragging ? Math.max(0.85, 1 - dragY / 1000) : 1})`,
          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onClick={handleScreenClick}
      >
        {/* TOP STORY HEADER & PROGRESS BARS */}
        <div className="status-viewer-header status-interactive-zone">
          {/* Segmented Progress Indicators */}
          <div className="status-progress-track">
            {statuses.map((s, idx) => {
              let segmentProgress = 0;
              if (idx < statusIndex) segmentProgress = 100;
              else if (idx === statusIndex) segmentProgress = progress;

              return (
                <div key={s.id || idx} className="status-progress-bar-segment">
                  <div
                    className="status-progress-bar-fill"
                    style={{ width: `${segmentProgress}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* User Info Bar */}
          <div className="status-user-bar">
            <div className="status-user-meta">
              <div className="status-avatar-wrapper">
                {groupUser?.avatar ? (
                  <img
                    src={groupUser.avatar}
                    alt={groupUser.name || 'User'}
                    className="status-viewer-avatar"
                  />
                ) : (
                  <div className="status-viewer-avatar status-avatar-fallback">
                    {(groupUser?.name || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>

              <div className="status-user-details">
                <div className="status-username-row">
                  <span className="status-username">
                    {isOwnStory ? 'My Status' : (groupUser?.name || 'Contact')}
                  </span>
                  {groupUser?.role && (
                    <span className="status-user-role-badge">
                      {groupUser.role}
                    </span>
                  )}
                </div>
                <div className="status-time-row">
                  <Clock size={11} className="status-time-icon" />
                  <span>{formatTimeAgo(createdAt)}</span>
                  {expiresAt && (
                    <>
                      <span className="status-time-dot">•</span>
                      <span className="status-expires-badge">
                        {calculateHoursRemaining(expiresAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Top Action Controls */}
            <div className="status-controls-group">
              {currentStatus?.type === 'video' && (
                <button
                  type="button"
                  className="status-icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              )}

              {/* Three-dot context menu */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="status-icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                    setIsPaused(!showMenu);
                  }}
                  title="More actions"
                >
                  <MoreVertical size={18} />
                </button>

                {showMenu && (
                  <div
                    className="status-dropdown-menu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isOwnStory ? (
                      <button
                        type="button"
                        className="status-dropdown-item danger"
                        onClick={() => {
                          setShowMenu(false);
                          handleDeleteCurrentStatus();
                        }}
                      >
                        <Trash2 size={15} />
                        <span>Delete Status</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="status-dropdown-item"
                          onClick={() => {
                            setShowMenu(false);
                            alert(`Muted status updates from ${currentGroup?.user?.name}.`);
                          }}
                        >
                          <Shield size={15} />
                          <span>Mute updates</span>
                        </button>
                        <button
                          type="button"
                          className="status-dropdown-item danger"
                          onClick={() => {
                            setShowMenu(false);
                            alert('Thank you for reporting. Our moderation team has been notified.');
                          }}
                        >
                          <Trash2 size={15} />
                          <span>Report status</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                className="status-icon-btn close"
                onClick={(e) => {
                  e.stopPropagation();
                  closeStatusStory();
                }}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* STORY CONTENT BODY */}
        <div className="status-content-body">
          {/* A. TEXT STATUS */}
          {statusType === 'text' && (
            <div
              className="status-text-slide"
              style={{
                background: backgroundColor,
                color: textColor,
                ...getTypographyStyle(typographyStyle)
              }}
            >
              <div className="status-text-slide-content">
                <p className="status-text-slide-p">
                  {textBody || caption || 'Status Update'}
                </p>
                {caption && textBody !== caption && (
                  <div className="status-text-slide-caption">
                    {caption}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* B. PHOTO STATUS */}
          {statusType === 'image' && (
            <div className="status-media-slide">
              {/* Blurred background glow */}
              {mediaUrl && (
                <div
                  className="status-media-blur-bg"
                  style={{ backgroundImage: `url(${mediaUrl})` }}
                />
              )}
              {mediaUrl ? (
                <img
                  src={mediaUrl}
                  alt={caption || 'Status image'}
                  className="status-media-image"
                />
              ) : (
                <div style={{ color: '#fff', textAlign: 'center', padding: '2rem' }}>
                  <p style={{ fontSize: '1rem', fontWeight: 600 }}>Image status</p>
                  {textBody && <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>{textBody}</p>}
                </div>
              )}
              {caption && (
                <div className="status-media-caption-badge">
                  {caption}
                </div>
              )}
            </div>
          )}

          {/* C. VIDEO STATUS */}
          {statusType === 'video' && (
            <div className="status-media-slide">
              {mediaUrl && (
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  className="status-media-video"
                  playsInline
                  autoPlay
                  muted={isMuted}
                  loop={false}
                />
              )}
              {caption && (
                <div className="status-media-caption-badge">
                  {caption}
                </div>
              )}
            </div>
          )}

          {/* Left / Right Chevron Nav Buttons for Desktop */}
          <button
            type="button"
            className="status-nav-arrow left"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            title="Previous"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            type="button"
            className="status-nav-arrow right"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            title="Next"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="status-viewer-footer status-interactive-zone">
          {/* OWN STATUS: View Count and Bottom Sheet Trigger */}
          {isOwnStory ? (
            <div className="status-own-footer">
              <button
                type="button"
                className="status-view-count-pill"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsViewerListOpen(true);
                  setIsPaused(true);
                }}
              >
                <Eye size={17} className="status-view-eye-icon" />
                <span className="status-view-count-text">
                  {viewCount > 0
                    ? `Viewed by ${viewCount} ${viewCount === 1 ? 'person' : 'people'}`
                    : 'No views yet'}
                </span>
                <span className="status-view-count-cue">Tap for details</span>
              </button>
            </div>
          ) : (
            /* CONTACT'S STATUS: Quick Reactions + Reply Bar */
            <div className="status-contact-footer">
              {/* Quick Reaction Emoji Bar */}
              <div className="status-reactions-strip">
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="status-reaction-emoji-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendQuickReaction(emoji);
                    }}
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Text Reply Input */}
              <form
                className="status-reply-form"
                onSubmit={handleSendTextReply}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="status-reply-input-wrapper">
                  <Smile size={18} className="status-reply-smile-icon" />
                  <input
                    type="text"
                    placeholder={`Reply to ${groupUser?.name || 'status'}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => {
                      if (!replyText) setIsPaused(false);
                    }}
                    className="status-reply-input"
                    maxLength={500}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSendingReply}
                  className="status-reply-send-btn"
                  title="Send reply"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Reply Sent Toast Feedback with Open Chat Action */}
        {replyFeedback && (
          <div
            className="status-reply-feedback-toast"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="status-reply-toast-left">
              <span className="status-reply-toast-check">✓</span>
              <span className="status-reply-toast-msg">{replyFeedback.text}</span>
            </div>
            {replyFeedback.contactUser && (
              <button
                type="button"
                className="status-reply-open-chat-btn"
                onClick={() => handleOpenChat(replyFeedback.contactUser)}
                title={`Open chat with ${replyFeedback.contactUser.name || 'contact'}`}
              >
                <span>Open Chat</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* OWN STATUS VIEWER DETAILS BOTTOM SHEET */}
      <StatusViewerBottomSheet
        status={currentStatus}
        isOpen={isViewerListOpen}
        onClose={() => {
          setIsViewerListOpen(false);
          setIsPaused(false);
        }}
        onDelete={handleDeleteCurrentStatus}
      />
    </div>
  );
}
