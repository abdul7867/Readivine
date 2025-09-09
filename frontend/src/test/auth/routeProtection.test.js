import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';

// Mock all the page components
vi.mock('../../pages/LoginPage', () => ({
  default: () => <div data-testid="login-page">Login Page</div>
}));

vi.mock('../../pages/DashboardPage', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard Page</div>
}));

vi.mock('../../pages/DebugPage', () => ({
  default: () => <div data-testid="debug-page">Debug Page</div>
}));

vi.mock('../../components/LoadingSpinner', () => ({
  default: ({ message }) => <div data-testid="loading-spinner">{message}</div>
}));

vi.mock('../../components/ErrorBoundary', () => ({
  default: ({ children }) => <div data-testid="error-boundary">{children}</div>
}));

vi.mock('../../components/AuthDebugPanel', () => ({
  default: () => <div data-testid="auth-debug-panel">Debug Panel</div>
}));

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
  },
  Toaster: () => <div data-testid="toaster">Toaster</div>
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

const renderAppWithRoute = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>
  );
};

describe('Route Protection', () => {
  let mockApi;
  let mockPerformSafeRedirect;
  
  beforeEach(() => {
    mockApi = vi.mocked(require('../../services/api')).default;
    mockPerformSafeRedirect = vi.mocked(require('../../utils/redirectLoopPrevention')).performSafeRedirect;
    
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

  describe('Unauthenticated User Access', () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: { authenticated: false, user: null }
        }
      });
    });

    it('should redirect unauthenticated user from dashboard to login', async () => {
      renderAppWithRoute('/dashboard');

      // Should show loading initially
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Wait for auth check and redirect
      await waitFor(() => {
        expect(mockPerformSafeRedirect).toHaveBeenCalledWith(
          'auth_check',
          '/login',
          expect.any(Object)
        );
      });
    });

    it('should allow unauthenticated user to access login page', async () => {
      renderAppWithRoute('/login');

      // Should show loading initially
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Wait for auth check to complete
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPerformSafeRedirect).not.toHaveBeenCalled();
    });

    it('should redirect unauthenticated user from root to login', async () => {
      renderAppWithRoute('/');

      // Should show loading initially
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Wait for auth check to complete and navigation to occur
      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/auth/check');
      });

      // Should navigate to login (handled by Navigate component)
      // The Navigate component will handle the redirect, not our safe redirect
    });

    it('should redirect unauthenticated user from unknown route to login', async () => {
      renderAppWithRoute('/unknown-route');

      // Should show loading initially
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Wait for auth check to complete
      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/auth/check');
      });

      // Should navigate to login (handled by Navigate component)
    });
  });

  describe('Authenticated User Access', () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: { 
            authenticated: true, 
            user: { _id: '123', username: 'testuser', email: 'test@example.com' }
          }
        }
      });
    });

    it('should allow authenticated user to access dashboard', async () => {
      renderAppWithRoute('/dashboard');

      // Should show loading initially
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Wait for auth check to complete
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPerformSafeRedirect).not.toHaveBeenCalled();
    });

    it('should redirect authenticated user from login to dashboard', async () => {
      renderAppWithRoute('/login');

      // Should show loading initially
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Wait for auth check and redirect
      await waitFor(() => {
        expect(mockPerformSafeRedirect).toHaveBeenCalledWith(
          'dashboard_redirect',
          '/dashboard',
          expect.any(Object)
        );
      });
    });

    it('should redirect authenticated user from root to dashboard', async () => {
      renderAppWithRoute('/');

      // Should show loading initially
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Wait for auth check to complete
      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/auth/check');
      });

      // Should navigate to dashboard (handled by Navigate component)
    });
  });

  describe('Authentication Loading States', () => {
    it('should show loading spinner during initial auth check', async () => {
      // Make API call hang to test loading state
      mockApi.get.mockImplementation(() => new Promise(() => {}));

      renderAppWithRoute('/dashboard');

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toHaveTextContent('Checking authentication...');
    });

    it('should show retry attempt in loading message', async () => {
      const networkError = new Error('Network Error');
      networkError.code = 'NETWORK_ERROR';
      
      mockApi.get
        .mockRejectedValueOnce(networkError)
        .mockImplementation(() => new Promise(() => {})); // Hang on retry

      renderAppWithRoute('/dashboard');

      // Wait for retry to start
      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toHaveTextContent('Checking authentication... (attempt 2)');
      }, { timeout: 2000 });
    });
  });

  describe('Error Handling', () => {
    it('should show error UI for authentication check failures', async () => {
      const serverError = new Error('Server Error');
      serverError.response = { status: 500 };
      
      mockApi.get.mockRejectedValue(serverError);

      renderAppWithRoute('/dashboard');

      await waitFor(() => {
        expect(screen.getByText('Authentication Check Failed')).toBeInTheDocument();
        expect(screen.getByText('Retry Authentication Check')).toBeInTheDocument();
      });
    });

    it('should show redirect loop error UI', async () => {
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: { authenticated: false, user: null }
        }
      });

      // Mock redirect loop error
      mockPerformSafeRedirect.mockResolvedValue({
        success: false,
        reason: 'circuit_open',
        message: 'Too many redirects detected. Please wait 300 seconds before trying again.',
        retryAfter: 300000
      });

      renderAppWithRoute('/dashboard');

      // Wait for the error to be set
      await waitFor(() => {
        expect(screen.getByText('Redirect Loop Detected')).toBeInTheDocument();
        expect(screen.getByText('Reset and Try Again')).toBeInTheDocument();
      });
    });
  });

  describe('Debug Route', () => {
    it('should allow access to debug route regardless of auth status', async () => {
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: { authenticated: false, user: null }
        }
      });

      renderAppWithRoute('/debug');

      await waitFor(() => {
        expect(screen.getByTestId('debug-page')).toBeInTheDocument();
      });
    });
  });
});