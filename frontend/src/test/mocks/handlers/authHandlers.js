import { http, HttpResponse } from 'msw'

const BACKEND_URL = 'http://localhost:8080/api/v1'

export const authHandlers = [
  // Mock auth status check
  http.get(`${BACKEND_URL}/auth/status`, ({ request }) => {
    const cookies = request.headers.get('cookie') || ''
    const hasAuthCookie = cookies.includes('accessToken=')
    
    if (hasAuthCookie) {
      return HttpResponse.json({
        statusCode: 200,
        success: true,
        data: {
          authenticated: true,
          user: {
            _id: 'test-user-id',
            username: 'testuser',
            email: 'test@example.com',
            avatarUrl: 'https://github.com/testuser.png',
            githubId: '12345'
          }
        },
        message: 'User is authenticated'
      })
    }
    
    return HttpResponse.json({
      statusCode: 401,
      success: false,
      data: {
        authenticated: false,
        user: null
      },
      message: 'User is not authenticated'
    }, { status: 401 })
  }),

  // Mock auth check (legacy endpoint)
  http.get(`${BACKEND_URL}/auth/check`, ({ request }) => {
    const cookies = request.headers.get('cookie') || ''
    const hasAuthCookie = cookies.includes('accessToken=')
    
    if (hasAuthCookie) {
      return HttpResponse.json({
        statusCode: 200,
        success: true,
        data: {
          _id: 'test-user-id',
          username: 'testuser',
          email: 'test@example.com',
          avatarUrl: 'https://github.com/testuser.png',
          githubId: '12345'
        },
        message: 'User is authenticated'
      })
    }
    
    return HttpResponse.json({
      statusCode: 401,
      success: false,
      data: null,
      message: 'User is not authenticated'
    }, { status: 401 })
  }),

  // Mock logout
  http.post(`${BACKEND_URL}/auth/logout`, () => {
    return HttpResponse.json({
      statusCode: 200,
      success: true,
      data: null,
      message: 'Logged out successfully'
    }, {
      headers: {
        'Set-Cookie': 'accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None'
      }
    })
  }),

  // Mock CORS preflight
  http.options(`${BACKEND_URL}/*`, () => {
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

  // Mock network error scenarios
  http.get(`${BACKEND_URL}/auth/status-error`, () => {
    return HttpResponse.error()
  }),

  // Mock timeout scenarios
  http.get(`${BACKEND_URL}/auth/status-timeout`, () => {
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
]