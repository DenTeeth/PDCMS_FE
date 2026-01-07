/**
 * Dashboard Service
 * 
 * Handles all dashboard statistics API calls
 * Based on BE DashboardController
 */

import { apiClient } from '@/lib/api';
import {
  DashboardOverview,
  RevenueExpenses,
  EmployeeStatistics,
  WarehouseStatistics,
  TransactionStatistics,
  DashboardTab,
  DashboardResponse,
} from '@/types/dashboard';

export class DashboardService {
  private readonly baseEndpoint = '/dashboard';

  /**
   * Get overview statistics
   * @param month Month in YYYY-MM format (e.g., "2026-01")
   * @param compareWithPrevious Whether to include month-over-month comparison
   */
  async getOverview(
    month: string,
    compareWithPrevious: boolean = false
  ): Promise<DashboardOverview> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get(
      `${this.baseEndpoint}/overview`,
      {
        params: { month, compareWithPrevious },
      }
    );
    // BE có thể trả về wrapped { success, data, message } hoặc trực tiếp
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Get revenue and expenses statistics
   * @param month Month in YYYY-MM format
   * @param compareWithPrevious Whether to include comparison
   */
  async getRevenueExpenses(
    month: string,
    compareWithPrevious: boolean = false
  ): Promise<RevenueExpenses> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get(
      `${this.baseEndpoint}/revenue-expenses`,
      {
        params: { month, compareWithPrevious },
      }
    );
    // BE có thể trả về wrapped { success, data, message } hoặc trực tiếp
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Get employee statistics
   * @param month Month in YYYY-MM format
   * @param topDoctors Number of top doctors to return (default: 10)
   */
  async getEmployees(
    month: string,
    topDoctors: number = 10
  ): Promise<EmployeeStatistics> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get(
      `${this.baseEndpoint}/employees`,
      {
        params: { month, topDoctors },
      }
    );
    // BE có thể trả về wrapped { success, data, message } hoặc trực tiếp
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Get warehouse statistics
   * @param month Month in YYYY-MM format
   */
  async getWarehouse(month: string): Promise<WarehouseStatistics> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get(
      `${this.baseEndpoint}/warehouse`,
      {
        params: { month },
      }
    );
    // BE có thể trả về wrapped { success, data, message } hoặc trực tiếp
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Get transaction statistics
   * @param month Month in YYYY-MM format
   */
  async getTransactions(month: string): Promise<TransactionStatistics> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get(
      `${this.baseEndpoint}/transactions`,
      {
        params: { month },
      }
    );
    // BE có thể trả về wrapped { success, data, message } hoặc trực tiếp
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Export dashboard data to Excel
   * @param tab Tab name to export
   * @param month Month in YYYY-MM format
   * @returns Blob of Excel file
   */
  async exportExcel(tab: DashboardTab, month: string): Promise<Blob> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get(
      `${this.baseEndpoint}/export/${tab}`,
      {
        params: { month },
        responseType: 'blob', // Important for file download
      }
    );
    return response.data;
  }

  /**
   * Download Excel file
   * Helper method to trigger browser download
   */
  async downloadExcel(tab: DashboardTab, month: string): Promise<void> {
    try {
      const blob = await this.exportExcel(tab, month);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dashboard-${tab}-${month}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();



