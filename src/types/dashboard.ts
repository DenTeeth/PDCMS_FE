/**
 * Dashboard Statistics Types
 * Based on BE Dashboard API responses
 */

// Common response wrapper
export interface DashboardResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// Overview Statistics
export interface DashboardOverview {
  month: string;
  previousMonth: string;
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    totalInvoices: number;
    totalAppointments: number;
    totalPatients: number;
    totalEmployees: number;
  };
  revenue: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  expenses: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  invoices: {
    total: number;
    paid: number;
    pending: number;
    cancelled: number;
    paidPercent: number;
    debt: number;
  };
  appointments: {
    total: number;
    scheduled: number;        // SCHEDULED - Đã đặt lịch
    checkedIn: number;        // CHECKED_IN - Đã check-in
    inProgress: number;       // IN_PROGRESS - Đang điều trị
    completed: number;        // COMPLETED - Hoàn thành
    cancelled: number;        // CANCELLED - Đã hủy (>24h)
    cancelledLate: number;    // CANCELLED_LATE - Hủy muộn (≤24h)
    noShow: number;           // NO_SHOW - Không đến
    completionRate: number;
  };
}

// Revenue & Expenses
export interface RevenueExpenses {
  month: string;
  revenue: {
    total: number;
    byType: {
      appointment: number;
      treatmentPlan: number;
      supplemental: number;
    };
    byDay: Array<{
      date: string;
      amount: number;
    }>;
    topServices: Array<{
      serviceId: number;
      serviceName: string;
      revenue: number;
      count: number;
    }>;
  };
  expenses: {
    total: number;
    byType: {
      serviceConsumption: number;
      damaged: number;
      expired: number;
      other: number;
    };
    byDay: Array<{
      date: string;
      amount: number;
    }>;
    topItems: Array<{
      itemId: number;
      itemName: string;
      quantity: number;
      value: number;
    }>;
  };
  comparison?: {
    revenue: {
      previous: number;
      change: number;
      changePercent: number;
    };
    expenses: {
      previous: number;
      change: number;
      changePercent: number;
    };
  };
}

// Employee Statistics
export interface EmployeeStatistics {
  month: string;
  topDoctors: Array<{
    employeeId: number;
    employeeCode: string;
    fullName: string;
    appointmentCount: number;
    totalRevenue: number;
    averageRevenuePerAppointment: number;
    serviceCount: number;
  }>;
  timeOff: {
    totalDays: number;
    totalRequests: number;
    byType: {
      paidLeave?: { requests: number; days: number };
      unpaidLeave?: { requests: number; days: number };
      emergencyLeave?: { requests: number; days: number };
      sickLeave?: { requests: number; days: number };
      other?: { requests: number; days: number };
    };
    byStatus: {
      pending: number;
      approved: number;
      rejected: number;
      cancelled: number;
    };
    topEmployees: Array<{
      employeeId: number;
      employeeCode: string;
      fullName: string;
      totalDays: number;
      requests: number;
    }>;
  };
}

// Warehouse Statistics
export interface WarehouseStatistics {
  month: string;
  transactions: {
    total: number;
    importData: {  // BE uses importData, not import
      count: number;
      totalValue: number;
    };
    exportData: {  // BE uses exportData, not export
      count: number;
      totalValue: number;
    };
    byStatus: {
      pending: number;
      approved: number;
      rejected: number;
      cancelled: number;
    };
    byDay: Array<{
      date: string;
      count: number;
      importValue: number;
      exportValue: number;
    }>;
  };
  inventory: {
    currentTotalValue: number;
    lowStockItems: number;
    expiringItems: number;
    usageRate: number;
  };
  topImports: Array<{
    itemId: number;
    itemName: string;
    quantity: number;
    value: number;
  }>;
  topExports: Array<{
    itemId: number;
    itemName: string;
    quantity: number;
    value: number;
  }>;
}

// Transaction Statistics
export interface TransactionStatistics {
  month: string;
  invoices: {
    total: number;
    totalValue: number;
    byStatus: {
      pendingPayment: { count: number; value: number };
      partialPaid: { count: number; value: number };
      paid: { count: number; value: number };
      cancelled: { count: number; value: number };
    };
    byType: {
      appointment: { count: number; value: number };
      treatmentPlan: { count: number; value: number };
      supplemental: { count: number; value: number };
    };
    paymentRate: number;
    debt: number;
  };
  payments: {
    total: number;
    totalValue: number;
    byMethod: {
      bankTransfer: { count: number; value: number };
      cash: { count: number; value: number };
      card: { count: number; value: number };
      other: { count: number; value: number };
    };
    byDay: Array<{
      date: string;
      count: number;
      value: number;
    }>;
  };
}

// Export tab types
export type DashboardTab = 'overview' | 'revenue-expenses' | 'employees' | 'warehouse' | 'transactions';



