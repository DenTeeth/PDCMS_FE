/**
 * Appointment Feedback Service
 * Handles all feedback-related API operations
 */

import { apiClient } from '@/lib/api';

const BASE_URL = '/feedbacks';

export interface AppointmentFeedback {
  feedbackId: number;
  appointmentId: number;
  appointmentCode: string;
  patientId: number;
  patientName: string;
  rating: number;
  comment?: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateFeedbackRequest {
  appointmentCode: string;
  rating: number;
  comment?: string;
  tags?: string[];
}

export interface FeedbackStatistics {
  averageRating: number;
  totalFeedbacks: number;
  ratingDistribution: {
    rating: number;
    count: number;
  }[];
  topTags: {
    tag: string;
    count: number;
  }[];
}

// New types for doctor statistics
export interface DoctorStatistics {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  specialization: string;
  avatar: string | null;
  statistics: {
    averageRating: number;
    totalFeedbacks: number;
    ratingDistribution: Record<string, number>; // "1": 5, "2": 10, etc.
    topTags: { tag: string; count: number }[];
    recentComments: {
      feedbackId: number;
      patientName: string;
      rating: number;
      comment: string;
      tags: string[];
      createdAt: string;
    }[];
  };
}

export interface DoctorFeedbackStatisticsResponse {
  doctors: DoctorStatistics[];
}

export interface FeedbackListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  minRating?: number;
  maxRating?: number;
  startDate?: string;
  endDate?: string;
  patientId?: number;
}

export interface PaginatedFeedbackResponse {
  content: AppointmentFeedback[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * Create a new feedback for an appointment
 */
export async function createFeedback(data: CreateFeedbackRequest): Promise<AppointmentFeedback> {
  const axiosInstance = apiClient.getAxiosInstance();
  const response = await axiosInstance.post(BASE_URL, data);
  const { extractApiResponse } = await import('@/utils/apiResponse');
  return extractApiResponse<AppointmentFeedback | PaginatedFeedbackResponse | FeedbackStatistics | DoctorFeedbackStatisticsResponse>(response);
}

/**
 * Get feedback by appointment code
 */
export async function getFeedbackByAppointmentCode(appointmentCode: string): Promise<AppointmentFeedback | null> {
  try {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`${BASE_URL}/appointment/${appointmentCode}`);
    const { extractApiResponse } = await import('@/utils/apiResponse');
  return extractApiResponse<AppointmentFeedback | PaginatedFeedbackResponse | FeedbackStatistics | DoctorFeedbackStatisticsResponse>(response);
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get paginated list of feedbacks
 */
export async function getFeedbacksList(params: FeedbackListParams = {}): Promise<PaginatedFeedbackResponse> {
  const axiosInstance = apiClient.getAxiosInstance();
  const response = await axiosInstance.get(BASE_URL, { params });
  const { extractApiResponse } = await import('@/utils/apiResponse');
  return extractApiResponse<AppointmentFeedback | PaginatedFeedbackResponse | FeedbackStatistics | DoctorFeedbackStatisticsResponse>(response);
}

/**
 * Get feedback statistics
 */
export async function getFeedbackStatistics(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<FeedbackStatistics> {
  const axiosInstance = apiClient.getAxiosInstance();
  const response = await axiosInstance.get(`${BASE_URL}/statistics`, { params });
  const { extractApiResponse } = await import('@/utils/apiResponse');
  return extractApiResponse<AppointmentFeedback | PaginatedFeedbackResponse | FeedbackStatistics | DoctorFeedbackStatisticsResponse>(response);
}

/**
 * Get feedback statistics by doctor
 * BE Endpoint: GET /api/v1/feedbacks/statistics/by-doctor
 * 
 * @param params Query parameters
 * @returns Doctor statistics with ratings, tags, and comments
 */
export async function getFeedbackStatisticsByDoctor(params?: {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  top?: number; // Number of top doctors to return (default: 10)
  sortBy?: 'rating' | 'feedbackCount'; // Sort by rating or feedback count (default: 'rating')
}): Promise<DoctorFeedbackStatisticsResponse> {
  const axiosInstance = apiClient.getAxiosInstance();
  const response = await axiosInstance.get(`${BASE_URL}/statistics/by-doctor`, { params });
  const { extractApiResponse } = await import('@/utils/apiResponse');
  return extractApiResponse<AppointmentFeedback | PaginatedFeedbackResponse | FeedbackStatistics | DoctorFeedbackStatisticsResponse>(response);
}
