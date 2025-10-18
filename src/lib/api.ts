import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { LoginRequest, LoginResponse, RefreshTokenResponse } from '@/types/auth';
import { getToken, setToken, clearAuthData } from '@/lib/cookies';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

class ApiClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor(baseURL: string) {
    // Create axios instance
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // ⚠️ CRITICAL: Send cookies with requests (for refreshToken)
    });

    // Request interceptor: Add access token to headers
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const accessToken = getToken();
        
        if (accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: Handle 401/500 (token expired) and auto-refresh
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError<any>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Check if token expired
        // Backend may return 401 or 500 when token expired
        const isTokenExpired = 
          error.response?.status === 401 ||
          error.response?.status === 500; // Backend trả về 500 khi token expired

        // If token expired and not already retrying and not the refresh endpoint
        if (
          isTokenExpired &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/refresh-token') &&
          !originalRequest.url?.includes('/auth/login')
        ) {
          console.log(`⚠️ Token expired detected (${error.response?.status}):`, error.response?.data);

          if (this.isRefreshing) {
            // If already refreshing, queue this request
            console.log('⏳ Request queued, waiting for token refresh...');
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return this.axiosInstance(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            console.log('🔄 Access token expired, refreshing...');
            console.log('📤 Calling refresh endpoint with credentials...');
            
            // Debug: check if cookies exist (only in browser)
            if (typeof document !== 'undefined') {
              console.log('🍪 Document cookies:', document.cookie);
            }
            
            // Call refresh token endpoint (refreshToken sent via HTTP-Only Cookie)
            // Use a fresh axios instance to avoid interceptor loop
            const refreshAxios = axios.create({
              baseURL: API_BASE_URL,
              withCredentials: true, // MUST send cookies
              headers: {
                'Content-Type': 'application/json'
              }
            });

            const response = await refreshAxios.post('/auth/refresh-token', {});

            console.log('📥 Refresh response:', response.data);

            // Handle different response structures
            // Could be: { accessToken: "..." } or { data: { accessToken: "..." } }
            const accessToken = response.data.accessToken || response.data.data?.accessToken;

            if (!accessToken) {
              console.error('❌ No access token in response. Full response:', response.data);
              throw new Error('No access token received from refresh');
            }

            // Update access token in localStorage
            setToken(accessToken);
            console.log('✅ Access token refreshed successfully:', accessToken.substring(0, 20) + '...');

            // Process all queued requests with new token
            console.log(`✅ Processing ${this.failedQueue.length} queued requests`);
            this.failedQueue.forEach((prom) => prom.resolve(accessToken));
            this.failedQueue = [];

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            console.log('🔄 Retrying original request with new token...');
            return this.axiosInstance(originalRequest);
          } catch (refreshError: any) {
            // Refresh failed → Clear data and redirect to login
            console.error('❌ Token refresh failed:', refreshError.response?.data || refreshError.message);
            this.failedQueue.forEach((prom) => prom.reject(refreshError));
            this.failedQueue = [];
            
            clearAuthData();
            
            if (typeof window !== 'undefined') {
              console.log('🚪 Redirecting to login...');
              window.location.href = '/login';
            }
            
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic request method
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.request<T>({
        method,
        url: endpoint,
        data,
      });
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await this.axiosInstance.post<LoginResponse>(
        '/auth/login',
        credentials
      );

      // Store access token in localStorage
      if (response.data.token) {
        setToken(response.data.token);
        console.log('✅ Access token stored in localStorage');
      }

      // Note: refreshToken is automatically stored in HTTP-Only Cookie by backend
      console.log('🍪 Refresh token stored in HTTP-Only Cookie by backend');

      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      throw new Error(message);
    }
  }

  // Refresh token (refreshToken sent automatically via HTTP-Only Cookie)
  async refreshToken(): Promise<RefreshTokenResponse> {
    try {
      console.log('🔄 Refreshing access token...');
      
      // POST to refresh endpoint - refreshToken sent automatically via cookie
      const response = await this.axiosInstance.post<RefreshTokenResponse>(
        '/auth/refresh-token'
      );

      // Store new access token in localStorage
      if (response.data.accessToken) {
        setToken(response.data.accessToken);
        console.log('✅ New access token stored in localStorage');
      }

      // Note: Backend automatically rotates refreshToken in HTTP-Only Cookie
      console.log('🍪 Refresh token rotated by backend');

      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Token refresh failed';
      console.error('❌ Refresh token failed:', message);
      throw new Error(message);
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout API endpoint
      await this.axiosInstance.post('/auth/logout');
      console.log('✅ Logout API call successful');
    } catch (error: any) {
      // Even if API call fails, we should still clear local data
      console.warn('⚠️ Logout API call failed:', error.message);
    } finally {
      // Always clear localStorage
      clearAuthData();
      console.log('🗑️ Local auth data cleared');
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('GET', '/health');
  }

  // Get axios instance for direct use if needed
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}
// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export for testing
export { ApiClient };