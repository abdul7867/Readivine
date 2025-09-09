import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api"; // Import the centralized api instance
import toast from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    setError("");
    try {
      // Use the new /check endpoint that doesn't require authentication
      const response = await api.get("/auth/check");
      if (
        response.data &&
        response.data.success &&
        response.data.data.authenticated
      ) {
        setIsAuthenticated(true);
        // The user object is nested inside a 'user' property in the response
        setUser(response.data.data.user || null);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      // Enhanced error handling for production debugging
      const errorDetails = {
        message: error.message,
        status: error.response?.status,
        url: error.config?.url,
        timestamp: new Date().toISOString(),
      };

      if (import.meta.env.DEV) {
        console.error("Auth status check failed:", error);
      } else {
        // Store auth errors in localStorage for production debugging
        window.localStorage.setItem(
          "authCheckError",
          JSON.stringify(errorDetails)
        );
      }

      setIsAuthenticated(false);
      setUser(null);
      if (error.response?.status !== 401) {
        const errorMsg = "Failed to check authentication status";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setIsLoading(false);
      setHasCheckedAuth(true);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = () => {
    // The redirect logic is clean and correct.
    // It constructs the full URL to the backend's GitHub auth endpoint.
    let backendUrl =
      import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_PROD_API_URL;

    // Fallback logic for production
    if (!backendUrl) {
      const isDevelopment = import.meta.env.DEV;
      if (isDevelopment) {
        backendUrl = "http://localhost:8080/api/v1";
      } else {
        backendUrl = "https://readivine.onrender.com/api/v1";
      }
    }

    window.location.href = `${backendUrl}/auth/github`;
  };

  const logout = async () => {
    if (isLoggingOut) return; // Prevent multiple logout calls

    setIsLoggingOut(true);
    setIsLoading(true);
    setError("");

    const loadingToast = toast.loading("Signing out...");

    try {
      await api.post("/auth/logout");
      toast.success("Successfully signed out!", { id: loadingToast });

      // Controlled delay for user feedback
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // State updates and navigation after delay
      setIsAuthenticated(false);
      setUser(null);

      // Use window.location instead of navigate hook to avoid routing issues
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.", { id: loadingToast });
    } finally {
      setIsLoading(false);
      setIsLoggingOut(false); // Release the lock
    }
  };

  const checkAuthIfNeeded = async () => {
    if (!hasCheckedAuth && !isLoading) {
      await checkAuthStatus();
    }
  };

  const clearError = () => {
    setError("");
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
