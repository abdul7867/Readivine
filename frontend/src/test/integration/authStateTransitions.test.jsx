import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '../../contexts/AuthContext.jsx'
import TestDashboard from '../components/TestDashboard.jsx'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

// Test component to access auth context
const AuthTestComponent = () => {
  const { user, isAuthenticated, isLoading, logout, error } = useAuth()
  
  return (
    <div>
      <div data-testid="auth-status">
        {isLoading ? 'loading' : isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="user-info">
        {user ? `User: ${user.username}` : 'No user'}
      </div>
      <div data-testid="error-info">
        {error ? `Error: ${error}` : 'No error'}
      </div>
      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
    </div>
  )
}

// Helper to render component with providers
const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Authentication State Transitions and Error Handling', () => {
  beforeEach(() => {
    document.cookie = ''
    vi.clearAllMocks()
  })

  describe('Authentication State Management', () => {
    it('should handle authentication state transitions correctly', async () => {
      // Requirement 4.1: Handle both cookie-based and header-based authentication
      
      server.use(
        http.get('https://readivine.onrender.com/auth/check', () => {
          return HttpResponse.json({
            statusCode: 200,
            success: true,
            data: {
              authenticated: true,
              user: {
                _id: 'test-user-id',
                username: 'testuser',
                email: 'test@example.com',
                avatarUrl: 'https://github.com/testuser.png'
              }
            }
          })
        })
      )

      renderWithProviders(<AuthTestComponent />)

      // Initial loading state
      expect(screen.getByTestId('auth-status')).toHaveTextContent('loading')

      // Wait for authentication check to complete
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      })

      expect(screen.getByTestId('user-info')).toHaveTextContent('User: testuser')
      expect(screen.getByTestId('error-info')).toHaveTextContent('No error')
    })

    it('should handle unauthenticated state correctly', async () => {
      // Requirement 4.3: Distinguish between "not authenticated" and "authentication error" states
      
      server.use(
        http.get('https://readivine.onrender.com/auth/check', () => {
          return HttpResponse.json({
            statusCode: 401,
            success: false,
            data: {
              authenticated: false,
              user: null
            },
            message: 'User is not authenticated'
          }, { status: 401 })
        })
      )

      renderWithProviders(<AuthTestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
      })

      expect(screen.getByTestId('user-info')).toHaveTextContent('No user')
      expect(screen.getByTestId('error-info')).toHaveTextContent('No error')
    })

    it('should make explicit API call to verify status when uncertain', async () => {
      // Requirement 4.2: Make explicit API call to verify status when authentication state is uncertain
      
      let apiCallCount = 0

      server.use(
        http.get('https://readivine.onrender.com/auth/check', () => {
          apiCallCount++
          return HttpResponse.json({
            statusCode: 200,
            success: true,
            data: {
              authenticated: true,
              user: { username: 'testuser' }
            }
          })
        })
      )

      renderWithProviders(<AuthTestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      })

      // Verify API was called to check authentication
      expect(apiCallCount).toBeGreaterThan(0)
    })

    it('should verify authentication before rendering protected content', async () => {
      // Requirement 4.4: Dashboard component verifies authentication before rendering protected content
      
      let authCheckCalled = false

      server.use(
        http.get('https://readivine.onrender.com/auth/check', () => {
          authCheckCalled = true
          return HttpResponse.json({
            statusCode: 200,
            success: true,
            data: {
              authenticated: true,
              user: { username: 'testuser' }
            }
          })
        })
      )

      renderWithProviders(<TestDashboard />)

      await waitFor(() => {
        expect(authCheckCalled).toBe(true)
      })

      // Should not show login page for authenticated user
      expect(screen.queryByText(/Please login/i)).not.toBeInTheDocument()
    })
  })

  describe('Error Handling and Distinction', () => {
    it('should distinguish between authentication failures and network errors', async () => {
      // Requirement 4.3: Distinguish between "not authenticated" and "authentication error" states
      
      // First test: Network error
      server.use(
        http.get('https://readivine.onrender.com/auth/check', () => {
          return HttpResponse.error()
        })
      )

      const { rerender } = renderWithProviders(<AuthTestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('error-info')).toHaveTextContent('Error:')
      })

      // Second test: Authentication failure (401)
      server.use(
        http.get('https://readivine.onrender.com/auth/check', () => {
          return HttpResponse.json({
            statusCode: 401,
            success: false,
            data: { authenticated: false, user: null },
            message: 'Not authenticated'
          }, { status: 401 })
        })
      )

      rerender(
        <BrowserRouter>
          <AuthProvider>
            <AuthTestComponent />
          </AuthProvider>
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
        expect(screen.getByTestId('error-info')).toHaveTextContent('No error')
      })
    })

    it('should handle server errors (5xx) differently from auth failures', async () => {
      // Test server error handling
      
      server.use(
        http.get('https://readivine.onrender.com/auth/check', () => {
          return HttpResponse.json({
            statusCode: 500,
            success: false,
            message: 'Internal server error'
          }, { status: 500 })
        })
      )

      renderWithProviders(<AuthTestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('error-info')).toHaveTextContent('Error:')
      })
    })

    it('should handle timeout errors gracefully', async () => {
      // Test timeout handling
      
      server.use(
        http.get('https://readivine.onrender.com/auth/check', () => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(HttpResponse.json({
                statusCode: 408,
                success: false,
                message: 'Request timeout'
              }, { status: 408 }))
            }, 35000) // Longer than typical timeout
          })
        })
      )

      renderWithProviders(<AuthTestComponent />)

      await waitFor(() => {
        // Should handle timeout gracefully
        expect(screen.getByTestId('auth-status')).not.toHaveTextContent('loading')
      }, { timeout: 10000 })
    })
  })

  describe('Logout Flow', () => {
    it('should handle logout state transition correctly', async () => {
      // Test logout functionality
      
      // Initial authenticated state
      server.use(
        http.get('https://readivine.onrender.com/auth/check', () => {
          return HttpResponse.json({
            statusCode: 200,
            success: true,
            data: {
              authenticated: true,
              user: { username: 'testuser' }
            }
          })
        }),
        
        http.post('https://readivine.onrender.com/auth/logout', () => {
          return HttpResponse.json({
            statusCode: 200,
            success: true,
            message: 'Logged out successfully'
          }, {
            headers: {
              'Set-Cookie': 'accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
            }
          })
        })
      )

      const user = userEvent.setup()
      renderWithProviders(<AuthTestComponent />)

      // Wait for initial authentication
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      })

      // Mock logout response
      server.use(
        http.get('https://readivine.onrender.com/auth/check', () => {
          return HttpResponse.json({
            statusCode: 401,
            success: false,
            data: { authenticated: false, user: null }
          }, { status: 401 })
        })
      )

      // Perform logout
      await user.click(screen.getByTestId('logout-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
        expect(screen.getByTestId('user-info')).toHaveTextContent('No user')
      })
    })

    it('should handle logout errors gracefully', async () => {
      // Test logout error handling
      
      server.use(
        http.get('https://readivine.onrender.com/auth/check', () => {
          return HttpResponse.json({
            statusCode: 200,
            success: true,
            data: {
              authenticated: true,
              user: { username: 'testuser' }
            }
          })
        }),
        
        http.post('https://readivine.onrender.com/auth/logout', () => {
          return HttpResponse.json({
            statusCode: 500,
            success: false,
            message: 'Logout failed'
          }, { status: 500 })
        })
      )

      const user = userEvent.setup()
      renderWithProviders(<AuthTestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      })

      await user.click(screen.getByTestId('logout-btn'))

      // Should handle logout error but still clear local state
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
      })
    })
  })

  describe('Redirect Loop Prevention', () => {
    it('should prevent infinite authentication redirects', async () => {
      // Test redirect loop prevention mechanism
      
      let redirectCount = 0
      const originalReplace = window.location.replace
      
      window.location.replace = vi.fn((url) => {
        redirectCount++
        if (redirectCount > 3) {
          throw new Error('Too many redirects detected')
        }
      })

      server.use(
        http.get('https://readivine.onrender.com/auth/check', () => {
          return HttpResponse.json({
            statusCode: 401,
            success: false,
            data: { authenticated: false, user: null }
          }, { status: 401 })
        })
      )

      renderWithProviders(<TestDashboard />)

      await waitFor(() => {
        // Should not cause infinite redirects
        expect(redirectCount).toBeLessThan(3)
      })

      window.location.replace = originalReplace
    })

    it('should handle authentication state validation before redirects', async () => {
      // Test authentication validation before performing redirects
      
      let validationCalled = false

      server.use(
        http.get('https://readivine.onrender.com/auth/check', () => {
          validationCalled = true
          return HttpResponse.json({
            statusCode: 200,
            success: true,
            data: {
              authenticated: true,
              user: { username: 'testuser' }
            }
          })
        })
      )

      renderWithProviders(<TestDashboard />)

      await waitFor(() => {
        expect(validationCalled).toBe(true)
      })

      // Should not redirect authenticated users
      expect(window.location.replace).not.toHaveBeenCalled()
    })
  })
})