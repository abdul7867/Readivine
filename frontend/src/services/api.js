import axios from 'axios';

/**
 * Determines the API base URL based on the environment
 */
const getApiBaseUrl = () => {
  // 1. Check if environment variable is set (highest priority)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // 2. Determine based on current environment
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;

  if (isDevelopment) {
    // Development environment - connect to local backend
    return 'http://localhost:8080/api/v1';
  }

  if (isProduction) {
    // Production environment - use relative URL or fallback
    // This will use the same domain as the frontend
    const currentOrigin = window.location.origin;
    
    // If deployed on Vercel and backend is separate
    if (currentOrigin.includes('vercel.app')) {
      // Replace this with your actual production backend URL
      return import.meta.env.VITE_PROD_API_URL || 'https://your-backend-domain.com/api/v1';
    }
    
    // Fallback for same-domain deployment
    return `${currentOrigin}/api/v1`;
  }

  // Fallback to localhost
  return 'http://localhost:8080/api/v1';
};

/**
 * Creates a pre-configured instance of axios.
 * This instance includes the base URL for the API and settings for handling credentials (cookies).
 */
const api = axios.create({
  baseURL: getApiBaseUrl(),
  
  // This is crucial for ensuring that the browser sends cookies (like our auth token)
  // with every request to the backend.
  withCredentials: true,
  
  // Set default headers
  headers: {
    'Content-Type': 'application/json',
  },
  
  // Request timeout (30 seconds)
  timeout: 30000,
});

// Request interceptor for debugging in development
if (import.meta.env.DEV) {
  api.interceptors.request.use(
    (config) => {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('API Request Error:', error);
      return Promise.reject(error);
    }
  );
}

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.warn('Unauthorized access - redirecting to login');
      // You might want to redirect to login page here
      // window.location.href = '/login';
    } else if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data);
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      console.error('Network error - check if backend is running');
    }
    
    return Promise.reject(error);
  }
);

export default api;
