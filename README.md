# Readivine

AI-powered README generator that helps developers create comprehensive, professional README files for their projects using GitHub integration and advanced AI capabilities.

## 🚀 Quick Start

### For Users
1. Visit the deployed application
2. Sign in with your GitHub account
3. Select a repository or create a new README
4. Let AI generate a professional README for your project

### For Developers
1. **Deployment**: See [Deployment Documentation](./docs/deployment/README.md)
2. **Configuration**: Follow the [Production Checklist](./docs/deployment/production-checklist.md)
3. **Troubleshooting**: Check the [Troubleshooting Guide](./docs/deployment/troubleshooting.md)

## 📋 Architecture

Readivine is built with a modern MERN stack architecture:

```
┌─────────────────┐    HTTPS    ┌─────────────────┐
│   Frontend      │◄──────────►│    Backend      │
│   (React/Vite)  │             │   (Express)     │
│   Vercel        │             │   Render        │
└─────────────────┘             └─────────────────┘
         │                               │
         │                               │
         ▼                               ▼
┌─────────────────┐             ┌─────────────────┐
│   Static Assets │             │   MongoDB       │
│   (Vercel CDN)  │             │   (Atlas)       │
└─────────────────┘             └─────────────────┘
```

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **State Management**: React Context
- **Authentication**: Cookie-based with GitHub OAuth
- **Deployment**: Vercel

### Backend
- **Runtime**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Authentication**: GitHub OAuth + JWT cookies
- **AI Integration**: OpenRouter API
- **Security**: Helmet, CORS, rate limiting
- **Deployment**: Render

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB (local or Atlas)
- GitHub OAuth application
- OpenRouter API key

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd readivine
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure environment variables in .env
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.development
   # Configure environment variables
   npm run dev
   ```

4. **Environment Configuration**
   - See [Environment Configuration Guide](./docs/deployment/environment-configuration.md)
   - Use the validation script: `npm run validate-config`

## 🚀 Deployment

### Production Deployment

For complete deployment instructions, see the [Deployment Documentation](./docs/deployment/README.md).

#### Quick Deployment
```bash
# Automated deployment
./deploy-vercel.sh  # Linux/Mac
./deploy-vercel.ps1 # Windows

# Manual validation
cd backend && npm run validate-config
cd frontend && npm run validate-config
```

#### Deployment Checklist
Follow the [Production Checklist](./docs/deployment/production-checklist.md) for a comprehensive deployment guide.

### Environment Requirements

#### Backend (Render)
- Node.js 18+
- MongoDB Atlas connection
- GitHub OAuth application
- OpenRouter API key
- Proper CORS and cookie configuration

#### Frontend (Vercel)
- Vite build configuration
- Environment variables for API connection
- Cross-domain authentication setup

## 🔐 Security

### Authentication
- GitHub OAuth integration
- JWT-based session management
- HttpOnly cookies for security
- Cross-domain authentication support

### Security Features
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration for cross-origin requests
- Security headers via Helmet
- Environment variable validation

### Cross-Domain Configuration
Special configuration is required for cross-domain deployments (Vercel + Render):
- Cookie `SameSite=None` and `Secure=true`
- Proper CORS origin configuration
- Credential handling in API requests

See [Cross-Domain Authentication Guide](./docs/deployment/cross-domain-authentication.md) for details.

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
npm run test:integration    # Integration tests
```

### Frontend Testing
```bash
cd frontend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
npm run test:integration    # Integration tests
```

### Configuration Testing
```bash
# Validate environment configuration
npm run validate-config
```

## 📚 Documentation

### Deployment Documentation
- [Deployment Overview](./docs/deployment/README.md)
- [Backend Deployment](./docs/deployment/backend-deployment.md)
- [Frontend Deployment](./docs/deployment/frontend-deployment.md)
- [Environment Configuration](./docs/deployment/environment-configuration.md)
- [Cross-Domain Authentication](./docs/deployment/cross-domain-authentication.md)
- [Troubleshooting Guide](./docs/deployment/troubleshooting.md)
- [Production Checklist](./docs/deployment/production-checklist.md)

### API Documentation
- Authentication endpoints
- README generation endpoints
- User management endpoints
- Health check endpoints

## 🛠 Development Tools

### Available Scripts

#### Backend
```bash
npm start              # Start production server
npm run dev            # Start development server
npm test               # Run tests
npm run validate       # Validate configuration
```

#### Frontend
```bash
npm run dev            # Start development server
npm run build          # Build for production
npm run preview        # Preview production build
npm test               # Run tests
npm run validate       # Validate configuration
```

### Configuration Validation
Use the built-in validation script to ensure proper configuration:
```bash
node scripts/validate-config.js
```

## 🔧 Troubleshooting

### Common Issues
- **Authentication loops**: Check cookie and CORS configuration
- **API connection failures**: Verify environment variables and CORS settings
- **Build failures**: Check Node.js version and dependencies
- **Cross-domain issues**: Review cross-domain authentication guide

### Getting Help
1. Check the [Troubleshooting Guide](./docs/deployment/troubleshooting.md)
2. Run configuration validation: `npm run validate-config`
3. Review deployment documentation
4. Check service status pages (Vercel, Render, MongoDB Atlas)

## 📊 Monitoring

### Health Checks
- Backend: `GET /api/v1/health`
- Frontend: Vercel's built-in monitoring
- Database: MongoDB Atlas monitoring dashboard

### Performance Monitoring
- Vercel Analytics for frontend performance
- Render metrics for backend performance
- Custom error tracking and logging

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run validation scripts
5. Submit a pull request

### Code Standards
- ESLint configuration for code quality
- Prettier for code formatting
- Jest/Vitest for testing
- Environment validation for configuration

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- OpenRouter for AI API services
- GitHub for OAuth integration
- Vercel and Render for hosting
- MongoDB Atlas for database services

---

## 📞 Support

### Documentation
- [Complete Deployment Guide](./docs/deployment/README.md)
- [Troubleshooting Guide](./docs/deployment/troubleshooting.md)
- [Configuration Reference](./docs/deployment/environment-configuration.md)

### Quick Links
- [Production Checklist](./docs/deployment/production-checklist.md)
- [Cross-Domain Setup](./docs/deployment/cross-domain-authentication.md)
- [Environment Variables](./docs/deployment/environment-configuration.md)

**Version**: 1.0.0  
**Last Updated**: December 2024