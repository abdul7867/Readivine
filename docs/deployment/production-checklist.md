# Production Deployment Checklist

Use this comprehensive checklist to ensure your Readivine deployment is production-ready with proper cross-domain authentication configuration.

## Pre-Deployment Setup

### 1. Account Setup
- [ ] **Render Account**: Created and verified
- [ ] **Vercel Account**: Created and verified  
- [ ] **MongoDB Atlas**: Database cluster created and configured
- [ ] **GitHub OAuth Apps**: Separate apps created for production
- [ ] **OpenRouter Account**: API key obtained for AI features

### 2. Repository Preparation
- [ ] **Code Committed**: Latest code pushed to main branch
- [ ] **Secrets Removed**: No sensitive data in repository
- [ ] **Dependencies Updated**: All packages up to date
- [ ] **Tests Passing**: All tests pass locally

## Environment Configuration

### 3. Backend Environment Variables

#### Required Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT=8080` (or Render's assigned port)
- [ ] `MONGODB_URI` - Production database connection string
- [ ] `ACCESS_TOKEN_SECRET` - 64+ character random string
- [ ] `REFRESH_TOKEN_SECRET` - 64+ character random string (different from access)
- [ ] `CRYPTO_SECRET_KEY` - Exactly 32 character random string
- [ ] `GITHUB_CLIENT_ID` - Production GitHub OAuth app client ID
- [ ] `GITHUB_CLIENT_SECRET` - Production GitHub OAuth app secret
- [ ] `GITHUB_CALLBACK_URL` - `https://your-backend.onrender.com/api/v1/auth/github/callback`
- [ ] `OPENROUTER_API_KEY` - Your OpenRouter API key

#### Cross-Domain Configuration
- [ ] `CORS_ORIGIN` - Exact frontend URL (e.g., `https://readivine.vercel.app`)
- [ ] `FRONTEND_URL` - Same as CORS_ORIGIN
- [ ] `COOKIE_SECURE=true`
- [ ] `COOKIE_SAME_SITE=none`
- [ ] `COOKIE_HTTP_ONLY=true`

#### Optional Variables
- [ ] `ADDITIONAL_CORS_ORIGINS` - Comma-separated additional domains
- [ ] `ACCESS_TOKEN_EXPIRY=1d`
- [ ] `REFRESH_TOKEN_EXPIRY=7d`

### 4. Frontend Environment Variables

#### Required Variables
- [ ] `VITE_API_BASE_URL` - Backend API URL (e.g., `https://your-backend.onrender.com/api/v1`)
- [ ] `VITE_WITH_CREDENTIALS=true`

#### Recommended Variables
- [ ] `VITE_APP_NAME=Readivine`
- [ ] `VITE_APP_VERSION=1.0.0`
- [ ] `VITE_NODE_ENV=production`
- [ ] `VITE_DEBUG_MODE=false`

## Security Configuration

### 5. Secret Generation
- [ ] **Strong Secrets**: All secrets are randomly generated and 32+ characters
- [ ] **Unique Secrets**: Different secrets for access tokens, refresh tokens, and encryption
- [ ] **Secure Storage**: Secrets stored securely (not in code or documentation)
- [ ] **Environment Separation**: Different secrets for development and production

### 6. GitHub OAuth Configuration
- [ ] **Production App**: Separate GitHub OAuth app for production
- [ ] **Homepage URL**: Set to frontend URL (e.g., `https://readivine.vercel.app`)
- [ ] **Callback URL**: Set to backend callback (e.g., `https://your-backend.onrender.com/api/v1/auth/github/callback`)
- [ ] **App Permissions**: Minimal required permissions (user:email, read:user)

### 7. Database Security
- [ ] **Network Access**: MongoDB Atlas network access configured for Render IPs
- [ ] **Authentication**: Strong database username and password
- [ ] **Connection String**: Uses SRV format with SSL
- [ ] **Backup Enabled**: Automated backups configured

## Deployment Process

### 8. Backend Deployment (Render)
- [ ] **Service Created**: Web service created in Render
- [ ] **Repository Connected**: GitHub repository linked
- [ ] **Build Settings**: 
  - Root Directory: `backend` (if applicable)
  - Build Command: `npm install`
  - Start Command: `npm start`
- [ ] **Environment Variables**: All variables set in Render dashboard
- [ ] **Deploy Successful**: Service builds and starts without errors
- [ ] **Health Check**: `/api/v1/health` endpoint responds correctly

### 9. Frontend Deployment (Vercel)
- [ ] **Project Created**: Vercel project created and configured
- [ ] **Repository Connected**: GitHub repository linked
- [ ] **Build Settings**:
  - Framework: Vite (auto-detected)
  - Root Directory: `frontend` (if applicable)
  - Build Command: `npm run build`
  - Output Directory: `dist`
- [ ] **Environment Variables**: All variables set in Vercel dashboard
- [ ] **Deploy Successful**: Build completes without errors
- [ ] **Site Accessible**: Frontend loads correctly

## Configuration Validation

### 10. Automated Validation
- [ ] **Backend Validation**: Run `node scripts/validate-config.js` in backend
- [ ] **Frontend Validation**: Run validation with frontend environment variables
- [ ] **No Critical Errors**: Validation passes without critical errors
- [ ] **Warnings Addressed**: All warnings reviewed and addressed if necessary

### 11. Manual Testing

#### Basic Functionality
- [ ] **Frontend Loads**: Homepage loads without errors
- [ ] **API Connection**: Frontend can reach backend API
- [ ] **Health Endpoint**: Backend health check responds

#### Authentication Flow
- [ ] **Login Button**: Login with GitHub button works
- [ ] **GitHub Redirect**: Redirects to GitHub OAuth page
- [ ] **Authorization**: User can authorize the application
- [ ] **Callback Success**: GitHub redirects back to application
- [ ] **Dashboard Access**: User lands on dashboard after authentication
- [ ] **Session Persistence**: Authentication persists after page refresh
- [ ] **Logout**: Logout functionality works correctly

#### Cross-Domain Verification
- [ ] **Cookies Set**: Authentication cookies are set in browser
- [ ] **Cookie Attributes**: Cookies have correct attributes (Secure, SameSite=None, HttpOnly)
- [ ] **CORS Headers**: Proper CORS headers in API responses
- [ ] **Credentials Sent**: Cookies sent with API requests

### 12. Browser Testing
- [ ] **Chrome**: Full authentication flow works
- [ ] **Firefox**: Full authentication flow works  
- [ ] **Safari**: Full authentication flow works
- [ ] **Edge**: Full authentication flow works
- [ ] **Mobile Browsers**: Basic functionality on mobile

## Performance and Monitoring

### 13. Performance Checks
- [ ] **Load Time**: Frontend loads in under 3 seconds
- [ ] **API Response Time**: API responses under 1 second
- [ ] **Bundle Size**: Frontend bundle size optimized
- [ ] **Image Optimization**: Images properly optimized

### 14. Monitoring Setup
- [ ] **Error Tracking**: Error monitoring configured (optional)
- [ ] **Uptime Monitoring**: Service uptime monitoring (optional)
- [ ] **Performance Monitoring**: Performance metrics tracking (optional)
- [ ] **Log Aggregation**: Centralized logging setup (optional)

## Security Verification

### 15. Security Headers
- [ ] **HTTPS Enforced**: All traffic uses HTTPS
- [ ] **Security Headers**: Proper security headers configured
- [ ] **Content Security Policy**: CSP configured if needed
- [ ] **CORS Policy**: CORS properly restricts origins

### 16. Data Protection
- [ ] **Sensitive Data**: No sensitive data exposed in frontend
- [ ] **API Keys**: No API keys in client-side code
- [ ] **Error Messages**: Error messages don't expose sensitive information
- [ ] **Input Validation**: All inputs properly validated

## Documentation and Handoff

### 17. Documentation
- [ ] **Deployment URLs**: Document frontend and backend URLs
- [ ] **Environment Variables**: Document all required variables (without values)
- [ ] **OAuth Configuration**: Document GitHub OAuth app settings
- [ ] **Troubleshooting**: Common issues and solutions documented

### 18. Team Handoff
- [ ] **Access Granted**: Team members have necessary access
- [ ] **Credentials Shared**: Shared credentials stored securely
- [ ] **Process Documented**: Deployment process documented
- [ ] **Emergency Contacts**: Emergency contact information available

## Post-Deployment Verification

### 19. Production Testing
- [ ] **End-to-End Testing**: Complete user journey tested
- [ ] **Load Testing**: Basic load testing performed (optional)
- [ ] **Security Scanning**: Security vulnerability scan (optional)
- [ ] **Accessibility Testing**: Basic accessibility compliance checked

### 20. Monitoring and Alerts
- [ ] **Health Monitoring**: Services monitored for uptime
- [ ] **Error Alerts**: Alerts configured for critical errors
- [ ] **Performance Alerts**: Alerts for performance degradation
- [ ] **Security Alerts**: Alerts for security incidents

## Maintenance Planning

### 21. Backup and Recovery
- [ ] **Database Backups**: Automated database backups configured
- [ ] **Code Backups**: Code repository properly backed up
- [ ] **Configuration Backups**: Environment configuration backed up securely
- [ ] **Recovery Plan**: Disaster recovery plan documented

### 22. Update Strategy
- [ ] **Dependency Updates**: Plan for regular dependency updates
- [ ] **Security Updates**: Process for security patches
- [ ] **Feature Deployments**: Process for deploying new features
- [ ] **Rollback Plan**: Plan for rolling back problematic deployments

## Final Verification

### 23. Complete System Test
- [ ] **User Registration**: New user can complete OAuth flow
- [ ] **Session Management**: Sessions work correctly across browser restarts
- [ ] **API Functionality**: All API endpoints work correctly
- [ ] **Error Handling**: Errors are handled gracefully
- [ ] **Cross-Device**: Works across different devices and browsers

### 24. Sign-off
- [ ] **Technical Review**: Technical team approves deployment
- [ ] **Security Review**: Security requirements met
- [ ] **Performance Review**: Performance requirements met
- [ ] **Documentation Complete**: All documentation updated
- [ ] **Go-Live Approved**: Stakeholders approve go-live

## Quick Reference Commands

### Validation Commands
```bash
# Backend validation
cd backend && node ../scripts/validate-config.js

# Frontend validation  
cd frontend && VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1 node ../scripts/validate-config.js

# Test backend health
curl https://your-backend.onrender.com/api/v1/health

# Test CORS
curl -X OPTIONS https://your-backend.onrender.com/api/v1/auth/status \
  -H "Origin: https://your-frontend.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

### Deployment Commands
```bash
# Deploy with scripts
./deploy-vercel.sh  # or deploy-vercel.ps1 on Windows

# Manual Vercel deployment
cd frontend && vercel --prod

# Check deployment status
vercel ls
```

## Emergency Procedures

### If Authentication Fails
1. Check backend logs in Render dashboard
2. Verify environment variables are set correctly
3. Test GitHub OAuth app configuration
4. Check CORS and cookie configuration
5. Validate SSL certificates

### If Site is Down
1. Check service status in hosting dashboards
2. Verify DNS configuration
3. Check for recent deployments
4. Review error logs
5. Contact hosting support if needed

### If Data is Compromised
1. Immediately rotate all secrets
2. Review access logs
3. Notify affected users
4. Implement additional security measures
5. Document incident for future prevention

---

**Note**: This checklist should be customized based on your specific requirements and organizational policies. Consider adding additional items relevant to your deployment environment and security requirements.