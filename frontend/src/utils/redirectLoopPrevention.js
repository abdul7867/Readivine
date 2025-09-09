/**
 * Redirect Loop Prevention Utility
 * 
 * Implements circuit breaker pattern to prevent infinite authentication redirects
 * and provides fallback mechanisms for authentication failures.
 */

// Configuration for redirect loop prevention
const REDIRECT_CONFIG = {
  maxRedirects: 3,
  timeWindow: 60000, // 1 minute
  cooldownPeriod: 300000, // 5 minutes
  storageKey: 'redirectLoopPrevention',
  fallbackDelay: 2000, // 2 seconds
};

// Redirect types for tracking
const REDIRECT_TYPES = {
  AUTH_CHECK: 'auth_check',
  LOGIN_REDIRECT: 'login_redirect',
  DASHBOARD_REDIRECT: 'dashboard_redirect',
  LOGOUT_REDIRECT: 'logout_redirect',
};

/**
 * Circuit breaker class for managing redirect attempts
 */
class RedirectCircuitBreaker {
  constructor() {
    this.state = this.loadState();
  }

  /**
   * Load state from localStorage
   */
  loadState() {
    try {
      const stored = localStorage.getItem(REDIRECT_CONFIG.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Clean up old entries
        this.cleanupOldEntries(parsed);
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to load redirect state:', error);
    }
    return {
      redirects: [],
      circuitOpen: false,
      lastReset: Date.now(),
    };
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      localStorage.setItem(REDIRECT_CONFIG.storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.warn('Failed to save redirect state:', error);
    }
  }

  /**
   * Clean up old redirect entries outside the time window
   */
  cleanupOldEntries(state) {
    const now = Date.now();
    const cutoff = now - REDIRECT_CONFIG.timeWindow;
    
    if (state.redirects) {
      state.redirects = state.redirects.filter(redirect => redirect.timestamp > cutoff);
    }
    
    // Reset circuit if cooldown period has passed
    if (state.circuitOpen && (now - state.lastReset) > REDIRECT_CONFIG.cooldownPeriod) {
      state.circuitOpen = false;
      state.redirects = [];
      state.lastReset = now;
    }
  }

  /**
   * Check if redirect is allowed
   */
  canRedirect(type, path) {
    this.cleanupOldEntries(this.state);
    
    // If circuit is open, deny redirects
    if (this.state.circuitOpen) {
      console.warn(`Redirect circuit breaker is open. Blocking redirect to ${path}`);
      return {
        allowed: false,
        reason: 'circuit_open',
        message: 'Too many redirects detected. Please wait before trying again.',
        retryAfter: this.getRemainingCooldown(),
      };
    }

    // Count recent redirects of the same type to the same path
    const now = Date.now();
    const recentRedirects = this.state.redirects.filter(redirect => 
      redirect.type === type && 
      redirect.path === path &&
      (now - redirect.timestamp) < REDIRECT_CONFIG.timeWindow
    );

    // Check if we've exceeded the limit
    if (recentRedirects.length >= REDIRECT_CONFIG.maxRedirects) {
      this.openCircuit();
      return {
        allowed: false,
        reason: 'max_redirects_exceeded',
        message: `Too many ${type} redirects to ${path}. Circuit breaker activated.`,
        retryAfter: REDIRECT_CONFIG.cooldownPeriod,
      };
    }

    return {
      allowed: true,
      reason: 'allowed',
      message: 'Redirect allowed',
    };
  }

  /**
   * Record a redirect attempt
   */
  recordRedirect(type, path, metadata = {}) {
    const redirect = {
      type,
      path,
      timestamp: Date.now(),
      metadata: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer,
        ...metadata,
      },
    };

    this.state.redirects.push(redirect);
    this.saveState();

    // Log for debugging
    if (import.meta.env.DEV) {
      console.log('Recorded redirect:', redirect);
    }
  }

  /**
   * Open the circuit breaker
   */
  openCircuit() {
    this.state.circuitOpen = true;
    this.state.lastReset = Date.now();
    this.saveState();
    
    console.warn('Redirect circuit breaker opened due to excessive redirects');
  }

  /**
   * Manually reset the circuit breaker
   */
  resetCircuit() {
    this.state.circuitOpen = false;
    this.state.redirects = [];
    this.state.lastReset = Date.now();
    this.saveState();
    
    console.log('Redirect circuit breaker manually reset');
  }

  /**
   * Get remaining cooldown time in milliseconds
   */
  getRemainingCooldown() {
    if (!this.state.circuitOpen) return 0;
    
    const elapsed = Date.now() - this.state.lastReset;
    const remaining = REDIRECT_CONFIG.cooldownPeriod - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Get debug information about the circuit breaker state
   */
  getDebugInfo() {
    return {
      state: this.state,
      config: REDIRECT_CONFIG,
      remainingCooldown: this.getRemainingCooldown(),
      recentRedirects: this.state.redirects.slice(-10), // Last 10 redirects
    };
  }
}

// Global instance
const circuitBreaker = new RedirectCircuitBreaker();

/**
 * Authentication state validator
 */
class AuthStateValidator {
  /**
   * Validate authentication state before allowing redirects
   */
  static async validateAuthState(authContext) {
    const { isAuthenticated, isLoading, hasCheckedAuth, error } = authContext;
    
    // If still loading or hasn't checked auth, wait
    if (isLoading || !hasCheckedAuth) {
      return {
        valid: false,
        reason: 'auth_pending',
        message: 'Authentication check in progress',
        shouldWait: true,
      };
    }

    // If there's an authentication error, it's not safe to redirect
    if (error && error.includes('Authentication check failed')) {
      return {
        valid: false,
        reason: 'auth_error',
        message: 'Authentication check failed',
        shouldRetry: true,
      };
    }

    // State is valid for redirect decisions
    return {
      valid: true,
      reason: 'valid',
      message: 'Authentication state is valid',
      isAuthenticated,
    };
  }

  /**
   * Validate specific redirect scenarios
   */
  static validateRedirectScenario(from, to, authState) {
    // Check for same page redirect first (highest priority)
    if (from === to) {
      return {
        scenario: 'same_page_redirect',
        valid: false,
        message: 'Prevented redirect to same page',
      };
    }

    // Check for authenticated user trying to access login
    if (authState.isAuthenticated && to === '/login') {
      return {
        scenario: 'authenticated_to_login',
        valid: false,
        message: 'Authenticated user should not access login page',
        suggestedRedirect: '/dashboard',
      };
    }

    // Check for unauthenticated user redirecting to login (valid)
    if (!authState.isAuthenticated && to === '/login') {
      return {
        scenario: 'unauthenticated_to_login',
        valid: true,
        message: 'Valid redirect to login for unauthenticated user',
      };
    }

    // Check for authenticated user redirecting to dashboard (valid)
    if (authState.isAuthenticated && to === '/dashboard') {
      return {
        scenario: 'authenticated_to_dashboard',
        valid: true,
        message: 'Valid redirect to dashboard for authenticated user',
      };
    }

    // Check for unauthenticated user trying to access protected route
    if (!authState.isAuthenticated && to === '/dashboard') {
      return {
        scenario: 'unauthenticated_to_protected',
        valid: true, // Allow but will be handled by ProtectedRoute
        message: 'Unauthenticated user accessing protected route',
      };
    }

    // Default: allow redirect
    return {
      scenario: 'default',
      valid: true,
      message: 'No specific scenario matched, allowing redirect',
    };
  }
}

/**
 * Fallback mechanism for authentication failures
 */
class AuthFallbackManager {
  /**
   * Handle authentication failures with appropriate fallbacks
   */
  static async handleAuthFailure(error, authContext, options = {}) {
    const { refreshAuthStatus, logout } = authContext;
    const { maxRetries = 2, retryDelay = 2000 } = options;

    console.warn('Handling authentication failure:', error);

    // Try to refresh auth status first
    if (refreshAuthStatus && maxRetries > 0) {
      try {
        console.log('Attempting to refresh authentication status...');
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        await refreshAuthStatus();
        
        // Check if refresh was successful
        if (authContext.isAuthenticated) {
          console.log('Authentication refresh successful');
          return {
            success: true,
            action: 'refreshed',
            message: 'Authentication status refreshed successfully',
          };
        }
      } catch (refreshError) {
        console.warn('Authentication refresh failed:', refreshError);
      }
    }

    // If refresh failed or not available, provide fallback options
    return {
      success: false,
      action: 'fallback_required',
      message: 'Authentication could not be restored',
      fallbackOptions: [
        {
          type: 'manual_login',
          message: 'Please log in again',
          action: () => window.location.href = '/login',
        },
        {
          type: 'force_logout',
          message: 'Clear session and restart',
          action: async () => {
            try {
              if (logout) await logout();
            } catch (logoutError) {
              console.warn('Logout failed:', logoutError);
            }
            // Clear all auth-related storage
            localStorage.removeItem('redirectLoopPrevention');
            window.location.href = '/login';
          },
        },
        {
          type: 'reload_page',
          message: 'Reload the page',
          action: () => window.location.reload(),
        },
      ],
    };
  }
}

/**
 * Main redirect loop prevention functions
 */

/**
 * Check if a redirect is safe to perform
 */
export const canPerformRedirect = async (type, path, authContext) => {
  // First check circuit breaker
  const circuitCheck = circuitBreaker.canRedirect(type, path);
  if (!circuitCheck.allowed) {
    return circuitCheck;
  }

  // Validate authentication state
  const authValidation = await AuthStateValidator.validateAuthState(authContext);
  if (!authValidation.valid) {
    return {
      allowed: false,
      reason: authValidation.reason,
      message: authValidation.message,
      shouldRetry: authValidation.shouldRetry,
      shouldWait: authValidation.shouldWait,
    };
  }

  // Validate redirect scenario
  const currentPath = window.location.pathname;
  const scenarioValidation = AuthStateValidator.validateRedirectScenario(
    currentPath, 
    path, 
    authValidation
  );

  if (!scenarioValidation.valid) {
    return {
      allowed: false,
      reason: scenarioValidation.scenario,
      message: scenarioValidation.message,
      suggestedRedirect: scenarioValidation.suggestedRedirect,
    };
  }

  return {
    allowed: true,
    reason: 'validated',
    message: 'Redirect is safe to perform',
  };
};

/**
 * Perform a safe redirect with loop prevention
 */
export const performSafeRedirect = async (type, path, authContext, options = {}) => {
  const { force = false, metadata = {} } = options;

  // Check if redirect is allowed (unless forced)
  if (!force) {
    const redirectCheck = await canPerformRedirect(type, path, authContext);
    if (!redirectCheck.allowed) {
      console.warn('Redirect blocked:', redirectCheck);
      return {
        success: false,
        ...redirectCheck,
      };
    }
  }

  // Record the redirect attempt
  circuitBreaker.recordRedirect(type, path, metadata);

  // Perform the redirect
  try {
    if (import.meta.env.DEV) {
      console.log(`Performing safe redirect: ${type} -> ${path}`);
    }

    // Add a small delay to prevent rapid redirects
    await new Promise(resolve => setTimeout(resolve, REDIRECT_CONFIG.fallbackDelay));
    
    window.location.href = path;
    
    return {
      success: true,
      message: `Redirect to ${path} initiated`,
    };
  } catch (error) {
    console.error('Redirect failed:', error);
    return {
      success: false,
      reason: 'redirect_failed',
      message: `Failed to redirect to ${path}`,
      error: error.message,
    };
  }
};

/**
 * Handle authentication failures with fallback mechanisms
 */
export const handleAuthFailure = async (error, authContext, options = {}) => {
  return AuthFallbackManager.handleAuthFailure(error, authContext, options);
};

/**
 * Reset the redirect circuit breaker (for manual recovery)
 */
export const resetRedirectCircuit = () => {
  circuitBreaker.resetCircuit();
};

/**
 * Get debug information about redirect prevention state
 */
export const getRedirectDebugInfo = () => {
  return circuitBreaker.getDebugInfo();
};

/**
 * Export redirect types for use in components
 */
export { REDIRECT_TYPES };

/**
 * Export the circuit breaker instance for advanced usage
 */
export { circuitBreaker };