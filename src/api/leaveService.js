import { apiClient } from './apiClient.js';

export const leaveService = {
  async getAllLeaves() {
    return await apiClient.get('/leaves');
  },

  async applyLeave(leaveData) {
    return await apiClient.post('/leaves', leaveData);
  },

  async approveLeave(leaveId, remark, managerName) {
    return await apiClient.put(`/leaves/${leaveId}/approve`, { remark, managerName });
  },

  async rejectLeave(leaveId, remark, managerName) {
    return await apiClient.put(`/leaves/${leaveId}/reject`, { remark, managerName });
  }
};
