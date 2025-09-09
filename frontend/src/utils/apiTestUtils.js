/**
 * API Testing Utilities
 * Provides functions to test and debug API configuration
 */

import api, { getApiDebugInfo, clearApiDebugInfo, testApiConnectivity } from '../services/api';

/**
 * Comprehensive API configuration test
 * Tests all aspects of the API service configuration
 */
export const runApiConfigurationTest = async () => {
  const testResults = {
    timestamp: new Date().toISOString(),
    environment: import.meta.env.DEV ? 'development' : 'production',
    tests: {},
  };

  console.log('🧪 Running API Configuration Tests...');

  // Test 1: Basic configuration
  testResults.tests.basicConfig = {
    name: 'Basic Configuration',
    passed: false,
    details: {},
  };

  try {
    const debugInfo = getApiDebugInfo();
    testResults.tests.basicConfig.details = {
      baseURL: debugInfo.baseURL,
      withCredentials: debugInfo.withCredentials,
      timeout: debugInfo.timeout,
      hasValidBaseURL: !!debugInfo.baseURL && debugInfo.baseURL.includes('api/v1'),
      hasCredentials: debugInfo.withCredentials === true,
      hasTimeout: debugInfo.timeout > 0,
    };

    testResults.tests.basicConfig.passed = 
      testResults.tests.basicConfig.details.hasValidBaseURL &&
      testResults.tests.basicConfig.details.hasCredentials &&
      testResults.tests.basicConfig.details.hasTimeout;

    console.log('✅ Basic Configuration:', testResults.tests.basicConfig.passed ? 'PASSED' : 'FAILED');
  } catch (error) {
    testResults.tests.basicConfig.error = error.message;
    console.log('❌ Basic Configuration: FAILED -', error.message);
  }

  // Test 2: Environment variable usage
  testResults.tests.environmentConfig = {
    name: 'Environment Configuration',
    passed: false,
    details: {},
  };

  try {
    const envVars = {
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      VITE_PROD_API_URL: import.meta.env.VITE_PROD_API_URL,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
    };

    testResults.tests.environmentConfig.details = {
      ...envVars,
      hasApiBaseUrl: !!envVars.VITE_API_BASE_URL,
      hasProdApiUrl: !!envVars.VITE_PROD_API_URL,
      environmentDetected: envVars.DEV || envVars.PROD,
    };

    testResults.tests.environmentConfig.passed = 
      testResults.tests.environmentConfig.details.hasApiBaseUrl &&
      testResults.tests.environmentConfig.details.environmentDetected;

    console.log('✅ Environment Configuration:', testResults.tests.environmentConfig.passed ? 'PASSED' : 'FAILED');
  } catch (error) {
    testResults.tests.environmentConfig.error = error.message;
    console.log('❌ Environment Configuration: FAILED -', error.message);
  }

  // Test 3: API connectivity (if possible)
  testResults.tests.connectivity = {
    name: 'API Connectivity',
    passed: false,
    details: {},
  };

  try {
    console.log('🔄 Testing API connectivity...');
    const connectivityResult = await testApiConnectivity();
    testResults.tests.connectivity.details = connectivityResult;
    testResults.tests.connectivity.passed = connectivityResult.success;

    console.log('✅ API Connectivity:', connectivityResult.success ? 'PASSED' : 'FAILED');
    if (!connectivityResult.success) {
      console.log('   Error:', connectivityResult.error);
    }
  } catch (error) {
    testResults.tests.connectivity.error = error.message;
    console.log('❌ API Connectivity: FAILED -', error.message);
  }

  // Test 4: Cross-domain configuration
  testResults.tests.crossDomain = {
    name: 'Cross-Domain Configuration',
    passed: false,
    details: {},
  };

  try {
    const currentOrigin = window.location.origin;
    const apiBaseURL = api.defaults.baseURL;
    const apiOrigin = new URL(apiBaseURL).origin;
    
    testResults.tests.crossDomain.details = {
      currentOrigin,
      apiOrigin,
      isCrossDomain: currentOrigin !== apiOrigin,
      withCredentials: api.defaults.withCredentials,
      hasProperCorsConfig: api.defaults.withCredentials && currentOrigin !== apiOrigin,
    };

    testResults.tests.crossDomain.passed = 
      !testResults.tests.crossDomain.details.isCrossDomain || 
      testResults.tests.crossDomain.details.hasProperCorsConfig;

    console.log('✅ Cross-Domain Configuration:', testResults.tests.crossDomain.passed ? 'PASSED' : 'FAILED');
  } catch (error) {
    testResults.tests.crossDomain.error = error.message;
    console.log('❌ Cross-Domain Configuration: FAILED -', error.message);
  }

  // Summary
  const passedTests = Object.values(testResults.tests).filter(test => test.passed).length;
  const totalTests = Object.keys(testResults.tests).length;
  
  console.log(`\n📊 Test Summary: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All API configuration tests passed!');
  } else {
    console.log('⚠️  Some API configuration tests failed. Check the details above.');
  }

  return testResults;
};

/**
 * Quick API health check
 * Performs a simple connectivity test
 */
export const quickApiHealthCheck = async () => {
  console.log('🏥 Performing quick API health check...');
  
  try {
    const result = await testApiConnectivity();
    
    if (result.success) {
      console.log('✅ API is healthy and reachable');
      return true;
    } else {
      console.log('❌ API health check failed:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ API health check error:', error.message);
    return false;
  }
};

/**
 * Debug API issues
 * Provides comprehensive debugging information
 */
export const debugApiIssues = () => {
  console.log('🔍 API Debug Information:');
  
  const debugInfo = getApiDebugInfo();
  
  console.log('Configuration:', {
    baseURL: debugInfo.baseURL,
    withCredentials: debugInfo.withCredentials,
    timeout: debugInfo.timeout,
    environment: debugInfo.environment,
  });
  
  console.log('Network Status:', {
    isOnline: debugInfo.isOnline,
    connectionType: debugInfo.connectionType,
    currentURL: debugInfo.currentURL,
  });
  
  if (debugInfo.recentErrors.errorLog.length > 0) {
    console.log('Recent Errors:', debugInfo.recentErrors.errorLog);
  } else {
    console.log('No recent errors found');
  }
  
  return debugInfo;
};

export default {
  runApiConfigurationTest,
  quickApiHealthCheck,
  debugApiIssues,
  getApiDebugInfo,
  clearApiDebugInfo,
};