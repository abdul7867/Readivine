/**
 * Tests for redirect loop prevention functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  canPerformRedirect, 
  performSafeRedirect, 
  handleAuthFailure,
  resetRedirectCircuit,
  getRedirectDebugInfo,
  REDIRECT_TYPES,
  circuitBreaker
} from '../utils/redirectLoopPrevention';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000/dashboard',
  pathname: '/dashboard',
  reload: vi.fn(),
};
global.window = { location: mockLocation };

// Mock navigator
global.navigator = {
  userAgent: 'test-agent',
  cookieEnabled: true,
};

// Mock document
global.document = {
  referrer: 'http://localhost:3000/login',
};

// Mock import.meta.env
vi.mock('import.meta', () => ({
  env: {
    DEV: true,
  },
}));

describe('Redirect Loop Prevention', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset circuit breaker state
    resetRedirectCircuit();
  });

  afterEach(() => {
    // Clean up
    resetRedirectCircuit();
  });

  describe('canPerformRedirect', () => {
    it('should allow redirect when circuit is closed and auth state is valid', async () => {
      const authContext = {
        isAuthenticated: false,
        isLoading: false,
        hasCheckedAuth: true,
        error: null,
      };

      const result = await canPerformRedirect(REDIRECT_TYPES.LOGIN_REDIRECT, '/login', authContext);
      
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('validated');
    });

    it('should block redirect when authentication state is loading', async () => {
      const authContext = {
        isAuthenticated: false,
        isLoading: true,
        hasCheckedAuth: false,
        error: null,
      };

      const result = await canPerformRedirect(REDIRECT_TYPES.LOGIN_REDIRECT, '/login', authContext);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('auth_pending');
    });

    it('should block redirect when authentication check failed', async () => {
      const authContext = {
        isAuthenticated: false,
        isLoading: false,
        hasCheckedAuth: true,
        error: 'Authentication check failed: Network error',
      };

      const result = await canPerformRedirect(REDIRECT_TYPES.LOGIN_REDIRECT, '/login', authContext);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('auth_error');
    });

    it('should prevent same page redirects', async () => {
      mockLocation.pathname = '/login';
      
      const authContext = {
        isAuthenticated: false,
        isLoading: false,
        hasCheckedAuth: true,
        error: null,
      };

      const result = await canPerformRedirect(REDIRECT_TYPES.LOGIN_REDIRECT, '/login', authContext);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('same_page_redirect');
    });

    it('should suggest dashboard redirect for authenticated user trying to access login', async () => {
      // Set current path to something other than /login to avoid same_page_redirect
      mockLocation.pathname = '/dashboard';
      
      const authContext = {
        isAuthenticated: true,
        isLoading: false,
        hasCheckedAuth: true,
        error: null,
      };

      const result = await canPerformRedirect(REDIRECT_TYPES.LOGIN_REDIRECT, '/login', authContext);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('authenticated_to_login');
      expect(result.suggestedRedirect).toBe('/dashboard');
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit after max redirects exceeded', async () => {
      const authContext = {
        isAuthenticated: false,
        isLoading: false,
        hasCheckedAuth: true,
        error: null,
      };

      // Simulate multiple redirects to the same path
      for (let i = 0; i < 3; i++) {
        circuitBreaker.recordRedirect(REDIRECT_TYPES.LOGIN_REDIRECT, '/login');
      }

      const result = await canPerformRedirect(REDIRECT_TYPES.LOGIN_REDIRECT, '/login', authContext);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('max_redirects_exceeded');
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should block redirects when circuit is open', async () => {
      const authContext = {
        isAuthenticated: false,
        isLoading: false,
        hasCheckedAuth: true,
        error: null,
      };

      // Force circuit open
      circuitBreaker.openCircuit();

      const result = await canPerformRedirect(REDIRECT_TYPES.DASHBOARD_REDIRECT, '/dashboard', authContext);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('circuit_open');
    });

    it('should reset circuit breaker', () => {
      // Force circuit open
      circuitBreaker.openCircuit();
      expect(circuitBreaker.state.circuitOpen).toBe(true);

      // Reset circuit
      resetRedirectCircuit();
      expect(circuitBreaker.state.circuitOpen).toBe(false);
      expect(circuitBreaker.state.redirects).toHaveLength(0);
    });
  });

  describe('performSafeRedirect', () => {
    it('should perform redirect when allowed', async () => {
      // Set current path to something other than /login to avoid same_page_redirect
      mockLocation.pathname = '/dashboard';
      
      const authContext = {
        isAuthenticated: false,
        isLoading: false,
        hasCheckedAuth: true,
        error: null,
      };

      // Mock window.location.href setter
      const originalHref = mockLocation.href;
      let redirectedTo = null;
      Object.defineProperty(mockLocation, 'href', {
        set: (value) => { redirectedTo = value; },
        get: () => originalHref,
      });

      const result = await performSafeRedirect(REDIRECT_TYPES.LOGIN_REDIRECT, '/login', authContext);
      
      expect(result.success).toBe(true);
      expect(redirectedTo).toBe('/login');
    });

    it('should record redirect attempt', async () => {
      // Set current path to something other than /login to avoid same_page_redirect
      mockLocation.pathname = '/dashboard';
      
      const authContext = {
        isAuthenticated: false,
        isLoading: false,
        hasCheckedAuth: true,
        error: null,
      };

      const recordSpy = vi.spyOn(circuitBreaker, 'recordRedirect');

      await performSafeRedirect(REDIRECT_TYPES.LOGIN_REDIRECT, '/login', authContext);
      
      expect(recordSpy).toHaveBeenCalledWith(
        REDIRECT_TYPES.LOGIN_REDIRECT, 
        '/login', 
        expect.any(Object)
      );
    });

    it('should force redirect when force option is true', async () => {
      const authContext = {
        isAuthenticated: false,
        isLoading: false,
        hasCheckedAuth: true,
        error: null,
      };

      // Force circuit open to normally block redirects
      circuitBreaker.openCircuit();

      const result = await performSafeRedirect(
        REDIRECT_TYPES.LOGIN_REDIRECT, 
        '/login', 
        authContext, 
        { force: true }
      );
      
      expect(result.success).toBe(true);
    });
  });

  describe('handleAuthFailure', () => {
    it('should attempt to refresh auth status', async () => {
      const mockRefreshAuthStatus = vi.fn().mockResolvedValue();
      const authContext = {
        isAuthenticated: false,
        isLoading: false,
        hasCheckedAuth: true,
        error: 'Network error',
        refreshAuthStatus: mockRefreshAuthStatus,
        logout: vi.fn(),
      };

      const result = await handleAuthFailure(new Error('Network error'), authContext);
      
      expect(mockRefreshAuthStatus).toHaveBeenCalled();
    });

    it('should provide fallback options when refresh fails', async () => {
      const mockRefreshAuthStatus = vi.fn().mockRejectedValue(new Error('Refresh failed'));
      const authContext = {
        isAuthenticated: false,
        isLoading: false,
        hasCheckedAuth: true,
        error: 'Network error',
        refreshAuthStatus: mockRefreshAuthStatus,
        logout: vi.fn(),
      };

      const result = await handleAuthFailure(new Error('Network error'), authContext);
      
      expect(result.success).toBe(false);
      expect(result.action).toBe('fallback_required');
      expect(result.fallbackOptions).toHaveLength(3);
      expect(result.fallbackOptions[0].type).toBe('manual_login');
      expect(result.fallbackOptions[1].type).toBe('force_logout');
      expect(result.fallbackOptions[2].type).toBe('reload_page');
    });

    it('should return success when refresh succeeds', async () => {
      const mockRefreshAuthStatus = vi.fn().mockResolvedValue();
      const authContext = {
        isAuthenticated: true, // Becomes authenticated after refresh
        isLoading: false,
        hasCheckedAuth: true,
        error: null,
        refreshAuthStatus: mockRefreshAuthStatus,
        logout: vi.fn(),
      };

      const result = await handleAuthFailure(new Error('Network error'), authContext);
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('refreshed');
    });
  });

  describe('getRedirectDebugInfo', () => {
    it('should return debug information', () => {
      // Record some redirects
      circuitBreaker.recordRedirect(REDIRECT_TYPES.LOGIN_REDIRECT, '/login');
      circuitBreaker.recordRedirect(REDIRECT_TYPES.DASHBOARD_REDIRECT, '/dashboard');

      const debugInfo = getRedirectDebugInfo();
      
      expect(debugInfo).toHaveProperty('state');
      expect(debugInfo).toHaveProperty('config');
      expect(debugInfo).toHaveProperty('remainingCooldown');
      expect(debugInfo).toHaveProperty('recentRedirects');
      expect(debugInfo.state.redirects).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not throw error
      expect(() => {
        const debugInfo = getRedirectDebugInfo();
        expect(debugInfo).toBeDefined();
      }).not.toThrow();
    });

    it('should clean up old redirect entries', () => {
      const now = Date.now();
      const oldTimestamp = now - 120000; // 2 minutes ago (outside 1 minute window)
      
      // Mock stored state with old entries
      const storedState = {
        redirects: [
          { type: 'old', path: '/old', timestamp: oldTimestamp },
          { type: 'new', path: '/new', timestamp: now },
        ],
        circuitOpen: false,
        lastReset: now,
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedState));
      
      // Load state should clean up old entries
      const newState = circuitBreaker.loadState();
      expect(newState.redirects).toHaveLength(1);
      expect(newState.redirects[0].type).toBe('new');
    });
  });
});