# Frontend Deployment Guide - Vercel

This guide covers deploying the Readivine frontend to Vercel with proper configuration for cross-domain authentication.

## Prerequisites

- Vercel account
- Backend deployed and running (see [Backend Deployment Guide](./backend-deployment.md))
- Backend URL available

## Step 1: Prepare Your Repository

Ensure your frontend code is pushed to a GitHub repository that Vercel can access.

## Step 2: Create Vercel Project

### Option A: Vercel Dashboard

1. **Login to Vercel**: Go to [vercel.com](https://vercel.com) and sign in
2. **Import Project**: Click "New Project" → "Import Git Repository"
3. **Connect Repository**: Select your GitHub repository
4. **Configure Project**:
   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `frontend` (if frontend is in a subdirectory)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Option B: Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel --prod
```

## Step 3: Environment Variables

Configure the following environment variables in Vercel's dashboard or via CLI:

### Required Variables

```bash
# Backend API Configuration
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api/v1

# Authentication Configuration
VITE_WITH_CREDENTIALS=true

# App Configuration
VITE_APP_NAME=Readivine
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=production
VITE_DEBUG_MODE=false
```

### Setting via Vercel Dashboard

1. Go to your project in Vercel dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with the appropriate value
4. Set the environment to "Production"

### Setting via Vercel CLI

```bash
# Set environment variables
vercel env add VITE_API_BASE_URL production
vercel env add VITE_WITH_CREDENTIALS production
vercel env add VITE_APP_NAME production
vercel env add VITE_APP_VERSION production
vercel env add VITE_NODE_ENV production
vercel env add VITE_DEBUG_MODE production
```

## Step 4: Configure Build Settings

Ensure your `vercel.json` file is properly configured:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## Step 5: Deploy

### Initial Deployment

1. **Deploy**: Click "Deploy" in Vercel dashboard or run `vercel --prod`
2. **Monitor**: Watch the build logs for any errors
3. **Test**: Once deployed, visit your Vercel URL to test the application

### Subsequent Deployments

Vercel automatically deploys when you push to your connected Git branch.

## Step 6: Custom Domain (Optional)

If you have a custom domain:

1. **Add Domain**: In Vercel dashboard, go to Settings → Domains
2. **Configure DNS**: Point your domain to Vercel's nameservers
3. **Update Backend**: Update `CORS_ORIGIN` and `FRONTEND_URL` in backend environment variables

## Step 7: Validation

Test the complete authentication flow:

1. **Visit Frontend**: Go to your Vercel URL
2. **Test Login**: Click "Login with GitHub"
3. **Verify Redirect**: Should redirect to GitHub, then back to your dashboard
4. **Check Authentication**: Verify you're logged in and can access protected features

Run the configuration validator:

```bash
# In your frontend directory
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api/v1 node ../scripts/validate-config.js
```

## Common Issues and Solutions

### Build Failures

**Issue**: Build fails with "Module not found" errors
**Solution**: 
- Ensure all dependencies are in `package.json`
- Check import paths are correct
- Verify Node.js version compatibility

### Environment Variable Issues

**Issue**: Environment variables not available in build
**Solution**: 
- Ensure variables start with `VITE_`
- Check they're set in Vercel dashboard
- Redeploy after adding variables

### API Connection Issues

**Issue**: Frontend can't connect to backend
**Solution**:
- Verify `VITE_API_BASE_URL` is correct
- Check backend is running and accessible
- Ensure CORS is properly configured on backend

### Authentication Issues

**Issue**: Login redirects but doesn't maintain session
**Solution**:
- Verify `VITE_WITH_CREDENTIALS=true`
- Check backend cookie configuration
- Ensure HTTPS is used for both frontend and backend

### Routing Issues

**Issue**: Direct URL access returns 404
**Solution**: Ensure `vercel.json` has proper rewrites configuration (see Step 4)

## Performance Optimizations

### Build Optimizations

1. **Code Splitting**: Vite automatically handles this
2. **Tree Shaking**: Remove unused code
3. **Asset Optimization**: Images and fonts are optimized by Vercel

### Runtime Optimizations

1. **CDN**: Vercel's global CDN serves static assets
2. **Compression**: Gzip/Brotli compression enabled by default
3. **Caching**: Proper cache headers for static assets

### Bundle Analysis

```bash
# Analyze bundle size
npm run build -- --analyze
```

## Security Considerations

### Content Security Policy

Consider adding CSP headers in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://your-backend-url.onrender.com"
        }
      ]
    }
  ]
}
```

### Environment Variables

- Never expose sensitive data in `VITE_` variables
- Use backend API for sensitive operations
- Validate all user inputs

## Monitoring and Analytics

### Vercel Analytics

Enable Vercel Analytics for performance monitoring:

1. Go to project dashboard
2. Navigate to Analytics tab
3. Enable Web Analytics

### Error Tracking

Consider integrating error tracking:

```bash
# Install Sentry (example)
npm install @sentry/react @sentry/tracing
```

## Scaling and Performance

Vercel automatically handles:
- **Global CDN**: Assets served from edge locations
- **Serverless Functions**: For API routes (if used)
- **Automatic Scaling**: Based on traffic
- **Zero-downtime Deployments**: Rolling deployments

## Backup and Recovery

1. **Git Repository**: Primary backup via GitHub
2. **Environment Variables**: Export and backup configuration
3. **Build Artifacts**: Vercel maintains deployment history

## Next Steps

After successful frontend deployment:

1. **Test Complete Flow**: Verify authentication works end-to-end
2. **Performance Testing**: Test load times and responsiveness
3. **Security Audit**: Review security headers and configurations
4. **Monitoring Setup**: Configure alerts and monitoring
5. **Documentation**: Update team documentation with URLs and procedures