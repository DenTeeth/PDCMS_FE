'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, AuthState, LoginRequest } from '@/types/auth';
import { apiClient } from '@/lib/api';
import { getToken, getUserData, setUserData, setToken, clearAuthData } from '@/lib/cookies';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }

        const token = getToken();
        const userData = getUserData();
        
        if (token && userData) {
          // Token exists, set authenticated
          setUser(userData);
          setIsAuthenticated(true);
          
          console.log('✅ User authenticated from localStorage');
        } else {
          console.log('❌ No authentication data found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Refresh auth function with useCallback to avoid re-creating on every render
  const refreshAuth = useCallback(async () => {
    try {
      console.log('🔄 Attempting to refresh token...');
      const response = await apiClient.refreshToken();
      
      if (response.data && response.data.accessToken) {
        // Update access token in localStorage (already done in apiClient)
        setToken(response.data.accessToken);
        
        // Update user data with new token and expiration time
        const currentUser = getUserData();
        if (currentUser) {
          const updatedUser: User = {
            ...currentUser,
            token: response.data.accessToken,
            tokenExpiresAt: response.data.accessTokenExpiresAt,
            refreshTokenExpiresAt: response.data.refreshTokenExpiresAt,
          };
          
          setUserData(updatedUser);
          setUser(updatedUser);
          setIsAuthenticated(true);
          
          const expiresIn = response.data.accessTokenExpiresAt 
            ? response.data.accessTokenExpiresAt - Math.floor(Date.now() / 1000)
            : 'unknown';
          
          console.log('✅ Token refreshed successfully');
          console.log(`⏰ New token expires in: ${expiresIn} seconds`);
          console.log('🍪 Refresh token rotated by backend in HTTP-Only Cookie');
        }
      } else {
        throw new Error('No access token received from refresh');
      }
    } catch (error) {
      console.error('❌ Failed to refresh token:', error);
      clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  }, []); // Empty deps because it only uses external functions

  // Auto-refresh token before expiration (synced with backend)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Calculate time until token expires
    const calculateRefreshDelay = () => {
      const userData = getUserData();
      if (!userData?.tokenExpiresAt) {
        // Fallback: refresh every 10 seconds if no expiration info
        console.log('⚠️ No token expiration info, using fallback 10s refresh');
        return 10000;
      }

      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      const expiresAt = userData.tokenExpiresAt; // Backend timestamp in seconds
      const timeUntilExpiry = expiresAt - now; // Seconds until expiration

      // ⚠️ If token already expired, refresh immediately but only once
      if (timeUntilExpiry <= 0) {
        console.warn('⚠️ Token already expired! Refreshing immediately...');
        return 100; // 100ms to avoid infinite loop, will fail and logout
      }

      // Refresh 5 seconds BEFORE expiration
      const refreshDelay = Math.max((timeUntilExpiry - 5) * 1000, 1000); // Convert to ms, min 1s

      console.log(`⏰ Token expires in ${timeUntilExpiry}s, will refresh in ${Math.floor(refreshDelay / 1000)}s`);
      
      return refreshDelay;
    };

    const delay = calculateRefreshDelay();

    console.log(`⏰ Setting up auto-refresh timer (${Math.floor(delay / 1000)} seconds)`);

    const refreshTimeout = setTimeout(async () => {
      try {
        console.log('⏰ Auto-refreshing token (synced with backend expiration)...');
        await refreshAuth();
        // Success: useEffect will re-run with new user data and set new timer
      } catch (error) {
        console.error('❌ Auto-refresh failed:', error);
        // User will be logged out (setIsAuthenticated(false) already called in refreshAuth)
        // useEffect will NOT re-run because dependencies changed, avoiding infinite loop
      }
    }, delay);

    return () => {
      console.log('⏰ Clearing auto-refresh timer');
      clearTimeout(refreshTimeout);
    };
  }, [isAuthenticated, user, refreshAuth]);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.login(credentials);
      
      if (response.statusCode === 200 && response.data) {
        const userData: User = {
          username: response.data.username,
          email: response.data.email,
          roles: response.data.roles,
          permissions: response.data.permissions,
          token: response.data.token,
          tokenExpiresAt: response.data.accessTokenExpiresAt,
          refreshTokenExpiresAt: response.data.refreshTokenExpiresAt,
        };

        // Store user data in localStorage
        setUserData(userData);
        
        const expiresIn = response.data.accessTokenExpiresAt 
          ? response.data.accessTokenExpiresAt - Math.floor(Date.now() / 1000)
          : 'unknown';
        
        // Note: accessToken already stored in apiClient.login()
        // Note: refreshToken automatically stored in HTTP-Only Cookie by backend
        console.log('✅ Login successful');
        console.log('📦 Access token stored in localStorage');
        console.log(`⏰ Token expires in: ${expiresIn} seconds`);
        console.log('🍪 Refresh token stored in HTTP-Only Cookie by backend');

        setUser(userData);
        setIsAuthenticated(true);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call API logout (will clear HTTP-Only Cookie on backend)
      await apiClient.logout();
      console.log('✅ Logout successful');
    } catch (error) {
      console.warn('⚠️ Logout API call failed:', error);
    } finally {
      // Always clear state and localStorage
      clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      console.log('🗑️ Local auth state cleared');
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};