import axios from 'axios';
import { getToken } from '@/lib/cookies';
import {
  WorkShift,
  CreateWorkShiftRequest,
  UpdateWorkShiftRequest,
  WorkShiftResponse,
  WorkShiftListResponse,
} from '@/types/workShift';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';


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
      const response = await api.get<WorkShiftListResponse | WorkShift[]>('/work-shifts', { params });

      // Handle both response structures
      // Case 1: { statusCode, data: [...] }
      // Case 2: [...]
      if (Array.isArray(response.data)) {
        return response.data;
      }

      // @ts-ignore - Type assertion for wrapped response
      return response.data.data || [];
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching work shifts:', error);
      }
      return [];
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
