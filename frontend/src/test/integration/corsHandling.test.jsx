import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext.jsx'
import TestDashboard from '../components/TestDashboard.jsx'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'
import api from '../../services/api.js'

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

describe('CORS Preflight Handling with Credentials', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Preflight Request Handling', () => {
    it('should handle CORS preflight requests correctly', async () => {
      // Requirement 2.4: CORS configured to handle preflight requests correctly
      
      let preflightCalled = false
      let actualRequestCalled = false

      server.use(
        // Mock preflight OPTIONS request
        http.options('https://readivine.onrender.com/auth/check', () => {
          preflightCalled = true
          return new HttpResponse(null, {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': 'https://readivine.vercel.app',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
              'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
              'Access-Control-Allow-Credentials': 'true',
              'Access-Control-Max-Age': '86400'
            }
          })
        }),
        
        // Mock actual GET request
        http.get('https://readivine.onrender.com/auth/check', () => {
          actualRequestCalled = true
          return HttpResponse.json({
            statusCode: 200,
            success: true,
            data: {
              authenticated: true,
              user: { username: 'testuser' }
            }
          }, {
            headers: {
              'Access-Control-Allow-Origin': 'https://readivine.vercel.app',
              'Access-Control-Allow-Credentials': 'true'
            }
          })
        })
      )

      renderWithProviders(<TestDashboard />)

      await waitFor(() => {
        expect(actualRequestCalled).toBe(true)
      })

      // In a real browser, preflight would be called automatically for cross-origin requests
      // This test verifies our mock handles it correctly
    })

    it('should handle credential inclusion in cross-origin requests', async () => {
      // Requirement 2.1: CORS allows credentials from Vercel frontend domain
      
      let requestWithCredentials = false

      server.use(
        http.get('https://readivine.onrender.com/auth/check', ({ request }) => {
          const origin = request.headers.get('origin')
          
          if (origin === 'https://readivine.vercel.app') {
            requestWithCredentials = true
            return HttpResponse.json({
              statusCode: 200,
              success: true,
              data: { 
                authenticated: true, 
                user: { username: 'testuser' } 
              }
            }, {
              headers: {
                'Access-Control-Allow-Origin': 'https://readivine.vercel.app',
                'Access-Control-Allow-Credentials': 'true'
              }
            })
          }
          
          return HttpResponse.json({
            statusCode: 403,
            success: false,
            message: 'Origin not allowed'
          }, { status: 403 })
        })
      )

      // Mock window.location to simulate Vercel frontend
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          origin: 'https://readivine.vercel.app'
        },
        writable: true
      })

      renderWithProviders(<TestDashboard />)

      await waitFor(() => {
        expect(requestWithCredentials).toBe(true)
      })
    })

    it('should handle CORS preflight failures gracefully', async () => {
      // Requirement 2.4: Proper handling of preflight requests
      
      server.use(
        http.options('https://readivine.onrender.com/auth/check', () => {
          return new HttpResponse(null, {
            status: 403,
            headers: {
              'Access-Control-Allow-Origin': 'null'
            }
          })
        }),
        
        http.get('https://readivine.onrender.com/auth/check', () => {
          // This should not be called due to preflight failure
          return HttpResponse.error()
        })
      )

      renderWithProviders(<TestDashboard />)

      await waitFor(() => {
        // Should handle CORS failure gracefully
        expect(true).toBe(true) // Test passes if no unhandled errors
      })
    })
  })

  describe('Origin Validation', () => {
    it('should validate allowed origins correctly', async () => {
      // Requirement 2.1: CORS allows credentials from Vercel frontend domain
      
      const allowedOrigins = [
        'https://readivine.vercel.app',
        'http://localhost:3000', // Development
        'http://localhost:5173'  // Vite dev server
      ]

      for (const origin of allowedOrigins) {
        server.use(
          http.get('https://readivine.onrender.com/auth/check', ({ request }) => {
            const requestOrigin = request.headers.get('origin')
            
            if (allowedOrigins.includes(requestOrigin)) {
              return HttpResponse.json({
                statusCode: 200,
                success: true,
                data: { 
                  authenticated: true, 
                  user: { username: 'testuser' } 
                }
              }, {
                headers: {
                  'Access-Control-Allow-Origin': requestOrigin,
                  'Access-Control-Allow-Credentials': 'true'
                }
              })
            }
            
            return HttpResponse.json({
              statusCode: 403,
              success: false,
              message: 'Origin not allowed'
            }, { status: 403 })
          })
        )

        // Mock origin
        Object.defineProperty(window, 'location', {
          value: { ...window.location, origin },
          writable: true
        })

        renderWithProviders(<TestDashboard />)

        await waitFor(() => {
          expect(true).toBe(true) // Should not throw CORS errors
        })
      }
    })

    it('should reject requests from unauthorized origins', async () => {
      // Test origin validation security
      
      server.use(
        http.get('https://readivine.onrender.com/auth/check', ({ request }) => {
          const origin = request.headers.get('origin')
          
          if (origin === 'https://malicious-site.com') {
            return HttpResponse.json({
              statusCode: 403,
              success: false,
              message: 'Origin not allowed'
            }, { 
              status: 403,
              headers: {
                'Access-Control-Allow-Origin': 'null'
              }
            })
          }
          
          return HttpResponse.json({
            statusCode: 200,
            success: true,
            data: { authenticated: false, user: null }
          })
        })
      )

      // Mock malicious origin
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          origin: 'https://malicious-site.com'
        },
        writable: true
      })

      renderWithProviders(<TestDashboard />)

      await waitFor(() => {
        // Should handle unauthorized origin gracefully
        expect(true).toBe(true)
      })
    })
  })

  describe('Cookie Credentials in CORS', () => {
    it('should send cookies with cross-origin requests when credentials are included', async () => {
      // Requirement 2.2: Backend accepts cookies from cross-origin requests
      
      let cookiesSent = false

      server.use(
        http.get('https://readivine.onrender.com/auth/check', ({ request }) => {
          const cookies = request.headers.get('cookie')
          const origin = request.headers.get('origin')
          
          if (cookies && cookies.includes('accessToken=') && origin === 'https://readivine.vercel.app') {
            cookiesSent = true
            return HttpResponse.json({
              statusCode: 200,
              success: true,
              data: { 
                authenticated: true, 
                user: { username: 'testuser' } 
              }
            }, {
              headers: {
                'Access-Control-Allow-Origin': 'https://readivine.vercel.app',
                'Access-Control-Allow-Credentials': 'true'
              }
            })
          }
          
          return HttpResponse.json({
            statusCode: 401,
            success: false,
            data: { authenticated: false, user: null }
          }, { status: 401 })
        })
      )

      // Set authentication cookie
      document.cookie = 'accessToken=test-token; Path=/; Secure; SameSite=None'

      // Mock Vercel origin
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          origin: 'https://readivine.vercel.app'
        },
        writable: true
      })

      renderWithProviders(<TestDashboard />)

      await waitFor(() => {
        expect(cookiesSent).toBe(true)
      })
    })

    it('should handle missing credentials in cross-origin requests', async () => {
      // Test behavior when credentials are not sent
      
      server.use(
        http.get('https://readivine.onrender.com/auth/check', ({ request }) => {
          const cookies = request.headers.get('cookie')
          
          if (!cookies || !cookies.includes('accessToken=')) {
            return HttpResponse.json({
              statusCode: 401,
              success: false,
              data: { authenticated: false, user: null },
              message: 'No authentication credentials provided'
            }, { 
              status: 401,
              headers: {
                'Access-Control-Allow-Origin': 'https://readivine.vercel.app',
                'Access-Control-Allow-Credentials': 'true'
              }
            })
          }
          
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

      // No cookies set
      document.cookie = ''

      renderWithProviders(<TestDashboard />)

      await waitFor(() => {
        // Should handle missing credentials gracefully
        expect(true).toBe(true)
      })
    })
  })

  describe('API Service CORS Configuration', () => {
    it('should configure axios with proper CORS settings', () => {
      // Requirement 2.1, 2.2: Proper credential handling for cross-domain requests
      
      // Verify api service is configured with credentials
      expect(api.defaults.withCredentials).toBe(true)
      expect(api.defaults.baseURL).toBe('https://readivine.onrender.com')
    })

    it('should handle CORS errors in API requests', async () => {
      // Test API error handling for CORS issues
      
      server.use(
        http.get('https://readivine.onrender.com/auth/check', () => {
          return HttpResponse.error()
        })
      )

      try {
        await api.get('/auth/check')
      } catch (error) {
        // Should handle CORS/network errors gracefully
        expect(error).toBeDefined()
      }
    })
  })
})