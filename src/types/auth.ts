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
    token: string;
    tokenExpiresAt: number;
    refreshTokenExpiresAt: number;
    username: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
}

export interface User {
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  token: string;
  tokenExpiresAt: number;
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
