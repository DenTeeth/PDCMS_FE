import { LoginRequest, LoginResponse, ApiError } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if token exists
    const token = this.getToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`API request failed: ${error.message}`);
      }
      throw new Error('API request failed: Unknown error');
    }
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    /* TEMPORARILY DISABLED FOR UI DEVELOPMENT
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    */
    
    // Mock response for UI development
    console.log('API login call intercepted for UI development:', credentials);
    return Promise.resolve({
      statusCode: 200,
      error: null,
      message: 'Login successful',
      data: {
        username: credentials.username,
        email: `${credentials.username}@example.com`,
        roles: ['ADMIN', 'MANAGER', 'DENTIST', 'RECEPTIONIST', 'ACCOUNTANT', 'WAREHOUSE'],
        permissions: ['*'],
        token: 'fake-token-for-development',
        tokenExpiresAt: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
        refreshTokenExpiresAt: Math.floor(Date.now() / 1000) + 604800, // 7 days from now
      }
    });
  }

  async logout(): Promise<void> {
    try {
      /* TEMPORARILY DISABLED FOR UI DEVELOPMENT
      // Call logout API endpoint
      await this.request('/auth/logout', {
        method: 'POST',
      });
      */
      console.log('API logout call intercepted for UI development');
    } catch (error) {
      // Even if API call fails, we should still clear local storage
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local storage
      if (typeof window !== 'undefined') {
        /* TEMPORARILY DISABLED FOR UI DEVELOPMENT
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        */
        console.log('Local storage clear bypassed for UI development');
      }
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export for testing
export { ApiClient };
