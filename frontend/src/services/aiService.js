import apiClient from '../api/api';

export const aiService = {
  /**
   * Generate AI compliance executive roadmap
   * Backend endpoint: GET /api/ai/roadmap/{business_id}
   */
  async getAIRoadmap(businessId) {
    return await apiClient.get(`/api/ai/roadmap/${businessId}`);
  },

  /**
   * Ask AI regulatory compliance assistant
   * Backend endpoint: POST /api/ai/ask?business_id=...&question=...
   */
  async askAI(businessId, question) {
    const params = new URLSearchParams({
      business_id: String(businessId),
      question: question,
    });
    return await apiClient.post(`/api/ai/ask?${params.toString()}`);
  },
};
