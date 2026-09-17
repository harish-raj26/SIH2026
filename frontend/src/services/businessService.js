import apiClient from '../api/api';

export const businessService = {
  async createBusiness(businessData) {
    return await apiClient.post('/api/businesses/', businessData);
  },
  async getBusinesses() {
    const data = await apiClient.get('/api/businesses/');
    return data.businesses || [];
  },
  async getBusiness(id) {
    return await apiClient.get(`/api/businesses/${id}`);
  },
  async deleteBusiness(id) {
    return await apiClient.delete(`/api/businesses/${id}`);
  },
  async clearAllBusinesses() {
    return await apiClient.delete('/api/businesses/');
  },
};

