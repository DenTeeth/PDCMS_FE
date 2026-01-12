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

      // Handle both response structures
      // Case 1: { statusCode, data: [...] }
      // Case 2: [...]
      if (Array.isArray(response.data)) {
        console.log('📊 Returning array data:', response.data.length, 'items');
        return response.data;
      }

      // @ts-ignore - Type assertion for wrapped response
      const result = response.data.data || [];
      console.log('📊 Returning wrapped data:', result.length, 'items');
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
    // Handle both response structures
    if ('data' in response.data) {
      return response.data.data;
    }
    return response.data as unknown as WorkShift;
  },

  // Create new work shift
  create: async (data: CreateWorkShiftRequest): Promise<WorkShift> => {
    const response = await api.post<WorkShiftResponse>('/work-shifts', data);
    // Handle both response structures
    if ('data' in response.data) {
      return response.data.data;
    }
    return response.data as unknown as WorkShift;
  },

  // Update work shift
  update: async (workShiftId: string, data: UpdateWorkShiftRequest): Promise<WorkShift> => {
    const response = await api.patch<WorkShiftResponse>(`/work-shifts/${workShiftId}`, data);
    // Handle both response structures
    if ('data' in response.data) {
      return response.data.data;
    }
    return response.data as unknown as WorkShift;
  },

  // Delete work shift (soft delete)
  delete: async (workShiftId: string): Promise<void> => {
    await api.delete(`/work-shifts/${workShiftId}`);
  },

  // Reactivate work shift
  reactivate: async (workShiftId: string): Promise<WorkShift> => {
    const response = await api.put<WorkShiftResponse>(`/work-shifts/${workShiftId}/reactivate`);
    // Handle both response structures
    if ('data' in response.data) {
      return response.data.data;
    }
    return response.data as unknown as WorkShift;
  },
};
