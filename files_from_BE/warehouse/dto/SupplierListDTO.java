package com.dental.clinic.management.warehouse.dto;

import com.dental.clinic.management.warehouse.enums.SupplierTier;
import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for Supplier List Response
 * Returns supplier information with business metrics
 * Used in API 6.13: GET /api/v1/warehouse/suppliers
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Supplier information with business metrics")
public class SupplierListDTO {

    @Schema(description = "Supplier ID", example = "1")
    private Long supplierId;

    @Schema(description = "Supplier code", example = "SUP-001")
    private String supplierCode;

    @Schema(description = "Supplier name", example = "Công ty Vật Tư Nha Khoa ABC")
    private String supplierName;

    @Schema(description = "Phone number", example = "0901234567")
    private String phoneNumber;

    @Schema(description = "Email address", example = "contact@supplier-abc.com")
    private String email;

    @Schema(description = "Address", example = "123 Nguyễn Huệ, Q1, TP.HCM")
    private String address;

    @Schema(description = "Supplier tier level (TIER_1, TIER_2, TIER_3)", example = "TIER_2")
    private SupplierTier tierLevel;

    @Schema(description = "Quality rating score (0.0 - 5.0)", example = "4.5")
    private BigDecimal ratingScore;

    @Schema(description = "Total number of orders from this supplier", example = "25")
    private Integer totalOrders;

    @Schema(description = "Date of last order", example = "2024-12-15")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate lastOrderDate;

    @Schema(description = "Is supplier blacklisted (fraud/quality issues)", example = "false")
    private Boolean isBlacklisted;

    @Schema(description = "Is supplier active", example = "true")
    private Boolean isActive;

    @Schema(description = "Additional notes")
    private String notes;

    @Schema(description = "Creation timestamp", example = "2024-01-15T10:30:00")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @Schema(description = "Last update timestamp", example = "2024-12-20T15:45:00")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    /**
     * Business logic: Check if supplier is inactive (> 6 months since last order)
     * 
     * @return true if lastOrderDate is more than 6 months ago
     */
    public boolean isInactive() {
        if (lastOrderDate == null) {
            return true; // Never ordered = inactive
        }
        LocalDate sixMonthsAgo = LocalDate.now().minusMonths(6);
        return lastOrderDate.isBefore(sixMonthsAgo);
    }
}
