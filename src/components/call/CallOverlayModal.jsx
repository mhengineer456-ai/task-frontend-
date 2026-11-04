import React, { useEffect, useRef, useState } from 'react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ChevronDown,
  AlertCircle,
  Volume1,
  MonitorUp,
  MonitorOff,
  Sparkles
} from 'lucide-react';
import { useCallContext } from '../../context/CallContext';
import CallAiSummaryModal from './CallAiSummaryModal';

export default function CallOverlayModal() {
  const {
    callState,
    callId,
    callType,
    channelId,
    remoteUser,
    isCaller,
    duration,
    isMuted,
    isVideoOff,
    isSpeakerOn,
    isFullscreen,
    isPiPMinimized,
    isScreenSharing,
    isRemoteScreenSharing,
    errorMessage,
    connectionStatus,
    localStream,
    remoteStream,
    screenStream,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    toggleFullscreen,
    togglePiPMinimized,
    toggleScreenShare
  } = useCallContext();

  const remoteAudioRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const presenterVideoRef = useRef(null);
  const modalContainerRef = useRef(null);

  const [audioAutoplayBlocked, setAudioAutoplayBlocked] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  // Derived Call Stage Conditions
  const isVideoCall = callType === 'video';
  const isConnected = callState === 'CONNECTED';
  const isConnecting = callState === 'CONNECTING';
  const isRinging = callState === 'RINGING' || callState === 'INITIATING';
  const isFailedOrEnded = ['REJECTED', 'MISSED', 'ENDED', 'BUSY', 'FAILED'].includes(callState);
  const showVideoStage = (isVideoCall || isScreenSharing || isRemoteScreenSharing) && isConnected;

  // Local PiP drag position
  const [pipPos, setPipPos] = useState({ x: 24, y: 24 });
  const [isDraggingPip, setIsDraggingPip] = useState(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialX: 24, initialY: 24 });

  // 1. Dedicated Remote Audio Stream Attachment
  // This ensures audio plays for BOTH simple voice calls and video calls without cutting off
  useEffect(() => {
    const audioEl = remoteAudioRef.current;
    if (!audioEl) return;

    if (remoteStream && remoteStream.getAudioTracks().length > 0) {
      console.log('🔊 [Audio Engine] Binding remoteStream to audio element. Audio tracks:', remoteStream.getAudioTracks().length);
      audioEl.srcObject = remoteStream;
      audioEl.muted = !isSpeakerOn;
      audioEl.volume = 1.0;

      const playPromise = audioEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🔊 [Audio Engine] Audio playback started successfully.');
            setAudioAutoplayBlocked(false);
          })
          .catch((err) => {
            console.warn('⚠️ [Audio Engine] Autoplay blocked by browser policy, awaiting interaction:', err);
            setAudioAutoplayBlocked(true);
          });
      }
    } else {
      audioEl.srcObject = null;
    }
  }, [remoteStream, isSpeakerOn, callState]);

  // Handle speaker toggle
  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !isSpeakerOn;
    }
  }, [isSpeakerOn]);

  // Click-to-unblock audio handler in case browser policies require explicit interaction
  const handleEnableAudio = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.play().then(() => {
        setAudioAutoplayBlocked(false);
      }).catch((e) => console.warn('Could not start audio:', e));
    }
  };

  // 2. Attach Presenter Video Stream (When local user is sharing their screen)
  useEffect(() => {
    if (presenterVideoRef.current) {
      if (screenStream) {
        presenterVideoRef.current.srcObject = screenStream;
        presenterVideoRef.current.play().catch((e) => console.warn('Presenter video play error:', e));
      } else {
        presenterVideoRef.current.srcObject = null;
      }
    }
  }, [screenStream, isScreenSharing, showVideoStage, callState]);

  // 3. Attach Local Video Stream / PiP Stream
  useEffect(() => {
    if (localVideoRef.current) {
      // When local user is presenting, PiP displays remote participant's video (if sending video)
      // Otherwise, PiP displays local camera
      const streamToBind = (isScreenSharing && !isRemoteScreenSharing)
        ? (remoteStream && remoteStream.getVideoTracks().length > 0 ? remoteStream : null)
        : localStream;

      if (streamToBind) {
        localVideoRef.current.srcObject = streamToBind;
        localVideoRef.current.play().catch((e) => console.warn('Local video play error:', e));
      } else {
        localVideoRef.current.srcObject = null;
      }
    }
  }, [localStream, remoteStream, screenStream, isScreenSharing, isRemoteScreenSharing, isVideoOff, showVideoStage, callState]);

  // 4. Attach Remote Video Stream (Remote peer's camera or remote peer's screen share)
  useEffect(() => {
    if (remoteVideoRef.current) {
      if (remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch((e) => console.warn('Remote video play error:', e));
      } else {
        remoteVideoRef.current.srcObject = null;
      }
    }
  }, [remoteStream, isRemoteScreenSharing, isScreenSharing, showVideoStage, callState]);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const remM = m % 60;
      return `${String(h).padStart(2, '0')}:${String(remM).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // PiP Drag Handlers
  const handlePipMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingPip(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: pipPos.x,
      initialY: pipPos.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingPip) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      setPipPos({
        x: Math.max(10, Math.min(window.innerWidth - 180, dragStartRef.current.initialX - dx)),
        y: Math.max(10, Math.min(window.innerHeight - 240, dragStartRef.current.initialY - dy))
      });
    };

    const handleMouseUp = () => {
      setIsDraggingPip(false);
    };

    if (isDraggingPip) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPip]);

  // If IDLE, render nothing
  if (callState === 'IDLE') return null;

  return (
    <>
      {/* 
        CRITICAL: Persistent Remote Audio Element
        Always mounted whenever callState !== 'IDLE' so voice never drops or fails during simple calls
      */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ position: 'fixed', top: 0, left: 0, width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
      />

      {/* Autoplay blocked banner: Click to unmute if browser policy requires it */}
      {audioAutoplayBlocked && (callState === 'CONNECTED' || callState === 'CONNECTING') && (
        <div
          onClick={handleEnableAudio}
          style={{
            position: 'fixed',
            top: '72px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100002,
            background: '#25D366',
            color: '#ffffff',
            padding: '9px 20px',
            borderRadius: '24px',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'callCardPop 0.25s ease'
          }}
          title="Click to enable call voice audio"
        >
          <Volume1 size={18} />
          <span>Tap to unmute call audio</span>
        </div>
      )}

      {/* ====================================================================
          1. INCOMING CALL MODAL DIALOG (WhatsApp Web Style)
          ==================================================================== */}
      {callState === 'INCOMING' ? (
        <div className="call-incoming-backdrop">
          <div className="call-incoming-card">
            <div className="call-avatar-wrapper pulsing">
              <img
                src={remoteUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(remoteUser?.name || 'User')}&background=00A884&color=fff&size=150`}
                alt={remoteUser?.name}
                className="call-avatar-img"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(remoteUser?.name || 'User')}&background=00A884&color=fff&size=150`;
                }}
              />
              <div className="call-incoming-type-badge">
                {callType === 'video' ? <Video size={16} /> : <Phone size={16} />}
              </div>
            </div>

            <div className="call-incoming-info">
              <h3 className="call-incoming-title">{remoteUser?.name || 'Team Member'}</h3>
              <p className="call-incoming-subtitle">
                Incoming {callType === 'video' ? 'Video' : 'Voice'} Call...
              </p>
            </div>

            {/* Action Buttons: Accept / Reject */}
            <div className="call-incoming-actions">
              <button
                type="button"
                onClick={() => rejectCall('Call declined')}
                className="call-btn-circle call-btn-reject"
                title="Decline Call"
              >
                <PhoneOff size={24} />
              </button>

              <button
                type="button"
                onClick={acceptCall}
                className="call-btn-circle call-btn-accept"
                title={`Accept ${callType === 'video' ? 'Video' : 'Voice'} Call`}
              >
                {callType === 'video' ? <Video size={24} /> : <Phone size={24} />}
              </button>
            </div>
          </div>
        </div>
      ) : isPiPMinimized && (callState === 'CONNECTED' || callState === 'CONNECTING') ? (
        /* ====================================================================
            2. MINIMIZED PICTURE-IN-PICTURE (PIP) FLOATING WIDGET
            ==================================================================== */
        <div
          className="call-minimized-pip"
          onClick={togglePiPMinimized}
          title="Click to expand call"
        >
          <div className="call-minimized-avatar">
            <img
              src={remoteUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(remoteUser?.name || 'User')}&background=00A884&color=fff&size=80`}
              alt={remoteUser?.name}
            />
            <span className="call-live-indicator" />
          </div>
          <div className="call-minimized-details">
            <span className="call-minimized-name">{remoteUser?.name || 'In Call'}</span>
            <span className="call-minimized-timer">{formatTime(duration)}</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              endCall();
            }}
            className="call-minimized-end"
            title="End Call"
          >
            <PhoneOff size={14} />
          </button>
        </div>
      ) : (
        /* ====================================================================
            3. FULL CALL SCREEN OVERLAY (Outgoing, Voice, Video, or Notice)
            ==================================================================== */
        (
          <div
            ref={modalContainerRef}
            className={`call-full-overlay ${isFullscreen ? 'call-fullscreen' : ''}`}
          >
            {/* Screen Sharing Notification Banners */}
            {isRemoteScreenSharing && (
              <div className="call-screenshare-banner">
                <MonitorUp size={16} />
                <span>{remoteUser?.name || 'Participant'} is sharing their screen</span>
              </div>
            )}

            {/* Top Header Bar */}
            <div className="call-top-bar">
              <div className="call-top-left">
                <div className="call-security-badge">
                  <span className="call-lock-icon">🔒</span>
                  <span>End-to-end encrypted</span>
                </div>
              </div>

              <div className="call-top-center">
                {isConnected ? (
                  <div className="call-timer-chip">
                    <span className="call-record-dot" />
                    <span>{formatTime(duration)}</span>
                  </div>
                ) : (
                  <div className="call-status-chip">
                    {isRinging ? (isCaller ? 'Ringing...' : 'Calling...') : isConnecting ? 'Connecting...' : (errorMessage || callState)}
                  </div>
                )}
              </div>

              <div className="call-top-right">
                {isConnected && (
                  <button
                    type="button"
                    onClick={togglePiPMinimized}
                    className="call-header-btn"
                    title="Minimize to window"
                  >
                    <ChevronDown size={18} />
                  </button>
                )}
                {showVideoStage && (
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="call-header-btn"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                )}
              </div>
            </div>

            {/* Main View Area */}
            <div className="call-main-stage">
              {/* Active Video / Screen Sharing Stage */}
              {showVideoStage ? (
                <div className="call-video-stage">
                  {/* 1. If YOU are presenting your screen: Display your live screen share on the stage */}
                  {isScreenSharing && !isRemoteScreenSharing ? (
                    <div className="call-presenter-stage">
                      <video
                        ref={presenterVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="call-remote-video"
                        style={{ objectFit: 'contain' }}
                      />
                      <div className="call-presenter-badge">
                        <div className="call-presenter-indicator">
                          <MonitorUp size={16} />
                          <span>You are sharing your screen</span>
                        </div>
                        <button
                          type="button"
                          onClick={toggleScreenShare}
                          className="call-presenter-stop-btn"
                          title="Stop sharing your screen"
                        >
                          <MonitorOff size={14} />
                          <span>Stop Sharing</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* 2. Remote Video Stream (or Remote Peer's Shared Screen) */}
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="call-remote-video"
                        style={isRemoteScreenSharing ? { objectFit: 'contain' } : undefined}
                      />

                      {/* Remote Fallback Avatar if remote camera/screen is paused or not sending */}
                      {!isRemoteScreenSharing && (!remoteStream || remoteStream.getVideoTracks().length === 0) && (
                        <div className="call-remote-placeholder">
                          <div className="call-large-avatar">
                            <img
                              src={remoteUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(remoteUser?.name || 'User')}&background=00A884&color=fff&size=200`}
                              alt={remoteUser?.name}
                            />
                          </div>
                          <h2 className="call-participant-name">{remoteUser?.name}</h2>
                          <p className="call-audio-badge">Audio connected</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Floating Draggable Local / Participant PiP Video Window */}
                  <div
                    className={`call-local-pip-box ${isDraggingPip ? 'dragging' : ''}`}
                    style={{
                      right: `${pipPos.x}px`,
                      bottom: `${pipPos.y}px`
                    }}
                    onMouseDown={handlePipMouseDown}
                    title="Drag to reposition preview"
                  >
                    {isScreenSharing && !isRemoteScreenSharing ? (
                      /* When you are presenting: PiP shows remote colleague */
                      remoteStream && remoteStream.getVideoTracks().length > 0 ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="call-local-video"
                          style={{ transform: 'none' }}
                        />
                      ) : (
                        <div className="call-local-pip-off">
                          <img
                            src={remoteUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(remoteUser?.name || 'User')}&background=00A884&color=fff&size=80`}
                            alt={remoteUser?.name}
                            style={{ width: 48, height: 48, borderRadius: '50%', marginBottom: 6 }}
                          />
                          <span>{remoteUser?.name || 'Participant'}</span>
                        </div>
                      )
                    ) : isVideoOff && !isScreenSharing ? (
                      <div className="call-local-pip-off">
                        <VideoOff size={22} />
                        <span>Camera Off</span>
                      </div>
                    ) : (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="call-local-video"
                      />
                    )}
                    <div className="call-local-pip-label">
                      <span>{isScreenSharing && !isRemoteScreenSharing ? (remoteUser?.name || 'Participant') : 'You'}</span>
                      {isMuted && !isScreenSharing && <MicOff size={11} color="#EF4444" />}
                    </div>
                  </div>
                </div>
                ) : (
                  /* Voice Call Screen / Outgoing Calling Screen / Notice Screen */
                  <div className="call-voice-stage">
                    <div className={`call-large-avatar ${isRinging ? 'pulsing' : ''}`}>
                      <img
                        src={remoteUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(remoteUser?.name || 'User')}&background=00A884&color=fff&size=220`}
                        alt={remoteUser?.name}
                      />
                      {isConnected && (
                        <div className="call-voice-waves">
                          <span className="wave-bar bar-1" />
                          <span className="wave-bar bar-2" />
                          <span className="wave-bar bar-3" />
                          <span className="wave-bar bar-4" />
                        </div>
                      )}
                    </div>

                    <h2 className="call-participant-name">{remoteUser?.name || 'Workspace Colleague'}</h2>
                    <p className="call-status-label">
                      {isRinging
                        ? (isCaller ? 'Ringing...' : 'Calling...')
                        : isConnecting
                        ? 'Connecting voice channel...'
                        : isConnected
                        ? `Connected • Voice Call (${formatTime(duration)})`
                        : (errorMessage || 'Call ended')}
                    </p>

                    {isFailedOrEnded && (
                      <div className="call-ended-wrapper">
                        <div className="call-ended-notice">
                          <AlertCircle size={16} />
                          <span>{errorMessage || 'Call ended'}</span>
                        </div>
                        {duration > 5 && (
                          <button
                            type="button"
                            onClick={() => setIsSummaryModalOpen(true)}
                            className="call-ended-summary-trigger"
                          >
                            <Sparkles size={16} />
                            <span>✨ Generate AI Meeting Minutes & Tasks</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Floating Bottom Control Dock (WhatsApp Web Style) */}
              <div className="call-control-dock">
                {/* Mic Toggle */}
                <button
                  type="button"
                  onClick={toggleMute}
                  disabled={isFailedOrEnded}
                  className={`call-dock-btn ${isMuted ? 'btn-active-off' : ''}`}
                  title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                {/* Video Camera Toggle */}
                {isVideoCall && (
                  <button
                    type="button"
                    onClick={toggleVideo}
                    disabled={isFailedOrEnded}
                    className={`call-dock-btn ${isVideoOff ? 'btn-active-off' : ''}`}
                    title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                  >
                    {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                  </button>
                )}

                {/* Screen Share Toggle */}
                {isConnected && (
                  <button
                    type="button"
                    onClick={toggleScreenShare}
                    disabled={isFailedOrEnded}
                    className={`call-dock-btn ${isScreenSharing ? 'btn-active-screenshare' : ''}`}
                    title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
                  >
                    {isScreenSharing ? <MonitorOff size={20} /> : <MonitorUp size={20} />}
                  </button>
                )}

                {/* Speaker Output Toggle */}
                <button
                  type="button"
                  onClick={toggleSpeaker}
                  disabled={isFailedOrEnded}
                  className={`call-dock-btn ${!isSpeakerOn ? 'btn-active-off' : ''}`}
                  title={isSpeakerOn ? 'Mute Speaker' : 'Turn On Speaker'}
                >
                  {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>

                {/* AI Meeting Summary & Notes Button */}
                {isConnected && (
                  <button
                    type="button"
                    onClick={() => setIsSummaryModalOpen(true)}
                    className="call-dock-btn"
                    title="PulseBot AI Meeting Minutes & Tasks"
                  >
                    <Sparkles size={19} />
                  </button>
                )}

                {/* Red End Call Button */}
                <button
                  type="button"
                  onClick={() => endCall(isRinging ? 'Cancelled' : 'Call ended')}
                  className="call-dock-btn btn-danger-end"
                  title="End Call"
                >
                  <PhoneOff size={22} />
                </button>
              </div>

              {/* PulseBot AI Summary Modal */}
              {isSummaryModalOpen && (
                <CallAiSummaryModal
                  isOpen={isSummaryModalOpen}
                  onClose={() => setIsSummaryModalOpen(false)}
                  callData={{
                    id: callId || `call-${Date.now()}`,
                    caller_name: isCaller ? 'You' : remoteUser?.name,
                    receiver_name: isCaller ? remoteUser?.name : 'You',
                    duration_seconds: duration,
                    channel_id: channelId,
                    call_type: callType
                  }}
                  currentUser={{ id: isCaller ? 'usr-1' : (remoteUser?.id || 'usr-1') }}
                />
              )}
            </div>
        )
      )}
    </>
  );
}
