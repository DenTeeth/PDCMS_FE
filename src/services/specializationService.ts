/**
 * Specialization Service
 * Handles all specialization-related API operations
 */

import { apiClient } from '@/lib/api';
import {
  Specialization,
  CreateSpecializationRequest,
  UpdateSpecializationRequest
} from '@/types/specialization';

class SpecializationService {
  private readonly endpoint = '/specializations';

  /**
   * Fetch all specializations
   */
  async getAll(): Promise<Specialization[]> {
    try {
      const response = await apiClient.getAxiosInstance().get(this.endpoint);
      
      console.log('� Raw response:', response);
      console.log('� response.data:', response.data);
      
      // BE có thể trả về wrapped hoặc trực tiếp
      if (response.data?.data) {
        console.log('� Using response.data.data');
        return response.data.data;
      }
      
      // Nếu BE trả về trực tiếp array
      console.log('� Using response.data directly');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch specializations:', error);
      throw error;
    }
  }

  /**
   * Get specialization by ID
   */
  async getById(specializationId: string): Promise<Specialization> {
    try {
      const response = await apiClient.getAxiosInstance().get(`${this.endpoint}/${specializationId}`);
      
      if (response.data?.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch specialization ${specializationId}:`, error);
      throw error;
    }
  }

  /**
   * Create new specialization
   */
  async create(data: CreateSpecializationRequest): Promise<Specialization> {
    try {
      const response = await apiClient.getAxiosInstance().post(this.endpoint, data);
      
      if (response.data?.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error: any) {
      console.error('Failed to create specialization:', error);
      throw error;
    }
  }

  /**
   * Update specialization
   */
  async update(
    specializationId: string,
    data: UpdateSpecializationRequest
  ): Promise<Specialization> {
    try {
      const response = await apiClient.getAxiosInstance().patch(`${this.endpoint}/${specializationId}`, data);
      
      if (response.data?.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error: any) {
      console.error(`Failed to update specialization ${specializationId}:`, error);
      throw error;
    }
  }

  /**
   * Delete specialization (soft delete)
   */
  async delete(specializationId: string): Promise<void> {
    try {
      await apiClient.getAxiosInstance().delete(`${this.endpoint}/${specializationId}`);
    } catch (error: any) {
      console.error(`Failed to delete specialization ${specializationId}:`, error);
      throw error;
    }
  }
  
}

export const specializationService = new SpecializationService();

