package com.dental.clinic.management.warehouse.dto.response;

import com.dental.clinic.management.warehouse.enums.ExportType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * API 6.5: Export Transaction Response DTO
 *
 * Enhanced with:
 * - Financial summary (totalValue for COGS tracking)
 * - Unpacking traceability (parentBatchId, unpackingInfo)
 * - Multi-batch allocation support
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportTransactionResponse {

    // Transaction Header
    private Long transactionId;
    private String transactionCode;
    private LocalDateTime transactionDate;
    private ExportType exportType;
    private String referenceCode;
    private String departmentName;
    private String requestedBy;
    private String notes;
    private String createdBy;
    private LocalDateTime createdAt;

    // Approval Info
    private com.dental.clinic.management.warehouse.enums.TransactionStatus status;
    private String approvedByName;
    private LocalDateTime approvedAt;

    // Appointment Info (for CLINICAL exports)
    private Long relatedAppointmentId;
    private String patientName;

    // Summary
    private Integer totalItems;
    private BigDecimal totalValue;

    // Items Detail
    private List<ExportItemResponse> items;

    // Warnings
    private List<WarningDTO> warnings;

    /**
     * Nested class: Export Item Response
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExportItemResponse {

        // Item Info
        private String itemCode;
        private String itemName;

        // Batch Info
        private Long batchId;
        private String lotNumber;
        private LocalDate expiryDate;
        private String binLocation;

        // Quantity Info
        private Integer quantityChange; // Số lượng xuất (âm: -5, -10)
        private String unitName;

        // Financial Info (for COGS tracking)
        private BigDecimal unitPrice; // Giá vốn của batch này
        private BigDecimal totalLineValue; // quantity × unitPrice

        // Unpacking Traceability (if applicable)
        private UnpackingInfo unpackingInfo;

        private String notes;
    }

    /**
     * Nested class: Unpacking Info
     * Tracking information when a batch is unpacked (e.g., Box → Pieces)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UnpackingInfo {

        private Boolean wasUnpacked; // Có phải batch được tạo từ unpacking không?
        private Long parentBatchId; // ID batch cha (hộp) bị xé
        private String parentUnitName; // Tên đơn vị cha (VD: "Hộp")
        private Integer remainingInBatch; // Số lượng còn lại trong batch sau unpacking
    }

    /**
     * Nested class: Warning DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WarningDTO {

        private Long batchId;
        private String itemCode;
        private String warningType; // NEAR_EXPIRY, EXPIRED_USED, LOW_STOCK
        private LocalDate expiryDate;
        private Integer daysUntilExpiry;
        private String message;
    }
}
