import apiClient from '../api/api';

export const approvalService = {
  /**
   * Discover business approvals using regulatory rules and RAG evidence
   * Backend endpoint: POST /api/approvals/discover/{business_id}
   */
  async discoverApprovals(businessId) {
    return await apiClient.post(`/api/approvals/discover/${businessId}`);
  },

  /**
   * Get prioritized statutory approval roadmap
   * Backend endpoint: GET /api/roadmap/{business_id}
   */
  async getRoadmap(businessId) {
    return await apiClient.get(`/api/roadmap/${businessId}`);
  },
};
