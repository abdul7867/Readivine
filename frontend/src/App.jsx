import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

// Import authentication context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import the page components we created
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DebugPage from './pages/DebugPage';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, hasCheckedAuth } = useAuth();
  
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
