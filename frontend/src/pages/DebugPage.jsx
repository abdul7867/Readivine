import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const DebugPage = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Collect debug information
    const info = {
      // Environment
      environment: import.meta.env.MODE,
      isProduction: import.meta.env.PROD,
      isDevelopment: import.meta.env.DEV,
      
      // URLs
      currentUrl: window.location.href,
      currentOrigin: window.location.origin,
      currentHostname: window.location.hostname,
      
      // API Configuration
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
      prodApiUrl: import.meta.env.VITE_PROD_API_URL,
      
      // Auth Status
      isAuthenticated,
      hasUser: !!user,
      userInfo: user ? { id: user._id, username: user.username } : null,
      
      // Cookies
      cookies: document.cookie,
      
      // Local Storage Debug Data
      lastLoginAttempt: JSON.parse(localStorage.getItem('lastLoginAttempt') || 'null'),
      authCheckError: JSON.parse(localStorage.getItem('authCheckError') || 'null'),
      lastServerError: JSON.parse(localStorage.getItem('lastServerError') || 'null'),
      lastNetworkError: JSON.parse(localStorage.getItem('lastNetworkError') || 'null'),
      
      // Browser Info
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };
    
    setDebugInfo(info);
  }, [isAuthenticated, user]);

  const clearDebugData = () => {
    localStorage.removeItem('lastLoginAttempt');
    localStorage.removeItem('authCheckError');
    localStorage.removeItem('lastServerError');
    localStorage.removeItem('lastNetworkError');
    window.location.reload();
  };

  const downloadDebugInfo = () => {
    const dataStr = JSON.stringify(debugInfo, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `readivine-debug-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Debug Information</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <button
              onClick={downloadDebugInfo}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Download Debug Info
            </button>
            <button
              onClick={clearDebugData}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Clear Debug Data
            </button>
          </div>
          
          <div className="bg-gray-50 rounded p-4 overflow-auto">
            <pre className="text-sm">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
