/**
 * Accounting Type Definitions
 * Types for financial management and accounting module
 */

/**
 * Transaction Types
 */
export enum TransactionType {
    INCOME = 'Thu',
    EXPENSE = 'Chi',
}

export enum TransactionStatus {
    PENDING = 'Chờ duyệt',
    APPROVED = 'Đã duyệt',
    REJECTED = 'Từ chối',
    PAID = 'Đã thanh toán',
    PARTIAL = 'Thanh toán một phần',
}

export enum PaymentMethod {
    CASH = 'Tiền mặt',
    TRANSFER = 'Chuyển khoản',
}

/**
 * Income Categories
 */
export enum IncomeCategory {
    DENTAL_SERVICE = 'Thu bán hàng',
    PRODUCT_SALE = 'Bán nha phẩm',
    MEDICINE_SALE = 'Bán thuốc',
    OTHER = 'Thu khác',
}

/**
 * Expense Categories
 */
export enum ExpenseCategory {
    SALARY = 'Chi lương',
    SUPPLIES = 'Chi nhập vật tư',
    UTILITIES = 'Chi điện nước',
    RENT = 'Chi thuê mặt bằng',
    MAINTENANCE = 'Chi sửa chữa',
    MARKETING = 'Chi marketing',
    LAB = 'Chi Labo',
    OTHER = 'Chi khác',
}

/**
 * Transaction Entity
 */
export interface Transaction {
    id: string;
    code: string;
    type: TransactionType;
    category: string;
    description: string;
    amount: number;
    payer?: string;
    receiver?: string;
    date: string;
    time?: string;
    status: TransactionStatus;
    paymentMethod: PaymentMethod;
    attachments?: string[];
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
    relatedId?: string; // Link to warehouse receipt, invoice, etc.
}

/**
 * Create Transaction Request
 */
export interface CreateTransactionRequest {
    type: TransactionType;
    category: string;
    description: string;
    amount: number;
    payer?: string;
    receiver?: string;
    date: string;
    paymentMethod: PaymentMethod;
    attachments?: File[];
}

/**
 * Supplier Debt Types
 */
export interface SupplierDebt {
    supplierId: string;
    supplierName: string;
    totalPurchase: number;
    totalPaid: number;
    remainingDebt: number;
    unpaidReceipts: UnpaidReceipt[];
}

export interface UnpaidReceipt {
    receiptId: string;
    receiptCode: string;
    date: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    status: 'Chưa thanh toán' | 'Thanh toán một phần' | 'Đã thanh toán';
}

export interface PaySupplierRequest {
    supplierId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    receiptIds: string[];
    notes?: string;
}

/**
 * Lab Debt Types (Similar to Supplier)
 */
export interface LabDebt {
    labId: string;
    labName: string;
    totalOrders: number;
    totalPaid: number;
    remainingDebt: number;
    unpaidOrders: UnpaidLabOrder[];
}

export interface UnpaidLabOrder {
    orderId: string;
    orderCode: string;
    date: string;
    patientName: string;
    service: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    status: string;
}

/**
 * Payroll & Commission Types
 */
export interface EmployeePayroll {
    employeeId: string;
    employeeName: string;
    role: string;
    totalRevenue: number;
    commissionRate: number;
    commissionAmount: number;
    baseSalary: number;
    advance: number;
    netSalary: number;
    status: 'Chưa chốt' | 'Đã chi lương';
    procedures: ProcedureCommission[];
}

export interface ProcedureCommission {
    procedureId: string;
    patientName: string;
    serviceName: string;
    price: number;
    commissionRate: number;
    commissionAmount: number;
    date: string;
}

export interface CommissionConfig {
    serviceId: string;
    serviceName: string;
    rate: number; // Percentage
}

/**
 * P&L Report Types
 */
export interface ProfitLossReport {
    period: string;
    revenue: RevenueBreakdown;
    expenses: ExpenseBreakdown;
    netProfit: number;
    profitMargin: number;
}

export interface RevenueBreakdown {
    total: number;
    dentalServices: number;
    productSales: number;
    medicineSales: number;
    other: number;
}

export interface ExpenseBreakdown {
    total: number;
    salary: number;
    supplies: number;
    utilities: number;
    rent: number;
    marketing: number;
    lab: number;
    other: number;
    breakdown: {
        category: string;
        amount: number;
        percentage: number;
    }[];
}

/**
 * Chart Data Types
 */
export interface DailyRevenueExpense {
    date: string;
    revenue: number;
    expense: number;
}

export interface ExpensePieChart {
    category: string;
    amount: number;
    percentage: number;
    color: string;
}

/**
 * Revenue Report Types
 */
export interface DoctorRevenue {
    doctorId: string;
    name: string;
    revenue: number;
    actualRevenue: number;
    patients: number;
    procedures: number;
}

export interface CustomerSourceRevenue {
    source: string;
    customers: number;
    procedures: number;
    revenue: number;
}

export interface CustomerGroupRevenue {
    group: string;
    customers: number;
    revenue: number;
    averageRevenue: number;
}

/**
 * Cashflow Report Types
 */
export interface CashflowSummary {
    openingBalance: number;
    totalIncome: number;
    totalExpense: number;
    closingBalance: number;
}

export interface CustomerCashflow {
    date: string;
    totalReceipt: number;
    actualRevenue: number;
    refund: number;
    balance: number;
}

export interface ClinicCashflow {
    date: string;
    receipt: number;
    expense: number;
    net: number;
}

/**
 * Debt Report Types
 */
export interface CustomerDebt {
    id: string;
    customerId: string;
    name: string;
    phone: string;
    debt: number;
    balance: number;
    totalDebt: number;
    status: 'Nợ' | 'Dư' | 'Đã thanh toán';
    dueDate?: string;
}

export interface DebtSummary {
    totalDebt: number;
    totalBalance: number;
    customersWithDebt: number;
    customersWithBalance: number;
}

/**
 * Dashboard Statistics
 */
export interface DashboardStats {
    totalIncome: number;
    totalExpense: number;
    profit: number;
    customerDebt: number;
    supplierDebt: number;
    incomeChange: number;
    expenseChange: number;
    profitChange: number;
    debtChange: number;
}

/**
 * Dashboard Todo Items
 */
export interface TodoItem {
    id: string;
    type: 'payment' | 'debt' | 'approval';
    title: string;
    count: number;
    link: string;
    priority: 'high' | 'medium' | 'low';
}

/**
 * Alert Types
 */
export interface Alert {
    type: 'warning' | 'info' | 'error';
    message: string;
    link: string;
}

/**
 * Query Parameters
 */
export interface TransactionQueryParams {
    page?: number;
    size?: number;
    type?: TransactionType;
    category?: string;
    status?: TransactionStatus;
    paymentMethod?: PaymentMethod;
    startDate?: string;
    endDate?: string;
    search?: string;
}

export interface RevenueReportParams {
    startDate: string;
    endDate: string;
    groupBy: 'doctor' | 'source' | 'group';
}

export interface CashflowReportParams {
    startDate: string;
    endDate: string;
    type: 'summary' | 'customer' | 'clinic';
}

export interface DebtReportParams {
    showOnlyDebt?: boolean;
    search?: string;
}

export interface PayrollParams {
    month: string; // YYYY-MM
    employeeId?: string;
}
