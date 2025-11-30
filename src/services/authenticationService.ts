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

  /**
   * Reset password using token from email
   * Used for both password reset and initial password setup
   * 
   * BE Requirements:
   * - Endpoint: POST /api/v1/auth/reset-password (public, no auth required)
   * - Request body: { token: string, newPassword: string, confirmPassword: string }
   * - Token must be valid, not expired, and not used
   * - Token expires after 24 hours
   * - After password reset, token is marked as used (usedAt is set)
   * - Account mustChangePassword is set to false after reset
   * 
   * @param token Password reset token from email (UUID format)
   * @param newPassword New password (must meet BE validation requirements)
   * @param confirmPassword Confirm password (must match newPassword)
   * @returns Success message
   * @throws Error if token is invalid, expired, or already used
   * @throws Error if passwords don't match
   * @throws Error if password doesn't meet requirements
   */
  async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ message: string }> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    // Log request for debugging
    console.log('🔐 Reset password request:', {
      token: token.substring(0, 8) + '...', // Only log first 8 chars for security
      hasNewPassword: !!newPassword,
      hasConfirmPassword: !!confirmPassword,
      passwordsMatch: newPassword === confirmPassword,
    });
    
    try {
      const response = await axiosInstance.post(`${this.endpoint}/reset-password`, {
        token,
        newPassword,
        confirmPassword,
      });
      
      console.log('✅ Reset password success:', response.data);
      
      if (response.data?.data) {
        return response.data.data;
      }
      return response.data || { message: 'Password reset successfully' };
    } catch (error: any) {
      console.error('❌ Reset password error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const authenticationService = new AuthenticationService();

