import axios from 'axios';
import { getToken } from '@/lib/cookies';
import {
  WorkShift,
  CreateWorkShiftRequest,
  UpdateWorkShiftRequest,
  WorkShiftResponse,
  WorkShiftListResponse,
} from '@/types/workShift';

// Use environment variable or fallback to production URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://pdcms.duckdns.org/api/v1';
// const API_BASE_URL = 'http://localhost:8080/api/v1';


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const workShiftService = {
  // Get all work shifts
  getAll: async (isActive?: boolean): Promise<WorkShift[]> => {
    try {
      const params = isActive !== undefined ? { isActive } : {};
      console.log('🔍 Fetching work shifts with params:', params);
      const response = await api.get<WorkShiftListResponse | WorkShift[]>('/work-shifts', { params });
      console.log('✅ Work shifts response:', response.data);

      // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
      const { extractApiResponse } = await import('@/utils/apiResponse');
      const data = extractApiResponse<WorkShift[] | WorkShiftListResponse>(response);
      
      // Handle both array and paginated response
      if (Array.isArray(data)) {
        console.log('📊 Returning array data:', data.length, 'items');
        return data;
      }
      
      // If paginated response, return content array
      const result = (data as any)?.content || [];
      console.log('📊 Returning paginated data:', result.length, 'items');
      return result;
    } catch (error: any) {
      console.error('❌ Error fetching work shifts:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Throw error để UI có thể bắt và hiển thị
      throw error;
    }
  },

  // Get work shift by ID
  getById: async (workShiftId: string): Promise<WorkShift> => {
    const response = await api.get<WorkShiftResponse>(`/work-shifts/${workShiftId}`);
    const { extractApiResponse } = await import('@/utils/apiResponse');
    return extractApiResponse<WorkShift>(response);
  },

  // Create new work shift
  create: async (data: CreateWorkShiftRequest): Promise<WorkShift> => {
    const response = await api.post<WorkShiftResponse>('/work-shifts', data);
    const { extractApiResponse } = await import('@/utils/apiResponse');
    return extractApiResponse<WorkShift>(response);
  },

  // Update work shift
  update: async (workShiftId: string, data: UpdateWorkShiftRequest): Promise<WorkShift> => {
    const response = await api.patch<WorkShiftResponse>(`/work-shifts/${workShiftId}`, data);
    const { extractApiResponse } = await import('@/utils/apiResponse');
    return extractApiResponse<WorkShift>(response);
  },

  // Delete work shift (soft delete)
  delete: async (workShiftId: string): Promise<void> => {
    await api.delete(`/work-shifts/${workShiftId}`);
  },

  // Reactivate work shift
  reactivate: async (workShiftId: string): Promise<WorkShift> => {
    const response = await api.put<WorkShiftResponse>(`/work-shifts/${workShiftId}/reactivate`);
    const { extractApiResponse } = await import('@/utils/apiResponse');
    return extractApiResponse<WorkShift>(response);
  },
};
