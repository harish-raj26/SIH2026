import apiClient from '../api/api';

export const documentService = {
  /**
   * Generate required documents list using AI and RAG regulatory evidence
   * Backend endpoint: POST /api/application-documents/{application_id}/generate
   */
  async generateDocuments(applicationId) {
    return await apiClient.post(`/api/application-documents/${applicationId}/generate`);
  },

  /**
   * Get all required documents for an application
   * Backend endpoint: GET /api/application-documents/{application_id}
   */
  async getDocuments(applicationId) {
    return await apiClient.get(`/api/application-documents/${applicationId}`);
  },

  /**
   * Upload an application document file
   * Backend endpoint: POST /api/application-documents/{document_id}/upload
   */
  async uploadDocument(documentId, file) {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post(
      `/api/application-documents/${documentId}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },

  /**
   * Run AI document verification on uploaded file
   * Backend endpoint: POST /api/application-documents/{document_id}/verify
   */
  async verifyDocument(documentId) {
    return await apiClient.post(`/api/application-documents/${documentId}/verify`);
  },
};
