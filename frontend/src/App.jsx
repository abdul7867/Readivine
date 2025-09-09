import { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Import authentication context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import the page components we created
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DebugPage from './pages/DebugPage';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import AuthDebugPanel from './components/AuthDebugPanel';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { 
    isAuthenticated, 
    isLoading, 
    hasCheckedAuth, 
    error, 
    retryCount, 
    refreshAuthStatus,
    safeRedirect,
    handleAuthenticationFailure,
    resetRedirectLoop,
    redirectAttempts
  } = useAuth();

  // Handle redirect for unauthenticated users
  useEffect(() => {
    if (hasCheckedAuth && !isLoading && !isAuthenticated && !error) {
      safeRedirect('/login', 'auth_check');
    }
  }, [hasCheckedAuth, isLoading, isAuthenticated, error, safeRedirect]);
  
  // Show loading while checking authentication or during retries
  if (isLoading || !hasCheckedAuth) {
    const message = retryCount > 0 
      ? `Checking authentication... (attempt ${retryCount + 1})`
      : "Checking authentication...";
    return <LoadingSpinner message={message} />;
  }
  
  // If there's an authentication error (not just "not authenticated"), show retry option
  if (error && error.includes('Authentication check failed')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg border border-amber-200">
          <h2 className="text-xl font-semibold text-amber-900 mb-4">Authentication Check Failed</h2>
          <p className="text-amber-700 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={refreshAuthStatus}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors block w-full"
            >
              Retry Authentication Check
            </button>
            {redirectAttempts > 0 && (
              <button
                onClick={resetRedirectLoop}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors block w-full"
              >
                Reset Redirect Loop Prevention
              </button>
            )}
            <button
              onClick={() => handleAuthenticationFailure(new Error(error))}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors block w-full"
            >
              Use Fallback Options
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If there's a redirect loop error, show specific handling
  if (error && (error.includes('Too many redirects') || error.includes('circuit breaker'))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg border border-red-200">
          <h2 className="text-xl font-semibold text-red-900 mb-4">Redirect Loop Detected</h2>
          <p className="text-red-700 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={resetRedirectLoop}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors block w-full"
            >
              Reset and Try Again
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors block w-full"
            >
              Go to Login (Force)
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // If not authenticated and no error, show loading while redirect happens
  if (!isAuthenticated) {
    return <LoadingSpinner message="Redirecting to login..." />;
  }
  
  return children;
};

// Public Route Component (redirect to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, hasCheckedAuth, safeRedirect } = useAuth();

  // Handle redirect for authenticated users
  useEffect(() => {
    if (hasCheckedAuth && !isLoading && isAuthenticated) {
      safeRedirect('/dashboard', 'dashboard_redirect');
    }
  }, [hasCheckedAuth, isLoading, isAuthenticated, safeRedirect]);
  
  // Show loading only during initial auth check
  if (isLoading && !hasCheckedAuth) {
    return <LoadingSpinner message="Loading..." />;
  }
  
  // If authenticated, show loading while redirect happens
  if (hasCheckedAuth && isAuthenticated) {
    return <LoadingSpinner message="Redirecting to dashboard..." />;
  }
  
  return children;
};

// App Routes Component (needs to be inside AuthProvider)
const AppRoutes = () => {
  const { isAuthenticated, hasCheckedAuth, isLoading } = useAuth();
  
  // Show loading during initial auth check
  if (isLoading && !hasCheckedAuth) {
    return <LoadingSpinner message="Initializing application..." />;
  }
  
  return (
    <Routes>
      {/* Public route for login page */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />

      {/* Protected route for dashboard */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />

      {/* Debug route - only accessible in development or with special flag */}
      <Route 
        path="/debug" 
        element={<DebugPage />} 
      />

      {/* Default route - redirect based on auth status */}
      <Route 
        path="/" 
        element={
          hasCheckedAuth ? (
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
          ) : (
            <LoadingSpinner message="Loading..." />
          )
        } 
      />
      
      {/* Catch all route - redirect to appropriate page */}
      <Route 
        path="*" 
        element={
          hasCheckedAuth ? (
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
          ) : (
            <LoadingSpinner message="Loading..." />
          )
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <AppRoutes />
          <AuthDebugPanel />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fef3c7', // amber-100
                color: '#92400e', // amber-800
                border: '1px solid #f59e0b', // amber-500
              },
              success: {
                style: {
                  background: '#dcfce7', // green-100
                  color: '#166534', // green-800
                  border: '1px solid #22c55e', // green-500
                },
              },
              error: {
                style: {
                  background: '#fee2e2', // red-100
                  color: '#991b1b', // red-800
                  border: '1px solid #ef4444', // red-500
                },
              },
            }}
          />
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
