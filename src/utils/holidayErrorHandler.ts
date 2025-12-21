/**
 * Holiday Error Handler Utility
 * 
 * Handles enhanced error responses from BE Holiday Management API
 * BE returns custom error codes with helpful data objects
 * 
 * Reference: docs/message_from_BE/holiday/Holiday_Management_API_Test_Guide.md
 */

import { HolidayErrorResponse } from '@/types/holiday';

export interface ParsedHolidayError {
  errorCode: string;
  message: string;
  userMessage: string;
  details?: {
    definitionId?: string;
    holidayDate?: string;
    startDate?: string;
    endDate?: string;
    missingFields?: string[];
    expectedFormat?: string;
    example?: string;
    requiredPermission?: string;
  };
}

/**
 * Parse holiday error response and return user-friendly message
 */
export function parseHolidayError(error: any): ParsedHolidayError {
  // Check if it's the enhanced error format
  if (error.response?.data?.errorCode) {
    const errorData: HolidayErrorResponse = error.response.data;
    
    return {
      errorCode: errorData.errorCode,
      message: errorData.message,
      userMessage: getHolidayErrorMessage(errorData),
      details: errorData.data,
    };
  }
  
  // Fallback for generic errors
  return {
    errorCode: 'UNKNOWN_ERROR',
    message: error.message || 'Có lỗi xảy ra',
    userMessage: error.message || 'Có lỗi xảy ra khi xử lý yêu cầu',
  };
}

/**
 * Get user-friendly error message based on error code
 */
function getHolidayErrorMessage(error: HolidayErrorResponse): string {
  const { errorCode, message, data } = error;
  
  switch (errorCode) {
    case 'DUPLICATE_HOLIDAY_DEFINITION':
      return `Định nghĩa ngày lễ "${data?.definitionId || ''}" đã tồn tại. Vui lòng chọn ID khác.`;
    
    case 'DUPLICATE_HOLIDAY_DATE':
      return `Ngày nghỉ "${data?.holidayDate || ''}" đã tồn tại cho định nghĩa "${data?.definitionId || ''}".`;
    
    case 'INVALID_DATE_RANGE':
      return `Khoảng thời gian không hợp lệ. Ngày bắt đầu (${data?.startDate || ''}) phải nhỏ hơn hoặc bằng ngày kết thúc (${data?.endDate || ''}).`;
    
    case 'HOLIDAY_DEFINITION_NOT_FOUND':
      return `Không tìm thấy định nghĩa ngày lễ với ID: ${data?.definitionId || ''}`;
    
    case 'HOLIDAY_DATE_NOT_FOUND':
      return `Không tìm thấy ngày nghỉ "${data?.holidayDate || ''}" cho định nghĩa "${data?.definitionId || ''}".`;
    
    case 'VALIDATION_ERROR':
      if (data?.missingFields && data.missingFields.length > 0) {
        return `Thiếu các trường bắt buộc: ${data.missingFields.join(', ')}`;
      }
      return message || 'Dữ liệu không hợp lệ';
    
    case 'INVALID_DATE_FORMAT':
      if (data?.expectedFormat && data?.example) {
        return `Định dạng ngày không hợp lệ. Định dạng mong đợi: ${data.expectedFormat}. Ví dụ: ${data.example}`;
      }
      return message || 'Định dạng ngày không hợp lệ';
    
    case 'FORBIDDEN':
      if (data?.requiredPermission) {
        return `Bạn không có quyền thực hiện thao tác này. Quyền yêu cầu: ${data.requiredPermission}`;
      }
      return 'Bạn không có quyền truy cập tài nguyên này';
    
    case 'HOLIDAY_CONFLICT':
      return `Không thể thực hiện thao tác vào ngày nghỉ lễ: ${data?.holidayDate || ''}`;
    
    default:
      return message || 'Có lỗi xảy ra';
  }
}

/**
 * Check if error is a holiday-specific error
 */
export function isHolidayError(error: any): boolean {
  const errorCodes = [
    'DUPLICATE_HOLIDAY_DEFINITION',
    'DUPLICATE_HOLIDAY_DATE',
    'INVALID_DATE_RANGE',
    'HOLIDAY_DEFINITION_NOT_FOUND',
    'HOLIDAY_DATE_NOT_FOUND',
    'VALIDATION_ERROR',
    'INVALID_DATE_FORMAT',
    'FORBIDDEN',
    'HOLIDAY_CONFLICT',
  ];
  
  const errorCode = error.response?.data?.errorCode || error.errorCode;
  return errorCodes.includes(errorCode);
}

/**
 * Get error code from error object
 */
export function getHolidayErrorCode(error: any): string | null {
  return error.response?.data?.errorCode || error.errorCode || null;
}

