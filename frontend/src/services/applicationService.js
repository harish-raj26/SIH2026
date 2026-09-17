import apiClient from '../api/api';

export const applicationService = {
  async createApplication(businessId, approvalId) {
    return await apiClient.post('/api/applications/', null, { params: { business_id: businessId, approval_id: approvalId } });
  },
  async listApplications(businessId) {
    const data = await apiClient.get('/api/applications/', { params: businessId ? { business_id: businessId } : {} });
    return data.applications || [];
  },
  async getApplication(applicationId) {
    return await apiClient.get(`/api/applications/${applicationId}`);
  },
  async checkApplication(applicationId) {
    return await apiClient.post(`/api/applications/${applicationId}/check`);
  },
  async validateApplication(applicationId) {
    return await apiClient.post(`/api/applications/${applicationId}/validate`);
  },
  async getApplicationStatus(applicationId) {
    return await apiClient.get(`/api/applications/${applicationId}/status`);
  },
  async submitApplication(applicationId, payload = {}) {
    return await apiClient.post(`/api/applications/${applicationId}/submit`, payload);
  },
  async syncApplicationStatus(applicationId) {
    return await apiClient.post(`/api/applications/${applicationId}/sync-status`);
  },
  async getApplicationHistory(applicationId) {
    return await apiClient.get(`/api/applications/${applicationId}/history`);
  },
  async getApplicationDossier(applicationId) {
    return await apiClient.get(`/api/applications/${applicationId}/dossier`);
  },
};
