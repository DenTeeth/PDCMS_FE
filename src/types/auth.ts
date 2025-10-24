// Authentication types for API integration
export interface LoginRequest {
  username: string;
  password: string;
}

// Sidebar navigation item
export interface SidebarItem {
  title: string;
  path: string;
}

// Grouped permissions by domain
export interface GroupedPermissions {
  [domain: string]: string[];
}

// Sidebar navigation structure
export interface SidebarNavigation {
  [domain: string]: SidebarItem[];
}

// Response từ /api/v1/auth/login
export interface LoginResponse {
  token: string; // JWT access token
  refreshToken: string | null;
  tokenExpiresAt: number; // Unix timestamp in seconds
  refreshTokenExpiresAt: number; // Unix timestamp in seconds
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  groupedPermissions: GroupedPermissions;
  baseRole: string; // BE now provides baseRole directly
  employmentType: string | null;
  mustChangePassword: boolean;
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
  groupedPermissions: GroupedPermissions;
  baseRole: string; // 'admin' | 'employee' | 'patient'
  employmentType: string | null;
  mustChangePassword: boolean;
  token: string;
  tokenExpiresAt?: number;
  refreshTokenExpiresAt?: number;
  employeeId?: string; // Add employeeId for employee-specific operations
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