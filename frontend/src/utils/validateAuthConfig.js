/**
 * Authentication Configuration Validator
 * 
 * Validates that all necessary environment variables and configurations
 * are properly set for the authentication system to work correctly.
 */

import api, { getApiDebugInfo, testApiConnectivity } from '../services/api.js';

export class AuthConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  /**
   * Validate frontend environment configuration
   */
  validateFrontendConfig() {
    const env = import.meta.env;
    
    // Check environment detection
    if (!env.DEV && !env.PROD) {
      this.errors.push('Unable to detect environment (neither DEV nor PROD is true)');
    }
    
    // Production-specific checks
    if (env.PROD) {
      if (!env.VITE_API_BASE_URL) {
        this.errors.push('VITE_API_BASE_URL is required in production');
      } else {
        if (!env.VITE_API_BASE_URL.startsWith('https://')) {
          this.warnings.push('VITE_API_BASE_URL should use HTTPS in production');
        }
        
        if (env.VITE_API_BASE_URL.includes('localhost')) {
          this.warnings.push('VITE_API_BASE_URL appears to be localhost in production');
        }
      }
    }
    
    // Development-specific checks
    if (env.DEV) {
      if (env.VITE_API_BASE_URL && !env.VITE_API_BASE_URL.includes('localhost')) {
        this.info.push('Using non-localhost API URL in development');
      }
    }
    
    // Check for common misconfigurations
    if (env.VITE_API_BASE_URL && env.VITE_API_BASE_URL.endsWith('/')) {
      this.warnings.push('VITE_API_BASE_URL should not end with a slash');
    }
    
    return {
      environment: env.PROD ? 'production' : 'development',
      apiBaseUrl: env.VITE_API_BASE_URL || 'default',
      hasRequiredVars: env.PROD ? !!env.VITE_API_BASE_URL : true
    };
  }

  /**
   * Validate API configuration
   */
  validateApiConfig() {
    try {
      const debugInfo = getApiDebugInfo();
      
      // Check API instance configuration
      if (!debugInfo.baseURL) {
        this.errors.push('API base URL is not configured');
      }
      
      if (!debugInfo.withCredentials) {
        this.errors.push('API credentials are not enabled (required for cross-domain auth)');
      }
      
      if (debugInfo.timeout < 10000) {
        this.warnings.push('API timeout is less than 10 seconds, may cause issues with slow connections');
      }
      
      // Check headers
      const headers = debugInfo.headers || {};
      if (headers['Content-Type'] !== 'application/json') {
        this.warnings.push('API Content-Type header is not set to application/json');
      }
      
      return {
        baseURL: debugInfo.baseURL,
        withCredentials: debugInfo.withCredentials,
        timeout: debugInfo.timeout,
        headers: headers,
        isOnline: debugInfo.isOnline
      };
      
    } catch (error) {
      this.errors.push(`Failed to validate API configuration: ${error.message}`);
      return null;
    }
  }

  /**
   * Test API connectivity
   */
  async testApiConnectivity() {
    try {
      const result = await testApiConnectivity();
      
      if (!result.success) {
        this.errors.push(`API connectivity test failed: ${result.error?.message || 'Unknown error'}`);
        return {
          success: false,
          error: result.error,
          baseURL: result.baseURL
        };
      }
      
      this.info.push('API connectivity test passed');
      return {
        success: true,
        status: result.status,
        baseURL: result.baseURL,
        responseTime: result.responseTime
      };
      
    } catch (error) {
      this.errors.push(`API connectivity test error: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test authentication endpoints
   */
  async testAuthEndpoints() {
    const endpoints = [
      { path: '/auth/check', name: 'Auth Check', required: true },
      { path: '/auth/cookies', name: 'Cookie Debug', required: false },
      { path: '/auth/debug/config', name: 'Config Debug', required: false },
      { path: '/health', name: 'Health Check', required: false }
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint.path, { timeout: 5000 });
        results[endpoint.name] = {
          success: true,
          status: response.status,
          path: endpoint.path
        };
        
        if (endpoint.required) {
          this.info.push(`Required endpoint ${endpoint.path} is accessible`);
        }
        
      } catch (error) {
        results[endpoint.name] = {
          success: false,
          error: error.message,
          status: error.response?.status,
          path: endpoint.path
        };
        
        if (endpoint.required) {
          this.errors.push(`Required endpoint ${endpoint.path} is not accessible: ${error.message}`);
        } else {
          this.warnings.push(`Optional endpoint ${endpoint.path} is not accessible: ${error.message}`);
        }
      }
    }
    
    return results;
  }

  /**
   * Validate browser environment
   */
  validateBrowserEnvironment() {
    const checks = {
      cookiesEnabled: navigator.cookieEnabled,
      localStorage: typeof Storage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      fetch: typeof fetch !== 'undefined',
      isOnline: navigator.onLine,
      userAgent: navigator.userAgent,
      protocol: window.location.protocol,
      origin: window.location.origin
    };
    
    // Check for potential issues
    if (!checks.cookiesEnabled) {
      this.errors.push('Cookies are disabled in this browser (required for authentication)');
    }
    
    if (!checks.localStorage) {
      this.warnings.push('localStorage is not available (may affect error logging)');
    }
    
    if (!checks.isOnline) {
      this.warnings.push('Browser appears to be offline');
    }
    
    if (checks.protocol !== 'https:' && import.meta.env.PROD) {
      this.errors.push('HTTPS is required in production for secure cookies');
    }
    
    return checks;
  }

  /**
   * Check for common authentication issues
   */
  checkCommonIssues() {
    const issues = [];
    
    // Check localStorage for previous errors
    try {
      const authError = localStorage.getItem('authCheckError');
      if (authError) {
        const error = JSON.parse(authError);
        issues.push({
          type: 'previous_auth_error',
          message: 'Previous authentication error found in localStorage',
          details: error
        });
      }
      
      const networkError = localStorage.getItem('lastNetworkError');
      if (networkError) {
        const error = JSON.parse(networkError);
        issues.push({
          type: 'previous_network_error',
          message: 'Previous network error found in localStorage',
          details: error
        });
      }
      
      const redirectState = localStorage.getItem('redirectLoopPrevention');
      if (redirectState) {
        const state = JSON.parse(redirectState);
        if (state.circuitOpen) {
          issues.push({
            type: 'redirect_circuit_open',
            message: 'Redirect circuit breaker is currently open',
            details: state
          });
        }
      }
      
    } catch (error) {
      this.warnings.push(`Failed to check localStorage for previous issues: ${error.message}`);
    }
    
    return issues;
  }

  /**
   * Run comprehensive validation
   */
  async runFullValidation() {
    const startTime = Date.now();
    
    console.log('🔍 Running authentication configuration validation...');
    
    // Reset arrays
    this.errors = [];
    this.warnings = [];
    this.info = [];
    
    const results = {
      timestamp: new Date().toISOString(),
      frontend: this.validateFrontendConfig(),
      api: this.validateApiConfig(),
      browser: this.validateBrowserEnvironment(),
      commonIssues: this.checkCommonIssues()
    };
    
    // Test connectivity
    console.log('🌐 Testing API connectivity...');
    results.connectivity = await this.testApiConnectivity();
    
    // Test endpoints
    console.log('🔗 Testing authentication endpoints...');
    results.endpoints = await this.testAuthEndpoints();
    
    const duration = Date.now() - startTime;
    
    results.summary = {
      duration,
      errors: this.errors.length,
      warnings: this.warnings.length,
      info: this.info.length,
      status: this.errors.length === 0 ? 'healthy' : 'unhealthy'
    };
    
    results.messages = {
      errors: this.errors,
      warnings: this.warnings,
      info: this.info
    };
    
    return results;
  }

  /**
   * Generate human-readable report
   */
  generateReport(results) {
    const lines = [];
    
    lines.push('🔐 Authentication Configuration Report');
    lines.push('='.repeat(50));
    lines.push('');
    
    // Summary
    lines.push(`Status: ${results.summary.status === 'healthy' ? '✅ Healthy' : '❌ Issues Found'}`);
    lines.push(`Duration: ${results.summary.duration}ms`);
    lines.push(`Errors: ${results.summary.errors}`);
    lines.push(`Warnings: ${results.summary.warnings}`);
    lines.push('');
    
    // Environment
    lines.push('📋 Environment Configuration');
    lines.push(`Environment: ${results.frontend.environment}`);
    lines.push(`API Base URL: ${results.frontend.apiBaseUrl}`);
    lines.push(`Required Variables: ${results.frontend.hasRequiredVars ? '✅' : '❌'}`);
    lines.push('');
    
    // API Configuration
    if (results.api) {
      lines.push('🔧 API Configuration');
      lines.push(`Base URL: ${results.api.baseURL}`);
      lines.push(`Credentials: ${results.api.withCredentials ? '✅' : '❌'}`);
      lines.push(`Timeout: ${results.api.timeout}ms`);
      lines.push('');
    }
    
    // Connectivity
    lines.push('🌐 Connectivity');
    lines.push(`API Reachable: ${results.connectivity.success ? '✅' : '❌'}`);
    if (results.connectivity.success) {
      lines.push(`Response Status: ${results.connectivity.status}`);
    } else {
      lines.push(`Error: ${results.connectivity.error}`);
    }
    lines.push('');
    
    // Browser Environment
    lines.push('🌍 Browser Environment');
    lines.push(`Cookies Enabled: ${results.browser.cookiesEnabled ? '✅' : '❌'}`);
    lines.push(`Protocol: ${results.browser.protocol}`);
    lines.push(`Online: ${results.browser.isOnline ? '✅' : '❌'}`);
    lines.push('');
    
    // Errors
    if (this.errors.length > 0) {
      lines.push('❌ Errors');
      this.errors.forEach(error => lines.push(`  • ${error}`));
      lines.push('');
    }
    
    // Warnings
    if (this.warnings.length > 0) {
      lines.push('⚠️  Warnings');
      this.warnings.forEach(warning => lines.push(`  • ${warning}`));
      lines.push('');
    }
    
    // Recommendations
    lines.push('💡 Recommendations');
    if (results.summary.status === 'healthy') {
      lines.push('  • Your authentication configuration looks good!');
      lines.push('  • Consider running the full test suite for comprehensive validation');
    } else {
      lines.push('  • Fix the errors listed above');
      lines.push('  • Review the warnings for potential improvements');
      lines.push('  • Test the authentication flow manually after fixes');
    }
    
    return lines.join('\n');
  }
}

/**
 * Quick validation function for use in components
 */
export async function validateAuthConfig() {
  const validator = new AuthConfigValidator();
  const results = await validator.runFullValidation();
  
  console.log(validator.generateReport(results));
  
  return results;
}

/**
 * Export for use in tests and debugging
 */
export default AuthConfigValidator;