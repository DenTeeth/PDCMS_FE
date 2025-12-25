package com.dental.clinic.management.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * SupplierSummaryResponse - DTO for supplier operations
 * Used for GET ALL (Table View) and CREATE/UPDATE responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierSummaryResponse {

    private Long supplierId;
    private String supplierCode;
    private String supplierName;
    private String phoneNumber;
    private String email;
    private String address;
    private Boolean isActive;
    private Boolean isBlacklisted;
    private Integer totalOrders;
    private LocalDate lastOrderDate;
    private String notes;
    private LocalDateTime createdAt;
    private String status; // Computed: ACTIVE | INACTIVE
}
