/**
 * Feedback & Review Type Definitions
 * For Manager Dashboard Analytics
 */

export interface Review {
    reviewId: string;
    patientName: string;
    patientCode: string;
    dentistName?: string;
    dentistCode?: string;
    serviceName?: string;
    serviceCode?: string;
    rating: number; // 1-5 stars
    reviewText: string;
    createdAt: string;
    updatedAt?: string;
    sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
}

export interface DentistRating {
    dentistCode: string;
    dentistName: string;
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
    };
}

export interface ServiceRating {
    serviceCode: string;
    serviceName: string;
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
    };
}

export interface RatingsOverview {
    overallRating: number;
    totalReviews: number;
    ratingDistribution: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
    };
    trendData: Array<{
        date: string;
        rating: number;
        count: number;
    }>;
}

export interface FeedbackAnalytics {
    keywords: Array<{
        text: string;
        value: number;
    }>;
    sentimentAnalysis: {
        positive: number;
        neutral: number;
        negative: number;
    };
    areasOfImprovement: Array<{
        area: string;
        count: number;
        averageRating: number;
    }>;
    aiSummary?: {
        positive: string;
        negative: string;
        suggestions: string[];
    };
}

export interface ReviewFilters {
    search?: string;
    rating?: number;
    startDate?: string;
    endDate?: string;
    dentistCode?: string;
    serviceCode?: string;
    sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    sortBy?: 'date' | 'rating';
    sortDirection?: 'ASC' | 'DESC';
    page?: number;
    size?: number;
}

export interface PaginatedReviews {
    content: Review[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    size: number;
}
