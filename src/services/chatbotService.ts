/**
 * Chatbot Service
 * 
 * Public endpoint - không cần authentication
 * Based on BE ChatbotController
 * Last updated: January 2025
 */

import axios, { AxiosInstance } from 'axios';
import { ChatRequest, ChatResponse } from '@/types/chatbot';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://pdcms.duckdns.org/api/v1';

/**
 * Chatbot Service Class
 * Handles chatbot API operations (public endpoint, no auth required)
 */
class ChatbotService {
  private readonly endpoint = '/chatbot/chat';
  private axiosInstance: AxiosInstance;

  constructor() {
    // Create axios instance for public endpoint (no auth interceptor)
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      // No withCredentials needed for public endpoint
    });
  }

  /**
   * Send message to chatbot and get response
   * @param message User's message
   * @returns Chatbot response
   */
  async sendMessage(message: string): Promise<ChatResponse> {
    try {
      const request: ChatRequest = { message: message.trim() };
      
      const response = await this.axiosInstance.post<ChatResponse>(
        this.endpoint,
        request
      );

      return response.data;
    } catch (error: any) {
      // Handle error response
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      // Network or other errors
      throw new Error(
        error.message || 'Không thể kết nối đến chatbot. Vui lòng thử lại sau.'
      );
    }
  }
}

// Export singleton instance
export const chatbotService = new ChatbotService();

