# Cross-Domain Authentication Configuration

This guide explains how to configure cross-domain authentication for Readivine when the frontend and backend are deployed on different domains (e.g., Vercel frontend + Render backend).

## Overview

Cross-domain authentication presents unique challenges due to browser security policies. This guide covers the specific configuration needed to make OAuth authentication work seamlessly across domains.

## Architecture

```
┌─────────────────────┐         ┌─────────────────────┐
│   Frontend          │         │   Backend           │
│   (Vercel)          │         │   (Render)          │
│                     │         │                     │
│ readivine.vercel.app│◄──────►│readivine.onrender.com│
│                     │  HTTPS  │                     │
│ - React App         │         │ - Express API       │
│ - Static Assets     │         │ - OAuth Handlers    │
│ - Client-side Auth  │         │ - Cookie Management │
└─────────────────────┘         └─────────────────────┘
          │                               │
          │        OAuth Flow             │
          ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│   GitHub OAuth      │         │   MongoDB Atlas     │
│                     │         │                     │
│ - User Authorization│         │ - User Data         │
│ - Callback Handling │         │ - Session Storage   │
└─────────────────────┘         └─────────────────────┘
```

## Browser Security Considerations

### Same-Origin Policy

Browsers enforce the same-origin policy, which restricts how documents or scripts from one origin can interact with resources from another origin. For authentication cookies to work across domains, specific configuration is required.

### Cookie Security

Cross-domain cookies must be configured with specific attributes:
- `SameSite=None`: Allows cookies to be sent in cross-site requests
- `Secure=true`: Requires HTTPS (mandatory when SameSite=None)
- `HttpOnly=true`: Prevents JavaScript access (security best practice)

## Backend Configuration

### CORS Setup

Configure CORS to allow credentials from your frontend domain:

```javascript
// app.js
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      ...(process.env.ADDITIONAL_CORS_ORIGINS?.split(',') || [])
    ].filter(Boolean);
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Critical for cross-domain cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));
```

### Cookie Configuration

Configure cookies for cross-domain authentication:

```javascript
// auth.Controller.js
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction, // HTTPS required in production
    sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-domain
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    // Don't set domain for cross-origin cookies
  };
};

// Set authentication cookies
res.cookie('accessToken', accessToken, getCookieOptions());
res.cookie('refreshToken', refreshToken, getCookieOptions());
```

### Environment Variables

```bash
# Backend environment variables for cross-domain
NODE_ENV=production
CORS_ORIGIN=https://readivine.vercel.app
FRONTEND_URL=https://readivine.vercel.app
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
COOKIE_HTTP_ONLY=true
```

## Frontend Configuration

### API Client Setup

Configure Axios to send credentials with requests:

```javascript
// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Critical for cross-domain cookies
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.VITE_DEBUG_MODE === 'true') {
      console.log('API Request:', config);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle authentication errors
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Authentication Context

Handle authentication state with proper error handling:

```javascript
// AuthContext.jsx
const checkAuthStatus = async () => {
  try {
    setIsLoading(true);
    const response = await api.get('/auth/status');
    
    if (response.data.success && response.data.data.authenticated) {
      setUser(response.data.data.user);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    setUser(null);
    setIsAuthenticated(false);
    
    // Don't redirect on network errors, only on 401
    if (error.response?.status === 401) {
      // User is not authenticated
    } else {
      // Network or server error - handle gracefully
      console.warn('Authentication check failed due to network error');
    }
  } finally {
    setIsLoading(false);
    setHasCheckedAuth(true);
  }
};
```

### Environment Variables

```bash
# Frontend environment variables for cross-domain
VITE_API_BASE_URL=https://readivine.onrender.com/api/v1
VITE_WITH_CREDENTIALS=true
VITE_DEBUG_MODE=false
VITE_NODE_ENV=production
```

## OAuth Flow Configuration

### GitHub OAuth App Setup

Configure your GitHub OAuth application for cross-domain:

1. **Homepage URL**: `https://readivine.vercel.app`
2. **Authorization callback URL**: `https://readivine.onrender.com/api/v1/auth/github/callback`

### OAuth Flow Steps

1. **User clicks login** → Frontend redirects to backend OAuth endpoint
2. **Backend redirects to GitHub** → User authorizes application
3. **GitHub redirects to backend** → Backend processes OAuth callback
4. **Backend sets cookies** → Cookies configured for cross-domain
5. **Backend redirects to frontend** → User lands on dashboard
6. **Frontend checks auth** → API call with credentials to verify authentication

## Testing Cross-Domain Authentication

### Manual Testing

1. **Clear cookies** in browser dev tools
2. **Visit frontend** → Should show login page
3. **Click login** → Should redirect to GitHub
4. **Authorize app** → Should redirect back to dashboard
5. **Check cookies** → Should see httpOnly cookies set
6. **Refresh page** → Should remain authenticated

### Automated Testing

```javascript
// Test cross-domain cookie handling
describe('Cross-Domain Authentication', () => {
  test('should maintain authentication across domains', async () => {
    // Simulate OAuth flow
    const response = await request(app)
      .get('/api/v1/auth/github/callback')
      .query({ code: 'test-code' })
      .expect(302);
    
    // Check cookies are set
    expect(response.headers['set-cookie']).toBeDefined();
    
    // Verify cookie attributes
    const cookies = response.headers['set-cookie'];
    expect(cookies.some(cookie => cookie.includes('SameSite=None'))).toBe(true);
    expect(cookies.some(cookie => cookie.includes('Secure'))).toBe(true);
  });
});
```

## Common Issues and Solutions

### Issue: Cookies Not Being Set

**Symptoms:**
- User completes OAuth but isn't authenticated
- No cookies visible in browser dev tools

**Solutions:**
1. Ensure `COOKIE_SECURE=true` in production
2. Verify `COOKIE_SAME_SITE=none` for cross-domain
3. Check both domains use HTTPS
4. Confirm `withCredentials: true` in frontend API calls

### Issue: CORS Preflight Failures

**Symptoms:**
- Network errors in browser console
- "CORS policy" error messages

**Solutions:**
1. Verify `CORS_ORIGIN` matches frontend URL exactly
2. Ensure `credentials: true` in CORS configuration
3. Check `OPTIONS` method is allowed
4. Confirm `Access-Control-Allow-Credentials` header is sent

### Issue: Authentication State Not Persisting

**Symptoms:**
- User appears logged in but loses authentication on refresh
- Intermittent authentication failures

**Solutions:**
1. Check cookie expiration times
2. Verify cookie path is set to '/'
3. Ensure authentication check API endpoint works
4. Confirm error handling doesn't clear auth state unnecessarily

### Issue: Redirect Loops

**Symptoms:**
- User gets stuck in login/dashboard redirect loop
- Multiple redirects in network tab

**Solutions:**
1. Implement proper authentication state checking
2. Add loading states to prevent premature redirects
3. Use circuit breaker pattern for authentication checks
4. Ensure OAuth callback sets cookies before redirecting

## Security Considerations

### Cookie Security

1. **HttpOnly**: Prevents XSS attacks by making cookies inaccessible to JavaScript
2. **Secure**: Ensures cookies are only sent over HTTPS
3. **SameSite=None**: Required for cross-domain but increases CSRF risk
4. **Path**: Limit cookie scope to necessary paths

### CORS Security

1. **Explicit Origins**: Never use wildcards (*) with credentials
2. **Origin Validation**: Validate origins against whitelist
3. **Preflight Handling**: Properly handle OPTIONS requests
4. **Header Restrictions**: Limit allowed headers to necessary ones

### Additional Security Measures

1. **CSRF Protection**: Implement CSRF tokens for state-changing operations
2. **Rate Limiting**: Prevent brute force attacks on authentication endpoints
3. **Input Validation**: Validate all inputs on both frontend and backend
4. **Error Handling**: Don't expose sensitive information in error messages

## Performance Considerations

### Preflight Optimization

```javascript
// Cache preflight responses
app.use(cors({
  // ... other options
  maxAge: 86400, // Cache preflight for 24 hours
}));
```

### Cookie Optimization

```javascript
// Minimize cookie size
const cookieOptions = {
  // ... other options
  maxAge: 7 * 24 * 60 * 60 * 1000, // Reasonable expiration
  // Don't include unnecessary data in cookies
};
```

## Monitoring and Debugging

### Backend Logging

```javascript
// Log CORS and cookie issues
app.use((req, res, next) => {
  console.log('Origin:', req.headers.origin);
  console.log('Cookies:', req.headers.cookie);
  console.log('Method:', req.method);
  next();
});
```

### Frontend Debugging

```javascript
// Debug authentication state
const debugAuth = () => {
  console.log('Auth State:', {
    isAuthenticated,
    user,
    hasCheckedAuth,
    cookies: document.cookie
  });
};
```

### Production Monitoring

1. **Error Tracking**: Monitor authentication failures
2. **Performance Metrics**: Track authentication flow performance
3. **Security Alerts**: Alert on unusual authentication patterns
4. **Cookie Analytics**: Monitor cookie acceptance rates

## Best Practices Summary

1. **Always use HTTPS** in production for both domains
2. **Configure cookies properly** for cross-domain scenarios
3. **Implement proper CORS** with explicit origin validation
4. **Handle errors gracefully** to prevent authentication loops
5. **Test thoroughly** across different browsers and scenarios
6. **Monitor authentication flows** for issues and performance
7. **Keep security in mind** when configuring cross-domain settings
8. **Document configuration** for team members and future maintenance