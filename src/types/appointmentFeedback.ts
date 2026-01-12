/**
 * Appointment Feedback Types
 * Tương ứng với BE DTOs
 */

/**
 * Request DTO để tạo feedback mới
 * Tương ứng với CreateFeedbackRequest.java
 */
export interface CreateFeedbackRequest {
  appointmentCode: string;
  rating: number; // 1-5
  comment?: string; // max 1000 characters
  tags?: string[]; // max 10 tags
}

/**
 * Response DTO cho feedback
 * Tương ứng với FeedbackResponse.java
 */
export interface FeedbackResponse {
  feedbackId: number;
  appointmentCode: string;
  patientName: string;
  employeeName: string;
  rating: number;
  comment?: string;
  tags?: string[];
  createdAt: string; // ISO date string
}

/**
 * Tag count cho statistics
 */
export interface TagCount {
  tag: string;
  count: number;
}

/**
 * Response DTO cho thống kê feedback
 * Tương ứng với FeedbackStatisticsResponse.java
 */
export interface FeedbackStatisticsResponse {
  totalFeedbacks: number;
  averageRating: number;
  ratingDistribution: Record<string, number>; // {"1": 5, "2": 10, ...}
  topTags: TagCount[];
}

/**
 * Filter params cho getFeedbacksList
 */
export interface FeedbackListFilters {
  rating?: number; // 1-5
  employeeCode?: string;
  patientCode?: string;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
  page?: number;
  size?: number;
  sort?: string; // "field,direction" e.g. "createdAt,desc"
}

/**
 * Paginated response cho feedback list
 */
export interface FeedbackListResponse {
  content: FeedbackResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
