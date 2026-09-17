import apiClient from '../api/api';

export const approvalService = {
  async discoverApprovals(businessId) {
    return await apiClient.get(
      `/api/approvals/discover/${businessId}`
    );
  },

  async analyzeApprovals(payload) {
    return await apiClient.post(
      '/api/approvals/analyze',
      payload
    );
  },

  async getRoadmap(businessId) {
    return await apiClient.get(
      `/api/approvals/${businessId}/roadmap`
    );
  },

  async getRequiredApprovals(businessId) {
    return await apiClient.get(
      `/api/approvals/${businessId}/required`
    );
  },

  async getConditionalApprovals(businessId) {
    return await apiClient.get(
      `/api/approvals/${businessId}/conditional`
    );
  },

  async getVerificationApprovals(businessId) {
    return await apiClient.get(
      `/api/approvals/${businessId}/verification`
    );
  },

  async refreshApprovals(businessId, params = {}) {
    return await apiClient.post(
      '/api/approvals/refresh',
      { business_id: businessId, ...params }
    );
  },

  async getApprovalSources() {
    return await apiClient.get(
      '/api/approvals/approval-sources'
    );
  },
};