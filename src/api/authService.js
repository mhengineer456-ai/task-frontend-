import { apiClient } from './apiClient.js';

export const authService = {
  async login(email, password, quickUserId) {
    return await apiClient.post('/auth/login', { email, password, quickUserId });
  },

  async register(registrationData) {
    return await apiClient.post('/auth/register', registrationData);
  },

  async resendOtp(pendingUserId, deliveryMethod = 'email') {
    return await apiClient.post('/auth/resend-otp', { pendingUserId, deliveryMethod });
  },

  async verifyOtp(pendingUserId, enteredOtp) {
    return await apiClient.post('/auth/verify-otp', { pendingUserId, enteredOtp });
  }
};
