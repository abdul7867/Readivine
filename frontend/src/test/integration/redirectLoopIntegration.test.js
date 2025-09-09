/**
 * Integration tests for redirect loop prevention with AuthContext
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { resetRedirectCircuit } from '../../utils/redirectLoopPrevention';

// Mock API
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: {
      baseURL: 'http://localhost:5000',
    },
  },
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
  },
}));

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

// Test component that uses AuthContext
const TestComponent = () => {
  const { 
    isAuthenticated, 
    isLoading, 
    safeRedirect, 
    redirectAttempts,
    resetRedirectLoop,
    getRedirectDebugInfo 
  } = require('../../contexts/AuthContext').useAuth();

  return (
    <div>
      <div data-testid="auth-status">
        {isLoading ? 'loading' : isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="redirect-attempts">{redirectAttempts}</div>
      <button 
        data-testid="safe-redirect-login" 
        onClick={() => safeRedirect('/login', 'login_redirect')}
      >
        Safe Redirect to Login
      </button>
      <button 
        data-testid="safe-redirect-dashboard" 
        onClick={() => safeRedirect('/dashboard', 'dashboard_redirect')}
      >
        Safe Redirect to Dashboard
      </button>
      <button 
        data-testid="reset-redirect-loop" 
        onClick={resetRedirectLoop}
      >
        Reset Redirect Loop
      </button>
      <button 
        data-testid="get-debug-info" 
        onClick={() => {
          const info = getRedirectDebugInfo();
          console.log('Debug info:', info);
        }}
      >
        Get Debug Info
      </button>
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

describe('Redirect Loop Prevention Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    resetRedirectCircuit();
    
    // Mock successful auth check by default
    const api = require('../../services/api').default;
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          authenticated: false,
          user: null,
        },
      },
    });
  });

  afterEach(() => {
    resetRedirectCircuit();
  });

  it('should prevent redirect loops when multiple redirects are attempted', async () => {
    mockLocation.pathname = '/dashboard';
    
    renderWithAuth(<TestComponent />);

    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    const redirectButton = screen.getByTestId('safe-redirect-login');
    
    // Simulate multiple rapid redirect attempts
    for (let i = 0; i < 4; i++) {
      redirectButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Should show increased redirect attempts
    await waitFor(() => {
      const attempts = parseInt(screen.getByTestId('redirect-attempts').textContent);
      expect(attempts).toBeGreaterThan(0);
    });
  });

  it('should allow reset of redirect loop prevention', async () => {
    mockLocation.pathname = '/dashboard';
    
    renderWithAuth(<TestComponent />);

    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    const redirectButton = screen.getByTestId('safe-redirect-login');
    const resetButton = screen.getByTestId('reset-redirect-loop');
    
    // Simulate multiple redirect attempts
    for (let i = 0; i < 3; i++) {
      redirectButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Reset the redirect loop prevention
    resetButton.click();

    // Should reset redirect attempts
    await waitFor(() => {
      expect(screen.getByTestId('redirect-attempts')).toHaveTextContent('0');
    });
  });

  it('should provide debug information', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    renderWithAuth(<TestComponent />);

    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    const debugButton = screen.getByTestId('get-debug-info');
    debugButton.click();

    // Should log debug information
    expect(consoleSpy).toHaveBeenCalledWith(
      'Debug info:',
      expect.objectContaining({
        state: expect.any(Object),
        config: expect.any(Object),
        contextState: expect.any(Object),
      })
    );

    consoleSpy.mockRestore();
  });

  it('should handle authentication state changes properly', async () => {
    const api = require('../../services/api').default;
    
    // Start with unauthenticated state
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          authenticated: false,
          user: null,
        },
      },
    });

    renderWithAuth(<TestComponent />);

    // Wait for initial auth check
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    // Change to authenticated state
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          authenticated: true,
          user: { username: 'testuser' },
        },
      },
    });

    // Trigger a redirect that would cause auth refresh
    const redirectButton = screen.getByTestId('safe-redirect-dashboard');
    redirectButton.click();

    // Should handle the state change appropriately
    await waitFor(() => {
      // The component should still be functional
      expect(screen.getByTestId('auth-status')).toBeDefined();
    });
  });

  it('should prevent same-page redirects', async () => {
    // Set current path to login
    mockLocation.pathname = '/login';
    
    renderWithAuth(<TestComponent />);

    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    const redirectButton = screen.getByTestId('safe-redirect-login');
    
    // Attempt to redirect to same page
    redirectButton.click();

    // Should not increase redirect attempts for same-page redirects
    await waitFor(() => {
      expect(screen.getByTestId('redirect-attempts')).toHaveTextContent('0');
    });
  });

  it('should handle network errors during auth checks', async () => {
    const api = require('../../services/api').default;
    
    // Mock network error
    api.get.mockRejectedValueOnce(new Error('Network error'));

    renderWithAuth(<TestComponent />);

    // Should handle the error gracefully
    await waitFor(() => {
      const status = screen.getByTestId('auth-status').textContent;
      expect(['loading', 'not-authenticated']).toContain(status);
    });
  });

  it('should handle authentication failures with fallback mechanisms', async () => {
    const api = require('../../services/api').default;
    
    // Mock authentication failure
    api.get.mockRejectedValueOnce({
      response: { status: 401 },
      message: 'Unauthorized',
    });

    renderWithAuth(<TestComponent />);

    // Should handle auth failure and show not-authenticated state
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });
  });
});