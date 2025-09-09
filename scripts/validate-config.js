#!/usr/bin/env node

/**
 * Production Configuration Validation Script
 * 
 * This script validates that all required environment variables are properly
 * configured for production deployment, with special attention to cookie and
 * CORS configuration for cross-domain authentication.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateBackendConfig() {
  log('\n🔧 Validating Backend Configuration...', 'cyan');
  
  const requiredVars = [
    'NODE_ENV',
    'MONGODB_URI',
    'ACCESS_TOKEN_SECRET',
    'REFRESH_TOKEN_SECRET',
    'CRYPTO_SECRET_KEY',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'GITHUB_CALLBACK_URL',
    'CORS_ORIGIN',
    'FRONTEND_URL'
  ];

  const cookieVars = [
    'COOKIE_SECURE',
    'COOKIE_SAME_SITE',
    'COOKIE_HTTP_ONLY'
  ];

  let errors = [];
  let warnings = [];

  // Check required variables
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      errors.push(`❌ Missing required environment variable: ${varName}`);
    } else if (value.includes('your-') || value.includes('generate_')) {
      errors.push(`❌ Environment variable ${varName} contains placeholder value: ${value}`);
    } else {
      log(`✅ ${varName}: configured`, 'green');
    }
  });

  // Check cookie configuration
  cookieVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      warnings.push(`⚠️  Cookie variable ${varName} not set (will use defaults)`);
    } else {
      log(`✅ ${varName}: ${value}`, 'green');
    }
  });

  // Validate NODE_ENV
  if (process.env.NODE_ENV !== 'production') {
    warnings.push(`⚠️  NODE_ENV is '${process.env.NODE_ENV}', expected 'production'`);
  }

  // Validate URLs
  const corsOrigin = process.env.CORS_ORIGIN;
  const frontendUrl = process.env.FRONTEND_URL;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL;

  if (corsOrigin && !corsOrigin.startsWith('https://')) {
    errors.push(`❌ CORS_ORIGIN must use HTTPS in production: ${corsOrigin}`);
  }

  if (frontendUrl && !frontendUrl.startsWith('https://')) {
    errors.push(`❌ FRONTEND_URL must use HTTPS in production: ${frontendUrl}`);
  }

  if (callbackUrl && !callbackUrl.startsWith('https://')) {
    errors.push(`❌ GITHUB_CALLBACK_URL must use HTTPS in production: ${callbackUrl}`);
  }

  // Validate CORS and Frontend URL match
  if (corsOrigin && frontendUrl && corsOrigin !== frontendUrl) {
    warnings.push(`⚠️  CORS_ORIGIN (${corsOrigin}) and FRONTEND_URL (${frontendUrl}) don't match`);
  }

  // Validate secret lengths
  const accessSecret = process.env.ACCESS_TOKEN_SECRET;
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
  const cryptoSecret = process.env.CRYPTO_SECRET_KEY;

  if (accessSecret && accessSecret.length < 32) {
    warnings.push(`⚠️  ACCESS_TOKEN_SECRET is too short (${accessSecret.length} chars, recommend 64+)`);
  }

  if (refreshSecret && refreshSecret.length < 32) {
    warnings.push(`⚠️  REFRESH_TOKEN_SECRET is too short (${refreshSecret.length} chars, recommend 64+)`);
  }

  if (cryptoSecret && cryptoSecret.length !== 32) {
    errors.push(`❌ CRYPTO_SECRET_KEY must be exactly 32 characters (current: ${cryptoSecret.length})`);
  }

  return { errors, warnings };
}

function validateFrontendConfig() {
  log('\n🎨 Validating Frontend Configuration...', 'cyan');
  
  const requiredVars = [
    'VITE_API_BASE_URL'
  ];

  const recommendedVars = [
    'VITE_WITH_CREDENTIALS',
    'VITE_APP_NAME',
    'VITE_APP_VERSION',
    'VITE_NODE_ENV'
  ];

  let errors = [];
  let warnings = [];

  // Check required variables
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      errors.push(`❌ Missing required environment variable: ${varName}`);
    } else if (value.includes('your-backend-url')) {
      errors.push(`❌ Environment variable ${varName} contains placeholder value`);
    } else {
      log(`✅ ${varName}: ${value}`, 'green');
    }
  });

  // Check recommended variables
  recommendedVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      warnings.push(`⚠️  Recommended variable ${varName} not set`);
    } else {
      log(`✅ ${varName}: ${value}`, 'green');
    }
  });

  // Validate API URL
  const apiUrl = process.env.VITE_API_BASE_URL;
  if (apiUrl && !apiUrl.startsWith('https://')) {
    errors.push(`❌ VITE_API_BASE_URL must use HTTPS in production: ${apiUrl}`);
  }

  // Validate credentials setting
  const withCredentials = process.env.VITE_WITH_CREDENTIALS;
  if (withCredentials !== 'true') {
    warnings.push(`⚠️  VITE_WITH_CREDENTIALS should be 'true' for cross-domain authentication`);
  }

  // Validate debug mode
  const debugMode = process.env.VITE_DEBUG_MODE;
  if (debugMode === 'true') {
    warnings.push(`⚠️  VITE_DEBUG_MODE is enabled in production (security risk)`);
  }

  return { errors, warnings };
}

function validateCrossDomainConfig() {
  log('\n🌐 Validating Cross-Domain Configuration...', 'cyan');
  
  let errors = [];
  let warnings = [];

  const corsOrigin = process.env.CORS_ORIGIN;
  const frontendUrl = process.env.FRONTEND_URL;
  const apiUrl = process.env.VITE_API_BASE_URL;

  // Extract domains for comparison
  let frontendDomain, backendDomain;
  
  try {
    if (corsOrigin) frontendDomain = new URL(corsOrigin).hostname;
    if (apiUrl) backendDomain = new URL(apiUrl).hostname;
  } catch (e) {
    errors.push(`❌ Invalid URL format in configuration: ${e.message}`);
    return { errors, warnings };
  }

  if (frontendDomain && backendDomain) {
    if (frontendDomain === backendDomain) {
      log(`✅ Same-domain deployment detected: ${frontendDomain}`, 'green');
      warnings.push(`⚠️  Same-domain deployment: cookie configuration may be simplified`);
    } else {
      log(`✅ Cross-domain deployment detected:`, 'green');
      log(`   Frontend: ${frontendDomain}`, 'blue');
      log(`   Backend:  ${backendDomain}`, 'blue');
      
      // Validate cross-domain cookie settings
      const cookieSecure = process.env.COOKIE_SECURE;
      const cookieSameSite = process.env.COOKIE_SAME_SITE;
      
      if (cookieSecure !== 'true') {
        errors.push(`❌ Cross-domain deployment requires COOKIE_SECURE=true`);
      }
      
      if (cookieSameSite !== 'none') {
        errors.push(`❌ Cross-domain deployment requires COOKIE_SAME_SITE=none`);
      }
      
      const withCredentials = process.env.VITE_WITH_CREDENTIALS;
      if (withCredentials !== 'true') {
        errors.push(`❌ Cross-domain deployment requires VITE_WITH_CREDENTIALS=true`);
      }
    }
  }

  return { errors, warnings };
}

function main() {
  log('🔍 Production Configuration Validator', 'magenta');
  log('=====================================', 'magenta');
  
  const isBackend = fs.existsSync(path.join(process.cwd(), 'app.js')) || 
                   fs.existsSync(path.join(process.cwd(), 'index.js'));
  const isFrontend = fs.existsSync(path.join(process.cwd(), 'vite.config.js')) ||
                    fs.existsSync(path.join(process.cwd(), 'package.json'));

  let allErrors = [];
  let allWarnings = [];

  if (isBackend) {
    const { errors, warnings } = validateBackendConfig();
    allErrors.push(...errors);
    allWarnings.push(...warnings);
  }

  if (isFrontend && process.env.VITE_API_BASE_URL) {
    const { errors, warnings } = validateFrontendConfig();
    allErrors.push(...errors);
    allWarnings.push(...warnings);
  }

  // Always validate cross-domain config if we have the necessary variables
  if (process.env.CORS_ORIGIN || process.env.VITE_API_BASE_URL) {
    const { errors, warnings } = validateCrossDomainConfig();
    allErrors.push(...errors);
    allWarnings.push(...warnings);
  }

  // Print summary
  log('\n📋 Validation Summary', 'cyan');
  log('===================', 'cyan');

  if (allErrors.length === 0) {
    log('✅ No critical errors found!', 'green');
  } else {
    log(`❌ Found ${allErrors.length} critical error(s):`, 'red');
    allErrors.forEach(error => log(error, 'red'));
  }

  if (allWarnings.length > 0) {
    log(`\n⚠️  Found ${allWarnings.length} warning(s):`, 'yellow');
    allWarnings.forEach(warning => log(warning, 'yellow'));
  }

  if (allErrors.length === 0 && allWarnings.length === 0) {
    log('\n🎉 Configuration looks perfect for production!', 'green');
  }

  // Exit with error code if there are critical errors
  process.exit(allErrors.length > 0 ? 1 : 0);
}

// Run the validator
main();