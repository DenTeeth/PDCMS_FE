package com.dental.clinic.management.warehouse.dto.request;

import com.dental.clinic.management.warehouse.enums.ExportType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * API 6.5: Export Transaction Request DTO
 *
 * Enhanced with:
 * - Audit fields (departmentName, requestedBy)
 * - Force flags (allowExpired)
 * - Financial tracking support
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportTransactionRequest {

    @NotNull(message = "Transaction date is required")
    private LocalDate transactionDate;

    @NotNull(message = "Export type is required")
    private ExportType exportType; // USAGE, DISPOSAL, RETURN

    @Size(max = 100, message = "Reference code must not exceed 100 characters")
    private String referenceCode; // Mã phiếu yêu cầu hoặc mã ca điều trị

    // Audit Fields (Enhanced from review)
    @Size(max = 200, message = "Department name must not exceed 200 characters")
    private String departmentName;

    @Size(max = 200, message = "Requested by must not exceed 200 characters")
    private String requestedBy;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;

    // Force Flags
    @Builder.Default
    private Boolean allowExpired = false; // Cho phép xuất hàng hết hạn (true nếu DISPOSAL)

    @NotEmpty(message = "Items list cannot be empty")
    @Valid
    private List<ExportItemRequest> items;

    /**
     * Nested class: Export Item Request
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExportItemRequest {

        @NotNull(message = "Item master ID is required")
        @Positive(message = "Item master ID must be positive")
        private Long itemMasterId;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        @Max(value = 1000000, message = "Quantity must not exceed 1,000,000")
        private Integer quantity;

        @NotNull(message = "Unit ID is required")
        @Positive(message = "Unit ID must be positive")
        private Long unitId;

        @Size(max = 500, message = "Notes must not exceed 500 characters")
        private String notes;
    }
}
