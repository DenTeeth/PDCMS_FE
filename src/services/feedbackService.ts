/**
 * Feedback Service
 * API calls for feedback and reviews management
 */

import { apiClient } from '@/lib/api';
import {
    Review,
    DentistRating,
    ServiceRating,
    RatingsOverview,
    FeedbackAnalytics,
    ReviewFilters,
    PaginatedReviews,
} from '@/types/feedback';

class FeedbackService {
    private readonly endpoint = '/feedback';

    /**
     * Get overall ratings overview
     */
    async getRatingsOverview(): Promise<RatingsOverview> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/overview`);
        const { extractApiResponse } = await import('@/utils/apiResponse');
        return extractApiResponse<RatingsOverview | DentistRating[] | ServiceRating[] | PaginatedReviews | Review[] | FeedbackAnalytics | any>(response);
    }

    /**
     * Get dentist ratings
     */
    async getDentistRatings(): Promise<DentistRating[]> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/dentists`);
        const { extractApiResponse } = await import('@/utils/apiResponse');
        const data = extractApiResponse<any>(response);
        return Array.isArray(data) ? data : [];
    }

    /**
     * Get service ratings
     */
    async getServiceRatings(): Promise<ServiceRating[]> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/services`);
        const { extractApiResponse } = await import('@/utils/apiResponse');
        const data = extractApiResponse<any>(response);
        return Array.isArray(data) ? data : [];
    }

    /**
     * Get all reviews with filters and pagination
     */
    async getReviews(filters: ReviewFilters = {}): Promise<PaginatedReviews> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/reviews`, {
            params: filters,
        });
        const { extractApiResponse } = await import('@/utils/apiResponse');
        return extractApiResponse<RatingsOverview | DentistRating[] | ServiceRating[] | PaginatedReviews | Review[] | FeedbackAnalytics | any>(response);
    }

    /**
     * Get reviews for specific dentist
     */
    async getDentistReviews(dentistCode: string): Promise<Review[]> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(
            `${this.endpoint}/dentists/${dentistCode}/reviews`
        );
        const { extractApiResponse } = await import('@/utils/apiResponse');
        const data = extractApiResponse<any>(response);
        return Array.isArray(data) ? data : [];
    }

    /**
     * Get reviews for specific service
     */
    async getServiceReviews(serviceCode: string): Promise<Review[]> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(
            `${this.endpoint}/services/${serviceCode}/reviews`
        );
        const { extractApiResponse } = await import('@/utils/apiResponse');
        const data = extractApiResponse<any>(response);
        return Array.isArray(data) ? data : [];
    }

    /**
     * Get feedback analytics
     */
    async getFeedbackAnalytics(): Promise<FeedbackAnalytics> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/analytics`);
        const { extractApiResponse } = await import('@/utils/apiResponse');
        return extractApiResponse<RatingsOverview | DentistRating[] | ServiceRating[] | PaginatedReviews | Review[] | FeedbackAnalytics | any>(response);
    }

    /**
     * Get AI-generated summary
     */
    async getAISummary(): Promise<{
        positive: string;
        negative: string;
        suggestions: string[];
    }> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/ai-summary`);
        const { extractApiResponse } = await import('@/utils/apiResponse');
        return extractApiResponse<RatingsOverview | DentistRating[] | ServiceRating[] | PaginatedReviews | Review[] | FeedbackAnalytics | any>(response);
    }
}

export const feedbackService = new FeedbackService();
