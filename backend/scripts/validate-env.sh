#!/bin/bash

# Production Environment Setup Script

echo "🚀 Setting up production environment..."

# Check if required environment variables are set
required_vars=(
    "NODE_ENV"
    "PORT"
    "MONGODB_URI"
    "ACCESS_TOKEN_SECRET"
    "REFRESH_TOKEN_SECRET"
    "GITHUB_CLIENT_ID"
    "GITHUB_CLIENT_SECRET"
    "CRYPTO_SECRET_KEY"
    "OPENROUTER_API_KEY"
    "FRONTEND_URL"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    exit 1
fi

echo "✅ All required environment variables are set"

# Validate production settings
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  Warning: NODE_ENV is not set to 'production'"
fi

# Check token strength
if [ ${#ACCESS_TOKEN_SECRET} -lt 32 ]; then
    echo "❌ ACCESS_TOKEN_SECRET is too short (minimum 32 characters)"
    exit 1
fi

if [ ${#REFRESH_TOKEN_SECRET} -lt 32 ]; then
    echo "❌ REFRESH_TOKEN_SECRET is too short (minimum 32 characters)"
    exit 1
fi

echo "✅ Environment validation passed"
echo "🎉 Ready for production deployment!"
