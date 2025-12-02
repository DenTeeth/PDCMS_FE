package com.dental.clinic.management.warehouse.enums;

/**
 * Payment Status for IMPORT transactions
 * Tracks the payment state of purchase invoices
 */
public enum PaymentStatus {
    UNPAID, // Chưa thanh toán (remainingDebt = totalValue)
    PARTIAL, // Thanh toán một phần (0 < paidAmount < totalValue)
    PAID // Đã thanh toán đủ (paidAmount = totalValue)
}
