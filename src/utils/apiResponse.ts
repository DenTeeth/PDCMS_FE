/**
 * API Response Utilities
 * Standardizes response extraction from BE API calls
 * 
 * BE Response Patterns:
 * 1. Direct response: { data: T }
 * 2. Wrapped response: { statusCode: 200, message: "...", data: T }
 * 3. Spring Page: { content: T[], totalElements: number, ... }
 */

import { AxiosResponse } from 'axios';

/**
 * Extract data from BE API response
 * Handles both direct and wrapped response formats
 */
export function extractApiResponse<T>(response: AxiosResponse<T>): T {
  const rawData = response.data;
  
  // Pattern 1: Direct response (most common)
  if (rawData && typeof rawData === 'object' && 'data' in rawData) {
    // Pattern 2: Wrapped response { statusCode, message, data }
    return (rawData as any).data;
  }
  
  // Pattern 1: Direct response
  return rawData;
}

/**
 * Extract paginated response (Spring Page format)
 */
export function extractPageResponse<T>(response: AxiosResponse<any>): {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
} {
  const rawData = response.data;
  const data = extractApiResponse(response);
  
  // Handle Spring Page format
  if (Array.isArray(data)) {
    // Fallback: if response is array directly
    return {
      content: data as T[],
      totalElements: data.length,
      totalPages: 1,
      size: data.length,
      number: 0,
    };
  }
  
  // Normal Spring Page structure
  return {
    content: (data?.content || data?.items || []) as T[],
    totalElements: Number(data?.totalElements ?? data?.total_elements ?? data?.totalItems ?? 0),
    totalPages: Number(data?.totalPages ?? data?.total_pages ?? 1),
    size: Number(data?.size ?? 20),
    number: Number(data?.number ?? data?.page ?? 0),
  };
}

/**
 * Extract error message from API error
 */
export function extractErrorMessage(error: any): string {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'Unknown error occurred';
}

/**
 * Extract error code from API error
 */
export function extractErrorCode(error: any): string | undefined {
  return error.response?.data?.errorCode || error.response?.data?.error_code || error.code;
}

/**
 * Create enhanced error with context
 */
export function createApiError(
  error: any,
  context: {
    endpoint: string;
    method: string;
    params?: any;
  }
): Error {
  const message = extractErrorMessage(error);
  const code = extractErrorCode(error);
  const status = error.response?.status;
  
  const enhancedError = new Error(message) as any;
  enhancedError.code = code;
  enhancedError.status = status;
  enhancedError.endpoint = context.endpoint;
  enhancedError.method = context.method;
  enhancedError.params = context.params;
  enhancedError.originalError = error;
  
  return enhancedError;
}

