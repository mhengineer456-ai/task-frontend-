import React from 'react';
import { Plus } from 'lucide-react';

/**
 * WhatsApp-style circular status ring avatar with segmented arcs
 * - Green ring (#25D366 / #00A884) for unread statuses
 * - Grey ring (#8696A0) for viewed statuses
 * - Segmented arcs when multiple status updates exist
 */
export default function StatusRingAvatar({
  avatar,
  name = 'User',
  count = 1,
  isUnread = true,
  size = 46,
  hasPlus = false,
  onPlusClick
}) {
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const gapSize = count > 1 ? 4.5 : 0;
  const segmentLength = count > 1 ? (circumference - gapSize * count) / count : circumference;
  const strokeColor = isUnread ? '#25D366' : '#8696A0';

  return (
    <div
      className="whatsapp-status-avatar-wrap"
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* WhatsApp SVG Status Ring (Only if count > 0) */}
      {count > 0 && (
        <svg
          width={size}
          height={size}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: 'rotate(-90deg)',
            pointerEvents: 'none'
          }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={count > 1 ? `${segmentLength} ${gapSize}` : undefined}
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Avatar Image / Fallback Initial */}
      <div
        style={{
          width: `${size - 8}px`,
          height: `${size - 8}px`,
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'var(--bg-input)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <span
            style={{
              fontWeight: 800,
              fontSize: `${Math.round(size * 0.38)}px`,
              color: 'var(--text-secondary)'
            }}
          >
            {(name || 'U')[0].toUpperCase()}
          </span>
        )}
      </div>

      {/* Small WhatsApp Green Plus (+) Badge (For My Status) */}
      {hasPlus && (
        <button
          type="button"
          onClick={(e) => {
            if (onPlusClick) {
              e.stopPropagation();
              onPlusClick(e);
            }
          }}
          className="whatsapp-status-plus-badge"
          title="Add status update"
          aria-label="Add status update"
          style={{
            position: 'absolute',
            bottom: '0px',
            right: '0px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#25D366',
            color: '#FFFFFF',
            border: '2px solid var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
            zIndex: 2,
            transition: 'transform 0.16s ease, background 0.16s ease'
          }}
        >
          <Plus size={12} strokeWidth={3.5} />
        </button>
      )}
    </div>
  );
}
