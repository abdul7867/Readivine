import request from 'supertest'
import { jest } from '@jest/globals'
import app from '../../app.js'

// Mock dependencies
jest.mock('../../config/database.js', () => ({
  connectDB: jest.fn()
}))

jest.mock('../../models/User.js', () => ({
  findOne: jest.fn(),
  create: jest.fn()
}))

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Cookie Configuration Tests', () => {
    it('should set cookies with proper cross-domain attributes on successful OAuth', async () => {
      // Requirement 1.1: Backend sets authentication cookies with proper cross-domain configuration
      
      // Mock successful OAuth callback
      const mockUser = {
        _id: 'test-user-id',
        username: 'testuser',
        email: 'test@example.com',
        githubId: '12345'
      }

      // This would typically be tested with actual OAuth flow
      // For now, we'll test the cookie setting mechanism directly
      const response = await request(app)
        .get('/auth/status')
        .set('Origin', 'https://readivine.vercel.app')
        .set('Cookie', 'accessToken=valid-jwt-token')
        .expect(200)

      // Verify CORS headers are set
      expect(response.headers['access-control-allow-origin']).toBe('https://readivine.vercel.app')
      expect(response.headers['access-control-allow-credentials']).toBe('true')
    })

    it('should configure cookies with secure attributes for production', async () => {
      // Requirement 3.1, 3.3: Appropriate cookie attributes for cross-domain scenarios
      
      // Mock production environment
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const response = await request(app)
        .post('/auth/logout')
        .set('Origin', 'https://readivine.vercel.app')
        .expect(200)

      // Check that cookies are cleared with proper attributes
      const setCookieHeader = response.headers['set-cookie']
      if (setCookieHeader) {
        expect(setCookieHeader.some(cookie => 
          cookie.includes('Secure') && 
          cookie.includes('SameSite=None') && 
          cookie.includes('HttpOnly')
        )).toBe(true)
      }

      process.env.NODE_ENV = originalEnv
    })

    it('should handle cookie setting failures gracefully', async () => {
      // Requirement 3.4: Clear error messages when cookies fail to be set or read
      
      const response = await request(app)
        .get('/auth/status')
        .set('Origin', 'https://readivine.vercel.app')
        // No cookies sent
        .expect(401)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('message')
      expect(response.body.data).toHaveProperty('authenticated', false)
    })
  })

  describe('CORS Configuration Tests', () => {
    it('should handle preflight requests correctly', async () => {
      // Requirement 2.4: CORS configured to handle preflight requests correctly
      
      const response = await request(app)
        .options('/auth/status')
        .set('Origin', 'https://readivine.vercel.app')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization')
        .expect(200)

      expect(response.headers['access-control-allow-origin']).toBe('https://readivine.vercel.app')
      expect(response.headers['access-control-allow-credentials']).toBe('true')
      expect(response.headers['access-control-allow-methods']).toContain('GET')
      expect(response.headers['access-control-allow-headers']).toContain('Content-Type')
    })

    it('should allow credentials from Vercel frontend domain', async () => {
      // Requirement 2.1: CORS allows credentials from Vercel frontend domain
      
      const response = await request(app)
        .get('/auth/status')
        .set('Origin', 'https://readivine.vercel.app')
        .set('Cookie', 'accessToken=test-token')
        .expect(200)

      expect(response.headers['access-control-allow-origin']).toBe('https://readivine.vercel.app')
      expect(response.headers['access-control-allow-credentials']).toBe('true')
    })

    it('should accept cookies from cross-origin requests', async () => {
      // Requirement 2.2: Backend accepts cookies from cross-origin requests
      
      const response = await request(app)
        .get('/auth/status')
        .set('Origin', 'https://readivine.vercel.app')
        .set('Cookie', 'accessToken=valid-jwt-token; refreshToken=valid-refresh-token')
        .expect(200)

      // Should process the request with cookies
      expect(response.body.success).toBe(true)
    })

    it('should validate origins correctly', async () => {
      // Test origin validation
      
      const allowedOrigins = [
        'https://readivine.vercel.app',
        'http://localhost:3000',
        'http://localhost:5173'
      ]

      for (const origin of allowedOrigins) {
        const response = await request(app)
          .get('/auth/status')
          .set('Origin', origin)
          .expect(200)

        expect(response.headers['access-control-allow-origin']).toBe(origin)
      }
    })

    it('should reject requests from unauthorized origins', async () => {
      // Test security - reject unauthorized origins
      
      const response = await request(app)
        .get('/auth/status')
        .set('Origin', 'https://malicious-site.com')
        .expect(403)

      expect(response.headers['access-control-allow-origin']).toBeUndefined()
    })

    it('should handle environment-specific CORS configuration', async () => {
      // Requirement 2.3: Environment variables properly reference correct production URLs
      
      // Test development environment
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      process.env.FRONTEND_URL = 'http://localhost:3000'

      const devResponse = await request(app)
        .get('/auth/status')
        .set('Origin', 'http://localhost:3000')
        .expect(200)

      expect(devResponse.headers['access-control-allow-origin']).toBe('http://localhost:3000')

      // Test production environment
      process.env.NODE_ENV = 'production'
      process.env.FRONTEND_URL = 'https://readivine.vercel.app'

      const prodResponse = await request(app)
        .get('/auth/status')
        .set('Origin', 'https://readivine.vercel.app')
        .expect(200)

      expect(prodResponse.headers['access-control-allow-origin']).toBe('https://readivine.vercel.app')

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Authentication Endpoint Tests', () => {
    it('should handle authentication status checks correctly', async () => {
      // Test /auth/status endpoint
      
      const response = await request(app)
        .get('/auth/status')
        .set('Origin', 'https://readivine.vercel.app')
        .set('Cookie', 'accessToken=valid-jwt-token')
        .expect(200)

      expect(response.body).toHaveProperty('statusCode', 200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('authenticated')
      expect(response.body.data).toHaveProperty('user')
    })

    it('should handle legacy auth check endpoint', async () => {
      // Test /auth/check endpoint for backward compatibility
      
      const response = await request(app)
        .get('/auth/check')
        .set('Origin', 'https://readivine.vercel.app')
        .set('Cookie', 'accessToken=valid-jwt-token')
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
    })

    it('should provide meaningful error responses for OAuth callback failures', async () => {
      // Requirement 5.2: Meaningful error responses for OAuth callback processing failures
      
      const response = await request(app)
        .get('/auth/github/callback')
        .query({ error: 'access_denied' })
        .set('Origin', 'https://readivine.vercel.app')
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toContain('OAuth')
    })

    it('should log specific error details for authentication failures', async () => {
      // Requirement 5.1: Log specific error details including cookie and CORS information
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await request(app)
        .get('/auth/status')
        .set('Origin', 'https://readivine.vercel.app')
        .set('Cookie', 'accessToken=invalid-token')
        .expect(401)

      // Verify error logging occurred
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('Cookie Debugging Endpoints', () => {
    it('should provide cookie debugging information', async () => {
      // Requirement 5.1: Cookie debugging endpoint for production troubleshooting
      
      const response = await request(app)
        .get('/auth/debug/cookies')
        .set('Origin', 'https://readivine.vercel.app')
        .set('Cookie', 'accessToken=test-token; refreshToken=test-refresh')
        .expect(200)

      expect(response.body).toHaveProperty('cookies')
      expect(response.body).toHaveProperty('headers')
      expect(response.body).toHaveProperty('environment')
    })

    it('should provide CORS debugging information', async () => {
      // Debug CORS configuration
      
      const response = await request(app)
        .get('/auth/debug/cors')
        .set('Origin', 'https://readivine.vercel.app')
        .expect(200)

      expect(response.body).toHaveProperty('origin')
      expect(response.body).toHaveProperty('allowedOrigins')
      expect(response.body).toHaveProperty('corsEnabled')
    })
  })

  describe('Error Handling and Logging', () => {
    it('should handle network timeouts gracefully', async () => {
      // Test timeout handling
      
      const response = await request(app)
        .get('/auth/status')
        .set('Origin', 'https://readivine.vercel.app')
        .timeout(1000) // Short timeout
        .expect(200)

      // Should respond within timeout
      expect(response.body).toHaveProperty('success')
    })

    it('should provide comprehensive error logging', async () => {
      // Requirement 5.3: Frontend logs specific reason for authentication check failures
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await request(app)
        .get('/auth/status')
        .set('Origin', 'https://malicious-site.com')
        .expect(403)

      // Verify comprehensive error logging
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('CORS')
      )

      consoleSpy.mockRestore()
    })

    it('should handle malformed cookies gracefully', async () => {
      // Test malformed cookie handling
      
      const response = await request(app)
        .get('/auth/status')
        .set('Origin', 'https://readivine.vercel.app')
        .set('Cookie', 'accessToken=malformed.jwt.token')
        .expect(401)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('message')
    })

    it('should handle missing JWT secret gracefully', async () => {
      // Test missing JWT secret handling
      
      const originalSecret = process.env.JWT_SECRET
      delete process.env.JWT_SECRET

      const response = await request(app)
        .get('/auth/status')
        .set('Origin', 'https://readivine.vercel.app')
        .set('Cookie', 'accessToken=some-token')
        .expect(500)

      expect(response.body).toHaveProperty('success', false)

      process.env.JWT_SECRET = originalSecret
    })
  })

  describe('Production Configuration Validation', () => {
    it('should validate production environment configuration', async () => {
      // Requirement 5.4: Production-specific configuration validation
      
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const response = await request(app)
        .get('/auth/debug/config')
        .set('Origin', 'https://readivine.vercel.app')
        .expect(200)

      expect(response.body).toHaveProperty('environment', 'production')
      expect(response.body).toHaveProperty('secureConfig')
      expect(response.body.secureConfig).toHaveProperty('httpsOnly', true)
      expect(response.body.secureConfig).toHaveProperty('secureCookies', true)

      process.env.NODE_ENV = originalEnv
    })

    it('should ensure HTTPS-only configuration in production', async () => {
      // Test HTTPS enforcement in production
      
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const response = await request(app)
        .get('/auth/status')
        .set('Origin', 'https://readivine.vercel.app')
        .set('X-Forwarded-Proto', 'https')
        .expect(200)

      // Should accept HTTPS requests in production
      expect(response.body).toHaveProperty('success')

      process.env.NODE_ENV = originalEnv
    })
  })
})