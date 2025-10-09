'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginRequest } from '@/types/auth';
import { apiClient } from '@/lib/api';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
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
  // TEMPORARILY MODIFIED FOR UI DEVELOPMENT: Setting default authenticated state
  const [user, setUser] = useState<User | null>({
    username: 'dev_user',
    email: 'dev@example.com',
    roles: ['ADMIN', 'MANAGER', 'DENTIST', 'RECEPTIONIST', 'ACCOUNTANT', 'WAREHOUSE'],
    permissions: ['*'],
    token: 'fake-token-for-development',
    tokenExpiresAt: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
  });
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Always authenticated for UI development
  const [isLoading, setIsLoading] = useState(false); // No loading state
  const [error, setError] = useState<string | null>(null);

  /* ORIGINAL CODE - TEMPORARILY DISABLED
  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          const now = Math.floor(Date.now() / 1000);
          
          // Check if token is still valid
          if (parsedUser.tokenExpiresAt > now) {
            setUser(parsedUser);
            setIsAuthenticated(true);
          } else {
            // Token expired, clear storage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);
  */
  
  // For UI development - no initialization needed
  useEffect(() => {
    console.log('Authentication context initialized with fake user for UI development');
  }, []);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      // TEMPORARILY MODIFIED FOR UI DEVELOPMENT: Bypass actual login API call
      console.log('Login bypassed for UI development:', credentials);
      
      // Mock successful login
      const mockUserData: User = {
        username: credentials.username,
        email: `${credentials.username}@example.com`,
        roles: ['ADMIN', 'MANAGER', 'DENTIST', 'RECEPTIONIST', 'ACCOUNTANT', 'WAREHOUSE'],
        permissions: ['*'],
        token: 'fake-token-for-development',
        tokenExpiresAt: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
      };
      
      // Store fake data in localStorage
      localStorage.setItem('auth_token', mockUserData.token);
      localStorage.setItem('user_data', JSON.stringify(mockUserData));
      
      setUser(mockUserData);
      setIsAuthenticated(true);
      
      /* ORIGINAL CODE - TEMPORARILY DISABLED
      const response = await apiClient.login(credentials);
      
      if (response.statusCode === 200 && response.data) {
        const userData: User = {
          username: response.data.username,
          email: response.data.email,
          roles: response.data.roles,
          permissions: response.data.permissions,
          token: response.data.token,
          tokenExpiresAt: response.data.tokenExpiresAt,
        };

        // Store in localStorage
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user_data', JSON.stringify(userData));

        setUser(userData);
        setIsAuthenticated(true);
      } else {
        throw new Error(response.message || 'Login failed');
      }
      */
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
      // TEMPORARILY MODIFIED FOR UI DEVELOPMENT: Bypass actual logout API call
      console.log('Logout intercepted for UI development - maintaining authenticated state');
      
      /* ORIGINAL CODE - TEMPORARILY DISABLED
      // Call API logout
      await apiClient.logout();
      */
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // For UI development - re-initialize fake user instead of clearing
      const mockUserData: User = {
        username: 'dev_user',
        email: 'dev@example.com',
        roles: ['ADMIN', 'MANAGER', 'DENTIST', 'RECEPTIONIST', 'ACCOUNTANT', 'WAREHOUSE'],
        permissions: ['*'],
        token: 'fake-token-for-development',
        tokenExpiresAt: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
      };
      setUser(mockUserData);
      
      /* ORIGINAL CODE - TEMPORARILY DISABLED
      // Always clear local state
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      */
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
