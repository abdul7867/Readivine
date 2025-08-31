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
    checkAuthIfNeeded();
  }, [checkAuthIfNeeded]);
  
  if (isLoading || !hasCheckedAuth) {
    return <LoadingSpinner message="Checking authentication..." />;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, hasCheckedAuth } = useAuth();
  
  // For public routes, only show loading if we're actually checking auth
  if (isLoading && hasCheckedAuth) {
    return <LoadingSpinner message="Checking authentication..." />;
  }
  
  // If we haven't checked auth yet, don't redirect - just show the public content
  if (!hasCheckedAuth) {
    return children;
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" /> : children;
};

// App Routes Component (needs to be inside AuthProvider)
const AppRoutes = () => {
  const { isAuthenticated, hasCheckedAuth } = useAuth();
  
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

      {/* Default route - only redirect if we've checked auth */}
      <Route 
        path="/" 
        element={
          hasCheckedAuth ? 
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} /> : 
            <Navigate to="/login" />
        } 
      />
      
      {/* Catch all route - redirect to appropriate page */}
      <Route 
        path="*" 
        element={
          hasCheckedAuth ? 
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} /> : 
            <Navigate to="/login" />
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
