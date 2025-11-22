import { useState, useEffect, useCallback, useMemo } from 'react';
import { createAuthAPI } from '../utils/authAPI';

/**
 * useAuth - React hook for authentication state management
 * 
 * @param {string} apiBaseUrl - Base URL for API (required)
 * @returns {Object} Auth state and methods
 */
export function useAuth(apiBaseUrl) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Create API client
  const authAPI = useMemo(() => {
    if (!apiBaseUrl) {
      console.error('useAuth: apiBaseUrl is required');
      return null;
    }
    return createAuthAPI(apiBaseUrl);
  }, [apiBaseUrl]);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUser(user);
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error('Failed to load user from localStorage:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    if (!authAPI) {
      throw new Error('API not configured');
    }

    try {
      const response = await authAPI.login(email, password);
      
      if (response.success && response.user) {
        const user = response.user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        setUser(user);
        setIsAuthenticated(true);
        return { success: true, user };
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      throw error;
    }
  }, [authAPI]);

  const logout = useCallback(() => {
    localStorage.removeItem('currentUser');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const register = useCallback(async (userData) => {
    if (!authAPI) {
      throw new Error('API not configured');
    }

    try {
      const response = await authAPI.register(userData);
      return response;
    } catch (error) {
      throw error;
    }
  }, [authAPI]);

  const resendVerification = useCallback(async (email) => {
    if (!authAPI) {
      throw new Error('API not configured');
    }

    try {
      const response = await authAPI.resendVerification(email);
      return response;
    } catch (error) {
      throw error;
    }
  }, [authAPI]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    resendVerification,
  };
}

