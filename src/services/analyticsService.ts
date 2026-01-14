import { apiClient } from '@/lib/api';
import {
    KPIData,
    RevenueTrendData,
    AppointmentStatusData,
    TopServiceData,
    PatientAcquisitionData,
    EmployeePerformance,
    ServiceAnalytics,
    IncomeExpenseData,
    ExpenseCategory,
    AppointmentVolumeData,
    PeakHourData,
    AppointmentMetrics,
    AnalyticsFilters,
} from '@/types/analytics';

const api = apiClient.getAxiosInstance();

/**
 * Analytics Service for Manager Dashboard
 */
export const analyticsService = {
    /**
     * Get KPI data (cards at top)
     */
    async getKPIData(): Promise<KPIData> {
        const response = await api.get('/analytics/kpi');
        const { extractApiResponse } = await import('@/utils/apiResponse');
        return extractApiResponse<any>(response);
    },

    /**
     * Get revenue trend data (last 12 months)
     */
    async getRevenueTrend(): Promise<RevenueTrendData[]> {
        const response = await api.get('/analytics/revenue-trend');
        const { extractApiResponse } = await import('@/utils/apiResponse');
        return extractApiResponse<any>(response);
    },

    /**
     * Get appointments by status (pie chart)
     */
    async getAppointmentsByStatus(): Promise<AppointmentStatusData[]> {
        const response = await api.get('/analytics/appointments-by-status');
        const { extractApiResponse } = await import('@/utils/apiResponse');
        return extractApiResponse<any>(response);
    },

    /**
     * Get top services
     */
    async getTopServices(limit: number = 10): Promise<TopServiceData[]> {
        const response = await api.get('/analytics/top-services', {
            params: { limit },
        });
        const { extractApiResponse } = await import('@/utils/apiResponse');
        return extractApiResponse<any>(response);
    },

    /**
     * Get patient acquisition data
     */
    async getPatientAcquisition(): Promise<PatientAcquisitionData[]> {
        const response = await api.get('/analytics/patient-acquisition');
        const { extractApiResponse } = await import('@/utils/apiResponse');
        return extractApiResponse<any>(response);
    },

    /**
     * Get employee performance
     */
    async getEmployeePerformance(
        filters?: AnalyticsFilters
    ): Promise<EmployeePerformance[]> {
        const response = await api.get('/analytics/employee-performance', {
            params: filters,
        });
        const { extractApiResponse } = await import('@/utils/apiResponse');
        return extractApiResponse<any>(response);
    },

    /**
     * Get service analytics
     */
    async getServiceAnalytics(): Promise<ServiceAnalytics[]> {
        const response = await api.get('/analytics/services');
        const { extractApiResponse } = await import('@/utils/apiResponse');
        return extractApiResponse<any>(response);
    },

    /**
     * Get income & expenses data
     */
    async getIncomeExpenses(): Promise<IncomeExpenseData[]> {
        const response = await api.get('/analytics/income-expenses');
        const { extractApiResponse } = await import('@/utils/apiResponse');
        return extractApiResponse<any>(response);
    },

    /**
     * Get expense breakdown by category
     */
    async getExpenseCategories(): Promise<ExpenseCategory[]> {
        const response = await api.get('/analytics/expense-categories');
        const { extractApiResponse } = await import('@/utils/apiResponse');
        return extractApiResponse<any>(response);
    },

    /**
     * Get appointment volume data
     */
    async getAppointmentVolume(
        filters?: AnalyticsFilters
    ): Promise<AppointmentVolumeData[]> {
        const response = await api.get('/analytics/appointment-volume', {
            params: filters,
        });
        const { extractApiResponse } = await import('@/utils/apiResponse');
        return extractApiResponse<any>(response);
    },

    /**
     * Get peak hours/days heatmap data
     */
    async getPeakHours(): Promise<PeakHourData[]> {
        const response = await api.get('/analytics/peak-hours');
        const { extractApiResponse } = await import('@/utils/apiResponse');
        return extractApiResponse<any>(response);
    },

    /**
     * Get appointment metrics (cancellation, no-show rates)
     */
    async getAppointmentMetrics(): Promise<AppointmentMetrics> {
        const response = await api.get('/analytics/appointment-metrics');
        const { extractApiResponse } = await import('@/utils/apiResponse');
        return extractApiResponse<any>(response);
    },

    /**
     * Export analytics report
     */
    async exportReport(
        reportType: string,
        filters?: AnalyticsFilters
    ): Promise<Blob> {
        const response = await api.get(`/analytics/export/${reportType}`, {
            params: filters,
            responseType: 'blob',
        });
        const { extractApiResponse } = await import('@/utils/apiResponse');
        return extractApiResponse<any>(response);
    },
};
