import { apiClient } from './apiClient';

export const callService = {
  // Fetch call history
  getCallHistory: async (userId) => {
    try {
      const res = await apiClient.get(`/calls/history?userId=${encodeURIComponent(userId)}`);
      return res.calls || [];
    } catch (err) {
      console.warn('callService.getCallHistory error:', err);
      return [];
    }
  },

  // Record a call log
  logCall: async (callData) => {
    try {
      const res = await apiClient.post('/calls/log', callData);
      return res.call || null;
    } catch (err) {
      console.warn('callService.logCall error:', err);
      return null;
    }
  },

  // Fetch STUN/TURN ICE servers configuration
  getIceServers: async () => {
    try {
      const res = await apiClient.get('/calls/ice-servers');
      return res.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' }
      ];
    } catch (err) {
      return [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' }
      ];
    }
  },

  // Delete call log record
  deleteCallLog: async (id) => {
    try {
      await apiClient.delete(`/calls/history/${id}`);
      return true;
    } catch (err) {
      console.warn('callService.deleteCallLog error:', err);
      return false;
    }
  }
};
