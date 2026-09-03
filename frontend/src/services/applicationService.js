import apiClient from '../api/api';

export const applicationService = {
  /**
   * Create or retrieve an application for a business and approval
   * Backend endpoint: POST /api/applications/?business_id=...&approval_id=...
   */
  async createApplication(businessId, approvalId) {
    const params = new URLSearchParams({
      business_id: String(businessId),
      approval_id: String(approvalId),
    });
    return await apiClient.post(`/api/applications/?${params.toString()}`);
  },

  /**
   * Check application field completion percentage
   * Backend endpoint: POST /api/applications/{application_id}/check
   */
  async checkApplication(applicationId) {
    return await apiClient.post(`/api/applications/${applicationId}/check`);
  },

  /**
   * Validate application compliance requirements
   * Backend endpoint: POST /api/applications/{application_id}/validate
   */
  async validateApplication(applicationId) {
    return await apiClient.post(`/api/applications/${applicationId}/validate`);
  },

  /**
   * Get current application status, field count, and document count
   * Backend endpoint: GET /api/applications/{application_id}/status
   */
  async getApplicationStatus(applicationId) {
    return await apiClient.get(`/api/applications/${applicationId}/status`);
  },

  /**
   * Submit application to authority (validates required fields and verified documents)
   * Backend endpoint: POST /api/applications/{application_id}/submit
   */
  async submitApplication(applicationId) {
    return await apiClient.post(`/api/applications/${applicationId}/submit`);
  },
};
