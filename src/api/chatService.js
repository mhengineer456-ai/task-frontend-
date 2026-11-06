import { apiClient } from './apiClient.js';

export const chatService = {
  async getChannels(userId) {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return await apiClient.get(`/chat/channels${query}`);
  },

  async getMessages(channelId, params = {}) {
    const query = new URLSearchParams();
    if (params && typeof params === 'object') {
      if (params.before) query.append('before', params.before);
      if (params.days !== undefined && params.days !== null) query.append('days', params.days);
      if (params.limit) query.append('limit', params.limit);
      if (params.userId) query.append('userId', params.userId);
    }
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await apiClient.get(`/chat/channels/${channelId}/messages${qs}`);
  },

  async sendMessage(messageData) {
    return await apiClient.post('/chat/messages', messageData);
  },

  async askAiAssistant({ message, imageUrl, sessionId, channelId, userId, taggedUserId, taggedUserName, taggedUserRole, taggedUserDepartment, requireEaFollowup, isScheduled = false, scheduledAt = null, aiMode = 'auto' }) {
    return await apiClient.post('/chat/ai-assistant', {
      message,
      imageUrl,
      sessionId,
      channelId,
      userId,
      taggedUserId,
      taggedUserName,
      taggedUserRole,
      taggedUserDepartment,
      requireEaFollowup,
      isScheduled,
      scheduledAt,
      aiMode
    });
  },

  async getAiStatus() {
    return await apiClient.get('/chat/status');
  },

  async createOrGetDirectChannel(currentUserId, targetUserId) {
    return await apiClient.post('/chat/direct-channel', { currentUserId, targetUserId });
  },

  async createGroupChannel({ name, description, memberIds, creatorId, creatorName }) {
    return await apiClient.post('/chat/groups', { name, description, memberIds, creatorId, creatorName });
  },

  async toggleReaction(messageId, emoji, userId, userName) {
    return await apiClient.post(`/chat/messages/${messageId}/reaction`, { emoji, userId, userName });
  },

  async deleteMessage(messageId, channelId) {
    const query = channelId ? `?channelId=${encodeURIComponent(channelId)}` : '';
    return await apiClient.delete(`/chat/messages/${messageId}${query}`);
  },

  async clearChannelMessages(channelId) {
    return await apiClient.delete(`/chat/channels/${channelId}/messages`);
  },

  async deleteChannel(channelId) {
    return await apiClient.delete(`/chat/channels/${channelId}`);
  }
};


