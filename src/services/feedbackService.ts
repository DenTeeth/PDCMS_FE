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
        return response.data?.data || response.data;
    }

    /**
     * Get dentist ratings
     */
    async getDentistRatings(): Promise<DentistRating[]> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/dentists`);
        return response.data?.data || response.data || [];
    }

    /**
     * Get service ratings
     */
    async getServiceRatings(): Promise<ServiceRating[]> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/services`);
        return response.data?.data || response.data || [];
    }

    /**
     * Get all reviews with filters and pagination
     */
    async getReviews(filters: ReviewFilters = {}): Promise<PaginatedReviews> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/reviews`, {
            params: filters,
        });
        return response.data?.data || response.data;
    }

    /**
     * Get reviews for specific dentist
     */
    async getDentistReviews(dentistCode: string): Promise<Review[]> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(
            `${this.endpoint}/dentists/${dentistCode}/reviews`
        );
        return response.data?.data || response.data || [];
    }

    /**
     * Get reviews for specific service
     */
    async getServiceReviews(serviceCode: string): Promise<Review[]> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(
            `${this.endpoint}/services/${serviceCode}/reviews`
        );
        return response.data?.data || response.data || [];
    }

    /**
     * Get feedback analytics
     */
    async getFeedbackAnalytics(): Promise<FeedbackAnalytics> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/analytics`);
        return response.data?.data || response.data;
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
        return response.data?.data || response.data;
    }
}

export const feedbackService = new FeedbackService();
