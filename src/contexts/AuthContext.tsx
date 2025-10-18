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
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
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
      
      if (response.accessToken) {
        // Update access token in localStorage (already done in apiClient)
        setToken(response.accessToken);
        
        // Update user data with new token and expiration time
        const currentUser = getUserData();
        if (currentUser) {
          const updatedUser: User = {
            ...currentUser,
            token: response.accessToken,
            tokenExpiresAt: response.accessTokenExpiresAt,
            refreshTokenExpiresAt: response.refreshTokenExpiresAt,
          };
          
          setUserData(updatedUser);
          setUser(updatedUser);
          setIsAuthenticated(true);
          
          const expiresIn = response.accessTokenExpiresAt 
            ? response.accessTokenExpiresAt - Math.floor(Date.now() / 1000)
            : 'unknown';
          
          console.log('✅ Token refreshed successfully');
          console.log(`⏰ New token expires in: ${expiresIn} seconds`);
          console.log('🍪 Refresh token rotated by backend');
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
        // Fallback: DISABLE auto-refresh if no expiration info
        console.log('⚠️ No token expiration info, auto-refresh disabled');
        return null; // Disable auto-refresh
      }

      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      const expiresAt = userData.tokenExpiresAt; // Backend timestamp in seconds
      const timeUntilExpiry = expiresAt - now; // Seconds until expiration

      console.log(`📊 Token expiration debug:`, {
        now,
        expiresAt,
        timeUntilExpiry,
        expiresAtDate: new Date(expiresAt * 1000).toISOString(),
        nowDate: new Date(now * 1000).toISOString()
      });

      // ⚠️ If token expires in more than 6 hours, something is wrong
      if (timeUntilExpiry > 6 * 60 * 60) {
        console.warn('⚠️ Token expiration time seems too far in future, disabling auto-refresh');
        return null;
      }

      // ⚠️ If token already expired, logout immediately
      if (timeUntilExpiry <= 0) {
        console.warn('⚠️ Token already expired! Logging out...');
        logout();
        return null;
      }

      // Refresh 5 MINUTES BEFORE expiration (not 5 seconds)
      const refreshDelay = Math.max((timeUntilExpiry - 5 * 60) * 1000, 60000); // Convert to ms, min 1 minute

      console.log(`⏰ Token expires in ${Math.floor(timeUntilExpiry / 60)} minutes, will refresh in ${Math.floor(refreshDelay / 60000)} minutes`);
      
      return refreshDelay;
    };

    const delay = calculateRefreshDelay();

    // If delay is null, don't set up timer
    if (delay === null) {
      console.log('⏰ Auto-refresh disabled');
      return;
    }

    console.log(`⏰ Setting up auto-refresh timer (${Math.floor(delay / 60000)} minutes)`);

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
      console.log('🔐 Starting login process...');
      const response = await apiClient.login(credentials);
      
      console.log('📥 Login response received:', response);
      
      // Response now directly contains the data (no statusCode wrapper)
      if (response.token) {
        const userData: User = {
          username: response.username,
          email: response.email,
          roles: response.roles,
          permissions: response.permissions,
          token: response.token,
          tokenExpiresAt: response.tokenExpiresAt,
          refreshTokenExpiresAt: response.refreshTokenExpiresAt,
        };

        console.log('👤 User data prepared:', userData);

        // Store user data in localStorage
        setUserData(userData);
        
        const expiresIn = response.tokenExpiresAt 
          ? response.tokenExpiresAt - Math.floor(Date.now() / 1000)
          : 'unknown';
        
        // Note: accessToken already stored in apiClient.login()
        // Note: refreshToken automatically stored in HTTP-Only Cookie by backend
        console.log('✅ Login successful');
        console.log('📦 Access token stored in localStorage');
        console.log(`⏰ Token expires in: ${expiresIn} seconds`);
        console.log('🍪 Refresh token stored in HTTP-Only Cookie by backend');

        // Update state IMMEDIATELY
        setUser(userData);
        setIsAuthenticated(true);
        
        console.log('✅ Auth state updated - isAuthenticated: true');
      } else {
        throw new Error('Login failed - no token received');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
      console.log('🏁 Login process completed');
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

  // ✅ Permission helper functions
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user?.permissions) return false;
    return user.permissions.includes(permission);
  }, [user]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!user?.permissions || permissions.length === 0) return false;
    return permissions.some(permission => user.permissions.includes(permission));
  }, [user]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    if (!user?.permissions || permissions.length === 0) return false;
    return permissions.every(permission => user.permissions.includes(permission));
  }, [user]);

  const hasRole = useCallback((role: string): boolean => {
    if (!user?.roles) return false;
    return user.roles.includes(role);
  }, [user]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
    refreshAuth,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};