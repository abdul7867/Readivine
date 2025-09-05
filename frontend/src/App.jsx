import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

// Import authentication context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import the page components we created
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, hasCheckedAuth, checkAuthIfNeeded } = useAuth();
  
  // Check authentication only if needed
  React.useEffect(() => {
    if (!hasCheckedAuth && !isLoading) {
      checkAuthIfNeeded();
    }
  }, [checkAuthIfNeeded, hasCheckedAuth, isLoading]);
  
  // Show loading while checking authentication
  if (isLoading || !hasCheckedAuth) {
    return <LoadingSpinner message="Checking authentication..." />;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route Component (redirect to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, hasCheckedAuth } = useAuth();
  
  // Show loading only during initial auth check
  if (isLoading && !hasCheckedAuth) {
    return <LoadingSpinner message="Loading..." />;
  }
  
  // If authenticated, redirect to dashboard
  if (hasCheckedAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
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

      {/* Default route - redirect based on auth status */}
      <Route 
        path="/" 
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        } 
      />
      
      {/* Catch all route - redirect to appropriate page */}
      <Route 
        path="*" 
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
