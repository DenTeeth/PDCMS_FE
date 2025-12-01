package com.dental.clinic.management.warehouse.dto.response;

import com.dental.clinic.management.warehouse.enums.PaymentStatus;
import com.dental.clinic.management.warehouse.enums.TransactionStatus;
import com.dental.clinic.management.warehouse.enums.TransactionType;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * API 6.6: Transaction History Item Response DTO
 * Contains summary information for transaction list
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TransactionHistoryItemDto {

    // Basic info
    private Long transactionId;
    private String transactionCode;
    private TransactionType type;
    private LocalDateTime transactionDate;

    // Related entities (for Import)
    private String supplierName;
    private String invoiceNumber;

    // Related entities (for Export)
    private Long relatedAppointmentId;
    private String relatedAppointmentCode;
    private String patientName;

    // Creator & Approver
    private String createdByName;
    private LocalDateTime createdAt;
    private String approvedByName;
    private LocalDateTime approvedAt;

    // Status
    private TransactionStatus status;

    // Financial (RBAC: Requires VIEW_COST permission)
    private Integer totalItems; // Số lượng items trong phiếu
    private BigDecimal totalValue; // Tổng giá trị (null if no VIEW_COST)

    // Payment tracking (for IMPORT)
    private PaymentStatus paymentStatus;
    private BigDecimal paidAmount;
    private BigDecimal remainingDebt;
    private LocalDate dueDate;

    // Notes
    private String notes;
}
