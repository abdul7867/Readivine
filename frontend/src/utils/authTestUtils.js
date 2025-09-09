// Test utilities for authentication functionality
// This file can be used to manually test authentication logic

import api from '../services/api';

export const testAuthenticationFlow = () => {
  console.log('Testing authentication flow...');
  
  // Test error categorization
  const testErrors = [
    { response: { status: 401 } },
    { response: { status: 500 } },
    { code: 'NETWORK_ERROR' },
    { code: 'ECONNABORTED' },
    { response: { status: 403 } },
    { message: 'Unknown error' }
  ];
  
  const categorizeError = (error) => {
    if (error.response?.status === 401) {
      return { type: 'auth_failure', message: 'Not authenticated' };
    } else if (error.response?.status === 403) {
      return { type: 'auth_failure', message: 'Access forbidden' };
    } else if (!error.response || error.code === 'NETWORK_ERROR') {
      return { type: 'network_error', message: 'Network connection failed' };
    } else if (error.code === 'ECONNABORTED') {
      return { type: 'network_error', message: 'Request timeout' };
    } else if (error.response?.status >= 500) {
      return { type: 'server_error', message: 'Server error occurred' };
    } else {
      return { type: 'unknown_error', message: error.message || 'Unknown error occurred' };
    }
  };
  
  const isRetryableError = (error) => {
    return (
      !error.response ||
      error.code === 'NETWORK_ERROR' ||
      error.code === 'ECONNABORTED' ||
      (error.response?.status >= 500 && error.response?.status < 600)
    );
  };
  
  testErrors.forEach((error, index) => {
    const category = categorizeError(error);
    const retryable = isRetryableError(error);
    console.log(`Test ${index + 1}:`, {
      error: error,
      category: category,
      retryable: retryable
    });
  });
  
  console.log('Authentication flow test completed!');
};

export const logAuthState = (authContext) => {
  console.log('Current Auth State:', {
    isAuthenticated: authContext.isAuthenticated,
    isLoading: authContext.isLoading,
    hasCheckedAuth: authContext.hasCheckedAuth,
    retryCount: authContext.retryCount,
    user: authContext.user ? {
      username: authContext.user.username,
      email: authContext.user.email
    } : null,
    error: authContext.error
  });
};

// Comprehensive authentication debugging utilities
export const debugAuthState = async () => {
  console.group('🔍 Authentication Debug Report');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Check browser environment
    console.group('📱 Browser Environment');
    console.log('User Agent:', navigator.userAgent);
    console.log('Cookies Enabled:', navigator.cookieEnabled);
    console.log('Current URL:', window.location.href);
    console.log('Origin:', window.location.origin);
    console.log('Protocol:', window.location.protocol);
    console.groupEnd();
    
    // Check document cookies (limited visibility due to httpOnly)
    console.group('🍪 Cookie Information');
    console.log('Document Cookies:', document.cookie || 'No accessible cookies');
    console.log('Note: httpOnly cookies are not visible here');
    console.groupEnd();
    
    // Check local/session storage
    console.group('💾 Storage Information');
    console.log('LocalStorage Keys:', Object.keys(localStorage));
    console.log('SessionStorage Keys:', Object.keys(sessionStorage));
    console.groupEnd();
    
    // Test backend connectivity
    console.group('🌐 Backend Connectivity');
    try {
      const cookieDebugResponse = await api.get('/auth/cookies');
      console.log('✅ Cookie Debug Response:', cookieDebugResponse.data);
    } catch (error) {
      console.error('❌ Cookie Debug Failed:', error.message);
    }
    
    try {
      const configDebugResponse = await api.get('/auth/debug/config');
      console.log('✅ Config Debug Response:', configDebugResponse.data);
    } catch (error) {
      console.error('❌ Config Debug Failed:', error.message);
    }
    
    try {
      const oauthDebugResponse = await api.get('/auth/debug/oauth');
      console.log('✅ OAuth Debug Response:', oauthDebugResponse.data);
    } catch (error) {
      console.error('❌ OAuth Debug Failed:', error.message);
    }
    console.groupEnd();
    
    // Test authentication status
    console.group('🔐 Authentication Status');
    try {
      const authCheckResponse = await api.get('/auth/check');
      console.log('✅ Auth Check Response:', authCheckResponse.data);
    } catch (error) {
      console.error('❌ Auth Check Failed:', error.message);
    }
    
    try {
      const authStatusResponse = await api.get('/auth/status');
      console.log('✅ Auth Status Response:', authStatusResponse.data);
    } catch (error) {
      console.error('❌ Auth Status Failed:', error.message);
    }
    console.groupEnd();
    
  } catch (error) {
    console.error('❌ Debug process failed:', error);
  }
  
  console.groupEnd();
};

export const testCookieHandling = async () => {
  console.group('🍪 Cookie Handling Test');
  
  try {
    // Test setting a test cookie
    document.cookie = 'test_cookie=test_value; path=/; SameSite=Lax';
    console.log('✅ Test cookie set successfully');
    
    // Check if test cookie is readable
    const testCookieExists = document.cookie.includes('test_cookie=test_value');
    console.log('Test cookie readable:', testCookieExists ? '✅ Yes' : '❌ No');
    
    // Test backend cookie debug endpoint
    const response = await api.get('/auth/cookies');
    console.log('Backend cookie debug response:', response.data);
    
    // Clean up test cookie
    document.cookie = 'test_cookie=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    console.log('✅ Test cookie cleaned up');
    
  } catch (error) {
    console.error('❌ Cookie test failed:', error);
  }
  
  console.groupEnd();
};

export const simulateAuthFlow = async () => {
  console.group('🔄 Authentication Flow Simulation');
  
  try {
    console.log('1. Testing initial auth check...');
    const initialCheck = await api.get('/auth/check');
    console.log('Initial auth status:', initialCheck.data);
    
    console.log('2. Testing OAuth debug info...');
    const oauthDebug = await api.get('/auth/debug/oauth');
    console.log('OAuth configuration:', oauthDebug.data);
    
    console.log('3. Simulating OAuth redirect URL...');
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const oauthUrl = `${backendUrl}/auth/github`;
    console.log('OAuth initiation URL:', oauthUrl);
    console.log('To test OAuth flow, visit:', oauthUrl);
    
  } catch (error) {
    console.error('❌ Auth flow simulation failed:', error);
  }
  
  console.groupEnd();
};

export const inspectNetworkRequests = () => {
  console.group('🌐 Network Request Inspector');
  
  // Intercept fetch requests for debugging
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const [url, options] = args;
    console.log('🚀 Outgoing Request:', {
      url,
      method: options?.method || 'GET',
      headers: options?.headers,
      credentials: options?.credentials,
      timestamp: new Date().toISOString()
    });
    
    try {
      const response = await originalFetch(...args);
      console.log('✅ Response Received:', {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      });
      return response;
    } catch (error) {
      console.error('❌ Request Failed:', {
        url,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  };
  
  console.log('✅ Network request inspector activated');
  console.log('To disable, call: restoreNetworkRequests()');
  
  // Store original fetch for restoration
  window._originalFetch = originalFetch;
  
  console.groupEnd();
};

export const restoreNetworkRequests = () => {
  if (window._originalFetch) {
    window.fetch = window._originalFetch;
    delete window._originalFetch;
    console.log('✅ Network request inspector disabled');
  }
};

// Make debugging functions available globally for easy console access
if (typeof window !== 'undefined') {
  window.authDebug = {
    debugAuthState,
    testCookieHandling,
    simulateAuthFlow,
    inspectNetworkRequests,
    restoreNetworkRequests,
    logAuthState,
    testAuthenticationFlow
  };
  
  console.log('🔧 Auth debugging utilities available at window.authDebug');
}