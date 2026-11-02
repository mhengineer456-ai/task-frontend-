import { io } from 'socket.io-client';
import { SERVER_URL } from './apiClient.js';

const SOCKET_URL = SERVER_URL;

let socket = null;
let currentUserId = null;

export const initSocket = (userId) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('⚡ [Socket.IO Client] Connected to real-time server:', socket.id);
      if (currentUserId) {
        socket.emit('user:join', currentUserId);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 [Socket.IO Client] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ [Socket.IO Client] Connection error:', error.message);
    });
  }

  if (userId && userId !== currentUserId) {
    currentUserId = userId;
    if (socket.connected) {
      socket.emit('user:join', userId);
    }
  }

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket(currentUserId);
  }
  return socket;
};

export const joinUser = (userId) => {
  currentUserId = userId;
  const s = getSocket();
  if (s && s.connected && userId) {
    s.emit('user:join', userId);
  }
};

export const joinChannel = (channelId) => {
  const s = getSocket();
  if (s && channelId) {
    s.emit('channel:join', channelId);
  }
};

export const leaveChannel = (channelId) => {
  const s = getSocket();
  if (s && channelId) {
    s.emit('channel:leave', channelId);
  }
};

export const sendTypingStatus = (channelId, user, isTyping) => {
  const s = getSocket();
  if (s && channelId) {
    s.emit('chat:typing', { channelId, user, isTyping });
  }
};

export const subscribeToSocket = (event, callback) => {
  const s = getSocket();
  if (s) {
    s.on(event, callback);
    return () => s.off(event, callback);
  }
  return () => {};
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentUserId = null;
  }
};
