import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bizclear_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for Error Normalization
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let normalizedError = {
      status: error.response?.status || 500,
      message: 'An unexpected error occurred. Please try again.',
      details: null,
      isNetworkError: !error.response,
    };

    if (error.response) {
      const data = error.response.data;
      if (typeof data === 'string') {
        normalizedError.message = data;
      } else if (data?.detail) {
        if (typeof data.detail === 'string') {
          normalizedError.message = data.detail;
        } else if (typeof data.detail === 'object') {
          normalizedError.message = data.detail.message || 'Validation error occurred';
          normalizedError.details = data.detail;
        }
      } else if (data?.message) {
        normalizedError.message = data.message;
      }

      // Friendly fallback messages by status
      switch (error.response.status) {
        case 400:
          normalizedError.userTitle = 'Bad Request';
          break;
        case 401:
          normalizedError.userTitle = 'Unauthorized Session';
          normalizedError.message = normalizedError.message || 'Session expired. Please log in again.';
          break;
        case 403:
          normalizedError.userTitle = 'Access Forbidden';
          normalizedError.message = 'You do not have permission to perform this action.';
          break;
        case 404:
          normalizedError.userTitle = 'Resource Not Found';
          break;
        case 409:
          normalizedError.userTitle = 'Conflict';
          break;
        case 422:
          normalizedError.userTitle = 'Validation Error';
          break;
        case 429:
          normalizedError.userTitle = 'API Quota Exceeded';
          normalizedError.message = normalizedError.message || 'Gemini AI rate limit reached. Please wait a moment and retry.';
          break;
        case 500:
        case 502:
        case 503:
          normalizedError.userTitle = 'Server Error';
          normalizedError.message = normalizedError.message || 'Backend service error. Please verify server status.';
          break;
        default:
          normalizedError.userTitle = 'Error';
      }
    } else if (error.request) {
      normalizedError.userTitle = 'Network Error';
      normalizedError.message = `Cannot connect to BizClear AI backend at ${BASE_URL}. Ensure FastAPI is running.`;
    }

    console.error(`[API Error ${normalizedError.status}]:`, normalizedError);
    return Promise.reject(normalizedError);
  }
);

export default apiClient;
export { BASE_URL };
