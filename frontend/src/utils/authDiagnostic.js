/**
 * Quick Authentication Diagnostic Tool
 * 
 * This utility provides a simple way to diagnose authentication issues
 * in both development and production environments.
 */

import { validateAuthConfig } from './validateAuthConfig.js';
import { getApiDebugInfo } from '../services/api.js';

/**
 * Run a quick diagnostic check
 */
export async function runQuickDiagnostic() {
  console.group('🔍 Quick Authentication Diagnostic');
  
  try {
    // 1. Environment Check
    console.log('1️⃣ Environment Configuration');
    const env = import.meta.env;
    console.log(`   Environment: ${env.PROD ? 'Production' : 'Development'}`);
    console.log(`   API Base URL: ${env.VITE_API_BASE_URL || 'Not set'}`);
    console.log(`   Mode: ${env.MODE}`);
    
    // 2. Browser Environment
    console.log('\n2️⃣ Browser Environment');
    console.log(`   Cookies Enabled: ${navigator.cookieEnabled ? '✅' : '❌'}`);
    console.log(`   Online: ${navigator.onLine ? '✅' : '❌'}`);
    console.log(`   Protocol: ${window.location.protocol}`);
    console.log(`   Origin: ${window.location.origin}`);
    
    // 3. API Configuration
    console.log('\n3️⃣ API Configuration');
    const apiInfo = getApiDebugInfo();
    console.log(`   Base URL: ${apiInfo.baseURL}`);
    console.log(`   Credentials: ${apiInfo.withCredentials ? '✅' : '❌'}`);
    console.log(`   Timeout: ${apiInfo.timeout}ms`);
    
    // 4. Storage Check
    console.log('\n4️⃣ Storage Status');
    const authError = localStorage.getItem('authCheckError');
    const networkError = localStorage.getItem('lastNetworkError');
    const redirectState = localStorage.getItem('redirectLoopPrevention');
    
    console.log(`   Auth Errors: ${authError ? '⚠️ Found' : '✅ None'}`);
    console.log(`   Network Errors: ${networkError ? '⚠️ Found' : '✅ None'}`);
    console.log(`   Redirect State: ${redirectState ? '📊 Present' : '✅ Clean'}`);
    
    if (redirectState) {
      try {
        const state = JSON.parse(redirectState);
        console.log(`   Circuit Open: ${state.circuitOpen ? '🔴 Yes' : '🟢 No'}`);
        console.log(`   Recent Redirects: ${state.redirects?.length || 0}`);
      } catch (e) {
        console.log(`   Redirect State: ❌ Invalid JSON`);
      }
    }
    
    // 5. Quick Recommendations
    console.log('\n5️⃣ Quick Recommendations');
    const issues = [];
    
    if (!navigator.cookieEnabled) {
      issues.push('Enable cookies in your browser');
    }
    
    if (!navigator.onLine) {
      issues.push('Check your internet connection');
    }
    
    if (env.PROD && window.location.protocol !== 'https:') {
      issues.push('Use HTTPS in production');
    }
    
    if (!env.VITE_API_BASE_URL && env.PROD) {
      issues.push('Set VITE_API_BASE_URL environment variable');
    }
    
    if (authError) {
      issues.push('Clear previous auth errors from localStorage');
    }
    
    if (issues.length === 0) {
      console.log('   ✅ No obvious issues detected');
      console.log('   💡 Run full validation for comprehensive check');
    } else {
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    console.log('\n📋 Next Steps:');
    console.log('   • Run npm run validate-auth for full validation');
    console.log('   • Run npm run test:auth for comprehensive testing');
    console.log('   • Check browser network tab during authentication');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
  
  console.groupEnd();
}

/**
 * Clear all authentication-related storage
 */
export function clearAuthStorage() {
  console.log('🧹 Clearing authentication storage...');
  
  const keysToRemove = [
    'authCheckError',
    'lastNetworkError',
    'lastAuthError',
    'lastServerError',
    'lastClientError',
    'lastForbiddenError',
    'lastApiRequest',
    'lastApiResponse',
    'lastRequestError',
    'apiErrorLog',
    'redirectLoopPrevention',
    'lastLoginAttempt'
  ];
  
  let cleared = 0;
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      cleared++;
    }
  });
  
  console.log(`✅ Cleared ${cleared} items from localStorage`);
  
  // Also clear any auth-related session storage
  try {
    sessionStorage.clear();
    console.log('✅ Cleared sessionStorage');
  } catch (error) {
    console.warn('⚠️ Could not clear sessionStorage:', error.message);
  }
}

/**
 * Test authentication endpoints manually
 */
export async function testAuthEndpoints() {
  console.group('🔗 Testing Authentication Endpoints');
  
  const { default: api } = await import('../services/api.js');
  
  const endpoints = [
    { path: '/auth/check', name: 'Auth Check' },
    { path: '/auth/cookies', name: 'Cookie Debug' },
    { path: '/auth/debug/config', name: 'Config Debug' },
    { path: '/health', name: 'Health Check' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name} (${endpoint.path})...`);
      const response = await api.get(endpoint.path, { timeout: 5000 });
      console.log(`✅ ${endpoint.name}: ${response.status} ${response.statusText}`);
      
      if (endpoint.path === '/auth/check') {
        const data = response.data;
        console.log(`   Authenticated: ${data.data?.authenticated ? '✅' : '❌'}`);
        console.log(`   User: ${data.data?.user?.username || 'None'}`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data:`, error.response.data);
      }
    }
  }
  
  console.groupEnd();
}

/**
 * Export diagnostic functions for global access
 */
if (typeof window !== 'undefined') {
  window.authDiagnostic = {
    runQuick: runQuickDiagnostic,
    clearStorage: clearAuthStorage,
    testEndpoints: testAuthEndpoints,
    fullValidation: validateAuthConfig
  };
  
  console.log('🔧 Auth diagnostic tools available at window.authDiagnostic');
}

export default {
  runQuickDiagnostic,
  clearAuthStorage,
  testAuthEndpoints,
  validateAuthConfig
};