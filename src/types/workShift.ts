// Work Shift Types

export type WorkShiftCategory = 'NORMAL' | 'NIGHT';

export interface WorkShift {
  workShiftId: string;
  shiftName: string;
  startTime: string; // HH:mm:ss format
  endTime: string; // HH:mm:ss format
  category: WorkShiftCategory;
  isActive: boolean;
  durationHours: number;
}

export interface CreateWorkShiftRequest {
  shiftName: string;
  startTime: string; // HH:mm:ss format
  endTime: string; // HH:mm:ss format
  category: WorkShiftCategory;
}

export interface UpdateWorkShiftRequest {
  shiftName?: string;
  startTime?: string; // HH:mm:ss format
  endTime?: string; // HH:mm:ss format
  category?: WorkShiftCategory;
}

export interface WorkShiftResponse {
  statusCode: number;
  error: string | null;
  message: string;
  data: WorkShift;
}

export interface WorkShiftListResponse {
  statusCode: number;
  error: string | null;
  message: string;
  data: WorkShift[];
}
