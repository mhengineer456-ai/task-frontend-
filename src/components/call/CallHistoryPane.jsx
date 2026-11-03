import React, { useState } from 'react';
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Trash2,
  Search,
  Clock,
  User
} from 'lucide-react';
import { useCallContext } from '../../context/CallContext';
import { useTaskContext } from '../../context/TaskContext';

export default function CallHistoryPane() {
  const { callHistory, isHistoryLoading, startCall, fetchCallHistory } = useCallContext();
  const { activeUser, users = [], startDirectChat } = useTaskContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'missed'

  // Format timestamp nicely
  const formatCallDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = d.toDateString() === yesterday.toDateString();

      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) return `Today, ${timeStr}`;
      if (isYesterday) return `Yesterday, ${timeStr}`;
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
    } catch (e) {
      return isoStr;
    }
  };

  const formatDuration = (secs) => {
    if (!secs || secs <= 0) return '';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Filter logs
  const filteredLogs = (callHistory || []).filter((log) => {
    const isCaller = String(log.caller_id) === String(activeUser?.id);
    const peerName = isCaller ? (log.receiver_name || '') : (log.caller_name || '');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!peerName.toLowerCase().includes(q)) return false;
    }

    if (filterType === 'missed') {
      return log.status === 'missed' || log.status === 'rejected';
    }

    return true;
  });

  // Handle immediate Call Back
  const handleCallBack = (log, type = null) => {
    const isCaller = String(log.caller_id) === String(activeUser?.id);
    const peerId = isCaller ? log.receiver_id : log.caller_id;
    const peerName = isCaller ? log.receiver_name : log.caller_name;
    const peerAvatar = isCaller ? log.receiver_avatar : log.caller_avatar;

    const matchedUser = users.find(u => String(u.id) === String(peerId)) || {
      id: peerId,
      name: peerName,
      avatar: peerAvatar
    };

    const callTypeToStart = type || log.call_type || 'voice';
    startCall(matchedUser, callTypeToStart, log.channel_id);
  };

  return (
    <div className="call-history-pane">
      {/* Search and Filter Header */}
      <div className="call-history-header">
        <div className="call-search-box">
          <Search size={14} className="call-search-icon" />
          <input
            type="text"
            placeholder="Search call logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="call-search-input"
          />
        </div>

        <div className="call-filter-tabs">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`call-filter-pill ${filterType === 'all' ? 'active' : ''}`}
          >
            All Calls ({callHistory?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('missed')}
            className={`call-filter-pill ${filterType === 'missed' ? 'active' : ''}`}
          >
            Missed ({callHistory?.filter(c => c.status === 'missed' || c.status === 'rejected').length || 0})
          </button>
        </div>
      </div>

      {/* List Stream */}
      <div className="call-history-stream">
        {filteredLogs.length === 0 ? (
          <div className="call-history-empty">
            <div className="call-empty-icon-wrap">
              <Phone size={32} />
            </div>
            <h4>No Call Records Found</h4>
            <p>
              {filterType === 'missed'
                ? 'You have no missed or declined calls.'
                : 'Start an instant voice or video call with any contact from your chat header!'}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isCaller = String(log.caller_id) === String(activeUser?.id);
            const peerId = isCaller ? log.receiver_id : log.caller_id;
            const peerName = isCaller ? (log.receiver_name || 'Team Member') : (log.caller_name || 'Team Member');
            const peerAvatar = isCaller ? log.receiver_avatar : log.caller_avatar;
            const isVideo = log.call_type === 'video';
            const isMissed = log.status === 'missed' || log.status === 'rejected';

            return (
              <div key={log.id} className="call-log-card">
                {/* Avatar */}
                <div className="call-log-avatar-wrap">
                  <img
                    src={peerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(peerName)}&background=00A884&color=fff&size=100`}
                    alt={peerName}
                    className="call-log-avatar"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(peerName)}&background=00A884&color=fff&size=100`;
                    }}
                  />
                  <div className={`call-type-mini-badge ${isVideo ? 'video' : 'voice'}`}>
                    {isVideo ? <Video size={10} /> : <Phone size={10} />}
                  </div>
                </div>

                {/* Details */}
                <div className="call-log-info">
                  <div className="call-log-title-row">
                    <span className={`call-log-name ${isMissed ? 'text-missed' : ''}`}>
                      {peerName}
                    </span>
                  </div>

                  <div className="call-log-meta-row">
                    {/* Direction Arrow */}
                    <span className="call-log-arrow">
                      {isMissed ? (
                        <PhoneMissed size={13} color="#EF4444" />
                      ) : isCaller ? (
                        <PhoneOutgoing size={13} color="#10B981" />
                      ) : (
                        <PhoneIncoming size={13} color="#10B981" />
                      )}
                    </span>

                    {/* Date / Time */}
                    <span className="call-log-time">{formatCallDate(log.created_at)}</span>

                    {/* Duration if completed */}
                    {log.duration_seconds > 0 && (
                      <span className="call-log-duration">
                        · {formatDuration(log.duration_seconds)}
                      </span>
                    )}

                    {isMissed && (
                      <span className="call-log-missed-label">
                        · {log.status === 'rejected' ? 'Declined' : 'Missed'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Call Back Actions */}
                <div className="call-log-actions">
                  <button
                    type="button"
                    onClick={() => handleCallBack(log, 'voice')}
                    className="call-log-action-btn"
                    title={`Voice Call ${peerName}`}
                  >
                    <Phone size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCallBack(log, 'video')}
                    className="call-log-action-btn video"
                    title={`Video Call ${peerName}`}
                  >
                    <Video size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
