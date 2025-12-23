/**
 * Chatbot Type Definitions
 * 
 * Based on BE ChatbotController and ChatbotService
 * Last updated: January 2025
 */

/**
 * Request DTO for sending message to chatbot
 */
export interface ChatRequest {
  message: string;
}

/**
 * Response DTO from chatbot API
 */
export interface ChatResponse {
  message: string;
  timestamp: string;
}

/**
 * Chat message displayed in UI
 */
export interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

/**
 * Knowledge base categories (from BE)
 */
export type KnowledgeId = 
  | 'GREETING'
  | 'PRICE_LIST'
  | 'SYMPTOM_TOOTHACHE'
  | 'ADDRESS'
  | 'UNKNOWN';

