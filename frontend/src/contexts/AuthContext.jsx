import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api"; // Import the centralized api instance
import toast from "react-hot-toast";
import { 
  performSafeRedirect, 
  handleAuthFailure, 
  resetRedirectCircuit,
  getRedirectDebugInfo as getRedirectDebugInfoUtil,
  REDIRECT_TYPES 
} from "../utils/redirectLoopPrevention";

// Import diagnostic tools for development
if (import.meta.env.DEV) {
  import("../utils/authDiagnostic.js").catch(console.warn);
}

const AuthContext = createContext();

// Configuration for retry logic
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2,
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  const [lastRedirectTime, setLastRedirectTime] = useState(0);

  // Helper function to determine if an error is retryable
  const isRetryableError = (error) => {
    // Network errors, timeouts, and 5xx server errors are retryable
    return (
      !error.response || // Network error
      error.code === 'NETWORK_ERROR' ||
      error.code === 'ECONNABORTED' || // Timeout
      (error.response?.status >= 500 && error.response?.status < 600) // Server errors
    );
  };

  // Helper function to determine if an error is an authentication failure vs network error
  const categorizeError = (error) => {
    if (error.response?.status === 401) {
      return { type: 'auth_failure', message: 'Not authenticated' };
    } else if (error.response?.status === 403) {
      return { type: 'auth_failure', message: 'Access forbidden' };
    } else if (!error.response || error.code === 'NETWORK_ERROR') {
      return { type: 'network_error', message: 'Network connection failed' };
    } else if (error.code === 'ECONNABORTED') {
      return { type: 'network_error', message: 'Request timeout' };
    } else if (error.response?.status >= 500) {
      return { type: 'server_error', message: 'Server error occurred' };
    } else {
      return { type: 'unknown_error', message: error.message || 'Unknown error occurred' };
    }
  };

  // Safe redirect function with loop prevention
  const safeRedirect = async (path, type = REDIRECT_TYPES.AUTH_CHECK, options = {}) => {

    const redirectResult = await performSafeRedirect(type, path, {
      isAuthenticated,
      isLoading,
      hasCheckedAuth,
      error,
      refreshAuthStatus,
      logout
    }, {
      metadata: {
        redirectAttempts,
        lastRedirectTime,
        currentPath: window.location.pathname,
        ...options.metadata
      },
      ...options
    });

    if (redirectResult.success) {
      setRedirectAttempts(prev => prev + 1);
      setLastRedirectTime(Date.now());
    } else {
      // Handle redirect failure
      console.warn('Redirect prevented:', redirectResult);
      
      if (redirectResult.reason === 'circuit_open' || redirectResult.reason === 'max_redirects_exceeded') {
        // Circuit breaker is active, show user-friendly message
        const message = `Too many redirects detected. Please wait ${Math.ceil(redirectResult.retryAfter / 1000)} seconds before trying again.`;
        toast.error(message);
        setError(message);
        
        // Provide fallback options
        if (redirectResult.reason === 'circuit_open') {
          setTimeout(() => {
            toast.info('You can now try again or manually navigate to the login page.');
          }, redirectResult.retryAfter);
        }
      } else if (redirectResult.suggestedRedirect) {
        // Use suggested redirect instead
        setTimeout(() => {
          safeRedirect(redirectResult.suggestedRedirect, type, { force: true });
        }, 1000);
      }
    }

    return redirectResult;
  };

  // Enhanced authentication check with retry logic
  const checkAuthStatus = async (attempt = 0) => {
    setIsLoading(true);
    setError("");
    
    try {
      // Use the consistent /auth/check endpoint for authentication status
      const response = await api.get("/auth/check");
      
      // Reset retry count on successful request
      setRetryCount(0);
      
      if (
        response.data &&
        response.data.success &&
        response.data.data.authenticated
      ) {
        setIsAuthenticated(true);
        setUser(response.data.data.user || null);
        
        // Log successful authentication in development
        if (import.meta.env.DEV) {
          console.log("Authentication check successful:", {
            authenticated: true,
            user: response.data.data.user?.username || 'Unknown'
          });
        }
      } else {
        // User is not authenticated - this is expected behavior, not an error
        setIsAuthenticated(false);
        setUser(null);
        
        if (import.meta.env.DEV) {
          console.log("Authentication check: User not authenticated");
        }
      }
    } catch (error) {
      const errorCategory = categorizeError(error);
      
      // Enhanced error details for debugging
      const errorDetails = {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
        timestamp: new Date().toISOString(),
        attempt: attempt + 1,
        category: errorCategory.type,
        retryable: isRetryableError(error),
      };

      // Log errors appropriately based on environment
      if (import.meta.env.DEV) {
        console.error("Auth status check failed:", errorDetails);
      } else {
        // Store auth errors in localStorage for production debugging
        window.localStorage.setItem(
          "authCheckError",
          JSON.stringify(errorDetails)
        );
      }

      // Handle retryable errors with exponential backoff
      if (isRetryableError(error) && attempt < RETRY_CONFIG.maxRetries) {
        const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
        
        if (import.meta.env.DEV) {
          console.log(`Retrying auth check in ${delay}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries})`);
        }
        
        setRetryCount(attempt + 1);
        
        // Retry after delay
        setTimeout(() => {
          checkAuthStatus(attempt + 1);
        }, delay);
        
        return; // Don't update state yet, wait for retry
      }

      // Set authentication state based on error type
      setIsAuthenticated(false);
      setUser(null);
      
      // Only show error messages for non-authentication failures
      if (errorCategory.type !== 'auth_failure') {
        const errorMsg = `Authentication check failed: ${errorCategory.message}`;
        setError(errorMsg);
        
        // Only show toast for serious errors, not auth failures
        if (errorCategory.type === 'network_error' || errorCategory.type === 'server_error') {
          toast.error(errorMsg);
        }
      }
      
      // Reset retry count after final attempt
      setRetryCount(0);
    } finally {
      setIsLoading(false);
      setHasCheckedAuth(true);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async () => {
    // Validate authentication state before login redirect
    const authContext = {
      isAuthenticated,
      isLoading,
      hasCheckedAuth,
      error,
      refreshAuthStatus,
      logout
    };

    // Check if user is already authenticated
    if (isAuthenticated) {
      console.log('User already authenticated, redirecting to dashboard');
      return safeRedirect('/dashboard', REDIRECT_TYPES.DASHBOARD_REDIRECT);
    }

    // Use the API service's base URL to ensure consistency
    const apiBaseUrl = api.defaults.baseURL;
    const authUrl = `${apiBaseUrl}/auth/github`;
    
    // Log for debugging
    const loginAttempt = {
      timestamp: new Date().toISOString(),
      authUrl: authUrl,
      apiBaseUrl: apiBaseUrl,
      currentUrl: window.location.href,
      userAgent: navigator.userAgent,
      environment: import.meta.env.DEV ? 'development' : 'production',
      redirectAttempts,
      lastRedirectTime
    };
    
    if (import.meta.env.DEV) {
      console.log("Initiating GitHub login:", loginAttempt);
    } else {
      // Store for production debugging
      window.localStorage.setItem("lastLoginAttempt", JSON.stringify(loginAttempt));
    }

    // Clear any existing errors before login
    setError("");
    
    // Use safe redirect for OAuth login
    return safeRedirect(authUrl, REDIRECT_TYPES.LOGIN_REDIRECT, {
      metadata: loginAttempt
    });
  };

  const logout = async () => {
    if (isLoggingOut) return; // Prevent multiple logout calls

    setIsLoggingOut(true);
    setIsLoading(true);
    setError("");

    const loadingToast = toast.loading("Signing out...");

    try {
      await api.post("/auth/logout");
      toast.success("Successfully signed out!", { id: loadingToast });

      // Controlled delay for user feedback
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // State updates and navigation after delay
      setIsAuthenticated(false);
      setUser(null);
      setHasCheckedAuth(false); // Reset auth check status
      setRetryCount(0); // Reset retry count

      // Use safe redirect to login page
      await safeRedirect("/login", REDIRECT_TYPES.LOGOUT_REDIRECT);
    } catch (error) {
      const errorCategory = categorizeError(error);
      
      if (import.meta.env.DEV) {
        console.error("Logout failed:", error);
      }
      
      // Provide more specific error messages
      let errorMessage = "Logout failed. Please try again.";
      if (errorCategory.type === 'network_error') {
        errorMessage = "Network error during logout. Please check your connection.";
      } else if (errorCategory.type === 'server_error') {
        errorMessage = "Server error during logout. Please try again.";
      }
      
      toast.error(errorMessage, { id: loadingToast });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsLoggingOut(false); // Release the lock
    }
  };

  const checkAuthIfNeeded = async () => {
    if (!hasCheckedAuth && !isLoading) {
      await checkAuthStatus();
    }
  };

  // Force a fresh authentication check (useful after login redirect)
  const refreshAuthStatus = async () => {
    setHasCheckedAuth(false);
    setRetryCount(0);
    await checkAuthStatus();
  };

  // Handle authentication failures with fallback mechanisms
  const handleAuthenticationFailure = async (error, options = {}) => {
    const authContext = {
      isAuthenticated,
      isLoading,
      hasCheckedAuth,
      error,
      refreshAuthStatus,
      logout
    };

    const fallbackResult = await handleAuthFailure(error, authContext, options);
    
    if (!fallbackResult.success && fallbackResult.fallbackOptions) {
      // Show fallback options to user
      const message = `Authentication failed: ${fallbackResult.message}`;
      setError(message);
      
      if (import.meta.env.DEV) {
        console.group('🔧 Authentication Fallback Options');
        fallbackResult.fallbackOptions.forEach((option, index) => {
          console.log(`${index + 1}. ${option.type}: ${option.message}`);
        });
        console.groupEnd();
      }
      
      // Auto-execute the first fallback option after a delay
      setTimeout(() => {
        if (fallbackResult.fallbackOptions[0]) {
          console.log('Executing fallback option:', fallbackResult.fallbackOptions[0].type);
          fallbackResult.fallbackOptions[0].action();
        }
      }, 5000); // 5 second delay to allow user to see the error
    }
    
    return fallbackResult;
  };

  const clearError = () => {
    setError("");
  };

  // Debug function to get comprehensive auth state information
  const getDebugInfo = () => {
    const debugInfo = {
      state: {
        isAuthenticated,
        isLoading,
        isLoggingOut,
        hasCheckedAuth,
        retryCount,
        error,
        user: user ? {
          username: user.username,
          email: user.email,
          id: user._id
        } : null
      },
      environment: {
        isDev: import.meta.env.DEV,
        apiBaseUrl: api.defaults.baseURL,
        currentUrl: window.location.href,
        origin: window.location.origin,
        userAgent: navigator.userAgent,
        cookiesEnabled: navigator.cookieEnabled
      },
      storage: {
        lastLoginAttempt: localStorage.getItem('lastLoginAttempt'),
        authCheckError: localStorage.getItem('authCheckError'),
        localStorageKeys: Object.keys(localStorage),
        sessionStorageKeys: Object.keys(sessionStorage)
      },
      timestamp: new Date().toISOString()
    };
    
    return debugInfo;
  };

  // Debug function to log current auth state
  const logDebugInfo = () => {
    const debugInfo = getDebugInfo();
    console.group('🔍 Auth Context Debug Info');
    console.log('State:', debugInfo.state);
    console.log('Environment:', debugInfo.environment);
    console.log('Storage:', debugInfo.storage);
    console.log('Timestamp:', debugInfo.timestamp);
    console.groupEnd();
    return debugInfo;
  };

  // Test authentication endpoints
  const testAuthEndpoints = async () => {
    console.group('🧪 Testing Auth Endpoints');
    
    const results = {
      check: null,
      status: null,
      cookies: null,
      config: null,
      oauth: null
    };
    
    try {
      console.log('Testing /auth/check...');
      const checkResponse = await api.get('/auth/check');
      results.check = { success: true, data: checkResponse.data };
      console.log('✅ /auth/check:', checkResponse.data);
    } catch (error) {
      results.check = { success: false, error: error.message };
      console.error('❌ /auth/check failed:', error.message);
    }
    
    try {
      console.log('Testing /auth/status...');
      const statusResponse = await api.get('/auth/status');
      results.status = { success: true, data: statusResponse.data };
      console.log('✅ /auth/status:', statusResponse.data);
    } catch (error) {
      results.status = { success: false, error: error.message };
      console.error('❌ /auth/status failed:', error.message);
    }
    
    try {
      console.log('Testing /auth/cookies...');
      const cookiesResponse = await api.get('/auth/cookies');
      results.cookies = { success: true, data: cookiesResponse.data };
      console.log('✅ /auth/cookies:', cookiesResponse.data);
    } catch (error) {
      results.cookies = { success: false, error: error.message };
      console.error('❌ /auth/cookies failed:', error.message);
    }
    
    try {
      console.log('Testing /auth/debug/config...');
      const configResponse = await api.get('/auth/debug/config');
      results.config = { success: true, data: configResponse.data };
      console.log('✅ /auth/debug/config:', configResponse.data);
    } catch (error) {
      results.config = { success: false, error: error.message };
      console.error('❌ /auth/debug/config failed:', error.message);
    }
    
    try {
      console.log('Testing /auth/debug/oauth...');
      const oauthResponse = await api.get('/auth/debug/oauth');
      results.oauth = { success: true, data: oauthResponse.data };
      console.log('✅ /auth/debug/oauth:', oauthResponse.data);
    } catch (error) {
      results.oauth = { success: false, error: error.message };
      console.error('❌ /auth/debug/oauth failed:', error.message);
    }
    
    console.groupEnd();
    return results;
  };

  // Reset redirect circuit breaker (for manual recovery)
  const resetRedirectLoop = () => {
    resetRedirectCircuit();
    setRedirectAttempts(0);
    setLastRedirectTime(0);
    setError("");
    toast.success('Redirect loop prevention reset');
  };

  // Get redirect debug information
  const getRedirectDebugInfo = () => {
    return {
      ...getRedirectDebugInfoUtil(),
      contextState: {
        redirectAttempts,
        lastRedirectTime,
        isAuthenticated,
        isLoading,
        hasCheckedAuth,
        error
      }
    };
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    error,
    hasCheckedAuth,
    retryCount,
    redirectAttempts,
    login,
    logout,
    clearError,
    checkAuthStatus,
    checkAuthIfNeeded,
    refreshAuthStatus,
    safeRedirect,
    handleAuthenticationFailure,
    resetRedirectLoop,
    // Debug functions
    getDebugInfo,
    logDebugInfo,
    testAuthEndpoints,
    getRedirectDebugInfo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
