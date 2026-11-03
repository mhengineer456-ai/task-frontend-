import { apiClient } from './apiClient.js';

export const statusService = {
  async getStatusFeed(userId) {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return await apiClient.get(`/statuses/feed${qs}`);
  },

  async createStatus(statusData) {
    return await apiClient.post('/statuses', statusData);
  },

  async recordStatusView(statusId, viewerData) {
    return await apiClient.post(`/statuses/${statusId}/view`, viewerData);
  },

  async getStatusViews(statusId, userId) {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return await apiClient.get(`/statuses/${statusId}/views${qs}`);
  },

  async deleteStatus(statusId, userId) {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return await apiClient.delete(`/statuses/${statusId}${qs}`);
  },

  async getStatusPrivacy(userId) {
    return await apiClient.get(`/statuses/privacy/${encodeURIComponent(userId)}`);
  },

  async updateStatusPrivacy(userId, privacySettings) {
    return await apiClient.put(`/statuses/privacy/${encodeURIComponent(userId)}`, privacySettings);
  },

  async replyToStatus(statusId, replyData) {
    return await apiClient.post(`/statuses/${statusId}/reply`, replyData);
  }
};
