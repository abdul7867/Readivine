# Backend Deployment Guide - Render

This guide covers deploying the Readivine backend to Render with proper configuration for cross-domain authentication.

## Prerequisites

- Render account
- MongoDB Atlas database
- GitHub OAuth application configured
- OpenRouter API key (for AI features)

## Step 1: Prepare Your Repository

Ensure your backend code is pushed to a GitHub repository that Render can access.

## Step 2: Create Render Service

1. **Login to Render**: Go to [render.com](https://render.com) and sign in
2. **Create New Web Service**: Click "New" → "Web Service"
3. **Connect Repository**: Connect your GitHub repository
4. **Configure Service**:
   - **Name**: `readivine-backend` (or your preferred name)
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: `backend` (if backend is in a subdirectory)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

## Step 3: Environment Variables

Configure the following environment variables in Render's dashboard:

### Required Variables

```bash
# Server Configuration
NODE_ENV=production
PORT=10000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/readivine

# JWT Secrets (generate with: openssl rand -hex 64)
ACCESS_TOKEN_SECRET=your-64-character-access-token-secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your-64-character-refresh-token-secret
REFRESH_TOKEN_EXPIRY=7d

# Encryption (generate with: openssl rand -hex 16)
CRYPTO_SECRET_KEY=your-32-character-encryption-key

# GitHub OAuth
GITHUB_CLIENT_ID=your-production-github-client-id
GITHUB_CLIENT_SECRET=your-production-github-client-secret
GITHUB_CALLBACK_URL=https://your-backend-url.onrender.com/api/v1/auth/github/callback

# External Services
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-api-key

# CORS Configuration for Cross-Domain Authentication
CORS_ORIGIN=https://readivine.vercel.app
ADDITIONAL_CORS_ORIGINS=
FRONTEND_URL=https://readivine.vercel.app

# Cookie Configuration for Cross-Domain Authentication
COOKIE_DOMAIN=
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
COOKIE_HTTP_ONLY=true
```

### Important Notes

- **CORS_ORIGIN**: Must exactly match your Vercel frontend URL
- **GITHUB_CALLBACK_URL**: Must match the callback URL in your GitHub OAuth app
- **Cookie Settings**: Critical for cross-domain authentication to work
- **Secrets**: Use strong, randomly generated values

## Step 4: GitHub OAuth Configuration

Update your GitHub OAuth application settings:

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Select your production OAuth app
3. Update the **Authorization callback URL** to: `https://your-backend-url.onrender.com/api/v1/auth/github/callback`
4. Update the **Homepage URL** to your frontend URL: `https://readivine.vercel.app`

## Step 5: Deploy

1. **Deploy**: Click "Create Web Service" in Render
2. **Monitor**: Watch the build logs for any errors
3. **Test**: Once deployed, test the health endpoint: `https://your-backend-url.onrender.com/api/v1/health`

## Step 6: Validation

Run the configuration validator to ensure everything is set up correctly:

```bash
# In your backend directory
node ../scripts/validate-config.js
```

## Common Issues and Solutions

### Build Failures

**Issue**: Build fails with dependency errors
**Solution**: Ensure `package.json` and `package-lock.json` are up to date

### Environment Variable Issues

**Issue**: App crashes with "Missing environment variable" errors
**Solution**: Double-check all required environment variables are set in Render dashboard

### CORS Errors

**Issue**: Frontend can't connect to backend
**Solution**: Verify `CORS_ORIGIN` exactly matches your frontend URL (no trailing slash)

### Cookie Issues

**Issue**: Authentication doesn't persist after OAuth
**Solution**: Ensure cookie configuration is set for cross-domain:
- `COOKIE_SECURE=true`
- `COOKIE_SAME_SITE=none`
- `COOKIE_HTTP_ONLY=true`

## Production Optimizations

### Performance

1. **Enable HTTP/2**: Render enables this by default
2. **Gzip Compression**: Ensure your Express app has compression middleware
3. **Connection Pooling**: MongoDB connection pooling is configured in the app

### Security

1. **Helmet**: Security headers are configured via Helmet middleware
2. **Rate Limiting**: API rate limiting is implemented
3. **Input Validation**: All inputs are validated and sanitized

### Monitoring

1. **Health Checks**: Render automatically monitors the `/health` endpoint
2. **Logs**: Access logs via Render dashboard
3. **Metrics**: Monitor performance via Render's built-in metrics

## Scaling

Render automatically handles:
- **Auto-scaling**: Based on CPU and memory usage
- **Load Balancing**: Distributes traffic across instances
- **Zero-downtime Deployments**: Rolling deployments for updates

## Backup and Recovery

1. **Database Backups**: Configure MongoDB Atlas automated backups
2. **Environment Variables**: Keep a secure backup of your environment configuration
3. **Code Backups**: Ensure your GitHub repository is properly backed up

## Next Steps

After successful backend deployment:

1. Note your backend URL (e.g., `https://readivine-backend.onrender.com`)
2. Proceed to [Frontend Deployment Guide](./frontend-deployment.md)
3. Configure the frontend to use your backend URL
4. Test the complete authentication flow