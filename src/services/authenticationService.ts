/**
 * Authentication Service
 * 
 * Handles authentication-related API operations including password reset and verification
 * Last updated: 2025-01-26
 */

import { apiClient } from '@/lib/api';

/**
 * Authentication Service Class
 * Handles authentication, password reset, and email verification operations
 */
class AuthenticationService {
  private readonly endpoint = '/auth';

  /**
   * Resend password setup email for patient with PENDING_VERIFICATION status
   * Uses forgot-password endpoint which works for accounts that need password setup
   * 
   * @param email Patient email address
   * @returns Success message
   */
  async resendPasswordSetupEmail(email: string): Promise<{ message: string }> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.post(`${this.endpoint}/forgot-password`, {
      email,
    });
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data || { message: 'Password setup email sent successfully' };
  }

  /**
   * Resend verification email for account verification
   * 
   * @param email Account email address
   * @returns Success message
   */
  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.post(`${this.endpoint}/resend-verification`, {
      email,
    });
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data || { message: 'Verification email sent successfully' };
  }
}

// Export singleton instance
export const authenticationService = new AuthenticationService();

