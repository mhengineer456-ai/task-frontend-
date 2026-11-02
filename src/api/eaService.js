import { apiClient } from './apiClient.js';

export const eaService = {
  async getFollowUps() {
    return await apiClient.get('/ea/followups');
  },

  async logFollowUp(followUpData) {
    return await apiClient.post('/ea/followups', followUpData);
  },

  async updateFollowUp(id, updates) {
    return await apiClient.put(`/ea/followups/${id}`, updates);
  },

  async getMeetings() {
    return await apiClient.get('/ea/meetings');
  },

  async scheduleMeeting(meetingData) {
    return await apiClient.post('/ea/meetings', meetingData);
  },

  async deleteMeeting(id) {
    return await apiClient.delete(`/ea/meetings/${id}`);
  },

  async getDailyTasks() {
    return await apiClient.get('/ea/daily-tasks');
  },

  async toggleDailyTask(id) {
    return await apiClient.put(`/ea/daily-tasks/${id}`, {});
  },

  async createDailyTask(taskData) {
    return await apiClient.post('/ea/daily-tasks', taskData);
  },

  async deleteDailyTask(id) {
    return await apiClient.delete(`/ea/daily-tasks/${id}`);
  }
};
