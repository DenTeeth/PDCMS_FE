/**
 * Helper function to unwrap FormatRestResponse wrapper from BE
 * 
 * BE uses FormatRestResponse.ResponseBodyAdvice to automatically wrap all responses
 * from controllers in this format: { statusCode, message, data: T }
 * 
 * This helper extracts the actual data from the wrapper.
 * 
 * Usage:
 *   const { extractApiResponse } = await import('@/utils/apiResponse');
 *   return extractApiResponse<YourType>(response);
 * 
 * Or import at top of file:
 *   import { extractApiResponse } from '@/utils/apiResponse';
 *   return extractApiResponse<YourType>(response);
 */

export { extractApiResponse } from './apiResponse';

