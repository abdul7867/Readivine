#!/bin/bash

# Readivine Vercel Deployment Script
# This script helps automate the deployment process for both frontend and backend

set -e  # Exit on any error

echo "🚀 Readivine Vercel Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if vercel CLI is installed
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed."
        print_status "Please install it with: npm i -g vercel"
        exit 1
    fi
    print_success "Vercel CLI is installed"
}

# Generate secrets
generate_secrets() {
    print_status "Generating required secrets..."
    
    echo ""
    echo "🔐 Generated Secrets (Save these securely!):"
    echo "============================================"
    
    ACCESS_TOKEN_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    REFRESH_TOKEN_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex').substring(0, 32))")
    
    echo "ACCESS_TOKEN_SECRET: $ACCESS_TOKEN_SECRET"
    echo "REFRESH_TOKEN_SECRET: $REFRESH_TOKEN_SECRET"
    echo "ENCRYPTION_KEY: $ENCRYPTION_KEY"
    echo ""
    
    # Save to file for reference
    cat > deployment_secrets.txt << EOF
# Generated Secrets for Readivine Deployment
# Generated on: $(date)
# IMPORTANT: Keep these secrets secure and don't commit to version control

ACCESS_TOKEN_SECRET=$ACCESS_TOKEN_SECRET
REFRESH_TOKEN_SECRET=$REFRESH_TOKEN_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
EOF
    
    print_success "Secrets saved to deployment_secrets.txt"
    print_warning "IMPORTANT: Keep deployment_secrets.txt secure and don't commit it to version control!"
}

# Deploy backend
deploy_backend() {
    print_status "Deploying backend to Vercel..."
    
    if [ ! -d "backend" ]; then
        print_error "Backend directory not found!"
        exit 1
    fi
    
    cd backend
    
    # Check if vercel.json exists
    if [ ! -f "vercel.json" ]; then
        print_warning "vercel.json not found. Creating one..."
        cat > vercel.json << EOF
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
EOF
        print_success "Created vercel.json"
    fi
    
    print_status "Deploying backend..."
    BACKEND_URL=$(vercel --prod --confirm 2>&1 | grep -E "https://.*\.vercel\.app" | head -1 | awk '{print $NF}')
    
    if [ -z "$BACKEND_URL" ]; then
        print_error "Failed to get backend URL from deployment"
        exit 1
    fi
    
    print_success "Backend deployed to: $BACKEND_URL"
    echo "BACKEND_URL=$BACKEND_URL" >> ../deployment_secrets.txt
    
    cd ..
}

# Deploy frontend
deploy_frontend() {
    print_status "Deploying frontend to Vercel..."
    
    if [ ! -d "frontend" ]; then
        print_error "Frontend directory not found!"
        exit 1
    fi
    
    cd frontend
    
    # Check if vercel.json exists
    if [ ! -f "vercel.json" ]; then
        print_warning "vercel.json not found. Creating one..."
        cat > vercel.json << EOF
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
  ]
}
EOF
        print_success "Created vercel.json"
    fi
    
    print_status "Deploying frontend..."
    FRONTEND_URL=$(vercel --prod --confirm 2>&1 | grep -E "https://.*\.vercel\.app" | head -1 | awk '{print $NF}')
    
    if [ -z "$FRONTEND_URL" ]; then
        print_error "Failed to get frontend URL from deployment"
        exit 1
    fi
    
    print_success "Frontend deployed to: $FRONTEND_URL"
    echo "FRONTEND_URL=$FRONTEND_URL" >> ../deployment_secrets.txt
    
    cd ..
}

# Generate environment variables template
generate_env_template() {
    print_status "Generating environment variables template..."
    
    # Read URLs from deployment_secrets.txt if they exist
    BACKEND_URL=""
    FRONTEND_URL=""
    
    if [ -f "deployment_secrets.txt" ]; then
        BACKEND_URL=$(grep "BACKEND_URL=" deployment_secrets.txt | cut -d'=' -f2)
        FRONTEND_URL=$(grep "FRONTEND_URL=" deployment_secrets.txt | cut -d'=' -f2)
    fi
    
    cat > backend_env_variables.txt << EOF
# Backend Environment Variables for Vercel
# Copy these to your Vercel project settings

NODE_ENV=production
PORT=8080

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/readivine

# JWT Secrets (from deployment_secrets.txt)
ACCESS_TOKEN_SECRET=your-access-token-secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRY=10d

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=${BACKEND_URL}/api/v1/auth/github/callback

# OpenRouter AI
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-api-key

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key

# CORS & Frontend
CORS_ORIGIN=${FRONTEND_URL}
FRONTEND_URL=${FRONTEND_URL}
EOF

    cat > frontend_env_variables.txt << EOF
# Frontend Environment Variables for Vercel
# Copy these to your Vercel project settings

VITE_API_BASE_URL=${BACKEND_URL}/api/v1
EOF

    print_success "Environment variable templates created:"
    print_status "- backend_env_variables.txt"
    print_status "- frontend_env_variables.txt"
}

# Main deployment flow
main() {
    echo ""
    print_status "Welcome to Readivine Vercel Deployment!"
    echo ""
    
    print_status "What would you like to do?"
    echo "1) Generate secrets only"
    echo "2) Deploy backend only"
    echo "3) Deploy frontend only"
    echo "4) Deploy both (recommended for first time)"
    echo "5) Generate environment variable templates"
    echo ""
    
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            check_vercel_cli
            generate_secrets
            ;;
        2)
            check_vercel_cli
            deploy_backend
            generate_env_template
            ;;
        3)
            check_vercel_cli
            deploy_frontend
            generate_env_template
            ;;
        4)
            check_vercel_cli
            generate_secrets
            deploy_backend
            deploy_frontend
            generate_env_template
            
            echo ""
            print_success "🎉 Deployment completed!"
            print_status "Next steps:"
            print_status "1. Set environment variables in Vercel dashboard using the generated templates"
            print_status "2. Configure GitHub OAuth app with the callback URL"
            print_status "3. Test your deployment"
            print_status "4. Review deployment_secrets.txt and keep it secure"
            ;;
        5)
            generate_env_template
            ;;
        *)
            print_error "Invalid choice. Please run the script again."
            exit 1
            ;;
    esac
    
    echo ""
    print_success "Done! Check the generated files for next steps."
}

# Check if running from correct directory
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ]; then
    print_error "Please run this script from the root directory of your Readivine project"
    exit 1
fi

# Run main function
main
