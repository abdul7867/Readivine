import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { REDIRECT_TYPES } from '../../utils/redirectLoopPrevention';

// Mock API
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: {
      baseURL: 'http://localhost:8080/api/v1'
    }
  }
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    loading: vi.fn(() => 'toast-id'),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

// Mock redirect loop prevention
vi.mock('../../utils/redirectLoopPrevention', () => ({
  performSafeRedirect: vi.fn(),
  handleAuthFailure: vi.fn(),
  resetRedirectCircuit: vi.fn(),
  getRedirectDebugInfo: vi.fn(() => ({ state: {}, config: {} })),
  REDIRECT_TYPES: {
    AUTH_CHECK: 'auth_check',
    LOGIN_REDIRECT: 'login_redirect',
    DASHBOARD_REDIRECT: 'dashboard_redirect',
    LOGOUT_REDIRECT: 'logout_redirect'
  }
}));

// Test component to access auth context
const TestComponent = ({ onAuthState }) => {
  const auth = useAuth();
  
  if (onAuthState) {
    onAuthState(auth);
  }
  
  return (
    <div>
      <div data-testid="auth-status">
        {auth.isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="loading-status">
        {auth.isLoading ? 'loading' : 'not-loading'}
      </div>
      <div data-testid="checked-status">
        {auth.hasCheckedAuth ? 'checked' : 'not-checked'}
      </div>
      <div data-testid="error-status">
        {auth.error || 'no-error'}
      </div>
      <button onClick={auth.login} data-testid="login-btn">Login</button>
      <button onClick={auth.logout} data-testid="logout-btn">Logout</button>
      <button onClick={auth.refreshAuthStatus} data-testid="refresh-btn">Refresh</button>
    </div>
  );
};

const renderWithAuth = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Authentication Flow', () => {
  let mockApi;
  let mockPerformSafeRedirect;
  
  beforeEach(() => {
    mockApi = vi.mocked(await import('../../services/api')).default;
    mockPerformSafeRedirect = vi.mocked(await import('../../utils/redirectLoopPrevention')).performSafeRedirect;
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Clear localStorage
    localStorage.clear();
    
    // Mock successful redirect by default
    mockPerformSafeRedirect.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Authentication Check', () => {
    it('should start in loading state and check authentication', async () => {
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: { authenticated: false, user: null }
        }
      });

      renderWithAuth(<TestComponent />);

      // Should start loading
      expect(screen.getByTestId('loading-status')).toHaveTextContent('loading');
      expect(screen.getByTestId('checked-status')).toHaveTextContent('not-checked');

      // Wait for auth check to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('not-loading');
        expect(screen.getByTestId('checked-status')).toHaveTextContent('checked');
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      });

      expect(mockApi.get).toHaveBeenCalledWith('/auth/check');
    });

    it('should set authenticated state when user is logged in', async () => {
      const mockUser = { _id: '123', username: 'testuser', email: 'test@example.com' };
      
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: { authenticated: true, user: mockUser }
        }
      });

      let authState;
      renderWithAuth(<TestComponent onAuthState={(auth) => authState = auth} />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      expect(authState.user).toEqual(mockUser);
      expect(authState.isAuthenticated).toBe(true);
    });

    it('should handle network errors with retry logic', async () => {
      const networkError = new Error('Network Error');
      networkError.code = 'NETWORK_ERROR';
      
      mockApi.get
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue({
          data: {
            success: true,
            data: { authenticated: false, user: null }
          }
        });

      renderWithAuth(<TestComponent />);

      // Should eventually succeed after retry
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      }, { timeout: 3000 });

      // Should have been called twice (initial + retry)
      expect(mockApi.get).toHaveBeenCalledTimes(2);
    });

    it('should handle authentication errors properly', async () => {
      const authError = new Error('Unauthorized');
      authError.response = { status: 401 };
      
      mockApi.get.mockRejectedValue(authError);

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('error-status')).toHaveTextContent('no-error'); // Auth errors shouldn't show as errors
      });
    });

    it('should show error for server errors', async () => {
      const serverError = new Error('Server Error');
      serverError.response = { status: 500 };
      
      mockApi.get.mockRejectedValue(serverError);

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('error-status')).toContain('Authentication check failed');
      });
    });
  });

  describe('Login Flow', () => {
    it('should redirect to GitHub OAuth when login is called', async () => {
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: { authenticated: false, user: null }
        }
      });

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      });

      fireEvent.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(mockPerformSafeRedirect).toHaveBeenCalledWith(
          REDIRECT_TYPES.LOGIN_REDIRECT,
          'http://localhost:8080/api/v1/auth/github',
          expect.any(Object),
          expect.objectContaining({
            metadata: expect.objectContaining({
              authUrl: 'http://localhost:8080/api/v1/auth/github'
            })
          })
        );
      });
    });

    it('should redirect to dashboard if already authenticated', async () => {
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: { authenticated: true, user: { _id: '123', username: 'test' } }
        }
      });

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      fireEvent.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(mockPerformSafeRedirect).toHaveBeenCalledWith(
          REDIRECT_TYPES.DASHBOARD_REDIRECT,
          '/dashboard',
          expect.any(Object)
        );
      });
    });
  });

  describe('Logout Flow', () => {
    it('should logout successfully and redirect to login', async () => {
      // Start authenticated
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: { authenticated: true, user: { _id: '123', username: 'test' } }
        }
      });

      mockApi.post.mockResolvedValue({ data: { success: true } });

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      fireEvent.click(screen.getByTestId('logout-btn'));

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/auth/logout');
        expect(mockPerformSafeRedirect).toHaveBeenCalledWith(
          REDIRECT_TYPES.LOGOUT_REDIRECT,
          '/login',
          expect.any(Object)
        );
      });
    });

    it('should handle logout errors gracefully', async () => {
      // Start authenticated
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: { authenticated: true, user: { _id: '123', username: 'test' } }
        }
      });

      const logoutError = new Error('Logout failed');
      logoutError.response = { status: 500 };
      mockApi.post.mockRejectedValue(logoutError);

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      fireEvent.click(screen.getByTestId('logout-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('error-status')).toContain('Server error during logout');
      });
    });
  });

  describe('Refresh Authentication', () => {
    it('should refresh authentication status', async () => {
      mockApi.get
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: { authenticated: false, user: null }
          }
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: { authenticated: true, user: { _id: '123', username: 'test' } }
          }
        });

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      });

      fireEvent.click(screen.getByTestId('refresh-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      expect(mockApi.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should prevent multiple logout calls', async () => {
      // Start authenticated
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: { authenticated: true, user: { _id: '123', username: 'test' } }
        }
      });

      // Make logout slow to test prevention
      mockApi.post.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 1000))
      );

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Click logout multiple times quickly
      fireEvent.click(screen.getByTestId('logout-btn'));
      fireEvent.click(screen.getByTestId('logout-btn'));
      fireEvent.click(screen.getByTestId('logout-btn'));

      // Should only call logout once
      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle redirect failures gracefully', async () => {
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: { authenticated: false, user: null }
        }
      });

      mockPerformSafeRedirect.mockResolvedValue({
        success: false,
        reason: 'circuit_open',
        message: 'Too many redirects detected',
        retryAfter: 5000
      });

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      });

      fireEvent.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('error-status')).toContain('Too many redirects detected');
      });
    });
  });
});