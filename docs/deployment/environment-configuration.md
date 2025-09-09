# Environment Configuration Guide

This guide provides detailed information about configuring environment variables for the Readivine application, with special focus on cross-domain authentication requirements.

## Overview

Readivine uses environment variables to configure different aspects of the application:
- Database connections
- Authentication secrets
- CORS and cookie settings
- External service API keys
- Feature flags and debugging options

## Backend Environment Variables

### Server Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Environment mode (`development`, `production`) |
| `PORT` | No | `8080` | Port for the server to listen on |

### Database Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | - | MongoDB connection string |

**Example:**
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/readivine?retryWrites=true&w=majority
```

### Authentication & Security

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ACCESS_TOKEN_SECRET` | Yes | - | Secret for signing JWT access tokens (64+ chars recommended) |
| `ACCESS_TOKEN_EXPIRY` | No | `1d` | Access token expiration time |
| `REFRESH_TOKEN_SECRET` | Yes | - | Secret for signing JWT refresh tokens (64+ chars recommended) |
| `REFRESH_TOKEN_EXPIRY` | No | `7d` | Refresh token expiration time |
| `CRYPTO_SECRET_KEY` | Yes | - | Secret for encrypting sensitive data (exactly 32 chars) |

**Generate secrets:**
```bash
# Generate 64-character secrets
openssl rand -hex 64

# Generate 32-character encryption key
openssl rand -hex 16
```

### GitHub OAuth

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_CLIENT_ID` | Yes | - | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | Yes | - | GitHub OAuth app client secret |
| `GITHUB_CALLBACK_URL` | Yes | - | OAuth callback URL (must match GitHub app settings) |

**Example:**
```bash
GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
GITHUB_CLIENT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
GITHUB_CALLBACK_URL=https://your-backend.onrender.com/api/v1/auth/github/callback
```

### CORS Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CORS_ORIGIN` | Yes | - | Primary frontend URL for CORS |
| `ADDITIONAL_CORS_ORIGINS` | No | - | Comma-separated additional allowed origins |
| `FRONTEND_URL` | Yes | - | Frontend URL for redirects after authentication |

**Example:**
```bash
CORS_ORIGIN=https://readivine.vercel.app
ADDITIONAL_CORS_ORIGINS=https://preview.readivine.vercel.app,https://staging.readivine.com
FRONTEND_URL=https://readivine.vercel.app
```

### Cookie Configuration (Cross-Domain)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `COOKIE_DOMAIN` | No | - | Cookie domain (leave empty for auto-detection) |
| `COOKIE_SECURE` | No | `auto` | Force secure cookies (`true`, `false`, `auto`) |
| `COOKIE_SAME_SITE` | No | `none` | SameSite cookie attribute (`strict`, `lax`, `none`) |
| `COOKIE_HTTP_ONLY` | No | `true` | HttpOnly cookie attribute |

**Cross-domain settings:**
```bash
COOKIE_DOMAIN=
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
COOKIE_HTTP_ONLY=true
```

### External Services

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | Yes | - | OpenRouter API key for AI features |

## Frontend Environment Variables

### API Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | Yes | - | Backend API base URL |
| `VITE_WITH_CREDENTIALS` | No | `true` | Enable credentials in API requests |

**Example:**
```bash
VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
VITE_WITH_CREDENTIALS=true
```

### App Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_APP_NAME` | No | `Readivine` | Application name |
| `VITE_APP_VERSION` | No | `1.0.0` | Application version |
| `VITE_NODE_ENV` | No | `development` | Environment identifier |
| `VITE_DEBUG_MODE` | No | `false` | Enable debug logging |

**Example:**
```bash
VITE_APP_NAME=Readivine
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=production
VITE_DEBUG_MODE=false
```

## Environment-Specific Configurations

### Development Environment

**Backend (.env):**
```bash
NODE_ENV=development
PORT=8080
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
GITHUB_CALLBACK_URL=http://localhost:8080/api/v1/auth/github/callback
```

**Frontend (.env.development):**
```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WITH_CREDENTIALS=true
VITE_DEBUG_MODE=true
VITE_NODE_ENV=development
```

### Production Environment

**Backend (.env.production):**
```bash
NODE_ENV=production
PORT=8080
FRONTEND_URL=https://readivine.vercel.app
CORS_ORIGIN=https://readivine.vercel.app
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
COOKIE_HTTP_ONLY=true
GITHUB_CALLBACK_URL=https://readivine-backend.onrender.com/api/v1/auth/github/callback
```

**Frontend (.env.production):**
```bash
VITE_API_BASE_URL=https://readivine-backend.onrender.com/api/v1
VITE_WITH_CREDENTIALS=true
VITE_DEBUG_MODE=false
VITE_NODE_ENV=production
```

## Cross-Domain Authentication Requirements

When deploying frontend and backend to different domains (e.g., Vercel + Render), specific configuration is required:

### Backend Requirements

1. **CORS Configuration:**
   ```bash
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

2. **Cookie Configuration:**
   ```bash
   COOKIE_SECURE=true
   COOKIE_SAME_SITE=none
   COOKIE_HTTP_ONLY=true
   ```

3. **HTTPS Required:** Both frontend and backend must use HTTPS

### Frontend Requirements

1. **Credentials Enabled:**
   ```bash
   VITE_WITH_CREDENTIALS=true
   ```

2. **Correct API URL:**
   ```bash
   VITE_API_BASE_URL=https://your-backend-domain.com/api/v1
   ```

## Security Best Practices

### Secret Management

1. **Never commit secrets to version control**
2. **Use strong, randomly generated secrets**
3. **Rotate secrets regularly**
4. **Use different secrets for different environments**

### URL Configuration

1. **Always use HTTPS in production**
2. **Validate all URLs are correct**
3. **Ensure CORS origins match exactly (no trailing slashes)**

### Cookie Security

1. **Use HttpOnly cookies for authentication**
2. **Set Secure flag in production**
3. **Configure SameSite appropriately for your deployment**

## Validation

Use the provided validation script to check your configuration:

```bash
# Backend validation
cd backend
node ../scripts/validate-config.js

# Frontend validation (with environment variables set)
cd frontend
VITE_API_BASE_URL=https://your-backend.com/api/v1 node ../scripts/validate-config.js
```

## Common Configuration Issues

### CORS Errors

**Problem:** Frontend can't connect to backend
**Solution:** 
- Ensure `CORS_ORIGIN` exactly matches frontend URL
- No trailing slashes in URLs
- Both domains use HTTPS in production

### Cookie Issues

**Problem:** Authentication doesn't persist
**Solution:**
- Set `COOKIE_SAME_SITE=none` for cross-domain
- Set `COOKIE_SECURE=true` in production
- Enable `VITE_WITH_CREDENTIALS=true` in frontend

### OAuth Callback Issues

**Problem:** GitHub OAuth fails
**Solution:**
- Ensure `GITHUB_CALLBACK_URL` matches GitHub app settings exactly
- Use correct domain and protocol (HTTPS in production)

## Environment Variable Templates

### Backend Template

```bash
# Copy this template and fill in your values
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/readivine
ACCESS_TOKEN_SECRET=generate-64-character-secret
REFRESH_TOKEN_SECRET=generate-different-64-character-secret
CRYPTO_SECRET_KEY=generate-32-character-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=https://your-backend.onrender.com/api/v1/auth/github/callback
OPENROUTER_API_KEY=sk-or-v1-your-api-key
CORS_ORIGIN=https://your-frontend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
COOKIE_HTTP_ONLY=true
```

### Frontend Template

```bash
# Copy this template and fill in your values
VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
VITE_WITH_CREDENTIALS=true
VITE_APP_NAME=Readivine
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=production
VITE_DEBUG_MODE=false
```