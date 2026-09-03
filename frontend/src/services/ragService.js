import apiClient from '../api/api';

export const ragService = {
  /**
   * Search regulatory knowledge base
   * Backend endpoint: GET /api/rag/search?query=...&top_k=...
   */
  async searchRegulations(query, topK = 5) {
    const params = new URLSearchParams({
      query: query,
      top_k: String(topK),
    });
    return await apiClient.get(`/api/rag/search?${params.toString()}`);
  },
};
