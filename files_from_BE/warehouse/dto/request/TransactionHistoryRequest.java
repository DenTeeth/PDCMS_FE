package com.dental.clinic.management.warehouse.dto.request;

import com.dental.clinic.management.warehouse.enums.PaymentStatus;
import com.dental.clinic.management.warehouse.enums.TransactionStatus;
import com.dental.clinic.management.warehouse.enums.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * API 6.6: Transaction History Request DTO
 * Supports comprehensive filtering for transaction history
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionHistoryRequest {

    // Pagination
    @Builder.Default
    private Integer page = 0;
    @Builder.Default
    private Integer size = 20;

    // Search
    private String search; // Search by transaction_code or invoice_number

    // Filters
    private TransactionType type; // IMPORT, EXPORT, ADJUSTMENT
    private TransactionStatus status; // DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, CANCELLED
    private PaymentStatus paymentStatus; // UNPAID, PARTIAL, PAID (only for IMPORT)

    // Date range
    private LocalDate fromDate;
    private LocalDate toDate;

    // Related entities
    private Long supplierId; // Filter by supplier (for IMPORT)
    private Long appointmentId; // Filter by appointment (for EXPORT)
    private Long createdBy; // Filter by creator

    // Sorting
    @Builder.Default
    private String sortBy = "transactionDate";
    @Builder.Default
    private String sortDir = "desc"; // asc, desc
}
