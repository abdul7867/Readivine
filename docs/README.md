# Readivine Documentation

Welcome to the Readivine documentation! This directory contains comprehensive guides for deploying, configuring, and maintaining the Readivine application.

## 📁 Documentation Structure

```
docs/
├── README.md                           # This file - documentation overview
└── deployment/                         # Deployment-specific documentation
    ├── README.md                       # Deployment overview and navigation
    ├── backend-deployment.md           # Backend deployment to Render
    ├── frontend-deployment.md          # Frontend deployment to Vercel
    ├── environment-configuration.md    # Environment variables guide
    ├── cross-domain-authentication.md  # Cross-domain auth configuration
    ├── troubleshooting.md             # Common issues and solutions
    └── production-checklist.md        # Pre-deployment checklist
```

## 🚀 Quick Start

If you're new to deploying Readivine, follow this sequence:

1. **[Production Checklist](./deployment/production-checklist.md)** - Start here for a complete deployment checklist
2. **[Environment Configuration](./deployment/environment-configuration.md)** - Set up your environment variables
3. **[Backend Deployment](./deployment/backend-deployment.md)** - Deploy the backend to Render
4. **[Frontend Deployment](./deployment/frontend-deployment.md)** - Deploy the frontend to Vercel
5. **[Cross-Domain Authentication](./deployment/cross-domain-authentication.md)** - Configure cross-domain auth
6. **[Troubleshooting](./deployment/troubleshooting.md)** - Reference for common issues

## 🎯 Common Use Cases

### First-Time Deployment
- Follow the [Production Checklist](./deployment/production-checklist.md)
- Use the automated deployment scripts in the root directory
- Validate configuration with `npm run validate-config`

### Troubleshooting Authentication Issues
- Check [Cross-Domain Authentication](./deployment/cross-domain-authentication.md)
- Review [Troubleshooting Guide](./deployment/troubleshooting.md)
- Run configuration validation scripts

### Environment Updates
- Reference [Environment Configuration](./deployment/environment-configuration.md)
- Update variables in hosting dashboards
- Re-run validation after changes

### Adding New Domains
- Update CORS configuration in backend
- Modify environment variables
- Test authentication flow thoroughly

## 🛠 Tools and Scripts

### Configuration Validation
```bash
# Backend validation
cd backend && npm run validate-config

# Frontend validation
cd frontend && npm run validate-config
```

### Deployment Scripts
```bash
# Automated deployment (PowerShell)
./deploy-vercel.ps1

# Automated deployment (Bash)
./deploy-vercel.sh
```

### Manual Deployment
```bash
# Backend (from backend directory)
npm install && npm start

# Frontend (from frontend directory)
npm install && npm run build && npm run preview
```

## 🔧 Configuration Overview

### Backend Configuration
- **Hosting**: Render (Node.js service)
- **Database**: MongoDB Atlas
- **Authentication**: GitHub OAuth + JWT cookies
- **Key Features**: CORS, cookie security, rate limiting

### Frontend Configuration  
- **Hosting**: Vercel (Static site)
- **Framework**: React + Vite
- **Authentication**: Cookie-based with API calls
- **Key Features**: SPA routing, credential handling

### Cross-Domain Setup
- **Frontend Domain**: `*.vercel.app`
- **Backend Domain**: `*.onrender.com`
- **Cookie Configuration**: `SameSite=None`, `Secure=true`
- **CORS Configuration**: Explicit origin allowlist

## 🔐 Security Considerations

### Environment Variables
- Never commit `.env` files with real secrets
- Use strong, randomly generated secrets (64+ characters)
- Rotate secrets regularly
- Use different secrets for different environments

### Cross-Domain Security
- Always use HTTPS in production
- Configure CORS with explicit origins (never use wildcards with credentials)
- Use proper cookie attributes for cross-site scenarios
- Implement proper error handling to avoid information leakage

### Authentication Security
- Use HttpOnly cookies for authentication tokens
- Implement proper session management
- Add rate limiting to authentication endpoints
- Validate all inputs and sanitize outputs

## 📊 Monitoring and Maintenance

### Health Checks
- Backend: `GET /api/v1/health`
- Frontend: Vercel's built-in monitoring
- Database: MongoDB Atlas monitoring

### Performance Monitoring
- Use Vercel Analytics for frontend performance
- Monitor Render service metrics for backend
- Set up alerts for critical issues

### Regular Maintenance
- Update dependencies monthly
- Rotate secrets quarterly
- Review and update documentation
- Test disaster recovery procedures

## 🆘 Getting Help

### Self-Service Resources
1. **[Troubleshooting Guide](./deployment/troubleshooting.md)** - Common issues and solutions
2. **Configuration Validation** - Run `npm run validate-config`
3. **Hosting Documentation** - Vercel and Render official docs
4. **GitHub OAuth Documentation** - GitHub's OAuth app setup guide

### When to Seek Help
- Configuration validation fails with critical errors
- Authentication flow completely broken
- Security vulnerabilities discovered
- Performance issues affecting users

### Information to Provide
When seeking help, include:
- Error messages (exact text)
- Configuration details (sanitized)
- Steps to reproduce the issue
- Browser/environment information
- Relevant log excerpts

## 📝 Contributing to Documentation

### Documentation Standards
- Use clear, actionable language
- Include code examples where helpful
- Provide troubleshooting steps for common issues
- Keep security considerations prominent

### Updating Documentation
1. Make changes to relevant `.md` files
2. Test any code examples or commands
3. Update navigation links if adding new files
4. Review for security implications

### Documentation Structure
- **Overview**: Brief description and purpose
- **Prerequisites**: What's needed before starting
- **Step-by-step Instructions**: Clear, numbered steps
- **Configuration Examples**: Working code/config examples
- **Troubleshooting**: Common issues and solutions
- **Security Notes**: Important security considerations

## 🔄 Version History

### Current Version: 1.0.0
- Initial deployment documentation
- Cross-domain authentication guide
- Automated deployment scripts
- Configuration validation tools
- Comprehensive troubleshooting guide

### Planned Updates
- Docker deployment options
- CI/CD pipeline documentation
- Advanced monitoring setup
- Performance optimization guide
- Security hardening checklist

---

## 📞 Support Contacts

For urgent production issues:
1. Check service status pages (Vercel, Render, MongoDB Atlas)
2. Review recent deployments and changes
3. Check error logs and monitoring dashboards
4. Follow incident response procedures

For non-urgent questions:
- Review documentation thoroughly
- Search existing issues and discussions
- Use configuration validation tools
- Test in development environment first

---

**Last Updated**: December 2024  
**Documentation Version**: 1.0.0  
**Application Version**: 1.0.0