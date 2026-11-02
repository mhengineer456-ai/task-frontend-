import { apiClient } from './apiClient.js';

export const userService = {
  async getUsers() {
    return await apiClient.get('/users');
  },

  async getUserById(id) {
    return await apiClient.get(`/users/${id}`);
  },

  async updateProfile(id, updates) {
    return await apiClient.put(`/users/${id}/profile`, updates);
  }
};
