import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../api/socket';
import { callService } from '../api/callService';
import {
  startOutgoingRingback,
  startIncomingRingtone,
  playBusyTone,
  playHangupBeep
} from '../utils/callAudioSynthesizer';

const CallContext = createContext(null);

export const useCallContext = () => {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error('useCallContext must be used within a CallProvider');
  }
  return ctx;
};

// Fallback public STUN servers
const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' }
];

// Helper to safely find the video transceiver on RTCPeerConnection without confusing audio
const getVideoTransceiver = (pc) => {
  if (!pc || !pc.getTransceivers) return null;
  const transceivers = pc.getTransceivers();
  return transceivers.find((t) => {
    const senderKind = t.sender?.track?.kind;
    const receiverKind = t.receiver?.track?.kind;
    return senderKind === 'video' || receiverKind === 'video';
  }) || null;
};

// Helper to safely find the video sender on RTCPeerConnection
const getVideoSender = (pc) => {
  if (!pc) return null;
  const vt = getVideoTransceiver(pc);
  if (vt && vt.sender) return vt.sender;
  const senders = pc.getSenders ? pc.getSenders() : [];
  return senders.find((s) => s.track && s.track.kind === 'video') || null;
};

export const CallProvider = ({ children, activeUser }) => {
  // Call States: IDLE, INITIATING, RINGING, INCOMING, CONNECTING, CONNECTED, REJECTED, MISSED, ENDED, BUSY, FAILED
  const [callState, setCallState] = useState('IDLE');
  const [callId, setCallId] = useState(null);
  const [callType, setCallType] = useState('voice'); // 'voice' | 'video'
  const [remoteUser, setRemoteUser] = useState(null); // { id, name, avatar, role }
  const [isCaller, setIsCaller] = useState(false);
  const [channelId, setChannelId] = useState(null);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiPMinimized, setIsPiPMinimized] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRemoteScreenSharing, setIsRemoteScreenSharing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('new');
  const [facingMode, setFacingMode] = useState('user'); // 'user' (selfie) | 'environment' (rear camera)
  const [mobileNoticeOpen, setMobileNoticeOpen] = useState(false);

  // Detect mobile device
  const isMobileDevice = typeof window !== 'undefined' && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 1 && window.innerWidth < 1024)
  );

  // Media Streams
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  // Call History State
  const [callHistory, setCallHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // References
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const iceServersRef = useRef(DEFAULT_ICE_SERVERS);
  const pendingIceCandidatesRef = useRef([]);
  const activeSoundRef = useRef(null);
  const durationTimerRef = useRef(null);
  const callTimeoutTimerRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const remoteUserRef = useRef(null);
  const pendingScreenShareRef = useRef(false);

  // Fetch configured ICE servers on mount
  useEffect(() => {
    callService.getIceServers().then((servers) => {
      if (servers && servers.length > 0) {
        iceServersRef.current = servers;
      }
    }).catch(() => {});
  }, []);

  // Fetch call history whenever activeUser changes
  const fetchCallHistory = useCallback(async () => {
    if (!activeUser?.id) return;
    setIsHistoryLoading(true);
    try {
      const logs = await callService.getCallHistory(activeUser.id);
      setCallHistory(logs || []);
    } catch (err) {
      console.warn('Failed to load call history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [activeUser?.id]);

  useEffect(() => {
    fetchCallHistory();
  }, [fetchCallHistory]);

  // Stop any active ringtone or tone
  const stopActiveSound = useCallback(() => {
    if (activeSoundRef.current && typeof activeSoundRef.current.stop === 'function') {
      try {
        activeSoundRef.current.stop();
      } catch (e) {}
      activeSoundRef.current = null;
    }
  }, []);

  // Clean up all local media tracks
  const cleanupMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    setIsRemoteScreenSharing(false);
    setScreenStream(null);
    setLocalStream(null);

    if (remoteStreamRef.current) {
      remoteStreamRef.current = null;
    }
    setRemoteStream(null);
  }, []);

  // Clean up RTCPeerConnection
  const cleanupPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.onconnectionstatechange = null;
        peerConnectionRef.current.close();
      } catch (e) {}
      peerConnectionRef.current = null;
    }
    pendingIceCandidatesRef.current = [];
  }, []);

  // Reset state to IDLE
  const resetCallState = useCallback(() => {
    stopActiveSound();
    cleanupMedia();
    cleanupPeerConnection();

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (callTimeoutTimerRef.current) {
      clearTimeout(callTimeoutTimerRef.current);
      callTimeoutTimerRef.current = null;
    }

    setCallState('IDLE');
    setCallId(null);
    setRemoteUser(null);
    setIsCaller(false);
    setChannelId(null);
    setDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsPiPMinimized(false);
    setIsFullscreen(false);
    setErrorMessage(null);
    setConnectionStatus('new');
    setFacingMode('user');
    setMobileNoticeOpen(false);
    callStartTimeRef.current = null;
  }, [stopActiveSound, cleanupMedia, cleanupPeerConnection]);

  // Duration timer when connected
  useEffect(() => {
    if (callState === 'CONNECTED') {
      callStartTimeRef.current = Date.now();
      durationTimerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [callState]);

  // Helper to create RTCPeerConnection
  const createPeerConnection = useCallback((currentCallId, targetUserId) => {
    cleanupPeerConnection();

    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current,
      iceCandidatePoolSize: 10
    });

    // Remote track handler
    pc.ontrack = (event) => {
      console.log('📡 [WebRTC] Remote track received:', event.track.kind, 'id:', event.track.id);
      let stream = remoteStreamRef.current;
      if (!stream) {
        stream = new MediaStream();
        remoteStreamRef.current = stream;
      }
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          if (!stream.getTracks().some(t => t.id === track.id)) {
            stream.addTrack(track);
          }
        });
      } else if (event.track) {
        if (!stream.getTracks().some(t => t.id === event.track.id)) {
          stream.addTrack(event.track);
        }
      }
      // Ensure all audio tracks are enabled and active
      stream.getAudioTracks().forEach((t) => {
        t.enabled = true;
      });
      setRemoteStream(new MediaStream(stream.getTracks()));

      // Media is arriving - ensure call state is marked CONNECTED and ringtone is stopped
      setCallState('CONNECTED');
      stopActiveSound();
    };

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate && targetUserId) {
        const socket = getSocket();
        if (socket) {
          socket.emit('call:ice-candidate', {
            callId: currentCallId,
            targetUserId: String(targetUserId),
            candidate: event.candidate
          });
        }
      }
    };

    // ICE Connection state handler (Critical for NAT/relay where iceConnectionState triggers first)
    pc.oniceconnectionstatechange = () => {
      console.log('🧊 [WebRTC] ICE Connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setCallState('CONNECTED');
        stopActiveSound();
      }
    };

    // Connection state change handler
    pc.onconnectionstatechange = () => {
      console.log('🌐 [WebRTC] Connection state:', pc.connectionState);
      setConnectionStatus(pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState('CONNECTED');
        stopActiveSound();
      } else if (pc.connectionState === 'failed') {
        setErrorMessage('WebRTC media connection failed. Reconnecting or ending call.');
        setTimeout(() => {
          endCall('Connection failed');
        }, 3000);
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [cleanupPeerConnection, stopActiveSound]);

  // ====================================================================
  // Call Actions
  // ====================================================================

  /**
   * Start Outgoing Call
   */
  const startCall = useCallback(async (targetUser, type = 'voice', chatChannelId = null, autoShareScreen = false) => {
    if (!activeUser?.id || !targetUser?.id) return;
    if (callState !== 'IDLE') {
      console.warn('Cannot initiate call: already in another call state:', callState);
      return;
    }

    const newCallId = `call-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const isVideo = type === 'video' || autoShareScreen;

    setCallId(newCallId);
    setCallType(isVideo ? 'video' : type);
    setRemoteUser(targetUser);
    remoteUserRef.current = targetUser;
    pendingScreenShareRef.current = Boolean(autoShareScreen);
    setIsCaller(true);
    setChannelId(chatChannelId);
    setCallState('INITIATING');
    setErrorMessage(null);
    setDuration(0);

    // Play outgoing ringback tone
    stopActiveSound();
    activeSoundRef.current = startOutgoingRingback();

    try {
      // 1. Acquire Local User Media with fallback
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: isVideo ? {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: 'user'
          } : false
        });
      } catch (err) {
        console.warn('Strict audio constraints failed, using simple audio: true', err);
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideo ? true : false
        });
      }

      // Ensure all audio tracks are explicitly enabled
      stream.getAudioTracks().forEach((t) => {
        t.enabled = true;
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      // 2. Setup RTCPeerConnection
      const pc = createPeerConnection(newCallId, targetUser.id);
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // 3. Emit call:initiate via Socket.IO
      const socket = getSocket();
      if (socket) {
        socket.emit('call:initiate', {
          callId: newCallId,
          caller: {
            id: String(activeUser.id),
            name: activeUser.name,
            avatar: activeUser.avatar || '',
            role: activeUser.role || 'Member'
          },
          receiverId: String(targetUser.id),
          receiverName: targetUser.name,
          receiverAvatar: targetUser.avatar || '',
          callType: type,
          channelId: chatChannelId
        });
      }

      setCallState('RINGING');

      // 4. Outgoing Call Timeout (35 seconds)
      callTimeoutTimerRef.current = setTimeout(() => {
        if (callState !== 'CONNECTED') {
          console.log('⏰ [Call] Outgoing call timed out. Marking as missed.');
          stopActiveSound();
          setCallState('MISSED');
          setErrorMessage('No answer');

          if (socket) {
            socket.emit('call:missed', {
              callId: newCallId,
              receiverId: String(targetUser.id),
              reason: 'No answer'
            });
          }

          callService.logCall({
            id: newCallId,
            callerId: String(activeUser.id),
            callerName: activeUser.name,
            callerAvatar: activeUser.avatar || '',
            receiverId: String(targetUser.id),
            receiverName: targetUser.name,
            receiverAvatar: targetUser.avatar || '',
            callType: type,
            status: 'missed',
            durationSeconds: 0,
            channelId: chatChannelId,
            postToChat: true
          }).then(fetchCallHistory);

          setTimeout(resetCallState, 2500);
        }
      }, 35000);

    } catch (mediaErr) {
      console.error('Media permission or acquisition error:', mediaErr);
      stopActiveSound();
      setCallState('FAILED');
      const errTxt = mediaErr.name === 'NotAllowedError'
        ? 'Microphone or camera permission denied. Please enable device access in your browser.'
        : `Could not access media devices: ${mediaErr.message}`;
      setErrorMessage(errTxt);
      setTimeout(resetCallState, 3500);
    }
  }, [activeUser, callState, createPeerConnection, fetchCallHistory, resetCallState, stopActiveSound]);

  /**
   * Accept Incoming Call
   */
  const acceptCall = useCallback(async () => {
    if (!callId || !remoteUser?.id || !activeUser?.id) return;

    stopActiveSound();
    setCallState('CONNECTING');
    remoteUserRef.current = remoteUser;
    const isVideo = callType === 'video';

    if (callTimeoutTimerRef.current) {
      clearTimeout(callTimeoutTimerRef.current);
      callTimeoutTimerRef.current = null;
    }

    try {
      // 1. Acquire Local Media with fallback
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: isVideo ? {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: 'user'
          } : false
        });
      } catch (err) {
        console.warn('Strict audio constraints failed, using simple audio: true', err);
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideo ? true : false
        });
      }

      // Ensure all audio tracks are explicitly enabled
      stream.getAudioTracks().forEach((t) => {
        t.enabled = true;
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      // 2. Setup RTCPeerConnection
      const pc = createPeerConnection(callId, remoteUser.id);
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // 3. Emit call:accept via socket
      const socket = getSocket();
      if (socket) {
        socket.emit('call:accept', {
          callId,
          callerId: String(remoteUser.id),
          receiver: {
            id: String(activeUser.id),
            name: activeUser.name,
            avatar: activeUser.avatar || '',
            role: activeUser.role || 'Member'
          }
        });
      }

    } catch (mediaErr) {
      console.error('Failed to acquire media on call accept:', mediaErr);
      setCallState('FAILED');
      setErrorMessage(
        mediaErr.name === 'NotAllowedError'
          ? 'Microphone or camera permission denied. Please enable device access.'
          : `Device error: ${mediaErr.message}`
      );
      setTimeout(resetCallState, 3500);
    }
  }, [activeUser, callId, callType, createPeerConnection, remoteUser, resetCallState, stopActiveSound]);

  /**
   * Reject Incoming Call
   */
  const rejectCall = useCallback((reason = 'Call declined') => {
    stopActiveSound();
    const socket = getSocket();

    if (callId && remoteUser?.id && socket) {
      socket.emit('call:reject', {
        callId,
        callerId: String(remoteUser.id),
        reason
      });

      callService.logCall({
        id: callId,
        callerId: String(remoteUser.id),
        callerName: remoteUser.name || 'Caller',
        callerAvatar: remoteUser.avatar || '',
        receiverId: String(activeUser?.id),
        receiverName: activeUser?.name || 'Receiver',
        receiverAvatar: activeUser?.avatar || '',
        callType,
        status: 'rejected',
        durationSeconds: 0,
        channelId,
        postToChat: true
      }).then(fetchCallHistory);
    }

    setCallState('REJECTED');
    setErrorMessage(reason);
    setTimeout(resetCallState, 1800);
  }, [activeUser, callId, callType, channelId, fetchCallHistory, remoteUser, resetCallState, stopActiveSound]);

  /**
   * End Call (Hang Up)
   */
  const endCall = useCallback((reason = 'Call ended') => {
    stopActiveSound();
    playHangupBeep();

    const currentCallId = callId;
    const currentDuration = duration;
    const currentRemote = remoteUser;
    const currentCallType = callType;
    const currentChannelId = channelId;
    const currentIsCaller = isCaller;

    const socket = getSocket();
    if (socket && currentCallId && currentRemote?.id) {
      socket.emit('call:end', {
        callId: currentCallId,
        targetUserId: String(currentRemote.id),
        durationSeconds: currentDuration,
        reason
      });
    }

    // Log call in database
    if (currentCallId && currentRemote?.id && activeUser?.id) {
      const finalCallerId = currentIsCaller ? String(activeUser.id) : String(currentRemote.id);
      const finalCallerName = currentIsCaller ? activeUser.name : currentRemote.name;
      const finalCallerAvatar = currentIsCaller ? activeUser.avatar : currentRemote.avatar;
      const finalReceiverId = currentIsCaller ? String(currentRemote.id) : String(activeUser.id);
      const finalReceiverName = currentIsCaller ? currentRemote.name : activeUser.name;
      const finalReceiverAvatar = currentIsCaller ? currentRemote.avatar : activeUser.avatar;

      const callStatus = currentDuration > 0 ? 'completed' : (currentIsCaller ? 'cancelled' : 'missed');

      callService.logCall({
        id: currentCallId,
        callerId: finalCallerId,
        callerName: finalCallerName,
        callerAvatar: finalCallerAvatar || '',
        receiverId: finalReceiverId,
        receiverName: finalReceiverName,
        receiverAvatar: finalReceiverAvatar || '',
        callType: currentCallType,
        status: callStatus,
        durationSeconds: currentDuration,
        channelId: currentChannelId,
        postToChat: true
      }).then(fetchCallHistory);
    }

    setCallState('ENDED');
    setErrorMessage(reason);
    setTimeout(resetCallState, 1500);
  }, [activeUser, callId, callType, channelId, duration, fetchCallHistory, isCaller, remoteUser, resetCallState, stopActiveSound]);

  /**
   * Toggle Microphone Mute
   */
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextMuted = !isMuted;
        audioTracks.forEach((t) => {
          t.enabled = !nextMuted;
        });
        setIsMuted(nextMuted);
      }
    }
  }, [isMuted]);

  /**
   * Toggle Video Camera On/Off
   */
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextVideoOff = !isVideoOff;
        videoTracks.forEach((t) => {
          t.enabled = !nextVideoOff;
        });
        setIsVideoOff(nextVideoOff);
      }
    }
  }, [isVideoOff]);

  /**
   * Switch between Front (Selfie) and Back (Rear) Camera
   * Essential on mobile phones to show physical screens, documents, and surroundings during VC!
   */
  const switchCamera = useCallback(async () => {
    if (callType !== 'video') return;
    const nextFacingMode = facingMode === 'user' ? 'environment' : 'user';

    try {
      let newStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: nextFacingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (exactErr) {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: nextFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      }

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) return;

      const pc = peerConnectionRef.current;
      if (pc) {
        const videoSender = getVideoSender(pc);
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
        }
      }

      // Stop previous camera track to free hardware sensor
      if (localStreamRef.current) {
        const oldTracks = localStreamRef.current.getVideoTracks();
        oldTracks.forEach((t) => {
          try { t.stop(); } catch (e) {}
          localStreamRef.current.removeTrack(t);
        });
        localStreamRef.current.addTrack(newVideoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      } else {
        localStreamRef.current = newStream;
        setLocalStream(newStream);
      }

      setFacingMode(nextFacingMode);
      setIsVideoOff(false);
    } catch (camErr) {
      console.warn('Switch camera error:', camErr);
      setErrorMessage(
        camErr.name === 'OverconstrainedError' || camErr.name === 'NotFoundError'
          ? 'Rear camera not available on this device.'
          : `Could not switch camera: ${camErr.message}`
      );
      setTimeout(() => setErrorMessage(null), 3500);
    }
  }, [callType, facingMode]);

  /**
   * Toggle Audio Output Speaker (if setSinkId supported)
   */
  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => !prev);
  }, []);

  /**
   * Toggle Fullscreen
   */
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  /**
   * Toggle PiP Minimized Window
   */
  const togglePiPMinimized = useCallback(() => {
    setIsPiPMinimized((prev) => !prev);
  }, []);

  /**
   * Stop Screen Sharing
   */
  const stopScreenShare = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => {
        try { t.stop(); } catch (e) {}
      });
      screenStreamRef.current = null;
    }

    setScreenStream(null);
    setIsScreenSharing(false);

    const pc = peerConnectionRef.current;
    const targetId = remoteUserRef.current?.id || remoteUser?.id;

    if (pc) {
      const videoSender = getVideoSender(pc);
      let cameraTrack = localStreamRef.current ? localStreamRef.current.getVideoTracks()[0] : null;

      if (videoSender) {
        if (cameraTrack && cameraTrack.readyState === 'live' && !isVideoOff && callType === 'video') {
          cameraTrack.enabled = true;
          await videoSender.replaceTrack(cameraTrack).catch(() => {});
          if (localStreamRef.current) {
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
          }
        } else if (callType === 'video' && !isVideoOff) {
          try {
            const camStream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
            });
            const newCamTrack = camStream.getVideoTracks()[0];
            if (newCamTrack) {
              if (localStreamRef.current) {
                localStreamRef.current.addTrack(newCamTrack);
              }
              setLocalStream(new MediaStream(localStreamRef.current ? localStreamRef.current.getTracks() : [newCamTrack]));
              await videoSender.replaceTrack(newCamTrack).catch(() => {});
            }
          } catch (camErr) {
            console.warn('Could not re-acquire camera track:', camErr);
            await videoSender.replaceTrack(null).catch(() => {});
          }
        } else {
          // If in audio-only call or video is turned off, clear track cleanly
          await videoSender.replaceTrack(null).catch(() => {});
        }
      }

      // Send renegotiation offer so peer decoder switches back cleanly
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: callType === 'video'
        });
        await pc.setLocalDescription(offer);
        const socket = getSocket();
        if (socket && targetId) {
          socket.emit('call:offer', {
            callId,
            targetUserId: String(targetId),
            offer
          });
        }
      } catch (negErr) {
        console.warn('Renegotiation offer notice on stop:', negErr);
      }
    }

    const socket = getSocket();
    if (socket && targetId) {
      socket.emit('call:screenshare-toggle', {
        callId,
        targetUserId: String(targetId),
        isSharing: false
      });
    }
  }, [callId, callType, isVideoOff, remoteUser?.id]);

  /**
   * Start Screen Sharing via getDisplayMedia
   */
  const startScreenShare = useCallback(async () => {
    if (isMobileDevice) {
      // Check if getDisplayMedia is supported on this mobile browser
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== 'function') {
        console.log('📱 [ScreenShare] getDisplayMedia not supported by mobile browser');
        setMobileNoticeOpen(true);
        return;
      }
    } else {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        setErrorMessage('Screen sharing is not supported in this browser or environment.');
        setTimeout(() => setErrorMessage(null), 3500);
        return;
      }
    }

    if (!peerConnectionRef.current && callState === 'IDLE') {
      console.warn('Cannot share screen: call is not active');
      return;
    }

    try {
      let screen;
      try {
        // Universal clean display media constraints (works across all browsers and devices without burning user activation)
        screen = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
      } catch (displayErr) {
        if (isMobileDevice) {
          // Mobile browsers (Android Chrome / iOS) often throw NotAllowedError due to OS MediaProjection policies
          console.warn('Mobile screen capture rejected by OS or user:', displayErr);
          setMobileNoticeOpen(true);
          return;
        }
        if (displayErr.name === 'NotAllowedError') {
          console.log('User cancelled screen selection dialog');
          return;
        }
        throw displayErr;
      }

      screenStreamRef.current = screen;
      setScreenStream(screen);

      const screenTrack = screen.getVideoTracks()[0];
      if (!screenTrack) {
        console.warn('No video track found in screen stream');
        return;
      }

      // Explicitly set contentHint on screen track for crisp desktop text and coding fonts
      if ('contentHint' in screenTrack) {
        screenTrack.contentHint = 'detail';
      }
      screenTrack.enabled = true;

      // Handle user stopping screen share from browser's floating toolbar ("Stop sharing")
      screenTrack.onended = () => {
        console.log('🖥️ [ScreenShare] Screen track ended via browser toolbar or user action');
        stopScreenShare();
      };

      const pc = peerConnectionRef.current;
      const targetId = remoteUserRef.current?.id || remoteUser?.id;

      if (pc) {
        const videoTransceiver = getVideoTransceiver(pc);
        const videoSender = getVideoSender(pc);

        if (videoTransceiver && videoTransceiver.direction === 'recvonly') {
          videoTransceiver.direction = 'sendrecv';
        }

        // Keep local webcam track in localStreamRef so we can restore it instantaneously,
        // but disable it while presenting to save bandwidth and hardware resources
        if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach((ct) => {
            ct.enabled = false;
          });
        }

        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        } else {
          // If no video transceiver existed (e.g. started as voice call), add the track
          pc.addTrack(screenTrack, screen);
        }

        // Always create and dispatch renegotiation offer so remote peer decoder switches cleanly!
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
          });
          await pc.setLocalDescription(offer);

          const socket = getSocket();
          if (socket && targetId) {
            socket.emit('call:offer', {
              callId,
              targetUserId: String(targetId),
              offer
            });
          }
        } catch (offerErr) {
          console.warn('Renegotiation offer notice:', offerErr);
        }
      }

      setIsScreenSharing(true);

      const socket = getSocket();
      if (socket && targetId) {
        socket.emit('call:screenshare-toggle', {
          callId,
          targetUserId: String(targetId),
          isSharing: true
        });
      }
    } catch (err) {
      if (isMobileDevice) {
        setMobileNoticeOpen(true);
      } else if (err.name === 'NotAllowedError') {
        console.log('User cancelled screen selection dialog');
      } else {
        console.error('Screen sharing error:', err);
        setErrorMessage(`Could not start screen share: ${err.message}`);
        setTimeout(() => setErrorMessage(null), 4000);
      }
    }
  }, [callId, callState, isMobileDevice, remoteUser?.id, stopScreenShare]);

  /**
   * Toggle Screen Sharing
   */
  const toggleScreenShare = useCallback(() => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  // ====================================================================
  // Socket.IO Signalling Event Listeners
  // ====================================================================

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeUser?.id) return;

    // 1. Incoming Call
    const handleIncomingCall = (payload) => {
      console.log('📞 [Socket] Incoming call event:', payload);
      if (callState !== 'IDLE') {
        console.log('User is busy on another call. Emitting call:busy');
        socket.emit('call:busy', {
          callId: payload.callId,
          receiverId: String(activeUser.id),
          reason: 'User is currently on another call'
        });
        return;
      }

      setCallId(payload.callId);
      setCallType(payload.callType || 'voice');
      setRemoteUser(payload.caller);
      remoteUserRef.current = payload.caller;
      setIsCaller(false);
      setChannelId(payload.channelId || null);
      setCallState('INCOMING');
      setDuration(0);
      setErrorMessage(null);

      // Play incoming ringtone
      stopActiveSound();
      activeSoundRef.current = startIncomingRingtone();

      // Emit ringing back to caller
      socket.emit('call:ringing', {
        callId: payload.callId,
        callerId: String(payload.caller.id)
      });
    };

    // 2. Call Ringing Confirmed by Receiver
    const handleCallRinging = (payload) => {
      console.log('🔔 [Socket] Receiver is ringing:', payload);
      if (callState === 'INITIATING') {
        setCallState('RINGING');
      }
    };

    // 3. Call Accepted by Receiver
    const handleCallAccept = async (payload) => {
      console.log('✅ [Socket] Call accepted by peer:', payload);
      stopActiveSound();
      setCallState('CONNECTING');
      if (payload.receiver) {
        remoteUserRef.current = payload.receiver;
      }

      if (callTimeoutTimerRef.current) {
        clearTimeout(callTimeoutTimerRef.current);
        callTimeoutTimerRef.current = null;
      }

      // Caller creates SDP Offer
      const pc = peerConnectionRef.current;
      if (pc) {
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: callType === 'video'
          });
          await pc.setLocalDescription(offer);

          socket.emit('call:offer', {
            callId: payload.callId,
            targetUserId: String(remoteUser?.id || payload.receiver?.id),
            offer
          });
        } catch (offerErr) {
          console.error('Failed to create/send SDP offer:', offerErr);
        }
      }
    };

    // 4. Call Rejected by Receiver
    const handleCallReject = (payload) => {
      console.log('🚫 [Socket] Call rejected by peer:', payload);
      stopActiveSound();
      setCallState('REJECTED');
      setErrorMessage(payload.reason || 'Call declined');
      setTimeout(resetCallState, 2000);
    };

    // 5. SDP Offer from Caller or renegotiation during call
    const handleCallOffer = async (payload) => {
      console.log('📥 [WebRTC] Received SDP Offer from:', payload.fromUserId);
      const pc = peerConnectionRef.current;
      if (pc && payload.offer) {
        try {
          if (pc.signalingState !== 'stable') {
            console.log('Signaling state is', pc.signalingState, '- handling collision/rollback');
            await Promise.all([
              pc.setLocalDescription({ type: 'rollback' }).catch(() => {}),
              pc.setRemoteDescription(new RTCSessionDescription(payload.offer))
            ]);
          } else {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
          }

          // Drain queued ICE candidates
          while (pendingIceCandidatesRef.current.length > 0) {
            const candidate = pendingIceCandidatesRef.current.shift();
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {}
          }

          const sdp = payload.offer?.sdp || '';
          const offerHasVideo = sdp.includes('m=video') && !sdp.includes('m=video 0');

          const answer = await pc.createAnswer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: offerHasVideo || callType === 'video'
          });
          await pc.setLocalDescription(answer);

          socket.emit('call:answer', {
            callId: payload.callId,
            targetUserId: String(payload.fromUserId),
            answer
          });
        } catch (err) {
          console.error('Error handling SDP offer:', err);
        }
      }
    };

    // 6. SDP Answer from Receiver
    const handleCallAnswer = async (payload) => {
      console.log('📥 [WebRTC] Received SDP Answer from:', payload.fromUserId);
      const pc = peerConnectionRef.current;
      if (pc && payload.answer) {
        try {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
          } else {
            console.log('Skipping answer setRemoteDescription, current signalingState:', pc.signalingState);
          }

          // Drain queued ICE candidates
          while (pendingIceCandidatesRef.current.length > 0) {
            const candidate = pendingIceCandidatesRef.current.shift();
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {}
          }

          // Once answer is processed, promote to CONNECTED and start queued screen sharing if requested
          setTimeout(() => {
            setCallState((prev) => (prev === 'CONNECTING' ? 'CONNECTED' : prev));
            stopActiveSound();
            if (pendingScreenShareRef.current) {
              pendingScreenShareRef.current = false;
              startScreenShare();
            }
          }, 450);
        } catch (err) {
          console.error('Error handling SDP answer:', err);
        }
      }
    };

    // 7. ICE Candidate
    const handleCallIceCandidate = async (payload) => {
      const pc = peerConnectionRef.current;
      if (payload.candidate) {
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (e) {
            console.warn('Error adding ICE candidate:', e);
          }
        } else {
          pendingIceCandidatesRef.current.push(payload.candidate);
        }
      }
    };

    // 8. Call Ended by Peer
    const handleCallEnd = (payload) => {
      console.log('🛑 [Socket] Call ended by peer:', payload);
      stopActiveSound();
      playHangupBeep();
      setCallState('ENDED');
      setErrorMessage(payload.reason || 'Call ended');
      fetchCallHistory();
      setTimeout(resetCallState, 1800);
    };

    // 9. Call Missed (Caller cancelled before answer)
    const handleCallMissed = (payload) => {
      console.log('⚠️ [Socket] Call missed event:', payload);
      stopActiveSound();
      setCallState('MISSED');
      setErrorMessage(payload.reason || 'Missed call');
      fetchCallHistory();
      setTimeout(resetCallState, 2000);
    };

    // 10. Call Busy (Recipient already on call)
    const handleCallBusy = (payload) => {
      console.log('⏳ [Socket] User is busy:', payload);
      stopActiveSound();
      activeSoundRef.current = playBusyTone();
      setCallState('BUSY');
      setErrorMessage(payload.reason || 'User is currently on another call');
      setTimeout(resetCallState, 3500);
    };

    // 11. Remote Screen Share Toggle
    const handleRemoteScreenShare = (payload) => {
      console.log('🖥️ [Socket] Remote screen share toggle:', payload.isSharing);
      setIsRemoteScreenSharing(Boolean(payload.isSharing));
      if (remoteStreamRef.current) {
        setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
      }
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:ringing', handleCallRinging);
    socket.on('call:accept', handleCallAccept);
    socket.on('call:reject', handleCallReject);
    socket.on('call:offer', handleCallOffer);
    socket.on('call:answer', handleCallAnswer);
    socket.on('call:ice-candidate', handleCallIceCandidate);
    socket.on('call:screenshare-toggle', handleRemoteScreenShare);
    socket.on('call:end', handleCallEnd);
    socket.on('call:missed', handleCallMissed);
    socket.on('call:busy', handleCallBusy);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:ringing', handleCallRinging);
      socket.off('call:accept', handleCallAccept);
      socket.off('call:reject', handleCallReject);
      socket.off('call:offer', handleCallOffer);
      socket.off('call:answer', handleCallAnswer);
      socket.off('call:ice-candidate', handleCallIceCandidate);
      socket.off('call:screenshare-toggle', handleRemoteScreenShare);
      socket.off('call:end', handleCallEnd);
      socket.off('call:missed', handleCallMissed);
      socket.off('call:busy', handleCallBusy);
    };
  }, [activeUser, callState, callType, fetchCallHistory, remoteUser, resetCallState, stopActiveSound]);

  // Clean up on window close / reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (callState !== 'IDLE' && remoteUser?.id) {
        const socket = getSocket();
        if (socket && callId) {
          socket.emit('call:end', {
            callId,
            targetUserId: String(remoteUser.id),
            durationSeconds: duration,
            reason: 'Window closed'
          });
        }
        cleanupMedia();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [callId, callState, cleanupMedia, duration, remoteUser]);

  return (
    <CallContext.Provider
      value={{
        callState,
        callId,
        callType,
        remoteUser,
        isCaller,
        channelId,
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
        callHistory,
        isHistoryLoading,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleSpeaker,
        toggleFullscreen,
        togglePiPMinimized,
        toggleScreenShare,
        startScreenShare,
        stopScreenShare,
        fetchCallHistory,
        facingMode,
        switchCamera,
        mobileNoticeOpen,
        setMobileNoticeOpen,
        isMobileDevice
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
