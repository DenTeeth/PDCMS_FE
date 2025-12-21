/**
 * Holiday Management Types
 * Based on BE Holiday Management API Documentation
 * Updated: January 2025
 * 
 * Reference: docs/message_from_BE/holiday/Holiday_Management_API_Test_Guide.md
 */

// Holiday Definition (yearly recurring holidays)
export interface HolidayDefinition {
  definitionId: string; // e.g., "TET_2025", "NEW_YEAR"
  holidayName: string; // e.g., "Tết Nguyên Đán 2025"
  holidayType: 'NATIONAL' | 'COMPANY'; // Type of holiday (matches BE)
  description?: string;
  createdAt?: string; // Format: "2025-11-01 23:12:49"
  updatedAt?: string; // Format: "2025-11-01 23:12:49"
  totalDates?: number; // Count of holiday dates for this definition
}

// Holiday Date (specific date instance)
export interface HolidayDate {
  holidayDate: string; // YYYY-MM-DD
  definitionId: string;
  holidayName?: string; // Populated from definition
  description?: string;
  createdAt?: string; // Format: "2025-11-01 23:12:49"
  updatedAt?: string; // Format: "2025-11-01 23:12:49"
}

// Holiday Check Response
export interface HolidayCheckResponse {
  isHoliday: boolean;
  // Note: BE returns { isHoliday: true/false } only
  // Additional fields may be populated in some responses
  holidayDate?: string;
  holidayName?: string;
  year?: number;
}

// Holiday Range Response
// BE returns array of HolidayDate directly
export interface HolidayRangeResponse {
  holidays: Array<{
    date: string; // YYYY-MM-DD
    holidayName: string;
    definitionId: string;
  }>;
}

// Next Working Day Response
export interface NextWorkingDayResponse {
  requestedDate: string;
  nextWorkingDay: string;
  daysSkipped: number;
  holidaysSkipped: string[];
}

// Note: CreateHolidayDateRequest moved above

// Create Holiday Definition Request
export interface CreateHolidayDefinitionRequest {
  definitionId: string;
  holidayName: string;
  holidayType: 'NATIONAL' | 'COMPANY'; // Required in BE
  description?: string;
}

// Update Holiday Definition Request
export interface UpdateHolidayDefinitionRequest {
  definitionId?: string; // Optional, can update ID
  holidayName?: string;
  holidayType?: 'NATIONAL' | 'COMPANY';
  description?: string;
}

// Create Holiday Date Request
export interface CreateHolidayDateRequest {
  holidayDate: string; // YYYY-MM-DD
  definitionId: string;
  description?: string;
}

// Update Holiday Date Request
export interface UpdateHolidayDateRequest {
  holidayDate: string; // YYYY-MM-DD (required, must match URL param)
  definitionId: string; // Required, must match URL param
  description?: string;
}

// Error Response with enhanced data object
export interface HolidayErrorResponse {
  errorCode: string;
  message: string;
  data?: {
    definitionId?: string;
    holidayDate?: string;
    startDate?: string;
    endDate?: string;
    missingFields?: string[];
    expectedFormat?: string;
    example?: string;
    requiredPermission?: string;
    parameter?: string;
  };
}

