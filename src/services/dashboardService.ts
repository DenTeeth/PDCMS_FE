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
   * ✅ NEW: Support both date range and month for backward compatibility
   * @param params - Can be either { month } or { startDate, endDate, comparisonMode }
   */
  async getOverview(
    params: { 
      month?: string; 
      startDate?: string; 
      endDate?: string;
      compareWithPrevious?: boolean;
      comparisonMode?: string;
    }
  ): Promise<DashboardOverview> {
    const axios = apiClient.getAxiosInstance();
    
    // Build query params
    const queryParams: any = {};
    if (params.month) {
      queryParams.month = params.month; // Backward compatible
    }
    if (params.startDate) {
      queryParams.startDate = params.startDate;
    }
    if (params.endDate) {
      queryParams.endDate = params.endDate;
    }
    if (params.compareWithPrevious !== undefined) {
      queryParams.compareWithPrevious = params.compareWithPrevious;
    }
    if (params.comparisonMode && params.compareWithPrevious) {
      queryParams.comparisonMode = params.comparisonMode;
    }
    
    const response = await axios.get(
      `${this.baseEndpoint}/overview`,
      { params: queryParams }
    );
    
    // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
    const { extractApiResponse } = await import('@/utils/apiResponse');
    return extractApiResponse<DashboardOverview>(response);
  }

  /**
   * Get revenue and expenses statistics
   * ✅ NEW: Support both date range and month
   * @param params - Can be either { month } or { startDate, endDate, comparisonMode }
   */
  async getRevenueExpenses(
    params: {
      month?: string;
      startDate?: string;
      endDate?: string;
      compareWithPrevious?: boolean;
      comparisonMode?: string;
    }
  ): Promise<RevenueExpenses> {
    const axios = apiClient.getAxiosInstance();
    
    const queryParams: any = {};
    if (params.month) queryParams.month = params.month;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    if (params.compareWithPrevious !== undefined) queryParams.compareWithPrevious = params.compareWithPrevious;
    if (params.comparisonMode && params.compareWithPrevious) queryParams.comparisonMode = params.comparisonMode;
    
    const response = await axios.get(
      `${this.baseEndpoint}/revenue-expenses`,
      { params: queryParams }
    );
    
    // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
    const { extractApiResponse } = await import('@/utils/apiResponse');
    return extractApiResponse<any>(response);
  }

  /**
   * Get employee statistics
   * ✅ NEW: Support both date range and month
   * @param params - Date range params and topDoctors limit
   */
  async getEmployees(
    params: {
      month?: string;
      startDate?: string;
      endDate?: string;
      topDoctors?: number;
    }
  ): Promise<EmployeeStatistics> {
    const axios = apiClient.getAxiosInstance();
    
    const queryParams: any = { topDoctors: params.topDoctors || 10 };
    if (params.month) queryParams.month = params.month;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    
    const response = await axios.get(
      `${this.baseEndpoint}/employees`,
      { params: queryParams }
    );
    
    // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
    const { extractApiResponse } = await import('@/utils/apiResponse');
    return extractApiResponse<any>(response);
  }

  /**
   * Get warehouse statistics
   * ✅ NEW: Support both date range and month
   */
  async getWarehouse(params: {
    month?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<WarehouseStatistics> {
    const axios = apiClient.getAxiosInstance();
    
    const queryParams: any = {};
    if (params.month) queryParams.month = params.month;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    
    const response = await axios.get(
      `${this.baseEndpoint}/warehouse`,
      { params: queryParams }
    );
    
    // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
    const { extractApiResponse } = await import('@/utils/apiResponse');
    return extractApiResponse<any>(response);
  }

  /**
   * Get transaction statistics
   * ✅ NEW: Support both date range and month
   */
  async getTransactions(params: {
    month?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TransactionStatistics> {
    const axios = apiClient.getAxiosInstance();
    
    const queryParams: any = {};
    if (params.month) queryParams.month = params.month;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    
    const response = await axios.get(
      `${this.baseEndpoint}/transactions`,
      { params: queryParams }
    );
    
    // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
    const { extractApiResponse } = await import('@/utils/apiResponse');
    return extractApiResponse<any>(response);
  }

  /**
   * Export dashboard data to Excel
   * @param tab Tab name to export
   * @param params - Can be either { month } or { startDate, endDate }
   * @returns Blob of Excel file
   */
  async exportExcel(
    tab: DashboardTab, 
    params: { month?: string; startDate?: string; endDate?: string }
  ): Promise<Blob> {
    const axios = apiClient.getAxiosInstance();
    
    // Build query params - BE supports both month and date range
    const queryParams: any = {};
    if (params.month) {
      queryParams.month = params.month;
    }
    if (params.startDate) {
      queryParams.startDate = params.startDate;
    }
    if (params.endDate) {
      queryParams.endDate = params.endDate;
    }
    
    try {
      const response = await axios.get(
        `${this.baseEndpoint}/export/${tab}`,
        {
          params: queryParams,
          responseType: 'blob', // Important for file download
        }
      );
      
      console.log(`✅ Export dashboard ${tab} - File downloaded`);
      return response.data;
    } catch (error: any) {
      // Try to extract error message from blob response if it's a JSON error
      let errorMessage = `Không thể xuất báo cáo ${tab}. Vui lòng thử lại sau.`;
      
      if (error.response?.data) {
        // If response is blob, try to read it as text
        if (error.response.data instanceof Blob) {
          try {
            const text = await error.response.data.text();
            const json = JSON.parse(text);
            errorMessage = json.message || errorMessage;
          } catch {
            // If parsing fails, use default message
          }
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      console.error(`❌ Export dashboard ${tab} error:`, {
        message: errorMessage,
        status: error.response?.status,
        params: queryParams,
        originalError: error,
      });
      
      const finalError = new Error(errorMessage);
      (finalError as any).status = error.response?.status;
      (finalError as any).params = queryParams;
      throw finalError;
    }
  }

  /**
   * Download Excel file
   * Helper method to trigger browser download
   */
  async downloadExcel(
    tab: DashboardTab, 
    params: { month?: string; startDate?: string; endDate?: string }
  ): Promise<void> {
    try {
      const blob = await this.exportExcel(tab, params);
      
      // Generate filename based on params
      let filename: string;
      if (params.month) {
        filename = `dashboard-${tab}-${params.month}.xlsx`;
      } else if (params.startDate && params.endDate) {
        filename = `dashboard-${tab}-${params.startDate}-to-${params.endDate}.xlsx`;
      } else {
        filename = `dashboard-${tab}-${new Date().toISOString().split('T')[0]}.xlsx`;
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ Dashboard ${tab} Excel file downloaded: ${filename}`);
    } catch (error: any) {
      console.error('❌ Error downloading Excel:', {
        tab,
        params,
        message: error.message,
        status: error.status,
        error,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();



