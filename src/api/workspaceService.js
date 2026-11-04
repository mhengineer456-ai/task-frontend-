import { apiClient } from './apiClient.js';

export const workspaceService = {
  // Reminders
  async getReminders(userId) {
    const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return await apiClient.get(`/workspace/reminders${q}`);
  },
  async createReminder(data) {
    return await apiClient.post('/workspace/reminders', data);
  },
  async toggleReminderStatus(id, status) {
    return await apiClient.patch(`/workspace/reminders/${id}/status`, { status });
  },
  async deleteReminder(id) {
    return await apiClient.delete(`/workspace/reminders/${id}`);
  },

  // Time Logs
  async getTimeLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const q = query ? `?${query}` : '';
    return await apiClient.get(`/workspace/timelogs${q}`);
  },
  async createTimeLog(data) {
    return await apiClient.post('/workspace/timelogs', data);
  },
  async deleteTimeLog(id) {
    return await apiClient.delete(`/workspace/timelogs/${id}`);
  },

  // Documents
  async getDocuments() {
    return await apiClient.get('/workspace/docs');
  },
  async createDocument(data) {
    return await apiClient.post('/workspace/docs', data);
  },
  async updateDocument(id, updates) {
    return await apiClient.put(`/workspace/docs/${id}`, updates);
  },
  async deleteDocument(id) {
    return await apiClient.delete(`/workspace/docs/${id}`);
  },

  // Notes
  async getNotes(userId) {
    const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return await apiClient.get(`/workspace/notes${q}`);
  },
  async createNote(data) {
    return await apiClient.post('/workspace/notes', data);
  },
  async updateNote(id, updates) {
    return await apiClient.put(`/workspace/notes/${id}`, updates);
  },
  async deleteNote(id) {
    return await apiClient.delete(`/workspace/notes/${id}`);
  },

  // Custom Lists
  async getLists(userId) {
    const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return await apiClient.get(`/workspace/lists${q}`);
  },
  async createList(data) {
    return await apiClient.post('/workspace/lists', data);
  },
  async updateList(id, updates) {
    return await apiClient.put(`/workspace/lists/${id}`, updates);
  },
  async deleteList(id) {
    return await apiClient.delete(`/workspace/lists/${id}`);
  }
};
