/**
 * Holiday Management Types
 * Based on BE_4: Treatment Plan Auto-Scheduling
 * Updated: December 11, 2025
 */

// Holiday Definition (yearly recurring holidays)
export interface HolidayDefinition {
  definitionId: string; // e.g., "TET_2025", "NEW_YEAR"
  holidayName: string; // e.g., "Tết Nguyên Đán 2025"
  holidayType?: 'ANNUAL' | 'LUNAR' | 'FIXED'; // Type of holiday
  description?: string;
  dates?: string[]; // Array of dates for this holiday (YYYY-MM-DD)
}

// Holiday Date (specific date instance)
export interface HolidayDate {
  holidayDate: string; // YYYY-MM-DD
  definitionId: string;
  holidayName?: string; // Populated from definition
}

// Holiday Check Response
export interface HolidayCheckResponse {
  date: string;
  isHoliday: boolean;
  holidayName?: string;
  definitionId?: string;
}

// Holiday Range Response
export interface HolidayRangeResponse {
  startDate: string;
  endDate: string;
  totalHolidays: number;
  holidays: Array<{
    date: string;
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

// Create Holiday Date Request
export interface CreateHolidayDateRequest {
  definitionId: string;
  holidayDate: string; // YYYY-MM-DD
}

// Create Holiday Definition Request
export interface CreateHolidayDefinitionRequest {
  definitionId: string;
  holidayName: string;
  holidayType?: 'ANNUAL' | 'LUNAR' | 'FIXED';
  description?: string;
}

// Update Holiday Definition Request
export interface UpdateHolidayDefinitionRequest {
  holidayName?: string;
  holidayType?: 'ANNUAL' | 'LUNAR' | 'FIXED';
  description?: string;
}

