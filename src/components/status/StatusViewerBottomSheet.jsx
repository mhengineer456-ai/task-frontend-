import React, { useEffect, useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { X, Eye, Trash2, Clock, Users, ShieldAlert } from 'lucide-react';
import { getTimeAgo } from '../../utils/dateUtils';

export default function StatusViewerBottomSheet({
  status,
  isOpen,
  onClose,
  onDelete
}) {
  const { fetchStatusViews, users = [] } = useTaskContext();
  const [views, setViews] = useState([]);
  const [totalViews, setTotalViews] = useState(status?.views_count || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && status?.id) {
      setIsLoading(true);
      fetchStatusViews(status.id)
        .then(res => {
          if (isMounted) {
            setViews(res.views || []);
            setTotalViews(res.totalViews || (res.views ? res.views.length : 0));
          }
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, status?.id]);

  if (!isOpen || !status) return null;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this status update?')) {
      setIsDeleting(true);
      try {
        await onDelete(status.id);
        onClose();
      } catch (e) {
        console.error(e);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 120000,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
      }}
    >
      <div
        className="modal-container status-viewer-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--bg-card)',
          borderRadius: '24px 24px 0 0',
          borderTop: '1px solid var(--border-color)',
          boxShadow: '0 -16px 40px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '82vh',
          animation: 'slideUpSheet 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        {/* Grab Handle for Touch UI */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px 0' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '4px', background: 'var(--border-color)' }} />
        </div>

        {/* Sheet Header */}
        <div style={{ padding: '12px 20px 16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--brand-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
              <Eye style={{ width: '19px', height: '19px' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {totalViews === 0 ? 'No Views Yet' : `Viewed by ${totalViews} ${totalViews === 1 ? 'person' : 'people'}`}
              </h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Posted {getTimeAgo(status.created_at)} • Expires in 24 hours
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                background: 'rgba(255, 59, 48, 0.1)',
                border: 'none',
                color: '#FF3B30',
                padding: '7px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              title="Delete this status"
            >
              <Trash2 style={{ width: '16px', height: '16px' }} />
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--bg-input)',
                border: 'none',
                color: 'var(--text-secondary)',
                padding: '7px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>

        {/* Viewers List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', minHeight: '160px' }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '10px', color: 'var(--text-secondary)' }}>
              <div style={{ width: '24px', height: '24px', border: '2.5px solid var(--border-color)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: '0.78rem' }}>Loading genuine viewers...</span>
            </div>
          ) : views.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', textAlign: 'center', gap: '8px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <Users style={{ width: '22px', height: '22px' }} />
              </div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                No views yet
              </h4>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', maxWidth: '280px', margin: 0 }}>
                Contacts who view your status update will appear here with authentic timestamps.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 8px' }}>
                AUTHENTIC VIEWERS ({views.length})
              </div>
              {views.map(viewer => {
                const userObj = users.find(u => String(u.id) === String(viewer.viewerId));
                const avatar = viewer.avatar || userObj?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewer.name)}&background=007AFF&color=fff&size=60`;
                const subtitle = userObj ? `${userObj.role} • ${userObj.department || 'Team'}` : 'Team Member';

                return (
                  <div
                    key={viewer.id || viewer.viewerId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <img
                        src={avatar}
                        alt={viewer.name}
                        style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--border-color)' }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {viewer.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {subtitle}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}>
                      <Clock style={{ width: '12px', height: '12px' }} />
                      <span>{getTimeAgo(viewer.viewedAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
