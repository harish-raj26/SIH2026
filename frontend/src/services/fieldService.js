import apiClient from '../api/api';

export const fieldService = {
  /**
   * Generate dynamic application fields using AI and RAG regulatory evidence
   * Backend endpoint: POST /api/application-fields/{application_id}/generate
   */
  async generateFields(applicationId) {
    return await apiClient.post(`/api/application-fields/${applicationId}/generate`);
  },

  /**
   * Get all fields for an application
   * Backend endpoint: GET /api/application-fields/{application_id}
   */
  async getFields(applicationId) {
    return await apiClient.get(`/api/application-fields/${applicationId}`);
  },

  /**
   * Update the value of a specific field
   * Backend endpoint: PUT /api/application-fields/{field_id}
   */
  async updateField(fieldId, value) {
    return await apiClient.put(`/api/application-fields/${fieldId}`, { value });
  },

  /**
   * Generate AI autofill suggestion for a field using business profile
   * Backend endpoint: POST /api/application-fields/{field_id}/suggest
   */
  async suggestField(fieldId) {
    return await apiClient.post(`/api/application-fields/${fieldId}/suggest`);
  },

  /**
   * Accept the AI autofill suggestion for a field
   * Backend endpoint: POST /api/application-fields/{field_id}/accept-suggestion
   */
  async acceptSuggestion(fieldId) {
    return await apiClient.post(`/api/application-fields/${fieldId}/accept-suggestion`);
  },
};
