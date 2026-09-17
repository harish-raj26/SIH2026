import apiClient from '../api/api';
export const complianceService = {
  getNotifications: (businessId) => apiClient.get(`/api/notifications/${businessId}`),
  markNotificationRead: (id) => apiClient.post(`/api/notifications/${id}/read`),
  getInspections: (businessId) => apiClient.get('/api/inspections', { params: businessId ? { business_id: businessId } : {} }),
  getDues: (businessId) => apiClient.get(`/api/dues/${businessId}`),
  payDue: (id) => apiClient.post(`/api/dues/${id}/pay`),
  getLifecycle: (businessId) => apiClient.get(`/api/lifecycle/${businessId}`),
};
