import axios from "axios";

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
    return "http://localhost:8080/api/v1";
  }

  if (isProduction) {
    // In production, use the direct backend URL since Vercel proxy has limitations with cookies
    return "https://readivine.onrender.com/api/v1";
  }

  // Final fallback to localhost
  return "http://localhost:8080/api/v1";
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
    "Content-Type": "application/json",
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
      console.error("API Request Error:", error);
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
    // Enhanced error handling that works in production
    const errorInfo = {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      timestamp: new Date().toISOString(),
    };

    if (error.response?.status === 401) {
      // Handle unauthorized access
      if (import.meta.env.DEV) {
        console.warn("Unauthorized access - redirecting to login");
      }
      // Store error for debugging in production
      window.localStorage.setItem("lastAuthError", JSON.stringify(errorInfo));
    } else if (error.response?.status >= 500) {
      if (import.meta.env.DEV) {
        console.error("Server error:", error.response.data);
      }
      // Store server errors for production debugging
      window.localStorage.setItem(
        "lastServerError",
        JSON.stringify({
          ...errorInfo,
          responseData: error.response.data,
        })
      );
    } else if (error.code === "NETWORK_ERROR" || !error.response) {
      if (import.meta.env.DEV) {
        console.error("Network error - check if backend is running");
      }
      // Store network errors for production debugging
      window.localStorage.setItem(
        "lastNetworkError",
        JSON.stringify({
          ...errorInfo,
          code: error.code,
          currentURL: window.location.href,
        })
      );
    }

    return Promise.reject(error);
  }
);

export default api;
