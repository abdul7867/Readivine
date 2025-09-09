# Readivine Vercel Deployment Script (PowerShell)
# This script helps automate the deployment process for both frontend and backend

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Readivine Vercel Deployment Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if vercel CLI is installed
function Test-VercelCLI {
    try {
        $null = Get-Command vercel -ErrorAction Stop
        Write-Success "Vercel CLI is installed"
        return $true
    }
    catch {
        Write-Error "Vercel CLI is not installed."
        Write-Status "Please install it with: npm i -g vercel"
        return $false
    }
}

# Generate secrets
function New-Secrets {
    Write-Status "Generating required secrets..."
    
    Write-Host ""
    Write-Host "🔐 Generated Secrets (Save these securely!):" -ForegroundColor Magenta
    Write-Host "============================================" -ForegroundColor Magenta
    
    $accessTokenSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
    $refreshTokenSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
    $encryptionKey = node -e "console.log(require('crypto').randomBytes(32).toString('hex').substring(0, 32))"
    
    Write-Host "ACCESS_TOKEN_SECRET: $accessTokenSecret"
    Write-Host "REFRESH_TOKEN_SECRET: $refreshTokenSecret"
    Write-Host "ENCRYPTION_KEY: $encryptionKey"
    Write-Host ""
    
    # Save to file for reference
    $secretsContent = @"
# Generated Secrets for Readivine Deployment
# Generated on: $(Get-Date)
# IMPORTANT: Keep these secrets secure and don't commit to version control

ACCESS_TOKEN_SECRET=$accessTokenSecret
REFRESH_TOKEN_SECRET=$refreshTokenSecret
ENCRYPTION_KEY=$encryptionKey
"@
    
    $secretsContent | Out-File -FilePath "deployment_secrets.txt" -Encoding UTF8
    
    Write-Success "Secrets saved to deployment_secrets.txt"
    Write-Warning "IMPORTANT: Keep deployment_secrets.txt secure and don't commit it to version control!"
}

# Deploy backend
function Deploy-Backend {
    Write-Status "Deploying backend to Vercel..."
    
    if (-not (Test-Path "backend")) {
        Write-Error "Backend directory not found!"
        exit 1
    }
    
    Push-Location "backend"
    
    # Check if vercel.json exists
    if (-not (Test-Path "vercel.json")) {
        Write-Warning "vercel.json not found. Creating one..."
        
        $vercelConfig = @"
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
"@
        $vercelConfig | Out-File -FilePath "vercel.json" -Encoding UTF8
        Write-Success "Created vercel.json"
    }
    
    Write-Status "Deploying backend..."
    
    try {
        $deployOutput = vercel --prod --confirm 2>&1
        $backendUrl = ($deployOutput | Select-String "https://.*\.vercel\.app").Matches.Value | Select-Object -First 1
        
        if (-not $backendUrl) {
            Write-Error "Failed to get backend URL from deployment"
            Pop-Location
            exit 1
        }
        
        Write-Success "Backend deployed to: $backendUrl"
        "BACKEND_URL=$backendUrl" | Add-Content -Path "../deployment_secrets.txt"
    }
    catch {
        Write-Error "Backend deployment failed: $_"
        Pop-Location
        exit 1
    }
    
    Pop-Location
}

# Deploy frontend
function Deploy-Frontend {
    Write-Status "Deploying frontend to Vercel..."
    
    if (-not (Test-Path "frontend")) {
        Write-Error "Frontend directory not found!"
        exit 1
    }
    
    Push-Location "frontend"
    
    # Check if vercel.json exists
    if (-not (Test-Path "vercel.json")) {
        Write-Warning "vercel.json not found. Creating one..."
        
        $vercelConfig = @"
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
"@
        $vercelConfig | Out-File -FilePath "vercel.json" -Encoding UTF8
        Write-Success "Created vercel.json"
    }
    
    Write-Status "Deploying frontend..."
    
    try {
        $deployOutput = vercel --prod --confirm 2>&1
        $frontendUrl = ($deployOutput | Select-String "https://.*\.vercel\.app").Matches.Value | Select-Object -First 1
        
        if (-not $frontendUrl) {
            Write-Error "Failed to get frontend URL from deployment"
            Pop-Location
            exit 1
        }
        
        Write-Success "Frontend deployed to: $frontendUrl"
        "FRONTEND_URL=$frontendUrl" | Add-Content -Path "../deployment_secrets.txt"
    }
    catch {
        Write-Error "Frontend deployment failed: $_"
        Pop-Location
        exit 1
    }
    
    Pop-Location
}

# Generate environment variables template
function New-EnvTemplate {
    Write-Status "Generating environment variables template..."
    
    # Read URLs from deployment_secrets.txt if they exist
    $backendUrl = ""
    $frontendUrl = ""
    
    if (Test-Path "deployment_secrets.txt") {
        $secrets = Get-Content "deployment_secrets.txt"
        $backendUrl = ($secrets | Select-String "BACKEND_URL=").ToString().Split("=")[1]
        $frontendUrl = ($secrets | Select-String "FRONTEND_URL=").ToString().Split("=")[1]
    }
    
    $backendEnv = @"
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
GITHUB_CALLBACK_URL=${backendUrl}/api/v1/auth/github/callback

# OpenRouter AI
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-api-key

# Encryption
CRYPTO_SECRET_KEY=your-32-character-encryption-key

# CORS Configuration for Cross-Domain Authentication
CORS_ORIGIN=${frontendUrl}
ADDITIONAL_CORS_ORIGINS=
FRONTEND_URL=${frontendUrl}

# Cookie Configuration for Cross-Domain Authentication
COOKIE_DOMAIN=
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
COOKIE_HTTP_ONLY=true
"@

    $frontendEnv = @"
# Frontend Environment Variables for Vercel
# Copy these to your Vercel project settings

# Backend API Configuration
VITE_API_BASE_URL=${backendUrl}/api/v1

# Authentication Configuration
VITE_WITH_CREDENTIALS=true

# App Configuration
VITE_APP_NAME=Readivine
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=production
VITE_DEBUG_MODE=false
"@

    $backendEnv | Out-File -FilePath "backend_env_variables.txt" -Encoding UTF8
    $frontendEnv | Out-File -FilePath "frontend_env_variables.txt" -Encoding UTF8

    Write-Success "Environment variable templates created:"
    Write-Status "- backend_env_variables.txt"
    Write-Status "- frontend_env_variables.txt"
}

# Main deployment flow
function Start-Deployment {
    Write-Host ""
    Write-Status "Welcome to Readivine Vercel Deployment!"
    Write-Host ""
    
    Write-Status "What would you like to do?"
    Write-Host "1) Generate secrets only"
    Write-Host "2) Deploy backend only"
    Write-Host "3) Deploy frontend only"
    Write-Host "4) Deploy both (recommended for first time)"
    Write-Host "5) Generate environment variable templates"
    Write-Host ""
    
    $choice = Read-Host "Enter your choice (1-5)"
    
    switch ($choice) {
        "1" {
            if (Test-VercelCLI) {
                New-Secrets
            }
        }
        "2" {
            if (Test-VercelCLI) {
                Deploy-Backend
                New-EnvTemplate
            }
        }
        "3" {
            if (Test-VercelCLI) {
                Deploy-Frontend
                New-EnvTemplate
            }
        }
        "4" {
            if (Test-VercelCLI) {
                New-Secrets
                Deploy-Backend
                Deploy-Frontend
                New-EnvTemplate
                
                Write-Host ""
                Write-Success "🎉 Deployment completed!"
                Write-Status "Next steps:"
                Write-Status "1. Set environment variables in Vercel dashboard using the generated templates"
                Write-Status "2. Configure GitHub OAuth app with the callback URL"
                Write-Status "3. Test your deployment"
                Write-Status "4. Review deployment_secrets.txt and keep it secure"
            }
        }
        "5" {
            New-EnvTemplate
        }
        default {
            Write-Error "Invalid choice. Please run the script again."
            exit 1
        }
    }
    
    Write-Host ""
    Write-Success "Done! Check the generated files for next steps."
}

# Check if running from correct directory
if (-not (Test-Path "package.json") -and -not (Test-Path "backend") -and -not (Test-Path "frontend")) {
    Write-Error "Please run this script from the root directory of your Readivine project"
    exit 1
}

# Run main function
Start-Deployment
