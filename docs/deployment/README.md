# Readivine Deployment Documentation

This directory contains comprehensive deployment documentation for the Readivine application, with specific focus on cross-domain authentication configuration.

## Quick Navigation

- [Backend Deployment Guide](./backend-deployment.md) - Complete guide for deploying the backend to Render
- [Frontend Deployment Guide](./frontend-deployment.md) - Complete guide for deploying the frontend to Vercel
- [Environment Configuration](./environment-configuration.md) - Detailed environment variable setup
- [Cross-Domain Authentication](./cross-domain-authentication.md) - Cookie and CORS configuration for cross-domain setups
- [Troubleshooting Guide](./troubleshooting.md) - Common issues and solutions
- [Production Checklist](./production-checklist.md) - Pre-deployment validation checklist

## Architecture Overview

Readivine uses a MERN stack with the following deployment architecture:

```
┌─────────────────┐    HTTPS    ┌─────────────────┐
│   Frontend      │◄──────────►│    Backend      │
│   (Vercel)      │             │   (Render)      │
│                 │             │                 │
│ readivine.      │             │ readivine.      │
│ vercel.app      │             │ onrender.com    │
└─────────────────┘             └─────────────────┘
         │                               │
         │                               │
         ▼                               ▼
┌─────────────────┐             ┌─────────────────┐
│   Static Files  │             │   MongoDB       │
│   (Vercel CDN)  │             │   (Atlas)       │
└─────────────────┘             └─────────────────┘
```

## Key Features

- **Cross-Domain Authentication**: Secure OAuth flow between Vercel frontend and Render backend
- **Cookie-Based Sessions**: HttpOnly cookies with proper cross-site configuration
- **CORS Configuration**: Properly configured for credential handling
- **Environment Validation**: Automated configuration validation scripts
- **Automated Deployment**: Scripts for streamlined deployment process

## Getting Started

1. **Prerequisites**: Ensure you have accounts for Vercel, Render, MongoDB Atlas, and GitHub OAuth apps configured
2. **Environment Setup**: Follow the [Environment Configuration](./environment-configuration.md) guide
3. **Backend Deployment**: Deploy using the [Backend Deployment Guide](./backend-deployment.md)
4. **Frontend Deployment**: Deploy using the [Frontend Deployment Guide](./frontend-deployment.md)
5. **Validation**: Run the production checklist to ensure everything is configured correctly

## Important Security Notes

- Never commit `.env` files containing real secrets to version control
- Use strong, randomly generated secrets for JWT tokens and encryption keys
- Ensure all production URLs use HTTPS
- Validate CORS origins to prevent unauthorized access
- Regularly rotate secrets and API keys

## Support

If you encounter issues during deployment, check the [Troubleshooting Guide](./troubleshooting.md) for common solutions.