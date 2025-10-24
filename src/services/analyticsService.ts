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
        return response.data;
    },

    /**
     * Get revenue trend data (last 12 months)
     */
    async getRevenueTrend(): Promise<RevenueTrendData[]> {
        const response = await api.get('/analytics/revenue-trend');
        return response.data;
    },

    /**
     * Get appointments by status (pie chart)
     */
    async getAppointmentsByStatus(): Promise<AppointmentStatusData[]> {
        const response = await api.get('/analytics/appointments-by-status');
        return response.data;
    },

    /**
     * Get top services
     */
    async getTopServices(limit: number = 10): Promise<TopServiceData[]> {
        const response = await api.get('/analytics/top-services', {
            params: { limit },
        });
        return response.data;
    },

    /**
     * Get patient acquisition data
     */
    async getPatientAcquisition(): Promise<PatientAcquisitionData[]> {
        const response = await api.get('/analytics/patient-acquisition');
        return response.data;
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
        return response.data;
    },

    /**
     * Get service analytics
     */
    async getServiceAnalytics(): Promise<ServiceAnalytics[]> {
        const response = await api.get('/analytics/services');
        return response.data;
    },

    /**
     * Get income & expenses data
     */
    async getIncomeExpenses(): Promise<IncomeExpenseData[]> {
        const response = await api.get('/analytics/income-expenses');
        return response.data;
    },

    /**
     * Get expense breakdown by category
     */
    async getExpenseCategories(): Promise<ExpenseCategory[]> {
        const response = await api.get('/analytics/expense-categories');
        return response.data;
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
        return response.data;
    },

    /**
     * Get peak hours/days heatmap data
     */
    async getPeakHours(): Promise<PeakHourData[]> {
        const response = await api.get('/analytics/peak-hours');
        return response.data;
    },

    /**
     * Get appointment metrics (cancellation, no-show rates)
     */
    async getAppointmentMetrics(): Promise<AppointmentMetrics> {
        const response = await api.get('/analytics/appointment-metrics');
        return response.data;
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
        return response.data;
    },
};
