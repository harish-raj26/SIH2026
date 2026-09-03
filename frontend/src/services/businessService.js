import apiClient from '../api/api';

export const businessService = {
  /**
   * Create a new business profile
   * Backend endpoint: POST /api/businesses/?name=...&industry=...
   */
  async createBusiness(businessData) {
    const params = new URLSearchParams();
    params.append('name', businessData.name);
    params.append('industry', businessData.industry);
    params.append('location', businessData.location);
    params.append('business_type', businessData.business_type);
    params.append('investment', String(businessData.investment));
    params.append('employees', String(businessData.employees));

    return await apiClient.post(`/api/businesses/?${params.toString()}`);
  },

  /**
   * Get all registered businesses
   * Backend endpoint: GET /api/businesses/
   */
  async getBusinesses() {
    return await apiClient.get('/api/businesses/');
  },
};