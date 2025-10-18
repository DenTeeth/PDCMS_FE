// Authentication types for API integration
export interface LoginRequest {
  username: string;
  password: string;
}

// Response từ /api/v1/auth/login
export interface LoginResponse {
  token: string; // JWT access token
  refreshToken: string;
  tokenExpiresAt: number; // Unix timestamp in seconds
  refreshTokenExpiresAt: number; // Unix timestamp in seconds
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
}

// Response từ /api/v1/auth/refresh-token
export interface RefreshTokenResponse {
  accessToken: string;
  accessTokenExpiresAt: number; // Unix timestamp in seconds
  refreshToken: string;
  refreshTokenExpiresAt: number; // Unix timestamp in seconds
}

export interface User {
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  token: string;
  tokenExpiresAt?: number;
  refreshTokenExpiresAt?: number;
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