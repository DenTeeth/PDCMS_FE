/**
 * Analytics Types for Manager Dashboard
 */

export interface KPIData {
    totalPatientsThisMonth: number;
    totalRevenueThisMonth: number;
    totalAppointmentsThisMonth: number;
    employeeCount: number;
    patientsChange?: number; // % change from last month
    revenueChange?: number;
    appointmentsChange?: number;
    employeesChange?: number;
}

export interface RevenueTrendData {
    month: string;
    revenue: number;
    target?: number;
}

export interface AppointmentStatusData {
    status: string;
    count: number;
    percentage: number;
}

export interface TopServiceData {
    serviceName: string;
    count: number;
    revenue: number;
}

export interface PatientAcquisitionData {
    month: string;
    newPatients: number;
    returningPatients: number;
}

export interface EmployeePerformance {
    employeeId: string;
    employeeName: string;
    role: string;
    appointmentsHandled: number;
    revenueGenerated: number;
    rating: number;
    avatar?: string;
}

export interface ServiceAnalytics {
    serviceCode: string;
    serviceName: string;
    usageCount: number;
    revenue: number;
    utilizationRate: number;
    averagePrice: number;
}

export interface IncomeExpenseData {
    month: string;
    income: number;
    expenses: number;
    netProfit: number;
}

export interface ExpenseCategory {
    category: string;
    amount: number;
    percentage: number;
}

export interface AppointmentVolumeData {
    date: string;
    count: number;
}

export interface PeakHourData {
    day: string;
    hour: number;
    count: number;
}

export interface AppointmentMetrics {
    totalAppointments: number;
    completed: number;
    cancelled: number;
    noShow: number;
    cancellationRate: number;
    noShowRate: number;
}

export type DateRangeFilter = 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_3_MONTHS' | 'CUSTOM';

export interface DateRange {
    startDate: string;
    endDate: string;
}

export interface AnalyticsFilters {
    dateRange: DateRangeFilter;
    customRange?: DateRange;
    role?: string;
    employeeId?: string;
}
