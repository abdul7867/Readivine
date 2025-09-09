import axios from "axios";

/**
 * Determines the API base URL based on the environment
 * Ensures consistent backend URL usage across all requests
 */
const getApiBaseUrl = () => {
  // 1. Check if environment variable is set (highest priority)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // 2. Check for production-specific environment variable
  if (import.meta.env.VITE_PROD_API_URL && import.meta.env.PROD) {
    return import.meta.env.VITE_PROD_API_URL;
  }

  // 3. Determine based on current environment
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;

  if (isDevelopment) {
    // Development environment - connect to local backend
    return "http://localhost:8080/api/v1";
  }

  if (isProduction) {
    // In production, use the backend URL from environment
    // Throw error if not configured to prevent silent failures
    const prodUrl = import.meta.env.VITE_API_BASE_URL;
    if (!prodUrl) {
      console.error('VITE_API_BASE_URL is not configured for production');
      throw new Error('Production API URL not configured. Please set VITE_API_BASE_URL environment variable.');
    }
    return prodUrl;
  }

  // Final fallback to localhost
  return "http://localhost:8080/api/v1";
};

/**
 * Creates a pre-configured instance of axios.
 * This instance includes the base URL for the API and settings for handling credentials (cookies).
 * Implements proper credential handling for cross-domain requests.
 */
const api = axios.create({
  baseURL: getApiBaseUrl(),

  // Critical for cross-domain cookie handling - ensures cookies are sent with requests
  withCredentials: true,

  // Set default headers for consistent API communication
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },

  // Request timeout (30 seconds) - reasonable for production environments
  timeout: 30000,

  // Additional axios configuration for better cross-domain support
  validateStatus: function (status) {
    // Accept status codes in the 2xx and 3xx range, and 401 (for auth handling)
    return (status >= 200 && status < 400) || status === 401;
  },
});

// Request interceptor for enhanced debugging and logging
api.interceptors.request.use(
  (config) => {
    // Enhanced request logging for production debugging
    const requestInfo = {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      withCredentials: config.withCredentials,
      headers: config.headers,
      timestamp: new Date().toISOString(),
    };

    if (import.meta.env.DEV) {
      console.log(`API Request: ${requestInfo.method} ${requestInfo.fullURL}`);
      console.log("Request config:", requestInfo);
    } else {
      // Store request info for production debugging
      window.localStorage.setItem("lastApiRequest", JSON.stringify(requestInfo));
    }

    return config;
  },
  (error) => {
    const errorInfo = {
      message: error.message,
      config: error.config,
      timestamp: new Date().toISOString(),
      type: "request_error",
    };

    if (import.meta.env.DEV) {
      console.error("API Request Error:", errorInfo);
    } else {
      window.localStorage.setItem("lastRequestError", JSON.stringify(errorInfo));
    }

    return Promise.reject(error);
  }
);

// Response interceptor for enhanced error handling and production debugging
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    }

    // Store successful response info for production debugging
    if (!import.meta.env.DEV) {
      const responseInfo = {
        status: response.status,
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        baseURL: response.config.baseURL,
        timestamp: new Date().toISOString(),
      };
      window.localStorage.setItem("lastApiResponse", JSON.stringify(responseInfo));
    }

    return response;
  },
  (error) => {
    // Enhanced error handling with comprehensive debugging information
    const errorInfo = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      code: error.code,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
      method: error.config?.method?.toUpperCase(),
      withCredentials: error.config?.withCredentials,
      headers: error.config?.headers,
      responseHeaders: error.response?.headers,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      currentURL: window.location.href,
    };

    // Categorize and handle different types of errors
    if (error.response?.status === 401) {
      // Handle unauthorized access
      const authErrorInfo = {
        ...errorInfo,
        type: "authentication_error",
        responseData: error.response?.data,
      };

      if (import.meta.env.DEV) {
        console.warn("Unauthorized access:", authErrorInfo);
      }
      
      // Store detailed auth error for production debugging
      window.localStorage.setItem("lastAuthError", JSON.stringify(authErrorInfo));
      
    } else if (error.response?.status === 403) {
      // Handle forbidden access
      const forbiddenErrorInfo = {
        ...errorInfo,
        type: "forbidden_error",
        responseData: error.response?.data,
      };

      if (import.meta.env.DEV) {
        console.warn("Forbidden access:", forbiddenErrorInfo);
      }
      
      window.localStorage.setItem("lastForbiddenError", JSON.stringify(forbiddenErrorInfo));
      
    } else if (error.response?.status >= 500) {
      // Handle server errors
      const serverErrorInfo = {
        ...errorInfo,
        type: "server_error",
        responseData: error.response?.data,
      };

      if (import.meta.env.DEV) {
        console.error("Server error:", serverErrorInfo);
      }
      
      window.localStorage.setItem("lastServerError", JSON.stringify(serverErrorInfo));
      
    } else if (error.code === "NETWORK_ERROR" || error.code === "ECONNABORTED" || !error.response) {
      // Handle network errors and timeouts
      const networkErrorInfo = {
        ...errorInfo,
        type: error.code === "ECONNABORTED" ? "timeout_error" : "network_error",
        isOnline: navigator.onLine,
        connectionType: navigator.connection?.effectiveType || 'unknown',
      };

      if (import.meta.env.DEV) {
        console.error("Network/Connection error:", networkErrorInfo);
      }
      
      window.localStorage.setItem("lastNetworkError", JSON.stringify(networkErrorInfo));
      
    } else if (error.response?.status >= 400 && error.response?.status < 500) {
      // Handle client errors (4xx)
      const clientErrorInfo = {
        ...errorInfo,
        type: "client_error",
        responseData: error.response?.data,
      };

      if (import.meta.env.DEV) {
        console.warn("Client error:", clientErrorInfo);
      }
      
      window.localStorage.setItem("lastClientError", JSON.stringify(clientErrorInfo));
    }

    // Store comprehensive error log for production debugging
    if (!import.meta.env.DEV) {
      const errorLog = JSON.parse(window.localStorage.getItem("apiErrorLog") || "[]");
      errorLog.push(errorInfo);
      
      // Keep only the last 10 errors to prevent localStorage bloat
      if (errorLog.length > 10) {
        errorLog.shift();
      }
      
      window.localStorage.setItem("apiErrorLog", JSON.stringify(errorLog));
    }

    return Promise.reject(error);
  }
);

/**
 * Utility function to get API debugging information
 * Useful for production troubleshooting
 */
export const getApiDebugInfo = () => {
  const debugInfo = {
    baseURL: api.defaults.baseURL,
    withCredentials: api.defaults.withCredentials,
    timeout: api.defaults.timeout,
    headers: api.defaults.headers,
    environment: import.meta.env.DEV ? 'development' : 'production',
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    currentURL: window.location.href,
    isOnline: navigator.onLine,
    connectionType: navigator.connection?.effectiveType || 'unknown',
  };

  // Include recent error information if available
  const recentErrors = {
    lastAuthError: JSON.parse(window.localStorage.getItem("lastAuthError") || "null"),
    lastServerError: JSON.parse(window.localStorage.getItem("lastServerError") || "null"),
    lastNetworkError: JSON.parse(window.localStorage.getItem("lastNetworkError") || "null"),
    lastClientError: JSON.parse(window.localStorage.getItem("lastClientError") || "null"),
    lastApiRequest: JSON.parse(window.localStorage.getItem("lastApiRequest") || "null"),
    lastApiResponse: JSON.parse(window.localStorage.getItem("lastApiResponse") || "null"),
    errorLog: JSON.parse(window.localStorage.getItem("apiErrorLog") || "[]"),
  };

  return {
    ...debugInfo,
    recentErrors,
  };
};

/**
 * Utility function to clear API debugging information
 * Useful for resetting debug state
 */
export const clearApiDebugInfo = () => {
  const debugKeys = [
    "lastAuthError",
    "lastServerError", 
    "lastNetworkError",
    "lastClientError",
    "lastForbiddenError",
    "lastApiRequest",
    "lastApiResponse",
    "lastRequestError",
    "apiErrorLog"
  ];

  debugKeys.forEach(key => {
    window.localStorage.removeItem(key);
  });

  if (import.meta.env.DEV) {
    console.log("API debug information cleared");
  }
};

/**
 * Utility function to test API connectivity
 * Useful for debugging connection issues
 */
export const testApiConnectivity = async () => {
  const testInfo = {
    baseURL: api.defaults.baseURL,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    isOnline: navigator.onLine,
  };

  try {
    // Make a simple request to test connectivity
    const response = await api.get("/health", { timeout: 5000 });
    
    return {
      ...testInfo,
      success: true,
      status: response.status,
      responseTime: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ...testInfo,
      success: false,
      error: {
        message: error.message,
        code: error.code,
        status: error.response?.status,
      },
      responseTime: new Date().toISOString(),
    };
  }
};

export default api;
