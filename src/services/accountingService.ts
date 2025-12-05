/**
 * Accounting Service
 * Handles all accounting and financial management API operations
 */

import { apiClient } from '@/lib/api';
import type {
    Transaction,
    CreateTransactionRequest,
    TransactionQueryParams,
    DoctorRevenue,
    CustomerSourceRevenue,
    CustomerGroupRevenue,
    CashflowSummary,
    CustomerCashflow,
    ClinicCashflow,
    CustomerDebt,
    DebtSummary,
    DashboardStats,
    RevenueReportParams,
    CashflowReportParams,
    DebtReportParams,
} from '@/types/accounting';

/**
 * Accounting Service Class
 */
class AccountingService {
    private readonly endpoint = '/accounting';

    /**
     * Get dashboard statistics
     */
    async getDashboardStats(): Promise<DashboardStats> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/dashboard/stats`);
        return response.data.data || response.data;
    }

    /**
     * Get all transactions with filters
     */
    async getTransactions(params: TransactionQueryParams = {}): Promise<{
        content: Transaction[];
        totalElements: number;
        totalPages: number;
    }> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/transactions`, { params });
        return response.data.data || response.data;
    }

    /**
     * Get transaction by ID
     */
    async getTransactionById(id: string): Promise<Transaction> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/transactions/${id}`);
        return response.data.data || response.data;
    }

    /**
     * Create new transaction
     */
    async createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
        const axiosInstance = apiClient.getAxiosInstance();
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            if (key === 'attachments' && Array.isArray(value)) {
                value.forEach(file => formData.append('attachments', file));
            } else if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        });

        const response = await axiosInstance.post(`${this.endpoint}/transactions`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.data || response.data;
    }

    /**
     * Update transaction
     */
    async updateTransaction(id: string, data: Partial<CreateTransactionRequest>): Promise<Transaction> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.patch(`${this.endpoint}/transactions/${id}`, data);
        return response.data.data || response.data;
    }

    /**
     * Delete transaction
     */
    async deleteTransaction(id: string): Promise<void> {
        const axiosInstance = apiClient.getAxiosInstance();
        await axiosInstance.delete(`${this.endpoint}/transactions/${id}`);
    }

    /**
     * Get revenue report by doctor
     */
    async getRevenueByDoctor(params: RevenueReportParams): Promise<DoctorRevenue[]> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/reports/revenue/doctor`, { params });
        return response.data.data || response.data;
    }

    /**
     * Get revenue report by customer source
     */
    async getRevenueBySource(params: RevenueReportParams): Promise<CustomerSourceRevenue[]> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/reports/revenue/source`, { params });
        return response.data.data || response.data;
    }

    /**
     * Get revenue report by customer group
     */
    async getRevenueByGroup(params: RevenueReportParams): Promise<CustomerGroupRevenue[]> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/reports/revenue/group`, { params });
        return response.data.data || response.data;
    }

    /**
     * Get cashflow summary
     */
    async getCashflowSummary(params: CashflowReportParams): Promise<CashflowSummary> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/reports/cashflow/summary`, { params });
        return response.data.data || response.data;
    }

    /**
     * Get customer cashflow
     */
    async getCustomerCashflow(params: CashflowReportParams): Promise<CustomerCashflow[]> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/reports/cashflow/customer`, { params });
        return response.data.data || response.data;
    }

    /**
     * Get clinic cashflow
     */
    async getClinicCashflow(params: CashflowReportParams): Promise<ClinicCashflow[]> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/reports/cashflow/clinic`, { params });
        return response.data.data || response.data;
    }

    /**
     * Get debt report
     */
    async getDebtReport(params: DebtReportParams = {}): Promise<{
        summary: DebtSummary;
        customers: CustomerDebt[];
    }> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/reports/debt`, { params });
        return response.data.data || response.data;
    }

    /**
     * Export transactions to Excel
     */
    async exportTransactions(params: TransactionQueryParams = {}): Promise<Blob> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/transactions/export`, {
            params,
            responseType: 'blob',
        });
        return response.data;
    }

    /**
     * Export report to Excel
     */
    async exportReport(reportType: string, params: any = {}): Promise<Blob> {
        const axiosInstance = apiClient.getAxiosInstance();
        const response = await axiosInstance.get(`${this.endpoint}/reports/${reportType}/export`, {
            params,
            responseType: 'blob',
        });
        return response.data;
    }
}

// Export singleton instance
export const accountingService = new AccountingService();
