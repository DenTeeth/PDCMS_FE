// Authentication types for API integration
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  statusCode: number;
  error: string | null;
  message: string;
  data: {
    token: string; // accessToken
    refreshToken: string;
    accessTokenExpiresAt: number; // Unix timestamp in seconds
    refreshTokenExpiresAt: number; // Unix timestamp in seconds
    username: string;
    email: string;
    roles: string[];
    permissions: string[];
    // Legacy fields for backward compatibility
    tokenExpiresAt?: number;
  };
}

export interface RefreshTokenResponse {
  statusCode: number;
  error: string | null;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt?: number; // Unix timestamp in seconds
    refreshTokenExpiresAt?: number; // Unix timestamp in seconds
    // Legacy fields for backward compatibility
    tokenExpiresAt?: number;
  };
}

export interface User {
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  token: string;
  // Note: refreshToken is stored in HTTP-Only Cookie by backend, not accessible from JS
  refreshToken?: string; // Optional, for backward compatibility
  tokenExpiresAt?: number; // Optional, for backward compatibility
  refreshTokenExpiresAt?: number; // Optional, for backward compatibility
}

export interface UserProfile {
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}