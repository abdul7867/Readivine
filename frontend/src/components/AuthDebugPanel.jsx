import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { debugAuthState, testCookieHandling, simulateAuthFlow } from '../utils/authTestUtils';

const AuthDebugPanel = ({ isVisible = false }) => {
  const [isOpen, setIsOpen] = useState(isVisible);
  const [debugResults, setDebugResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const auth = useAuth();

  if (!import.meta.env.DEV && !window.location.search.includes('debug=true')) {
    return null; // Only show in development or when debug=true is in URL
  }

  const runDebugTest = async (testName, testFunction) => {
    setIsRunning(true);
    try {
      console.log(`🔧 Running ${testName}...`);
      const result = await testFunction();
      setDebugResults(prev => ({
        ...prev,
        [testName]: { success: true, result, timestamp: new Date().toISOString() }
      }));
    } catch (error) {
      console.error(`❌ ${testName} failed:`, error);
      setDebugResults(prev => ({
        ...prev,
        [testName]: { success: false, error: error.message, timestamp: new Date().toISOString() }
      }));
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setDebugResults(null);
    console.clear();
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium"
          title="Open Auth Debug Panel"
        >
          🔧 Debug
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Auth Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="p-4 overflow-y-auto max-h-80">
        {/* Current Auth State */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">Current State</h4>
          <div className="text-xs bg-gray-100 p-2 rounded">
            <div>Authenticated: {auth.isAuthenticated ? '✅' : '❌'}</div>
            <div>Loading: {auth.isLoading ? '⏳' : '✅'}</div>
            <div>Has Checked: {auth.hasCheckedAuth ? '✅' : '❌'}</div>
            <div>Retry Count: {auth.retryCount}</div>
            <div>Redirect Attempts: {auth.redirectAttempts || 0}</div>
            <div>User: {auth.user?.username || 'None'}</div>
            {auth.error && <div className="text-red-600">Error: {auth.error}</div>}
          </div>
        </div>

        {/* Debug Actions */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">Debug Actions</h4>
          <div className="space-y-2">
            <button
              onClick={() => auth.logDebugInfo()}
              disabled={isRunning}
              className="w-full text-left px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded border disabled:opacity-50"
            >
              📊 Log Auth State
            </button>
            
            <button
              onClick={() => runDebugTest('authEndpoints', auth.testAuthEndpoints)}
              disabled={isRunning}
              className="w-full text-left px-2 py-1 text-xs bg-green-50 hover:bg-green-100 rounded border disabled:opacity-50"
            >
              🧪 Test Auth Endpoints
            </button>
            
            <button
              onClick={() => runDebugTest('fullDebug', debugAuthState)}
              disabled={isRunning}
              className="w-full text-left px-2 py-1 text-xs bg-purple-50 hover:bg-purple-100 rounded border disabled:opacity-50"
            >
              🔍 Full Debug Report
            </button>
            
            <button
              onClick={() => runDebugTest('cookieTest', testCookieHandling)}
              disabled={isRunning}
              className="w-full text-left px-2 py-1 text-xs bg-yellow-50 hover:bg-yellow-100 rounded border disabled:opacity-50"
            >
              🍪 Test Cookie Handling
            </button>
            
            <button
              onClick={() => runDebugTest('authFlow', simulateAuthFlow)}
              disabled={isRunning}
              className="w-full text-left px-2 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 rounded border disabled:opacity-50"
            >
              🔄 Simulate Auth Flow
            </button>
            
            <button
              onClick={() => auth.refreshAuthStatus()}
              disabled={isRunning}
              className="w-full text-left px-2 py-1 text-xs bg-orange-50 hover:bg-orange-100 rounded border disabled:opacity-50"
            >
              🔄 Refresh Auth Status
            </button>
            
            <button
              onClick={() => runDebugTest('redirectDebug', auth.getRedirectDebugInfo)}
              disabled={isRunning}
              className="w-full text-left px-2 py-1 text-xs bg-red-50 hover:bg-red-100 rounded border disabled:opacity-50"
            >
              🔄 Check Redirect Loop State
            </button>
            
            <button
              onClick={() => auth.resetRedirectLoop()}
              disabled={isRunning}
              className="w-full text-left px-2 py-1 text-xs bg-gray-50 hover:bg-gray-100 rounded border disabled:opacity-50"
            >
              🔧 Reset Redirect Loop Prevention
            </button>
          </div>
        </div>

        {/* Results */}
        {debugResults && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-700">Results</h4>
              <button
                onClick={clearResults}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
            <div className="text-xs bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
              {Object.entries(debugResults).map(([test, result]) => (
                <div key={test} className="mb-1">
                  <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                    {result.success ? '✅' : '❌'} {test}
                  </span>
                  {!result.success && (
                    <div className="text-red-500 ml-4 text-xs">{result.error}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500">
          <div className="mb-1">💡 Check browser console for detailed logs</div>
          <div>🔧 Available at window.authDebug in console</div>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugPanel;