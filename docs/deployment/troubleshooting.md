# Deployment Troubleshooting Guide

This guide covers common issues encountered during deployment and their solutions, with specific focus on cross-domain authentication problems.

## Quick Diagnosis

Use this checklist to quickly identify the type of issue you're experiencing:

- [ ] **Build/Deploy Issues**: App fails to build or deploy
- [ ] **Connection Issues**: Frontend can't reach backend
- [ ] **Authentication Issues**: OAuth flow fails or doesn't persist
- [ ] **CORS Issues**: Cross-origin request errors
- [ ] **Cookie Issues**: Authentication cookies not working
- [ ] **Environment Issues**: Configuration problems

## Build and Deployment Issues

### Backend Build Failures

#### Issue: npm install fails
```
Error: Cannot resolve dependency
```

**Solutions:**
1. Delete `node_modules` and `package-lock.json`, then reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Check Node.js version compatibility in `package.json`
3. Verify all dependencies are listed in `package.json`

#### Issue: Build timeout on Render
```
Build exceeded time limit
```

**Solutions:**
1. Optimize dependencies - remove unused packages
2. Use `.nvmrc` file to specify Node.js version
3. Consider upgrading Render plan for more build time

#### Issue: Environment variables not loading
```
Error: Missing required environment variable
```

**Solutions:**
1. Verify all variables are set in Render dashboard
2. Check variable names match exactly (case-sensitive)
3. Ensure no trailing spaces in variable values
4. Use the validation script: `node scripts/validate-config.js`

### Frontend Build Failures

#### Issue: Vite build fails
```
Error: Failed to resolve import
```

**Solutions:**
1. Check all import paths are correct
2. Verify file extensions are included where needed
3. Ensure all dependencies are installed
4. Check for circular dependencies

#### Issue: Environment variables not available
```
import.meta.env.VITE_API_BASE_URL is undefined
```

**Solutions:**
1. Ensure variables start with `VITE_`
2. Set variables in Vercel dashboard
3. Redeploy after adding variables
4. Check variables are set for correct environment (production/preview)

## Connection Issues

### Frontend Can't Reach Backend

#### Issue: Network errors in browser console
```
Failed to fetch
net::ERR_CONNECTION_REFUSED
```

**Diagnosis:**
```bash
# Test backend directly
curl https://your-backend.onrender.com/api/v1/health

# Check DNS resolution
nslookup your-backend.onrender.com
```

**Solutions:**
1. Verify backend is running and accessible
2. Check `VITE_API_BASE_URL` is correct
3. Ensure backend URL uses HTTPS
4. Verify Render service is not sleeping (free tier limitation)

#### Issue: SSL/TLS errors
```
SSL_ERROR_BAD_CERT_DOMAIN
```

**Solutions:**
1. Ensure both frontend and backend use HTTPS
2. Check SSL certificates are valid
3. Verify domain names match certificates
4. Wait for DNS propagation (up to 48 hours)

## Authentication Issues

### OAuth Flow Failures

#### Issue: GitHub OAuth returns error
```
Error: invalid_client
```

**Solutions:**
1. Verify GitHub OAuth app configuration:
   - Client ID matches environment variable
   - Client secret is correct
   - Callback URL matches exactly: `https://your-backend.onrender.com/api/v1/auth/github/callback`
2. Check GitHub OAuth app is not suspended
3. Ensure OAuth app allows the correct redirect URI

#### Issue: OAuth callback fails
```
Error: Authentication failed
```

**Diagnosis:**
```bash
# Check backend logs in Render dashboard
# Look for OAuth callback errors
```

**Solutions:**
1. Verify `GITHUB_CLIENT_SECRET` is set correctly
2. Check `GITHUB_CALLBACK_URL` matches GitHub app settings
3. Ensure backend can reach GitHub API
4. Verify user has authorized the GitHub app

### Authentication State Issues

#### Issue: User appears logged in but loses authentication
```
Authentication check returns 401
```

**Solutions:**
1. Check cookie configuration for cross-domain:
   ```bash
   COOKIE_SECURE=true
   COOKIE_SAME_SITE=none
   COOKIE_HTTP_ONLY=true
   ```
2. Verify `VITE_WITH_CREDENTIALS=true` in frontend
3. Ensure authentication check endpoint works
4. Check JWT token expiration times

#### Issue: Redirect loops after OAuth
```
User stuck between login and dashboard
```

**Solutions:**
1. Implement proper authentication state checking
2. Add loading states to prevent premature redirects
3. Check authentication context logic
4. Verify redirect loop prevention is working

## CORS Issues

### Preflight Request Failures

#### Issue: CORS preflight errors
```
Access to fetch at 'backend-url' from origin 'frontend-url' has been blocked by CORS policy
```

**Diagnosis:**
```javascript
// Check browser network tab for OPTIONS requests
// Look for Access-Control-Allow-Origin headers
```

**Solutions:**
1. Verify CORS configuration in backend:
   ```javascript
   const corsOptions = {
     origin: process.env.CORS_ORIGIN,
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
   };
   ```
2. Ensure `CORS_ORIGIN` exactly matches frontend URL
3. Check no trailing slashes in URLs
4. Verify `credentials: true` is set

#### Issue: Credentials not allowed
```
Access-Control-Allow-Credentials header is missing
```

**Solutions:**
1. Set `credentials: true` in CORS configuration
2. Never use wildcard (*) origin with credentials
3. Ensure `withCredentials: true` in frontend API calls
4. Check preflight response headers

## Cookie Issues

### Cookies Not Being Set

#### Issue: No authentication cookies in browser
```
Set-Cookie headers not working
```

**Diagnosis:**
```javascript
// Check browser dev tools → Application → Cookies
// Look for Set-Cookie headers in network tab
```

**Solutions:**
1. For cross-domain deployment:
   ```bash
   COOKIE_SECURE=true
   COOKIE_SAME_SITE=none
   ```
2. Ensure both domains use HTTPS
3. Check cookie domain is not set (leave empty for cross-domain)
4. Verify `withCredentials: true` in API calls

#### Issue: Cookies not sent with requests
```
Cookie header missing from requests
```

**Solutions:**
1. Set `withCredentials: true` in Axios configuration
2. Verify cookie `SameSite` attribute is correct
3. Check cookie `Path` attribute (should be '/')
4. Ensure cookies haven't expired

### Cookie Security Issues

#### Issue: SameSite warnings in browser
```
Cookie "accessToken" will be soon rejected because it has the "SameSite" attribute set to "None"
```

**Solutions:**
1. Ensure `Secure` attribute is set with `SameSite=None`
2. Use HTTPS for both frontend and backend
3. Consider using `SameSite=Lax` for same-site deployments

## Environment Configuration Issues

### Missing Environment Variables

#### Issue: Configuration validation fails
```
❌ Missing required environment variable: ACCESS_TOKEN_SECRET
```

**Solutions:**
1. Run validation script: `node scripts/validate-config.js`
2. Check all required variables are set
3. Verify variable names match exactly
4. Ensure no placeholder values remain

#### Issue: URL mismatches
```
⚠️ CORS_ORIGIN and FRONTEND_URL don't match
```

**Solutions:**
1. Ensure all URL variables use the same domain
2. Check for typos in domain names
3. Verify HTTPS is used consistently
4. Remove trailing slashes from URLs

### Secret Generation Issues

#### Issue: Weak or invalid secrets
```
⚠️ ACCESS_TOKEN_SECRET is too short
```

**Solutions:**
1. Generate strong secrets:
   ```bash
   # 64-character secrets
   openssl rand -hex 64
   
   # 32-character encryption key
   openssl rand -hex 16
   ```
2. Use different secrets for different environments
3. Ensure `CRYPTO_SECRET_KEY` is exactly 32 characters

## Performance Issues

### Slow Authentication Checks

#### Issue: Dashboard takes long to load
```
Authentication check timeout
```

**Solutions:**
1. Optimize authentication check endpoint
2. Implement proper caching for user data
3. Add loading states in frontend
4. Consider using JWT tokens in localStorage for faster checks (less secure)

#### Issue: Render service sleeping
```
Service unavailable (free tier)
```

**Solutions:**
1. Upgrade to paid Render plan
2. Implement service warming (ping endpoint regularly)
3. Add loading states for cold starts
4. Consider alternative hosting for always-on requirements

## Security Issues

### Exposed Secrets

#### Issue: Secrets visible in client-side code
```
API keys found in frontend bundle
```

**Solutions:**
1. Never put secrets in `VITE_` variables
2. Use backend proxy for external API calls
3. Audit frontend bundle for exposed secrets
4. Rotate any exposed secrets immediately

#### Issue: Insecure cookie configuration
```
Cookies vulnerable to XSS/CSRF
```

**Solutions:**
1. Always use `HttpOnly` for authentication cookies
2. Set `Secure` flag in production
3. Implement CSRF protection for state-changing operations
4. Use proper `SameSite` configuration

## Debugging Tools and Commands

### Backend Debugging

```bash
# Check service status
curl https://your-backend.onrender.com/api/v1/health

# Test authentication endpoint
curl -X GET https://your-backend.onrender.com/api/v1/auth/status \
  -H "Cookie: accessToken=your-token" \
  -v

# Check CORS headers
curl -X OPTIONS https://your-backend.onrender.com/api/v1/auth/status \
  -H "Origin: https://your-frontend.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

### Frontend Debugging

```javascript
// Debug authentication state
console.log('Auth State:', {
  isAuthenticated,
  user,
  hasCheckedAuth,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL
});

// Debug API calls
api.interceptors.request.use(config => {
  console.log('API Request:', config);
  return config;
});

// Check cookies
console.log('Cookies:', document.cookie);
```

### Configuration Validation

```bash
# Run validation script
node scripts/validate-config.js

# Check environment variables
env | grep -E "(CORS|COOKIE|VITE_|GITHUB_)"

# Test cross-domain configuration
curl -X POST https://your-backend.onrender.com/api/v1/auth/test \
  -H "Origin: https://your-frontend.vercel.app" \
  -H "Content-Type: application/json" \
  --cookie-jar cookies.txt \
  --cookie cookies.txt \
  -v
```

## Getting Help

### Information to Gather

When seeking help, provide:

1. **Error messages** (exact text from console/logs)
2. **Environment details** (Node.js version, deployment platform)
3. **Configuration** (sanitized environment variables)
4. **Steps to reproduce** the issue
5. **Browser/network information** (browser version, network tab screenshots)

### Useful Log Locations

- **Render Backend Logs**: Render dashboard → Service → Logs
- **Vercel Frontend Logs**: Vercel dashboard → Project → Functions tab
- **Browser Console**: F12 → Console tab
- **Network Requests**: F12 → Network tab

### Community Resources

- GitHub Issues for bug reports
- Documentation for configuration reference
- Stack Overflow for general questions
- Discord/Slack for real-time help

## Prevention Strategies

### Pre-deployment Checklist

- [ ] Run configuration validation script
- [ ] Test authentication flow in staging
- [ ] Verify all environment variables are set
- [ ] Check CORS configuration
- [ ] Test cross-domain cookie handling
- [ ] Validate SSL certificates
- [ ] Review security headers

### Monitoring Setup

1. **Health Checks**: Implement and monitor health endpoints
2. **Error Tracking**: Set up error monitoring (Sentry, etc.)
3. **Performance Monitoring**: Track authentication flow performance
4. **Uptime Monitoring**: Monitor service availability
5. **Log Aggregation**: Centralize logs for easier debugging

### Regular Maintenance

1. **Secret Rotation**: Regularly rotate secrets and API keys
2. **Dependency Updates**: Keep dependencies up to date
3. **Security Audits**: Regular security reviews
4. **Performance Reviews**: Monitor and optimize performance
5. **Documentation Updates**: Keep deployment docs current