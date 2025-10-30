/**
 * Employee Shift Service
 * Based on EMPLOYEE_SHIFT_API_TEST_GUIDE.md specification (BE-307)
 */

import { apiClient } from '@/lib/api';
import {
  EmployeeShift,
  EmployeeShiftApiResponse,
  EmployeeShiftDetail,
  EmployeeShiftListResponse,
  CreateShiftRequest,
  UpdateShiftRequest,
  ShiftSummaryResponse,
  ApiResponse,
  PaginatedResponse,
  ShiftSource,
  ShiftStatus,
} from '@/types/employeeShift';

export class EmployeeShiftService {
  private static readonly BASE_URL = '/shifts';

  /**
   * Convert API response to frontend format
   */
  private static convertApiResponse(apiShift: EmployeeShiftApiResponse): EmployeeShift {
    return {
      employeeShiftId: apiShift.employee_shift_id,
      employeeId: apiShift.employee.employee_id,
      workShiftId: apiShift.work_shift.work_shift_id,
      workDate: apiShift.work_date,
      status: apiShift.status as ShiftStatus,
      shiftType: apiShift.source as ShiftSource,
      notes: apiShift.notes,
      employee: {
        employeeId: apiShift.employee.employee_id,
        firstName: apiShift.employee.full_name.split(' ')[0] || '',
        lastName: apiShift.employee.full_name.split(' ').slice(1).join(' ') || '',
        fullName: apiShift.employee.full_name,
        employmentType: apiShift.employee.position,
      },
      workShift: {
        workShiftId: apiShift.work_shift.work_shift_id,
        shiftName: apiShift.work_shift.shift_name,
        startTime: apiShift.work_shift.start_time,
        endTime: apiShift.work_shift.end_time,
        category: 'NORMAL', // Default category
      },
      createdAt: apiShift.created_at,
      updatedAt: apiShift.updated_at,
    };
  }

  /**
  /**
   * 1. GET /api/v1/shifts - Get Shift Calendar
   * Lấy danh sách ca làm việc để hiển thị trên lịch
   */
  static async getShifts(params?: {
    start_date?: string;
    end_date?: string;
    employee_id?: number;
    status?: ShiftStatus;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<EmployeeShift[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    if (params?.end_date) {
      queryParams.append('end_date', params.end_date);
    }
    if (params?.employee_id) {
      queryParams.append('employee_id', params.employee_id.toString());
    }
    if (params?.status) {
      queryParams.append('status', params.status);
    }
    if (params?.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      queryParams.append('size', params.size.toString());
    }
    if (params?.sort) {
      queryParams.append('sort', params.sort);
    }

    const url = queryParams.toString() 
      ? `${this.BASE_URL}?${queryParams.toString()}`
      : this.BASE_URL;

    console.log('🔍 EmployeeShiftService.getShifts - API Call:', {
      url,
      params,
      queryString: queryParams.toString()
    });

    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<PaginatedResponse<EmployeeShiftApiResponse>>(url);
    
    console.log('✅ EmployeeShiftService.getShifts - Response:', {
      status: response.status,
      data: response.data
    });
    
    // Convert API response to frontend format
    const convertedShifts = (response.data.content || []).map(apiShift => 
      this.convertApiResponse(apiShift)
    );
    
    return convertedShifts;
  }

  /**
   * 2. GET /api/v1/shifts/{id} - Get Shift Detail
   * Lấy chi tiết 1 ca làm việc
   */
  static async getShiftById(shiftId: string): Promise<EmployeeShiftDetail> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<ApiResponse<EmployeeShiftDetail>>(`${this.BASE_URL}/${shiftId}`);
    return response.data.data;
  }

  /**
   * 3. GET /api/v1/shifts/summary - Get Shift Summary
   * Lấy thống kê tổng quan về lịch làm việc
   */
  static async getShiftSummary(params: {
    start_date: string;
    end_date: string;
    employee_id?: number;
  }): Promise<ShiftSummaryResponse> {
    const queryParams = new URLSearchParams();
    
    // start_date và end_date là bắt buộc
    queryParams.append('start_date', params.start_date);
    queryParams.append('end_date', params.end_date);
    
    // employee_id là optional
    if (params.employee_id) {
      queryParams.append('employee_id', params.employee_id.toString());
    }

    const url = `${this.BASE_URL}/summary?${queryParams.toString()}`;

    console.log('Summary API URL:', url);

    const axios = apiClient.getAxiosInstance();
    const response = await axios.get(url);
    
    console.log('Summary API Response:', response.data);
    
    // Handle both wrapped and direct response formats
    if (response.data && Array.isArray(response.data)) {
      // Direct array response
      return response.data;
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      // Wrapped response
      return response.data.data;
    } else {
      console.error('Unexpected response format:', response.data);
      return [];
    }
  }


  // Helper methods for backward compatibility
  static async getShiftsByDate(date: string): Promise<EmployeeShift[]> {
    const response = await this.getShifts({ 
      start_date: date, 
      end_date: date 
    });
    return response;
  }

  static   async getShiftsByDateRange(
    startDate: string,
    endDate: string,
    employeeId?: number
  ): Promise<EmployeeShift[]> {
    const response = await this.getShifts({
      start_date: startDate,
      end_date: endDate,
      employee_id: employeeId,
    });
    return response;
  }

  /**
   * Create a new shift
   */
  static async createShift(shiftData: {
    employee_id: number;
    work_date: string;
    work_shift_id: string;
    notes?: string;
  }): Promise<EmployeeShift> {
    console.log('🔍 EmployeeShiftService.createShift - API Call:', shiftData);

    const axios = apiClient.getAxiosInstance();
    const response = await axios.post<ApiResponse<EmployeeShift>>(`${this.BASE_URL}`, shiftData);

    console.log('✅ EmployeeShiftService.createShift - Response:', { status: response.status, data: response.data });

    return response.data.data;
  }

  /**
   * Update a shift
   */
  static async updateShift(
    shiftId: string,
    updateData: {
      status?: string;
      notes?: string;
    }
  ): Promise<EmployeeShift> {
    console.log('🔍 EmployeeShiftService.updateShift - API Call:', { shiftId, updateData });

    const axios = apiClient.getAxiosInstance();
    const response = await axios.patch<ApiResponse<EmployeeShift>>(`${this.BASE_URL}/${shiftId}`, updateData);

    console.log('✅ EmployeeShiftService.updateShift - Response:', { status: response.status, data: response.data });

    return response.data.data;
  }

  /**
   * Delete a shift
   */
  static async deleteShift(shiftId: string): Promise<void> {
    console.log('🔍 EmployeeShiftService.deleteShift - API Call:', shiftId);

    const axios = apiClient.getAxiosInstance();
    const response = await axios.delete<ApiResponse<void>>(`${this.BASE_URL}/${shiftId}`);

    console.log('✅ EmployeeShiftService.deleteShift - Response:', { status: response.status, data: response.data });
  }
}

export default EmployeeShiftService;
