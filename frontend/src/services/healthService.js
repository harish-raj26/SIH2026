import apiClient from '../api/api';

export const healthService = {
  /**
   * Check backend health status
   * Backend endpoint: GET /api/health
   */
  async checkHealth() {
    return await apiClient.get('/api/health');
  },

  /**
   * Root ping
   * Backend endpoint: GET /
   */
  async getRoot() {
    return await apiClient.get('/');
  },
};
