/**
 * Mock Data for Accountant Module
 * Xóa file này khi có API thật từ backend
 */

import type {
    Transaction,
    DashboardStats,
    DoctorRevenue,
    CustomerSourceRevenue,
    CashflowSummary,
    CustomerCashflow,
    ClinicCashflow,
    CustomerDebt,
    DebtSummary,
    Alert,
    TodoItem,
    DailyRevenueExpense,
    ExpensePieChart,
} from '@/types/accounting';
import { TransactionType, TransactionStatus, PaymentMethod } from '@/types/accounting';

/// - ĐÂY LÀ DATA GIẢ - BẮT ĐẦU
/// Xóa tất cả code giữa 2 dòng comment này khi tích hợp API thật

export const mockDashboardStats: DashboardStats = {
    totalIncome: 125500000,
    totalExpense: 45200000,
    profit: 80300000,
    customerDebt: 0,
    supplierDebt: 50000000,
    incomeChange: 12.5,
    expenseChange: 8.2,
    profitChange: 15.3,
    debtChange: 0,
};

export const mockTodoItems: TodoItem[] = [
    { id: '1', type: 'payment', title: '5 Phiếu nhập kho chưa thanh toán', count: 5, link: '/accountant/supplier-debt', priority: 'high' },
    { id: '2', type: 'approval', title: '2 Phiếu chi chưa duyệt', count: 2, link: '/accountant/transactions', priority: 'medium' },
    { id: '3', type: 'payment', title: '4 Đơn Labo chưa thanh toán', count: 4, link: '/accountant/lab-debt', priority: 'medium' },
];

export const mockDailyRevenueExpense: DailyRevenueExpense[] = [
    { date: '20/01', revenue: 8500000, expense: 3200000 },
    { date: '21/01', revenue: 6200000, expense: 2800000 },
    { date: '22/01', revenue: 12000000, expense: 4500000 },
    { date: '23/01', revenue: 9500000, expense: 3800000 },
    { date: '24/01', revenue: 11000000, expense: 4200000 },
    { date: '25/01', revenue: 7800000, expense: 3100000 },
    { date: '26/01', revenue: 10500000, expense: 3900000 },
];

export const mockExpensePieChart: ExpensePieChart[] = [
    { category: 'Lương', amount: 35000000, percentage: 51.3, color: '#ef4444' },
    { category: 'Vật tư', amount: 15000000, percentage: 22.0, color: '#f97316' },
    { category: 'Thuê MB', amount: 8000000, percentage: 11.7, color: '#eab308' },
    { category: 'Marketing', amount: 4000000, percentage: 5.9, color: '#22c55e' },
    { category: 'Điện nước', amount: 3200000, percentage: 4.7, color: '#3b82f6' },
    { category: 'Labo', amount: 2000000, percentage: 2.9, color: '#8b5cf6' },
    { category: 'Khác', amount: 1000000, percentage: 1.5, color: '#6b7280' },
];

export const mockTransactions: Transaction[] = [
    {
        id: 'PT001',
        code: 'PT-20250120-001',
        type: TransactionType.INCOME,
        category: 'Thu bán hàng',
        description: 'Thanh toán dịch vụ - Nguyễn Văn A',
        amount: 2500000,
        payer: 'Nguyễn Văn A',
        date: '2025-01-20',
        time: '14:30',
        status: TransactionStatus.APPROVED,
        paymentMethod: PaymentMethod.TRANSFER,
    },
    {
        id: 'PC001',
        code: 'PC-20250120-001',
        type: TransactionType.EXPENSE,
        category: 'Chi lương',
        description: 'Lương tháng 1/2025',
        amount: 15000000,
        receiver: 'Phòng Nhân Sự',
        date: '2025-01-20',
        time: '10:00',
        status: TransactionStatus.APPROVED,
        paymentMethod: PaymentMethod.TRANSFER,
    },
    {
        id: 'PT002',
        code: 'PT-20250119-001',
        type: TransactionType.INCOME,
        category: 'Bán nha phẩm',
        description: 'Bán bàn chải điện - Trần Thị B',
        amount: 850000,
        payer: 'Trần Thị B',
        date: '2025-01-19',
        time: '16:45',
        status: TransactionStatus.APPROVED,
        paymentMethod: PaymentMethod.CASH,
    },
    {
        id: 'PC002',
        code: 'PC-20250119-001',
        type: TransactionType.EXPENSE,
        category: 'Chi nhập vật tư',
        description: 'Mua vật tư nha khoa',
        amount: 3200000,
        receiver: 'Công ty ABC',
        date: '2025-01-19',
        time: '09:15',
        status: TransactionStatus.APPROVED,
        paymentMethod: PaymentMethod.TRANSFER,
    },
    {
        id: 'PT003',
        code: 'PT-20250118-001',
        type: TransactionType.INCOME,
        category: 'Thu bán hàng',
        description: 'Thanh toán dịch vụ - Lê Văn C',
        amount: 4500000,
        payer: 'Lê Văn C',
        date: '2025-01-18',
        time: '11:20',
        status: TransactionStatus.APPROVED,
        paymentMethod: PaymentMethod.CASH,
    },
];

export const mockAlerts: Alert[] = [
    { type: 'info', message: '3 phiếu chi chưa được duyệt', link: '/accountant/transactions' },
    { type: 'warning', message: 'Báo cáo doanh thu tháng trước chưa hoàn thành', link: '/accountant/revenue-report' },
];

export const mockDoctorRevenue: DoctorRevenue[] = [
    { doctorId: 'D001', name: 'BS. Nguyễn Văn A', revenue: 45000000, actualRevenue: 42000000, patients: 35, procedures: 48 },
    { doctorId: 'D002', name: 'BS. Trần Thị B', revenue: 38000000, actualRevenue: 36000000, patients: 28, procedures: 42 },
    { doctorId: 'D003', name: 'BS. Lê Văn C', revenue: 32000000, actualRevenue: 30000000, patients: 25, procedures: 38 },
];

export const mockCustomerSourceRevenue: CustomerSourceRevenue[] = [
    { source: 'Website', customers: 45, procedures: 68, revenue: 85000000 },
    { source: 'Facebook', customers: 38, procedures: 52, revenue: 62000000 },
    { source: 'Zalo', customers: 25, procedures: 35, revenue: 45000000 },
    { source: 'Walk-in', customers: 18, procedures: 28, revenue: 35000000 },
    { source: 'Referral', customers: 12, procedures: 18, revenue: 22000000 },
];

export const mockCashflowSummary: CashflowSummary = {
    openingBalance: 50000000,
    totalIncome: 125500000,
    totalExpense: 45200000,
    closingBalance: 130300000,
};

export const mockCustomerCashflow: CustomerCashflow[] = [
    { date: '2025-01-20', totalReceipt: 8500000, actualRevenue: 7200000, refund: 0, balance: 1300000 },
    { date: '2025-01-19', totalReceipt: 6200000, actualRevenue: 6200000, refund: 500000, balance: -500000 },
    { date: '2025-01-18', totalReceipt: 12000000, actualRevenue: 10500000, refund: 0, balance: 1500000 },
];

export const mockClinicCashflow: ClinicCashflow[] = [
    { date: '2025-01-20', receipt: 2000000, expense: 15000000, net: -13000000 },
    { date: '2025-01-19', receipt: 1500000, expense: 3200000, net: -1700000 },
    { date: '2025-01-18', receipt: 0, expense: 5000000, net: -5000000 },
];

export const mockCustomerDebt: CustomerDebt[] = [
    { id: '1', customerId: 'C001', name: 'Nguyễn Văn A', phone: '0901234567', debt: 2500000, balance: 0, totalDebt: 2500000, status: 'Nợ', dueDate: '2025-02-01' },
    { id: '2', customerId: 'C002', name: 'Trần Thị B', phone: '0912345678', debt: 0, balance: 1500000, totalDebt: -1500000, status: 'Dư' },
    { id: '3', customerId: 'C003', name: 'Lê Văn C', phone: '0923456789', debt: 4200000, balance: 500000, totalDebt: 3700000, status: 'Nợ', dueDate: '2025-01-28' },
    { id: '4', customerId: 'C004', name: 'Phạm Thị D', phone: '0934567890', debt: 1800000, balance: 0, totalDebt: 1800000, status: 'Nợ', dueDate: '2025-02-05' },
    { id: '5', customerId: 'C005', name: 'Hoàng Văn E', phone: '0945678901', debt: 0, balance: 2000000, totalDebt: -2000000, status: 'Dư' },
];

export const mockDebtSummary: DebtSummary = {
    totalDebt: mockCustomerDebt.reduce((sum, item) => sum + item.debt, 0),
    totalBalance: mockCustomerDebt.reduce((sum, item) => sum + item.balance, 0),
    customersWithDebt: mockCustomerDebt.filter(item => item.debt > 0).length,
    customersWithBalance: mockCustomerDebt.filter(item => item.balance > 0).length,
};

/// - KẾT THÚC DATA GIẢ
