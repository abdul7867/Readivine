import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true,
});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Check authentication status on app load
  const checkAuthStatus = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await apiClient.get('/auth/status');
      
      if (response.data && response.data.success) {
        setIsAuthenticated(true);
        setUser(response.data.user || null);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      
      // Only set error if it's not a 401 (unauthorized)
      if (error.response?.status !== 401) {
        setError('Failed to check authentication status');
      }
    } finally {
      setIsLoading(false);
      setHasCheckedAuth(true);
    }
  };

  // Login function
  const login = async () => {
    try {
      // Redirect to GitHub OAuth
      window.location.href = 'http://localhost:8080/api/auth/github';
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed. Please try again.');
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
      // Don't show error to user for logout failures
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
    }
  };

  // Clear error function
  const clearError = () => {
    setError('');
  };

  // Smart authentication check - only check if not already checked
  const checkAuthIfNeeded = async () => {
    if (!hasCheckedAuth && !isLoading) {
      await checkAuthStatus();
    }
  };



  const value = {
    isAuthenticated,
    isLoading,
    user,
    error,
    hasCheckedAuth,
    login,
    logout,
    clearError,
    checkAuthStatus,
    checkAuthIfNeeded,
    apiClient, // Expose configured axios instance
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;