import { apiClient } from './apiClient.js';

export const taskService = {
  async getAllTasks() {
    return await apiClient.get('/tasks');
  },

  async createTask(taskData) {
    return await apiClient.post('/tasks', taskData);
  },

  async updateTask(taskId, updates) {
    return await apiClient.put(`/tasks/${taskId}`, updates);
  },

  async addFollowup(taskId, followupData) {
    return await apiClient.post(`/tasks/${taskId}/followups`, followupData);
  },

  async deleteTask(taskId) {
    return await apiClient.delete(`/tasks/${taskId}`);
  }
};
